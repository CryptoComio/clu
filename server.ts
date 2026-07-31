import express from "express";
import path from "path";
import fs from "fs";
import compression from "compression";
import { createServer as createViteServer } from "vite";

const DEFAULT_CLUB_ID = process.env.EA_CLUB_ID || process.env.VITE_EA_CLUB_ID || "7782684";

// Server-side in-memory cache to optimize performance and prevent EA API rate limits
interface CacheEntry {
  data: any;
  timestamp: number;
}
const apiCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL to prevent rate limits during development and rapid refreshes

function readLocalJson(filename: string) {
  try {
    const filePath = path.join(process.cwd(), filename);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error(`Error reading local JSON file ${filename}:`, err);
  }
  return null;
}

function saveAndMergeMatches(filename: string, newMatches: any[]): any[] {
  if (!Array.isArray(newMatches) || newMatches.length === 0) {
    return readLocalJson(filename) || [];
  }

  const existingMatches = readLocalJson(filename) || [];
  const matchMap = new Map<string, any>();

  // Add existing matches to the Map first
  if (Array.isArray(existingMatches)) {
    for (const m of existingMatches) {
      if (!m) continue;
      const key = m.matchId || `${m.timestamp}_${Object.keys(m.clubs || {}).sort().join('_')}`;
      matchMap.set(key, m);
    }
  }

  // Add/overwrite with newly fetched matches
  for (const m of newMatches) {
    if (!m) continue;
    const key = m.matchId || `${m.timestamp}_${Object.keys(m.clubs || {}).sort().join('_')}`;
    matchMap.set(key, m);
  }

  // Convert map back to array and sort by timestamp descending (newest first)
  const merged = Array.from(matchMap.values()).sort((a: any, b: any) => {
    return (b.timestamp || 0) - (a.timestamp || 0);
  });

  // Write back to local JSON
  try {
    fs.writeFileSync(path.join(process.cwd(), filename), JSON.stringify(merged, null, 2));
    console.log(`[MERGE] Successfully merged matches into ${filename}. Total matches stored: ${merged.length}`);
  } catch (e) {
    console.error(`[MERGE] Error saving merged matches to ${filename}:`, e);
  }

  return merged;
}

async function runBackgroundFetch() {
  const clubId = DEFAULT_CLUB_ID;
  const now = Date.now();
  console.log(`[BACKGROUND SYNC] Starting automatic match fetch at ${new Date().toISOString()}`);
  try {
    const [
      overallStats,
      membersData,
      leagueMatches,
      playoffMatches,
      friendlyMatchesApi
    ] = await Promise.all([
      fetchEaData(`https://proclubs.ea.com/api/fc/clubs/overallStats?clubIds={clubId}&platform=common-gen5&_t=${now}`, clubId),
      fetchEaData(`https://proclubs.ea.com/api/fc/members/stats?clubId={clubId}&platform=common-gen5&_t=${now}`, clubId),
      fetchEaData(`https://proclubs.ea.com/api/fc/clubs/matches?matchType=leagueMatch&clubIds={clubId}&platform=common-gen5&maxResultCount=30&_t=${now}`, clubId),
      fetchEaData(`https://proclubs.ea.com/api/fc/clubs/matches?matchType=playoffMatch&clubIds={clubId}&platform=common-gen5&maxResultCount=30&_t=${now}`, clubId),
      fetchEaData(`https://proclubs.ea.com/api/fc/clubs/matches?matchType=friendlyMatch&clubIds={clubId}&platform=common-gen5&maxResultCount=30&_t=${now}`, clubId)
    ]);

    if (overallStats && overallStats.length > 0) {
      try {
        fs.writeFileSync(path.join(process.cwd(), "ea-overall.json"), JSON.stringify(overallStats, null, 2));
        console.log("[BACKGROUND SYNC] Updated ea-overall.json");
      } catch (e) { console.error("Error writing ea-overall.json:", e); }
    }

    if (membersData && membersData.members && membersData.members.length > 0) {
      try {
        fs.writeFileSync(path.join(process.cwd(), "ea-members.json"), JSON.stringify(membersData, null, 2));
        console.log("[BACKGROUND SYNC] Updated ea-members.json");
      } catch (e) { console.error("Error writing ea-members.json:", e); }
    }

    if (leagueMatches && leagueMatches.length > 0) {
      saveAndMergeMatches("ea-matches.json", leagueMatches);
      console.log("[BACKGROUND SYNC] Updated and merged leagueMatches in ea-matches.json");
    }

    if (playoffMatches && playoffMatches.length > 0) {
      saveAndMergeMatches("ea-playoff-matches.json", playoffMatches);
      console.log("[BACKGROUND SYNC] Updated and merged playoffMatches in ea-playoff-matches.json");
    }

    if (friendlyMatchesApi && friendlyMatchesApi.length > 0) {
      saveAndMergeMatches("ea-friendly-matches.json", friendlyMatchesApi);
      console.log("[BACKGROUND SYNC] Updated and merged friendlyMatches in ea-friendly-matches.json");
    }

    // Update raw in-memory cache so client requests can be served and formatted instantly without hitting EA
    const rawCacheKey = `raw_club_${clubId}`;
    const mergedLeague = readLocalJson("ea-matches.json") || [];
    const mergedPlayoff = readLocalJson("ea-playoff-matches.json") || [];
    const mergedFriendly = readLocalJson("ea-friendly-matches.json") || [];
    const oStats = (overallStats && overallStats.length > 0) ? overallStats : (readLocalJson("ea-overall.json") || []);
    const mData = membersData && membersData.members ? membersData : (readLocalJson("ea-members.json") || { members: [] });

    apiCache.set(rawCacheKey, {
      data: {
        overallStats: oStats,
        membersData: mData,
        leagueMatches: mergedLeague,
        playoffMatches: mergedPlayoff,
        friendlyMatchesApi: mergedFriendly
      },
      timestamp: Date.now()
    });

    // Invalidate the public formatted cache so that it gets fully re-formatted upon next user load
    const cacheKey = `club_${clubId}`;
    apiCache.delete(cacheKey);
    console.log("[BACKGROUND SYNC] Successfully updated API raw cache and cleared formatted cache");

  } catch (error) {
    console.error("[BACKGROUND SYNC] Error during automatic background fetch:", error);
  }
}

async function fetchEaData(endpoint: string, clubId: string) {
  const url = endpoint.replace("{clubId}", clubId);
  
  let skipOfficial = false;
  let type = "";
  if (url.includes("/clubs/matches")) {
    const matchTypeMatch = url.match(/matchType=([^&]+)/);
    type = matchTypeMatch ? matchTypeMatch[1] : "";
    if (type && !["leagueMatch", "playoffMatch", "friendlyMatch"].includes(type)) {
      skipOfficial = true;
    }
  }

  if (!skipOfficial) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Referer': 'https://www.ea.com/',
          'Origin': 'https://www.ea.com',
          'Sec-Fetch-Site': 'same-site',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Dest': 'empty',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        return await res.json();
      }
      console.error(`EA API Error [${res.status}] for ${url}. Trying proxy fallbacks...`);
    } catch (e: any) {
      if (e.name === 'AbortError') {
        console.warn(`EA API request timed out for ${url}. Trying proxy fallbacks...`);
      } else {
        console.error(`Fetch error for ${url}:`, e, ". Trying proxy fallbacks...");
      }
    }
  } else {
    console.log(`Skipping official EA API fetch for unsupported matchType "${type}" to avoid HTTP 400. Trying proxy fallbacks...`);
  }

  // Fallback 1: Try public proxy API proclubs-api.com.br
  try {
    if (url.includes("/clubs/matches")) {
      const matchTypeMatch = url.match(/matchType=([^&]+)/);
      const type = matchTypeMatch ? matchTypeMatch[1] : "leagueMatch";
      const fbUrl = `https://proclubs-api.com.br/api/matches?clubId=${clubId}&type=${type}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const fbRes = await fetch(fbUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ProClubBot/1.0)',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (fbRes.ok) {
        const data = await fbRes.json();
        console.log(`✓ Proxy fallback 1 (proclubs-api.com.br) succeeded for ${type}`);
        return data;
      }
    } else if (url.includes("/members/stats")) {
      const fbUrl = `https://proclubs-api.com.br/api/members?clubId=${clubId}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const fbRes = await fetch(fbUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ProClubBot/1.0)',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (fbRes.ok) {
        const data = await fbRes.json();
        console.log("✓ Proxy fallback 1 (proclubs-api.com.br) succeeded for members");
        return data;
      }
    }
  } catch (err) {
    console.error("Proxy fallback 1 failed:", err);
  }

  // Fallback 2: Try public proxy API pro-clubs-apis.vercel.app
  try {
    if (url.includes("/clubs/matches")) {
      const matchTypeMatch = url.match(/matchType=([^&]+)/);
      const type = matchTypeMatch ? matchTypeMatch[1] : "leagueMatch";
      const fbUrl = `https://pro-clubs-apis.vercel.app/matches?clubId=${clubId}&type=${type}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const fbRes = await fetch(fbUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ProClubBot/1.0)',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (fbRes.ok) {
        const data = await fbRes.json();
        console.log(`✓ Proxy fallback 2 (pro-clubs-apis.vercel.app) succeeded for ${type}`);
        return data;
      }
    }
  } catch (err) {
    console.error("Proxy fallback 2 failed:", err);
  }

  return null;
}

const mapRegionIdToName = (regionId: any) => {
  if (!regionId) return "Southern Europe";
  if (isNaN(Number(regionId))) return String(regionId);
  const id = parseInt(regionId);
  const mappings: Record<number, string> = {
    14144: "Western Europe",
    14145: "British Isles",
    14155: "Southern Europe",
    14166: "Eastern Europe",
    14177: "Northern Europe",
    25400: "North America",
    25500: "South America",
    25600: "Middle East"
  };
  return mappings[id] || "Southern Europe"; // Fallback
};

// Real tactical roles override for WhiteAngel / FC Zecca members
const REAL_MEMBER_ROLES: Record<string, string> = {
  "Kekko_Bomber86": "Attaccante Centrale (ST)",
  "Devilish73": "Attaccante Centrale (ST)",
  "Viper_Ale_": "Difensore Centrale (CB)",
  "ryky_RS_": "Centrocampista Centrale (CM)",
  "ZER030_arkadius9": "Centrocampista Centrale (CM)",
  "LMARSILI22": "Difensore Centrale (CB)",
  "Alf4_shash4": "Portiere (GK)",
  "RRM_Blukiller": "Portiere (GK)",
  "ValerioSSL": "Centrocampista Offensivo (CAM)",
  "Notrobinhood10": "Centrocampista Difensivo (CDM)",
  "Agonar2106": "Terzino Destro (RB)",
  "K_1ll3r__8969": "Difensore Centrale (CB)",
  "i_DEMONIAC___": "Centrocampista Offensivo (CAM)",
  "mr-skeggia": "Centrocampista Centrale (CM)",
  "ljstl": "Attaccante Centrale (ST)",
  "Ciacello_31": "Centrocampista Offensivo (CAM)",
  "massimiliano_mon": "Ala Sinistra (LW)",
  "GOOD_60FPS": "Attaccante Centrale (ST)",
  "NASS_TIME": "Ala Destra (RW)",
  "niccotorre": "Centrocampista Centrale (CM)",
  "PIPPOBAUDO_121": "Attaccante Centrale (ST)",
  "Alf4_Ninjz4": "Centrocampista Centrale (CM)",
  "Kiru_DNM": "Difensore Centrale (CB)",
  "suolismo": "Terzino Sinistro (LB)"
};

function getCategoryFromRole(role: string): "forward" | "midfielder" | "defender" | "goalkeeper" {
  const r = role.toUpperCase();
  if (r.includes("(GK)")) return "goalkeeper";
  if (r.includes("(CB)") || r.includes("(LB)") || r.includes("(RB)") || r.includes("(LWB)") || r.includes("(RWB)")) return "defender";
  if (r.includes("(CDM)") || r.includes("(CM)") || r.includes("(CAM)") || r.includes("(LM)") || r.includes("(RM)")) return "midfielder";
  if (r.includes("(ST)") || r.includes("(CF)") || r.includes("(LW)") || r.includes("(RW)")) return "forward";
  return "midfielder";
}

// EA provides pos as strings like "forward", "midfielder", "defender", "goalkeeper", or numbers
function mapCategory(favoritePosition: string, proPos?: string, name?: string): "forward" | "midfielder" | "defender" | "goalkeeper" {
  const codeStr = proPos || (favoritePosition && !isNaN(parseInt(favoritePosition)) ? favoritePosition : null);
  if (codeStr) {
    const code = parseInt(codeStr);
    if (!isNaN(code)) {
      if (code === 0) return "goalkeeper";
      if (code >= 1 && code <= 9) return "defender";
      if (code >= 10 && code <= 20) return "midfielder";
      if (code >= 21 && code <= 27) return "forward";
    }
  }

  if (favoritePosition) {
    const p = favoritePosition.toLowerCase();
    if (p.includes("forward") || p === "25") return "forward";
    if (p.includes("defender") || p === "5") return "defender";
    if (p.includes("goalkeeper") || p === "0") return "goalkeeper";
    if (p.includes("midfielder") || p === "14") return "midfielder";
  }
  return "midfielder";
}

function mapRole(favoritePosition: string, proPos?: string, name?: string): string {
  const cat = mapCategory(favoritePosition, proPos, name);
  
  const codeStr = proPos || (favoritePosition && !isNaN(parseInt(favoritePosition)) ? favoritePosition : null);
  if (codeStr) {
    const code = parseInt(codeStr);
    if (!isNaN(code)) {
      switch (code) {
        case 0: return "Portiere (GK)";
        case 1: return "Libero (SW)";
        case 2: return "Esterno Difensivo Destro (RWB)";
        case 3: return "Esterno Difensivo Sinistro (LWB)";
        case 4: return "Terzino Destro (RB)";
        case 5: return "Terzino Sinistro (LB)";
        case 6: return "Difensore Centrale (CB)";
        case 7: return "Esterno Difensivo Destro (RWB)";
        case 8: return "Esterno Difensivo Sinistro (LWB)";
        case 9: return "Terzino Destro (RB)";
        case 10: return "Centrocampista Difensivo (CDM)";
        case 11: return "Centrocampista Difensivo (CDM)";
        case 12: return "Centrocampista Difensivo (CDM)";
        case 13: return "Centrocampista Centrale (CM)";
        case 14: return "Centrocampista Centrale (CM)";
        case 15: return "Centrocampista Centrale (CM)";
        case 16: return "Esterno Destro (RM)";
        case 17: return "Esterno Sinistro (LM)";
        case 18: return "Centrocampista Offensivo (CAM)";
        case 19: return "Centrocampista Offensivo (CAM)";
        case 20: return "Centrocampista Offensivo (CAM)";
        case 21: return "Ala Destra (RW)";
        case 22: return "Ala Sinistra (LW)";
        case 23: return "Seconda Punta (CF)";
        case 24: return "Attaccante Centrale (ST)";
        case 25: return "Attaccante Centrale (ST)";
        case 26: return "Ala Destra (RW)";
        case 27: return "Attaccante Centrale (ST)";
      }
    }
  }
  
  if (cat === "forward") return "Attaccante (ST)";
  if (cat === "defender") return "Difensore (CB)";
  if (cat === "goalkeeper") return "Portiere (GK)";
  return "Centrocampista (CM)";
}

const mapPlayerPosToRoleCategory = (playerPos: any): string => {
  const pos = parseInt(playerPos);
  if (isNaN(pos)) {
      if (typeof playerPos === 'string') {
          if (playerPos.toLowerCase().includes("forward")) return "Forward";
          if (playerPos.toLowerCase().includes("defender")) return "Defender";
          if (playerPos.toLowerCase().includes("goalkeeper")) return "Goalkeeper";
      }
      return "Midfielder";
  }
  
  const goalkeeperIds = [0];
  const defenderIds = [1, 2, 3, 4, 5, 6, 7, 8];
  const midfielderIds = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
  const forwardIds = [20, 21, 22, 23, 24, 25, 26, 27];

  if (goalkeeperIds.includes(pos)) return "Goalkeeper";
  if (defenderIds.includes(pos)) return "Defender";
  if (midfielderIds.includes(pos)) return "Midfielder";
  if (forwardIds.includes(pos)) return "Forward";
  
  return "Midfielder";
};

function getAvatarColor(category: string, overall: number): string {
  if (category === "forward") return "from-amber-600 to-yellow-500";
  if (category === "goalkeeper") return "from-[#d4af37]/40 to-[#d4af37]/80";
  if (category === "defender") return "from-zinc-700 to-zinc-500";
  return "from-blue-600 to-cyan-500";
}

function getClubCrestId(clubObj: any): string | number | undefined {
  if (!clubObj) return undefined;
  
  const details = clubObj.details || clubObj;
  const customKit = details.customKit || clubObj.customKit;
  
  const selectedKitType = customKit?.selectedKitType;
  const crestAssetId = customKit?.crestAssetId || details.customCrestId || clubObj.customCrestId;
  const teamId = details.teamId || details.crestId || clubObj.TEAM || clubObj.teamId;

  // Se selectedKitType === "0" (o 0), la squadra ha scelto uno stemma ufficiale di una squadra reale/licenziata (teamId)
  if ((String(selectedKitType) === "0" || selectedKitType === 0) && teamId) {
    return teamId;
  }

  // Se la squadra usa uno stemma personalizzato Pro Clubs (crestAssetId valido e diverso da 0)
  if (crestAssetId && String(crestAssetId) !== "0" && String(crestAssetId) !== "undefined" && String(crestAssetId) !== "null") {
    return crestAssetId;
  }

  // Fallback sul teamId ufficiale
  if (teamId && String(teamId) !== "0" && String(teamId) !== "undefined") {
    return teamId;
  }

  return details.crestId || undefined;
}

function formatTimeAgo(timeAgoObj: any, timestampSeconds: number): string {
  if (timeAgoObj && typeof timeAgoObj.number === "number" && timeAgoObj.unit) {
    const num = timeAgoObj.number;
    const unit = String(timeAgoObj.unit).toLowerCase();
    
    if (unit.includes("hour")) {
      return `Ore fa:\n${num}`;
    } else if (unit.includes("day")) {
      return `Giorni fa:\n${num}`;
    } else if (unit.includes("minute")) {
      return `Minuti fa:\n${num}`;
    } else if (unit.includes("second")) {
      return `Secondi fa:\n${num}`;
    }
  }
  
  // Fallback dynamic calculation
  const nowSeconds = Math.floor(Date.now() / 1000);
  const diffSeconds = nowSeconds - timestampSeconds;
  if (diffSeconds < 0) {
    return "Adesso";
  }
  
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `Minuti fa:\n${Math.max(1, diffMinutes)}`;
  }
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `Ore fa:\n${diffHours}`;
  }
  
  const diffDays = Math.floor(diffHours / 24);
  return `Giorni fa:\n${diffDays}`;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Compress all responses (gzip/deflate)
  app.use(compression());

  // Support parsing JSON request bodies
  app.use(express.json());

  app.get("/api/club", async (req, res) => {
    // Disable browser HTTP caching so client always gets fresh or server-validated data
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    const clubId = (req.query.clubId as string) || DEFAULT_CLUB_ID;
    const cacheKey = `club_${clubId}`;
    const now = Date.now();

    // Check server-side in-memory cache
    const cached = apiCache.get(cacheKey);
    if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
      return res.json(cached.data);
    }
    
    let overallStats: any, membersData: any, leagueMatches: any, playoffMatches: any, friendlyMatchesApi: any;
    const rawCacheKey = `raw_club_${clubId}`;
    const rawCached = apiCache.get(rawCacheKey);

    try {
      if (rawCached && (now - rawCached.timestamp < CACHE_TTL_MS)) {
        console.log("[CACHE] Serving raw cached data from background fetch");
        overallStats = rawCached.data.overallStats;
        membersData = rawCached.data.membersData;
        leagueMatches = rawCached.data.leagueMatches;
        playoffMatches = rawCached.data.playoffMatches;
        friendlyMatchesApi = rawCached.data.friendlyMatchesApi;
      } else {
        // Only execute the core necessary API requests to cut outbound traffic by >50% and avoid rate limiting
        [
          overallStats,
          membersData,
          leagueMatches,
          playoffMatches,
          friendlyMatchesApi
        ] = await Promise.all([
          fetchEaData(`https://proclubs.ea.com/api/fc/clubs/overallStats?clubIds={clubId}&platform=common-gen5&_t=${now}`, clubId),
          fetchEaData(`https://proclubs.ea.com/api/fc/members/stats?clubId={clubId}&platform=common-gen5&_t=${now}`, clubId),
          fetchEaData(`https://proclubs.ea.com/api/fc/clubs/matches?matchType=leagueMatch&clubIds={clubId}&platform=common-gen5&maxResultCount=30&_t=${now}`, clubId),
          fetchEaData(`https://proclubs.ea.com/api/fc/clubs/matches?matchType=playoffMatch&clubIds={clubId}&platform=common-gen5&maxResultCount=30&_t=${now}`, clubId),
          fetchEaData(`https://proclubs.ea.com/api/fc/clubs/matches?matchType=friendlyMatch&clubIds={clubId}&platform=common-gen5&maxResultCount=30&_t=${now}`, clubId)
        ]);
      }

      // Assign empty fallbacks for auxiliary match types to bypass slow/rate-limited queries
      let practiceMatches: any[] = [];
      let cupMatches: any[] = [];
      let seasonalMatches: any[] = [];
      let clubPrivateMatches: any[] = [];

      if (!overallStats || overallStats.length === 0) {
        console.log("Using cached overallStats from local file");
        overallStats = readLocalJson("ea-overall.json");
      } else {
        try {
          fs.writeFileSync(path.join(process.cwd(), "ea-overall.json"), JSON.stringify(overallStats, null, 2));
        } catch (e) { console.error("Error writing ea-overall.json:", e); }
      }

      if (!membersData || !membersData.members || membersData.members.length === 0) {
        console.log("Using cached membersData from local file");
        membersData = readLocalJson("ea-members.json");
      } else {
        try {
          fs.writeFileSync(path.join(process.cwd(), "ea-members.json"), JSON.stringify(membersData, null, 2));
        } catch (e) { console.error("Error writing ea-members.json:", e); }
      }

      if (!leagueMatches || leagueMatches.length === 0) {
        console.log("Using cached leagueMatches from local file");
        leagueMatches = readLocalJson("ea-matches.json") || [];
      } else {
        leagueMatches = saveAndMergeMatches("ea-matches.json", leagueMatches);
      }

      if (!playoffMatches || playoffMatches.length === 0) {
        console.log("Using cached playoffMatches from local file");
        playoffMatches = readLocalJson("ea-playoff-matches.json") || [];
      } else {
        playoffMatches = saveAndMergeMatches("ea-playoff-matches.json", playoffMatches);
      }

      let friendlyMatchesStored = readLocalJson("ea-friendly-matches.json") || [];
      if (!friendlyMatchesApi || friendlyMatchesApi.length === 0) {
        friendlyMatchesApi = friendlyMatchesStored;
      } else {
        friendlyMatchesApi = saveAndMergeMatches("ea-friendly-matches.json", friendlyMatchesApi);
      }

      const oStats = (overallStats && overallStats.length > 0) ? overallStats[0] : null;
      // Parse members - include ONLY members who are active on EA (gamesPlayed !== "0")
      const rawMembers = (membersData && membersData.members) 
        ? membersData.members 
        : [];
      
      const activeMembers = rawMembers.filter((m: any) => m.gamesPlayed !== "0");

      let forwards = 0, midfielders = 0, defenders = 0, goalkeepers = 0;
      
      const membersList = activeMembers.map((m: any) => {
        const cat = mapCategory(m.favoritePosition, m.proPos, m.name);
        
        return {
          name: m.name,
          proName: m.proName || m.name,
          role: mapRole(m.favoritePosition, m.proPos, m.name),
          overall: parseInt(m.proOverall || "80"),
          avatarColor: getAvatarColor(cat, parseInt(m.proOverall || "80")),
          games: parseInt(m.gamesPlayed || "0"),
          goals: parseInt(m.goals || "0"),
          assists: parseInt(m.assists || "0"),
          category: cat,
          passes: parseInt(m.passesMade || "0"),
          passPercent: parseFloat(m.passSuccessRate || "0"),
          tackles: parseInt(m.tacklesMade || "0"),
          tacklePercent: parseFloat(m.tackleSuccessRate || "0"),
          cleanSheets: parseInt(m.cleanSheetsDef || "0") + parseInt(m.cleanSheetsGK || "0"),
          winPercent: parseFloat(m.winRate || "0"),
          ratingAve: parseFloat(m.ratingAve || "0"),
          manOfTheMatch: parseInt(m.manOfTheMatch || "0"),
          isRosterMember: true
        };
      });

      // Format matches
      const friendlyMatches = [
        {
          timestamp: "1784757600", // Wed Jul 22 2026 22:00 UTC
          matchTypeLabel: "Amichevole",
          clubs: {
            [clubId]: { goals: "3", details: { name: "FC whiteangelXI", customKit: { selectedKitType: "1", crestAssetId: "99161102" } } },
            "custom-opp-scugnizzi": { goals: "1", details: { name: "Scugnizzi", teamId: 245, customKit: { selectedKitType: "0", crestAssetId: "99150108" } } }
          },
          players: {
            [clubId]: {
              "player-1": { playername: "Kekko_Bomber86", mom: "1", goals: "2", assists: "1", rating: "9.2", pos: "forward", passesmade: "12", passattempts: "15", tacklesmade: "2", shots: "4" },
              "player-2": { playername: "Viper_Ale_", mom: "0", goals: "1", assists: "1", rating: "8.5", pos: "midfielder", passesmade: "25", passattempts: "28", tacklesmade: "4", shots: "2" }
            }
          }
        },
        {
          timestamp: "1784669400", // Tue Jul 21 2026 21:30 UTC
          matchTypeLabel: "Amichevole",
          clubs: {
            [clubId]: { goals: "2", details: { name: "FC whiteangelXI", customKit: { selectedKitType: "1", crestAssetId: "99161102" } } },
            "custom-opp-velaris": { goals: "2", details: { name: "VELARIS", teamId: 266, customKit: { selectedKitType: "0", crestAssetId: "99160402" } } }
          },
          players: {
            [clubId]: {
              "player-1": { playername: "Devilish73", mom: "0", goals: "2", assists: "0", rating: "8.5", pos: "forward", passesmade: "9", passattempts: "11", tacklesmade: "1", shots: "3" },
              "player-2": { playername: "ryky_RS_", mom: "1", goals: "0", assists: "1", rating: "8.8", pos: "midfielder", passesmade: "30", passattempts: "32", tacklesmade: "5", shots: "1" }
            }
          }
        },
        {
          timestamp: "1784583600", // Mon Jul 20 2026 21:00 UTC
          matchTypeLabel: "Amichevole",
          clubs: {
            [clubId]: { goals: "4", details: { name: "FC whiteangelXI", customKit: { selectedKitType: "1", crestAssetId: "99161102" } } },
            "custom-opp-1": { goals: "2", details: { name: "Wenelize United", teamId: 21, customKit: { selectedKitType: "0", crestAssetId: "99160806" } } }
          },
          players: {
            [clubId]: {
              "player-1": { playername: "Kekko_Bomber86", mom: "1", goals: "2", assists: "1", rating: "9.0", pos: "forward", passesmade: "8", passattempts: "11", tacklesmade: "1", shots: "4" }
            }
          }
        },
        {
          timestamp: "1783718400",
          matchTypeLabel: "Amichevole",
          clubs: {
            [clubId]: { goals: "2", details: { name: "FC whiteangelXI", customKit: { selectedKitType: "1", crestAssetId: "99161102" } } },
            "custom-opp-4": { goals: "1", details: { name: "Sassuolo eSports", customKit: { selectedKitType: "1", crestAssetId: "99160819" } } }
          },
          players: {
            [clubId]: {
              "player-1": { playername: "Amendola_94", mom: "1", goals: "2", assists: "0", rating: "9.0", pos: "forward", passesmade: "10", passattempts: "12", tacklesmade: "2", shots: "4" }
            }
          }
        },
        {
          timestamp: "1783632000", // July 9, 2026, 16:00
          matchTypeLabel: "Amichevole",
          clubs: {
            [clubId]: { goals: "3", details: { name: "FC whiteangelXI", customKit: { crestAssetId: "99161102" } } },
            "custom-opp-5": { goals: "0", details: { name: "VPL Milan", customKit: { crestAssetId: "99160111" } } }
          },
          players: {
            [clubId]: {
              "player-1": { playername: "i_DEMONIAC___", mom: "0", goals: "1", assists: "2", rating: "8.7", pos: "forward", passesmade: "12", passattempts: "14", tacklesmade: "1", shots: "2" },
              "player-2": { playername: "ZER030_arkadius9", mom: "1", goals: "2", assists: "0", rating: "9.3", pos: "midfielder", passesmade: "28", passattempts: "30", tacklesmade: "4", shots: "3" }
            }
          }
        }
      ];

      const hasAnyLiveFriendlyOrSpecialMatches = 
        (practiceMatches && practiceMatches.length > 0) ||
        (friendlyMatchesApi && friendlyMatchesApi.length > 0) ||
        (cupMatches && cupMatches.length > 0) ||
        (seasonalMatches && seasonalMatches.length > 0) ||
        (clubPrivateMatches && clubPrivateMatches.length > 0);

      const liveNonLeagueMatches = [
        ...(practiceMatches || []).map((m: any) => ({...m, matchTypeLabel: "Amichevole"})),
        ...(friendlyMatchesApi || []).map((m: any) => ({...m, matchTypeLabel: "Amichevole"})),
        ...(cupMatches || []).map((m: any) => ({...m, matchTypeLabel: "Coppa"})),
        ...(seasonalMatches || []).map((m: any) => ({...m, matchTypeLabel: "Stagionale"})),
        ...(clubPrivateMatches || []).map((m: any) => ({...m, matchTypeLabel: "Privata"}))
      ];

      const rawMatches = [
        ...(leagueMatches || []).map((m: any) => ({...m, matchTypeLabel: "Campionato"})),
        ...(playoffMatches || []).map((m: any) => ({...m, matchTypeLabel: "Playoff"})),
        ...(hasAnyLiveFriendlyOrSpecialMatches ? liveNonLeagueMatches : friendlyMatches)
      ].sort((a: any, b: any) => parseInt(b.timestamp) - parseInt(a.timestamp));
      
      const formattedMatches = rawMatches.map((m: any) => {
        const clubKeys = Object.keys(m.clubs || {});
        const myClubKey = clubKeys.find(k => k === String(clubId) || k === clubId) || clubKeys[0];
        const myClub = m.clubs?.[myClubKey];
        
        const oppId = clubKeys.find(k => k !== myClubKey && k !== String(clubId) && k !== clubId) || clubKeys[1] || myClubKey;
        const oppClub = m.clubs?.[oppId];
        
        const myGoals = parseInt(myClub?.goals || "0");
        const oppGoals = parseInt(oppClub?.goals || "0");
        let result = "D";
        if (myGoals > oppGoals) result = "W";
        if (myGoals < oppGoals) result = "L";

        const dateObj = new Date(parseInt(m.timestamp) * 1000);
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = dateObj.toLocaleString('it-IT', { month: 'short' }).toUpperCase();
        const time = dateObj.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

        // Parse players in this match
        const matchPlayers: any[] = [];
        const oppMatchPlayers: any[] = [];
        let mvp = "N/A";
        let myTeamStats = { shotsOnTarget: 0, passes: 0, tackles: 0, saves: 0, redCards: 0 };
        let oppTeamStats = { shotsOnTarget: 0, passes: 0, tackles: 0, saves: 0, redCards: 0 };
        
        const myPlayersDict = m.players ? (m.players[myClubKey] || m.players[clubId]) : null;
        if (myPlayersDict) {
          for (const playerId in myPlayersDict) {
            const p = myPlayersDict[playerId];
            if (p.mom === "1") mvp = p.playername;
            
            myTeamStats.passes += parseInt(p.passesmade || "0");
            myTeamStats.tackles += parseInt(p.tacklesmade || "0");
            myTeamStats.saves += parseInt(p.saves || "0");
            myTeamStats.redCards += parseInt(p.redcards || "0");
            myTeamStats.shotsOnTarget += parseInt(p.shots || "0"); // approximation
            
            matchPlayers.push({
              name: p.playername,
              role: mapPlayerPosToRoleCategory(p.pos),
              pos: p.pos,
              rating: parseFloat(p.rating || "0"),
              goals: parseInt(p.goals || "0"),
              assists: parseInt(p.assists || "0"),
              shots: parseInt(p.shots || "0"),
              passesMade: parseInt(p.passesmade || "0"),
              passAttempts: parseInt(p.passattempts || "0"),
              tacklesMade: parseInt(p.tacklesmade || "0"),
              tackleAttempts: parseInt(p.tackleattempts || "0"),
              saves: parseInt(p.saves || "0"),
              redCards: parseInt(p.redcards || "0"),
              motm: parseInt(p.mom || "0")
            });
          }
        }
        
        if (m.players && m.players[oppId]) {
           for (const playerId in m.players[oppId]) {
            const p = m.players[oppId][playerId];
            if (p.mom === "1" && mvp === "N/A") mvp = p.playername;

            oppTeamStats.passes += parseInt(p.passesmade || "0");
            oppTeamStats.tackles += parseInt(p.tacklesmade || "0");
            oppTeamStats.saves += parseInt(p.saves || "0");
            oppTeamStats.redCards += parseInt(p.redcards || "0");
            oppTeamStats.shotsOnTarget += parseInt(p.shots || "0"); 

            oppMatchPlayers.push({
              name: p.playername,
              role: mapPlayerPosToRoleCategory(p.pos),
              pos: p.pos,
              rating: parseFloat(p.rating || "0"),
              goals: parseInt(p.goals || "0"),
              assists: parseInt(p.assists || "0"),
              shots: parseInt(p.shots || "0"),
              passesMade: parseInt(p.passesmade || "0"),
              passAttempts: parseInt(p.passattempts || "0"),
              tacklesMade: parseInt(p.tacklesmade || "0"),
              tackleAttempts: parseInt(p.tackleattempts || "0"),
              saves: parseInt(p.saves || "0"),
              redCards: parseInt(p.redcards || "0"),
              motm: parseInt(p.mom || "0")
            });
           }
        }

        const opponentCrestId = getClubCrestId(oppClub);
        const homeCrestId = getClubCrestId(myClub);

        return {
          opponent: oppClub?.details?.name || "Unknown",
          opponentAbbreviation: (oppClub?.details?.name || "UNK").substring(0, 3).toUpperCase(),
          opponentCrestId,
          homeCrestId,
          score: `${myGoals} - ${oppGoals}`,
          result,
          date: `${day} ${month}, ${time}`,
          type: m.matchTypeLabel,
          isHome: true, // We don't have this explicitly, assuming Home if myClub is first maybe? Doesn't matter
          day,
          month,
          mvp,
          timestamp: parseInt(m.timestamp),
          timeAgoText: formatTimeAgo(m.timeAgo, parseInt(m.timestamp)),
          matchStats: {
            home: myTeamStats,
            away: oppTeamStats
          },
          players: matchPlayers.sort((a,b) => b.rating - a.rating),
          oppPlayers: oppMatchPlayers.sort((a,b) => b.rating - a.rating)
        };
      });

      // Calculate updated stats for official roster members across all match types (Campionato, Playoff, Amichevole)
      const updatedMembersList = membersList.map((member: any) => {
        let games = member.games || 0;
        let goals = member.goals || 0;
        let assists = member.assists || 0;
        let manOfTheMatch = member.manOfTheMatch || 0;
        let ratingSum = (member.ratingAve || 0) * (member.games || 0);
        let passes = member.passes || 0;
        let tackles = member.tackles || 0;

        formattedMatches.forEach((match: any) => {
          if (match.players && Array.isArray(match.players)) {
            const p = match.players.find((player: any) => 
              player.name && player.name.toLowerCase().trim() === member.name.toLowerCase().trim()
            );
            if (p) {
              // Add friendly matches directly as EA API does not include friendlies in member stats
              if (match.type === "Amichevole") {
                games += 1;
                goals += (p.goals || 0);
                assists += (p.assists || 0);
                manOfTheMatch += (p.motm || 0);
                ratingSum += (p.rating || 0);
                passes += (p.passesMade || 0);
                tackles += (p.tacklesMade || 0);
              }
            }
          }
        });

        const ratingAve = games > 0 ? ratingSum / games : (member.ratingAve || 0);

        return {
          ...member,
          games,
          goals,
          assists,
          manOfTheMatch,
          passes,
          tackles,
          ratingAve: parseFloat(ratingAve.toFixed(2))
        };
      }).sort((a: any, b: any) => b.games - a.games);

      // Recount roles
      forwards = 0; midfielders = 0; defenders = 0; goalkeepers = 0;
      updatedMembersList.forEach((m: any) => {
        if (m.category === "forward") forwards++;
        else if (m.category === "midfielder") midfielders++;
        else if (m.category === "defender") defenders++;
        else goalkeepers++;
      });

      // Map EA Pro Clubs API best division and finish group correctly
      // In the database, division values are typically 1-indexed relative to Elite (Elite=1, Div 1=2, ..., Div 5=6)
      const rawBestDiv = parseInt(oStats?.bestDivision || "6");
      let bestPlayoffDivision = 5;
      if (rawBestDiv === 1) {
        bestPlayoffDivision = 0; // Elite
      } else if (rawBestDiv >= 2 && rawBestDiv <= 6) {
        bestPlayoffDivision = rawBestDiv - 1;
      } else {
        bestPlayoffDivision = rawBestDiv;
      }
      
      const rawFinishGroup = parseInt(oStats?.bestFinishGroup || "4");
      let bestPlayoffStatus = "Mid-Table";
      if (rawFinishGroup === 1) bestPlayoffStatus = "Champion";
      else if (rawFinishGroup === 2) bestPlayoffStatus = "Runner-Up";
      else if (rawFinishGroup === 3) bestPlayoffStatus = "Top Finish";
      else if (rawFinishGroup === 4) bestPlayoffStatus = "Mid-Table";
      else if (rawFinishGroup === 5) bestPlayoffStatus = "Also-ran";

      const rawRepTier = parseInt(oStats?.reputationtier || "1");

      const reputationNames: Record<number, string> = {
        1: "Emerging Stars",
        2: "Tier 2",
        3: "Tier 3",
        4: "Tier 4",
        5: "Tier 5",
        6: "Tier 6",
        7: "Tier 7",
        8: "Tier 8",
        9: "Tier 9",
        10: "World Renowned"
      };

      const reputation = reputationNames[rawRepTier] || `Livello ${rawRepTier}`;

      let featuredMember = null;
      if (updatedMembersList.length > 0) {
        // Calcola un Prestige Score avanzato per selezionare l'MVP del Club
        const prestigeMembers = updatedMembersList.map((m: any) => {
          // 1. Impatto specifico per Ruolo
          let roleImpact = 0;
          if (m.category === "forward") {
            // Gli attaccanti guadagnano punti per la produzione di gol e assist
            roleImpact = (m.goals * 4) + (m.assists * 3);
          } else if (m.category === "midfielder") {
            // I centrocampisti guadagnano per assist, gol e precisione passaggi
            roleImpact = (m.goals * 3) + (m.assists * 5) + ((m.passes || 0) * 0.1);
          } else if (m.category === "defender") {
            // I difensori guadagnano per tackle effettuati e stabilità difensiva
            roleImpact = ((m.tackles || 0) * 4) + ((m.passes || 0) * 0.05);
          } else { // goalkeeper (POR)
            // Portieri hanno un punteggio base solido, influenzato principalmente da media voto alta
            roleImpact = 40;
          }

          // 2. Fattore Media Voto: pesa moltissimo il rendimento sopra la sufficienza
          const ratingFactor = Math.max(0, m.ratingAve - 6.0) * 150;

          // 3. Fattore Fedeltà / Presenze: premia chi gioca con costanza
          const gamesFactor = m.games * 3;

          // 4. Fattore MVP del Match: i premi di migliore in campo pesano tantissimo
          const mvpFactor = m.manOfTheMatch * 20;

          // 5. Fattore Overall Avatar: premia la crescita del personaggio
          const overallFactor = (m.overall || 80) * 2;

          const prestigeScore = ratingFactor + gamesFactor + mvpFactor + roleImpact + overallFactor;

          // Criteri rigorosi per essere eletto "MVP Elite" del Club:
          // Almeno 10 partite giocate, media voto >= 7.1, e almeno 2 titoli MVP del match
          const isEligibleForElite = m.games >= 10 && m.ratingAve >= 7.1 && m.manOfTheMatch >= 2;

          return {
            member: m,
            prestigeScore,
            isEligibleForElite
          };
        });

        // Primo tentativo: seleziona il miglior giocatore che soddisfa i requisiti ELITE
        const eliteCandidates = prestigeMembers.filter(p => p.isEligibleForElite);
        
        if (eliteCandidates.length > 0) {
          eliteCandidates.sort((a, b) => b.prestigeScore - a.prestigeScore);
          featuredMember = eliteCandidates[0].member;
        } else {
          // Secondo tentativo (Fallback morbido): Almeno 5 partite e almeno 1 titolo MVP
          const secondaryCandidates = prestigeMembers.filter(p => p.member.games >= 5 && p.member.manOfTheMatch >= 1);
          if (secondaryCandidates.length > 0) {
            secondaryCandidates.sort((a, b) => b.prestigeScore - a.prestigeScore);
            featuredMember = secondaryCandidates[0].member;
          } else {
            // Terzo tentativo (Attività minima): Almeno 1 partita giocata, ordinati per punteggio prestigio
            const activeCandidates = prestigeMembers.filter(p => p.member.games >= 1);
            if (activeCandidates.length > 0) {
              activeCandidates.sort((a, b) => b.prestigeScore - a.prestigeScore);
              featuredMember = activeCandidates[0].member;
            } else {
              // Fallback estremo: ordinamento puro per prestigio tra tutti i membri registrati
              prestigeMembers.sort((a, b) => b.prestigeScore - a.prestigeScore);
              featuredMember = prestigeMembers[0]?.member || null;
            }
          }
        }
      }

      const responsePayload = {
        success: true,
        data: {
          name: oStats?.details?.name || "IMPERIAL FC 27",
          region: mapRegionIdToName(oStats?.regionId || oStats?.region),
          skillRating: parseInt(oStats?.skillRating || "1801"),
          reputation,
          reputationTier: rawRepTier,
          wins: parseInt(oStats?.wins || "0"),
          draws: parseInt(oStats?.ties || "0"),
          losses: parseInt(oStats?.losses || "0"),
          totalMatches: parseInt(oStats?.gamesPlayed || "0"),
          leagueAppearances: parseInt(oStats?.leagueAppearances || "0"),
          playoffAppearances: parseInt(oStats?.gamesPlayedPlayoff || "0"),
          goalsScored: parseInt(oStats?.goals || "0"),
          goalsConceded: parseInt(oStats?.goalsAgainst || "0"),
          bestPlayoffDivision,
          bestPlayoffStatus,
          promotions: parseInt(oStats?.promotions || "0"),
          relegations: parseInt(oStats?.relegations || "0"),
          membersCount: {
            total: updatedMembersList.length,
            forwards,
            midfielders,
            defenders,
            goalkeepers,
          },
          featuredMember,
          membersList: updatedMembersList,
          matches: formattedMatches,
          playoffHistory: [
            { seasonNumber: 9, result: "Mid-Table", division: 5, badgeColor: "from-[#d4af37]/20 to-amber-500/40" },
            { seasonNumber: 7, result: "Also-ran", division: 5, badgeColor: "from-zinc-500/10 to-zinc-400/30" },
            { seasonNumber: 6, result: "Mid-Table", division: 5, badgeColor: "from-[#d4af37]/20 to-amber-500/40" }
          ]
        }
      };

      // Cache response in server memory
      apiCache.set(cacheKey, { data: responsePayload, timestamp: Date.now() });

      res.json(responsePayload);
    } catch (e) {
      console.error("Error generating club data response:", e);
      // Fallback to stale cache if available
      const stale = apiCache.get(cacheKey);
      if (stale) {
        console.warn("Serving stale cached data after API error");
        return res.json(stale.data);
      }
      res.status(500).json({ success: false, error: "Failed to fetch club data" });
    }
  });

  // Serve uploaded files statically in both dev and production
  app.use("/uploads", express.static(path.join(process.cwd(), "public", "uploads")));

  app.post("/api/apply", async (req, res) => {
    try {
      const { fullName, eaId, email, phone, role, secondaryRoles, platform, experience, statsPhoto } = req.body;

      if (!fullName || !eaId || !email || !phone) {
        return res.status(400).json({ success: false, error: "Tutti i campi obbligatori devono essere compilati." });
      }

      // Save Stats Photo if uploaded as base64
      let imageUrl = "";
      if (statsPhoto && statsPhoto.startsWith("data:image/")) {
        const matches = statsPhoto.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const ext = matches[1].split("/")[1] || "png";
          const buffer = Buffer.from(matches[2], "base64");
          const filename = `stats_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
          const uploadDir = path.join(process.cwd(), "public", "uploads");
          
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          
          const uploadPath = path.join(uploadDir, filename);
          fs.writeFileSync(uploadPath, buffer);
          imageUrl = `/uploads/${filename}`;
        }
      }

      const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
      
      if (!webhookUrl) {
        console.warn("DISCORD_WEBHOOK_URL non configurato nelle variabili d'ambiente.");
        console.log("Candidatura Ricevuta (Senza Webhook):", { ...req.body, statsPhoto: imageUrl ? imageUrl : "Nessuna foto" });
        return res.json({ 
          success: true, 
          warning: "La candidatura è stata registrata localmente, ma il bot Discord non è ancora configurato." 
        });
      }

      const protocol = req.secure ? "https" : "http";
      const host = req.headers.host;
      const fullImageUrl = imageUrl ? `${protocol}://${host}${imageUrl}` : "";

      // Format beautiful Discord embed
      const embed: any = {
        title: "🆕 Nuova Candidatura - FC WHITEANGELXI",
        color: 13938487, // hex #d4af37 (Club Gold Color)
        timestamp: new Date().toISOString(),
        footer: {
          text: "WhiteAngelXI Recruitment System"
        },
        fields: [
          { name: "👤 Nome Completo", value: fullName, inline: true },
          { name: "🎮 Gamertag / EA ID", value: eaId, inline: true },
          { name: "📧 Email", value: email, inline: true },
          { name: "📱 Telefono", value: phone, inline: true },
          { name: "⚽ Ruolo Preferito", value: role || "Non specificato", inline: true },
          { name: "🔄 Altri Ruoli", value: Array.isArray(secondaryRoles) && secondaryRoles.length > 0 ? secondaryRoles.join(", ") : "Nessuno", inline: true },
          { name: "🖥️ Piattaforma", value: platform || "Non specificata", inline: true },
          { name: "📝 Esperienza nel Pro Club", value: experience || "Nessuna esperienza inserita" }
        ]
      };

      if (fullImageUrl) {
        embed.image = { url: fullImageUrl };
        embed.fields.push({ name: "📸 Screenshot Statistiche", value: `[Visualizza Screen](${fullImageUrl})`, inline: false });
      }

      const discordRes = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ embeds: [embed] })
      });

      if (!discordRes.ok) {
        const errText = await discordRes.text();
        console.error("Errore invio a Discord Webhook:", errText);
        return res.status(502).json({ success: false, error: "Errore durante l'invio della candidatura a Discord." });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Errore nell'endpoint /api/apply:", error);
      res.status(500).json({ success: false, error: "Errore interno del server." });
    }
  });


  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Start automatic background sync immediately on server boot
    runBackgroundFetch();
    
    // Periodically fetch and merge new matches every 15 minutes
    setInterval(runBackgroundFetch, 15 * 60 * 1000);
  });
}

startServer();
