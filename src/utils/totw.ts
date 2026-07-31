import { ClubMatch, ClubMember } from "../hooks/useClubData";
import { parseAndTranslateRole, getRoleCategoryName } from "./roleUtils";

export const getResolvedRole = (player: { name: string; role: string; goals: number; assists: number }): string => {
  return player.role || "Midfielder";
};

export interface TOTWPlayer {
  name: string;
  role: string; // "ST" | "CM" | "CB" | "GK"
  rating: number; // e.g. 9.1
  stats: string; // e.g. "3 Gol / 1 Assist"
  category: "forward" | "midfielder" | "defender" | "goalkeeper";
  weeklyRating: number;
  weeklyStat: string;
  gamesPlayed: number;
  awardLabel?: string;
  subRoleLabel?: string;
  mainRoleLabel?: string;
  siglaLabel?: string;
  dotColor?: string;
  isMVP?: boolean;
  isStarDelClub?: boolean;
  weeklyStats?: {
    roleFidelity: number;
    tacticalMatch: boolean;
    compatibilityScore: number;
    passSuccessRate: number;
    tackleSuccessRate: number;
    shots: number;
    saves: number;
    passesMade?: number;
    passAttempts?: number;
    tacklesMade?: number;
    tackleAttempts?: number;
    motm?: number;
    games?: number;
    goals?: number;
    assists?: number;
    ratingAve?: number;
    rosterRole: string;
    rosterCategory: string;
    primaryPlayedRole: string;
  };
}

export interface WeeklyPlayerStats {
  name: string;
  proName?: string;
  role: string; // The primary role played this week
  overall: number; // Overall from roster
  avatarColor: string;
  games: number; // Games played this week
  goals: number; // Goals scored this week
  assists: number; // Assists this week
  category: "forward" | "midfielder" | "defender" | "goalkeeper"; // Primary category played this week
  ratingAve: number; // Average rating this week
  manOfTheMatch: number; // MOTM this week
  weeklyStats: {
    roleFidelity: number;
    tacticalMatch: boolean;
    compatibilityScore: number;
    passSuccessRate: number;
    tackleSuccessRate: number;
    shots: number;
    saves: number;
    passesMade?: number;
    passAttempts?: number;
    tacklesMade?: number;
    tackleAttempts?: number;
    motm?: number;
    games?: number;
    goals?: number;
    assists?: number;
    ratingAve?: number;
    rosterRole: string;
    rosterCategory: string;
    primaryPlayedRole: string;
  };
}

/**
 * STEP 1: Macro-Categories Role Dictionary (ATT, CEN, DIF, POR)
 */
export function getMacroRole(eaPosition: string): "forward" | "midfielder" | "defender" | "goalkeeper" {
  if (!eaPosition) return "midfielder";
  const upper = eaPosition.toUpperCase();
  const parsed = parseAndTranslateRole(eaPosition);
  const sigla = parsed.sigla;

  if (sigla === "POR" || upper.includes("GK") || upper.includes("GOALKEEPER")) {
    return "goalkeeper";
  }
  if (["DC", "TS", "TD", "ASA", "ADA"].includes(sigla) || upper.includes("DEF") || upper.includes("CB") || upper.includes("BACK")) {
    return "defender";
  }
  if (["COC", "ATT", "AT", "AS", "AD"].includes(sigla) || upper.includes("FWD") || upper.includes("STRIKER") || upper.includes("FORWARD") || upper.includes("ATTACCANTE")) {
    return "forward";
  }
  return "midfielder";
}

/**
 * Checks if a match timestamp falls on Monday, Tuesday, Wednesday, or Thursday
 * (including late Thursday night session matches up to 5:00 AM Friday) in Italian timezone (Europe/Rome).
 */
export function normalizeName(s: string): string {
  if (!s || typeof s !== 'string') return '';
  return s.toLowerCase().replace(/[^a-z0-9]/gi, '').trim();
}

export function extractPlayersFromMatch(match: ClubMatch): any[] {
  if (!match || !match.players) return [];

  // If match.players is an array
  if (Array.isArray(match.players)) {
    return match.players;
  }

  // If match.players is an object
  if (typeof match.players === 'object' && match.players !== null) {
    const list: any[] = [];
    Object.values(match.players).forEach((val: any) => {
      if (!val) return;
      if (typeof val === 'object') {
        // Check if val is an individual player object
        if (val.name || val.playername || val.proName || val.eaName || val.vproattr || val.rating !== undefined || val.goals !== undefined) {
          list.push(val);
        } else {
          // It's a team dictionary of players (e.g. { "player-1": { playername: "..." }, ... })
          Object.values(val).forEach((nestedPlayer: any) => {
            if (nestedPlayer && typeof nestedPlayer === 'object') {
              list.push(nestedPlayer);
            }
          });
        }
      }
    });
    return list;
  }

  return [];
}

/**
 * Checks if a match timestamp falls on Monday, Tuesday, Wednesday, or Thursday
 * (including late Thursday night session matches up to 5:00 AM Friday) in Italian timezone (Europe/Rome).
 */
export function isMondayToThursdayMatch(timestamp: number): boolean {
  if (!timestamp) return false;
  const tsMs = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
  const d = new Date(tsMs);

  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Rome",
      weekday: "short",
      hour: "numeric",
      hour12: false
    });
    const parts = formatter.formatToParts(d);
    const map: Record<string, string> = {};
    parts.forEach(p => { map[p.type] = p.value; });

    const dayName = map.weekday; // Mon, Tue, Wed, Thu, Fri, Sat, Sun
    const hour = parseInt(map.hour || "0");

    if (["Mon", "Tue", "Wed", "Thu"].includes(dayName)) {
      return true;
    }
    // Late Thursday night session running past midnight into Friday morning before 5:00 AM
    if (dayName === "Fri" && hour < 5) {
      return true;
    }
  } catch (e) {
    const day = d.getDay();
    return day >= 1 && day <= 4;
  }

  return false;
}

export type TimeframeMode = "weekly" | "all_mon_thu" | "all_season";

export interface TimeframeMetadata {
  filteredMatches: ClubMatch[];
  dateRangeText: string;
  totalMatchesAnalyzed: number;
}

/**
 * Gets filtered matches and calculated date range metadata for a given timeframe.
 */
export function getFilteredMatchesAndMetadata(
  matchesData: ClubMatch[],
  timeframe: TimeframeMode = "weekly",
  language: "it" | "en" = "it"
): TimeframeMetadata {
  if (!matchesData || !Array.isArray(matchesData) || matchesData.length === 0) {
    return {
      filteredMatches: [],
      dateRangeText: language === "it" ? "Nessuna partita trovata" : "No matches found",
      totalMatchesAnalyzed: 0
    };
  }

  const validMatches = matchesData.filter(m => m && m.timestamp);
  if (validMatches.length === 0) {
    return {
      filteredMatches: [],
      dateRangeText: language === "it" ? "Nessuna partita con data valida" : "No matches with valid timestamp",
      totalMatchesAnalyzed: 0
    };
  }

  // 1. Calculate Monday 00:00:00 of the PREVIOUS week in Rome timezone
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const currentWeekStart = new Date(now);
  currentWeekStart.setDate(now.getDate() - daysSinceMonday);
  currentWeekStart.setHours(0, 0, 0, 0);
  const currentWeekStartMs = currentWeekStart.getTime();

  // Previous week start (Monday 00:00:00 of last week)
  const prevWeekStartMs = currentWeekStartMs - (7 * 24 * 60 * 60 * 1000);
  // Previous week end (Friday 05:00:00 AM to cover late Thursday night sessions)
  const prevWeekEndMs = prevWeekStartMs + (4 * 24 * 60 * 60 * 1000) + (5 * 60 * 60 * 1000);

  let filteredMatches: ClubMatch[] = [];
  let startDateMs: number = prevWeekStartMs;
  let endDateMs: number = prevWeekStartMs + (3 * 24 * 60 * 60 * 1000);

  if (timeframe === "all_season") {
    filteredMatches = validMatches;
  } else if (timeframe === "all_mon_thu") {
    filteredMatches = validMatches.filter(m => isMondayToThursdayMatch(parseInt(m.timestamp!.toString())));
  } else {
    // Default / Weekly: Priority to CURRENT WEEK Monday to Thursday, then PREVIOUS WEEK, then latest active week
    const currentWeekEndMs = currentWeekStartMs + (4 * 24 * 60 * 60 * 1000) + (5 * 60 * 60 * 1000);
    let currentMatches = validMatches.filter((match) => {
      const matchTimeMs = parseInt(match.timestamp!.toString()) < 10000000000 
        ? parseInt(match.timestamp!.toString()) * 1000 
        : parseInt(match.timestamp!.toString());
      return matchTimeMs >= currentWeekStartMs && matchTimeMs <= currentWeekEndMs && isMondayToThursdayMatch(parseInt(match.timestamp!.toString()));
    });

    if (currentMatches.length > 0) {
      filteredMatches = currentMatches;
      startDateMs = currentWeekStartMs;
      endDateMs = currentWeekStartMs + (3 * 24 * 60 * 60 * 1000);
    } else {
      let prevMatches = validMatches.filter((match) => {
        const matchTimeMs = parseInt(match.timestamp!.toString()) < 10000000000 
          ? parseInt(match.timestamp!.toString()) * 1000 
          : parseInt(match.timestamp!.toString());
        return matchTimeMs >= prevWeekStartMs && matchTimeMs <= prevWeekEndMs && isMondayToThursdayMatch(parseInt(match.timestamp!.toString()));
      });

      if (prevMatches.length > 0) {
        filteredMatches = prevMatches;
        startDateMs = prevWeekStartMs;
        endDateMs = prevWeekStartMs + (3 * 24 * 60 * 60 * 1000);
      } else {
        // Fallback 2: Latest available Monday-Thursday week window with matches
        const allMonThu = validMatches.filter(m => isMondayToThursdayMatch(parseInt(m.timestamp!.toString())));
        if (allMonThu.length > 0) {
          const latestMs = Math.max(
            ...allMonThu.map((m) => (parseInt(m.timestamp!.toString()) < 10000000000 ? parseInt(m.timestamp!.toString()) * 1000 : parseInt(m.timestamp!.toString())))
          );
          const latestDate = new Date(latestMs);
          const latestDay = latestDate.getDay();
          const latestDaysSinceMon = latestDay === 0 ? 6 : latestDay - 1;

          const targetStart = new Date(latestDate);
          targetStart.setDate(latestDate.getDate() - latestDaysSinceMon);
          targetStart.setHours(0, 0, 0, 0);
          const targetStartMs = targetStart.getTime();
          const targetEndMs = targetStartMs + (4 * 24 * 60 * 60 * 1000) + (5 * 60 * 60 * 1000);

          filteredMatches = validMatches.filter((m) => {
            const timeMs = parseInt(m.timestamp!.toString()) < 10000000000 
              ? parseInt(m.timestamp!.toString()) * 1000 
              : parseInt(m.timestamp!.toString());
            return timeMs >= targetStartMs && timeMs <= targetEndMs && isMondayToThursdayMatch(parseInt(m.timestamp!.toString()));
          });
          startDateMs = targetStartMs;
          endDateMs = targetStartMs + (3 * 24 * 60 * 60 * 1000);

          if (filteredMatches.length === 0) {
            filteredMatches = allMonThu;
          }
        } else {
          filteredMatches = validMatches;
        }
      }
    }
  }

  // Format date range text
  let dateRangeText = "";
  if (filteredMatches.length > 0) {
    const minDateStr = new Date(startDateMs).toLocaleDateString(language === "it" ? "it-IT" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
    const maxDateStr = new Date(endDateMs).toLocaleDateString(language === "it" ? "it-IT" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });

    dateRangeText = `${minDateStr} - ${maxDateStr}`;
  } else {
    dateRangeText = language === "it" ? "Nessun match" : "No matches";
  }

  return {
    filteredMatches,
    dateRangeText,
    totalMatchesAnalyzed: filteredMatches.length
  };
}

/**
 * Calculates aggregated player statistics for the specified timeframe
 * (Default: 'weekly' - Monday to Thursday of active week).
 */
export function calculatePreviousWeekPlayerStats(
  matchesData: ClubMatch[], 
  membersList: ClubMember[],
  timeframe: TimeframeMode = "weekly"
): WeeklyPlayerStats[] {
  const { filteredMatches } = getFilteredMatchesAndMetadata(matchesData, timeframe);
  if (!filteredMatches || filteredMatches.length === 0) {
    return [];
  }

  // Map of member name/proName to ClubMember for roster details lookup (normalized & case-insensitive)
  const memberMap = new Map<string, ClubMember>();
  if (Array.isArray(membersList)) {
    membersList.forEach(m => {
      if (m.name) {
        memberMap.set(normalizeName(m.name), m);
        memberMap.set(m.name.toLowerCase().trim(), m);
      }
      if (m.proName) {
        memberMap.set(normalizeName(m.proName), m);
        memberMap.set(m.proName.toLowerCase().trim(), m);
      }
    });
  }

  // STEP 2: Aggregate stats per player
  const playerStatsMap = new Map<string, {
    name: string;
    proName: string;
    games: number;
    goals: number;
    assists: number;
    ratingSum: number;
    motm: number;
    passesMade: number;
    passAttempts: number;
    tacklesMade: number;
    tackleAttempts: number;
    shots: number;
    saves: number;
    rolesCount: { [role: string]: number };
  }>();

  filteredMatches.forEach((match) => {
    const playersList = extractPlayersFromMatch(match);
    if (playersList.length === 0) return;

    playersList.forEach((player) => {
      const rawName = player.name || player.playername || player.proName || player.eaName || player.vproattr;
      if (!rawName || typeof rawName !== 'string') return;

      const macroRole = getMacroRole(player.role || player.pos || "Midfielder");
      const cleanName = rawName.trim();
      const normKey = normalizeName(cleanName);

      // Find matching member in memberMap
      let matchedMember = memberMap.get(normKey) || memberMap.get(cleanName.toLowerCase());
      if (!matchedMember && player.proName) {
        matchedMember = memberMap.get(normalizeName(player.proName)) || memberMap.get(player.proName.toLowerCase().trim());
      }
      if (!matchedMember && player.playername) {
        matchedMember = memberMap.get(normalizeName(player.playername)) || memberMap.get(player.playername.toLowerCase().trim());
      }

      // Strictly ignore any players who are not part of our club's roster
      if (!matchedMember) {
        return;
      }

      // Canonical key for grouping stats
      const keyStr = normalizeName(matchedMember.name);
      const canonicalName = matchedMember.name;
      const canonicalProName = matchedMember.proName || matchedMember.name;

      if (!playerStatsMap.has(keyStr)) {
        playerStatsMap.set(keyStr, {
          name: canonicalName,
          proName: canonicalProName,
          games: 0,
          goals: 0,
          assists: 0,
          ratingSum: 0,
          motm: 0,
          passesMade: 0,
          passAttempts: 0,
          tacklesMade: 0,
          tackleAttempts: 0,
          shots: 0,
          saves: 0,
          rolesCount: {}
        });
      }

      const stats = playerStatsMap.get(keyStr)!;
      stats.games += 1;
      stats.goals += parseInt((player.goals ?? "0").toString());
      stats.assists += parseInt((player.assists ?? "0").toString());
      stats.ratingSum += parseFloat((player.rating ?? "0").toString());
      stats.motm += parseInt((player.motm ?? player.mom ?? "0").toString());
      stats.passesMade += parseInt((player.passesMade ?? player.passesmade ?? "0").toString());
      stats.passAttempts += parseInt((player.passAttempts ?? player.passattempts ?? "0").toString());
      stats.tacklesMade += parseInt((player.tacklesMade ?? player.tacklesmade ?? "0").toString());
      stats.tackleAttempts += parseInt((player.tackleAttempts ?? player.tackleattempts ?? "0").toString());
      stats.shots += parseInt((player.shots ?? "0").toString());
      stats.saves += parseInt((player.saves ?? "0").toString());
      stats.rolesCount[macroRole] = (stats.rolesCount[macroRole] || 0) + 1;
    });
  });

  const result: WeeklyPlayerStats[] = [];

  playerStatsMap.forEach((stats, keyStr) => {
    let primaryPlayedRole = "midfielder";
    let maxCount = -1;
    Object.keys(stats.rolesCount).forEach((r) => {
      if (stats.rolesCount[r] > maxCount) {
        maxCount = stats.rolesCount[r];
        primaryPlayedRole = r; // "forward" | "midfielder" | "defender" | "goalkeeper"
      }
    });

    const playedCategory = primaryPlayedRole as "forward" | "midfielder" | "defender" | "goalkeeper";

    const member = memberMap.get(keyStr);
    const displayName = member ? member.name : stats.name;
    const rosterCategory = member ? member.category : playedCategory;
    const rosterRole = member ? member.role : (
      playedCategory === "goalkeeper" ? "Portiere (GK)" :
      playedCategory === "defender" ? "Difensore Centrale (CB)" :
      playedCategory === "forward" ? "Attaccante Centrale (ST)" :
      "Centrocampista Centrale (CM)"
    );

    const gamesInRosterCategory = stats.rolesCount[rosterCategory] || 0;
    const roleFidelity = stats.games > 0 ? Math.round((gamesInRosterCategory / stats.games) * 100) : 100;
    const tacticalMatch = playedCategory === rosterCategory;

    const passSuccessRate = stats.passAttempts > 0 ? Math.round((stats.passesMade / stats.passAttempts) * 100) : 0;
    const tackleSuccessRate = stats.tackleAttempts > 0 ? Math.round((stats.tacklesMade / stats.tackleAttempts) * 100) : 0;

    let kpiFactor = 70;
    if (playedCategory === "goalkeeper") {
      const savesPerGame = stats.games > 0 ? stats.saves / stats.games : 0;
      const savesPart = Math.min(45, Math.round(savesPerGame * 8));
      const passPart = Math.min(25, Math.round(passSuccessRate * 0.25));
      const motmPart = Math.min(30, Math.round((stats.motm / stats.games) * 30));
      kpiFactor = Math.min(100, Math.max(20, savesPart + passPart + motmPart));
    } else if (playedCategory === "defender") {
      const tacklesPerGame = stats.games > 0 ? stats.tacklesMade / stats.games : 0;
      const ratePart = tackleSuccessRate * 0.35;
      const volPart = Math.min(30, tacklesPerGame * 10);
      const passPart = passSuccessRate * 0.25;
      const bonusPart = Math.min(20, (((stats.goals + stats.assists) / stats.games) * 20) + ((stats.motm / stats.games) * 10));
      kpiFactor = Math.min(100, Math.round(ratePart + volPart + passPart + bonusPart));
    } else if (playedCategory === "midfielder") {
      const passesPerGame = stats.games > 0 ? stats.passesMade / stats.games : 0;
      const assistsPerGame = stats.games > 0 ? stats.assists / stats.games : 0;
      const goalsPerGame = stats.games > 0 ? stats.goals / stats.games : 0;
      const tacklesPerGame = stats.games > 0 ? stats.tacklesMade / stats.games : 0;

      const passAccuracyPart = passSuccessRate * 0.25;
      const passVolumePart = Math.min(25, passesPerGame * 1.5);
      const attackOutputPart = Math.min(35, (assistsPerGame * 25) + (goalsPerGame * 20));
      const defensePart = Math.min(15, tacklesPerGame * 6);
      const motmPart = Math.min(10, (stats.motm / stats.games) * 10);

      kpiFactor = Math.min(100, Math.round(passAccuracyPart + passVolumePart + attackOutputPart + defensePart + motmPart));
    } else if (playedCategory === "forward") {
      const goalsPerGame = stats.games > 0 ? stats.goals / stats.games : 0;
      const assistsPerGame = stats.games > 0 ? stats.assists / stats.games : 0;
      const shotAccuracy = stats.shots > 0 ? Math.round((stats.goals / stats.shots) * 100) : 0;

      const goalPart = Math.min(50, goalsPerGame * 35);
      const assistPart = Math.min(25, assistsPerGame * 25);
      const conversionPart = Math.min(15, shotAccuracy * 0.25);
      const linkUpPart = passSuccessRate * 0.10;
      const motmPart = Math.min(15, (stats.motm / stats.games) * 15);

      kpiFactor = Math.min(100, Math.round(goalPart + conversionPart + assistPart + linkUpPart + motmPart));
    }

    const ratingAve = stats.games > 0 ? parseFloat((stats.ratingSum / stats.games).toFixed(2)) : 0;
    // Map rating 5.0..9.5 -> 0..100
    const ratingPart = Math.min(100, Math.max(0, Math.round((ratingAve - 5.0) * 22.2)));

    const consistencyFactor = Math.min(100, Math.round((stats.games / 5) * 100));

    const compatibilityScore = Math.round(
      (roleFidelity * 0.15) + 
      (ratingPart * 0.45) + 
      (kpiFactor * 0.30) +
      (consistencyFactor * 0.10)
    );

    let finalRole = "";
    if (member && member.category === playedCategory) {
      finalRole = member.role;
    } else {
      if (playedCategory === "goalkeeper") finalRole = "Portiere (GK)";
      else if (playedCategory === "defender") finalRole = "Difensore Centrale (CB)";
      else if (playedCategory === "forward") finalRole = "Attaccante Centrale (ST)";
      else finalRole = "Centrocampista Centrale (CM)";
    }

    const overall = member ? member.overall : 82;
    const avatarColor = member ? member.avatarColor : "from-blue-600 to-cyan-500";
    const proName = member ? member.proName : displayName;

    result.push({
      name: displayName,
      proName,
      role: finalRole,
      overall,
      avatarColor,
      games: stats.games,
      goals: stats.goals,
      assists: stats.assists,
      category: playedCategory,
      ratingAve,
      manOfTheMatch: stats.motm,
      weeklyStats: {
        roleFidelity,
        tacticalMatch,
        compatibilityScore,
        passSuccessRate,
        tackleSuccessRate,
        shots: stats.shots,
        saves: stats.saves,
        passesMade: stats.passesMade,
        passAttempts: stats.passAttempts,
        tacklesMade: stats.tacklesMade,
        tackleAttempts: stats.tackleAttempts,
        motm: stats.motm,
        games: stats.games,
        goals: stats.goals,
        assists: stats.assists,
        ratingAve: ratingAve,
        rosterRole,
        rosterCategory,
        primaryPlayedRole: playedCategory
      }
    });
  });

  return result;
}

/**
 * STEP 3, 4, 5: Professional TOTW Algorithm with Anti-Fraud, Anti-Clone, Role Separation, and MVP Slot Assignment.
 */
export function calculatePreviousWeekTOTW(
  matchesData: ClubMatch[], 
  membersList: ClubMember[], 
  mvpName?: string, 
  language: 'it' | 'en' = 'it',
  timeframe: TimeframeMode = "weekly"
): TOTWPlayer[] {
  const weeklyPlayers = calculatePreviousWeekPlayerStats(matchesData, membersList, timeframe);
  
  if (weeklyPlayers.length === 0) {
    return [];
  }

  const timeframeMeta = getFilteredMatchesAndMetadata(matchesData, timeframe, language);
  const threshold = timeframeMeta.totalMatchesAnalyzed >= 6 ? 3 : (timeframeMeta.totalMatchesAnalyzed > 3 ? 2 : 1);

  // STEP 3: Minimum presence filter (min 1 match)
  const eligibleCandidates = weeklyPlayers.filter(p => p.games >= 1);

  if (eligibleCandidates.length === 0) {
    // Fallback to all if strict threshold filters out everyone
    eligibleCandidates.push(...weeklyPlayers);
  }

  // STEP 4: Sorting candidates by Professional Performance Index (compatibilityScore), then Average Rating, then games played, goals, assists
  const sortedCandidates = [...eligibleCandidates].sort((a, b) => {
    const rawScoreA = a.weeklyStats?.compatibilityScore ?? ((a.ratingAve || 0) * 10);
    const rawScoreB = b.weeklyStats?.compatibilityScore ?? ((b.ratingAve || 0) * 10);
    
    const weightA = a.games >= threshold ? 1 : (a.games / threshold);
    const weightB = b.games >= threshold ? 1 : (b.games / threshold);

    const scoreA = Math.round(rawScoreA * weightA);
    const scoreB = Math.round(rawScoreB * weightB);

    if (scoreA !== scoreB) {
      return scoreB - scoreA;
    }
    if (Math.abs(a.ratingAve - b.ratingAve) > 0.001) {
      return b.ratingAve - a.ratingAve;
    }
    if (a.games !== b.games) {
      return b.games - a.games;
    }
    if (a.goals !== b.goals) {
      return b.goals - a.goals;
    }
    return b.assists - a.assists;
  });

  const awardMap: { [key: string]: string } = language === 'it' ? {
    goalkeeper: "Top Portiere",
    defender: "Top Difensore",
    midfielder: "Top Centrocampista",
    forward: "Top Attaccante",
  } : {
    goalkeeper: "Top Goalkeeper",
    defender: "Top Defender",
    midfielder: "Top Midfielder",
    forward: "Top Forward",
  };

  const dotColorMap: { [key: string]: string } = {
    goalkeeper: "bg-[#94a3b8]",
    defender: "bg-[#3b82f6]",
    midfielder: "bg-[#22c55e]",
    forward: "bg-[#be213b]",
  };

  const selected: any[] = [];
  const selectedNames = new Set<string>();

  // STEP 5: Assignment of Absolute MVP (The 5th Slot) - Restored to always be Gold and Highlighted
  if (sortedCandidates.length > 0) {
    const mvpCandidate = sortedCandidates[0];
    selected.push({
      ...mvpCandidate,
      awardLabel: language === 'it' ? "⭐ MVP DELLA SETTIMANA ⭐" : "⭐ MVP OF THE WEEK ⭐",
      dotColor: "bg-[#d7ae6a]",
      isMVP: true
    });
    selectedNames.add(mvpCandidate.name);
  }

  // STEP 4: Role-based winners (Top POR, DIF, CEN, ATT) with Anti-Clone rule (same player cannot appear twice)
  const categories: ("goalkeeper" | "defender" | "midfielder" | "forward")[] = ["goalkeeper", "defender", "midfielder", "forward"];

  categories.forEach((cat) => {
    const candidatesForCat = sortedCandidates.filter(p => p.category === cat && !selectedNames.has(p.name));
    if (candidatesForCat.length > 0) {
      const bestForRole = candidatesForCat[0];
      selected.push({
        ...bestForRole,
        awardLabel: awardMap[cat],
        dotColor: dotColorMap[cat],
        isMVP: false
      });
      selectedNames.add(bestForRole.name);
    }
  });

  // If we have fewer than 5 players selected (e.g. missing certain roles), fill with next best sorted candidates
  if (selected.length < 5) {
    const remaining = sortedCandidates.filter(p => !selectedNames.has(p.name));
    for (const p of remaining) {
      if (selected.length >= 5) break;
      selected.push({
        ...p,
        awardLabel: awardMap[p.category] || (language === 'it' ? "Top Giocatore" : "Top Player"),
        dotColor: dotColorMap[p.category] || "bg-[#22c55e]",
        isMVP: false
      });
      selectedNames.add(p.name);
    }
  }

  // Format final output list
  return selected.map((player) => {
    const statParts: string[] = [];
    if (player.goals > 0) {
      statParts.push(`${player.goals} ${language === 'it' ? 'Gol' : player.goals === 1 ? 'Goal' : 'Goals'}`);
    }
    if (player.assists > 0) {
      statParts.push(`${player.assists} Assist`);
    }
    
    const statsLabel = statParts.length > 0 
      ? statParts.join(" / ") 
      : language === 'it' 
        ? `${player.games} ${player.games === 1 ? "Partita" : "Partite"}`
        : `${player.games} ${player.games === 1 ? "Match" : "Matches"}`;

    const cat = player.category;
    const parsedRole = parseAndTranslateRole(player.role, language);
    const sigla = parsedRole.sigla;
    const nomeCompleto = parsedRole.nomeCompleto;
    const mainRole = getRoleCategoryName(cat, language);

    const subRoleLabel = `${nomeCompleto} (${sigla})`;

    const weight = player.games >= threshold ? 1 : (player.games / threshold);
    const rawScore = player.weeklyStats?.compatibilityScore ?? ((player.ratingAve || 0) * 10);
    const penalizedScore = Math.round(rawScore * weight);

    return {
      name: player.name,
      role: sigla,
      rating: player.ratingAve,
      stats: statsLabel,
      category: cat,
      weeklyRating: player.ratingAve,
      weeklyStat: statsLabel,
      gamesPlayed: player.games,
      awardLabel: player.awardLabel || awardMap[cat],
      subRoleLabel,
      mainRoleLabel: mainRole,
      siglaLabel: sigla,
      dotColor: player.dotColor || dotColorMap[cat],
      isMVP: player.isMVP,
      isStarDelClub: mvpName ? player.name.toLowerCase() === mvpName.toLowerCase() : false,
      weeklyStats: player.weeklyStats ? {
        ...player.weeklyStats,
        compatibilityScore: penalizedScore
      } : undefined,
    };
  }).sort((a, b) => {
    if (a.isMVP) return -1;
    if (b.isMVP) return 1;
    return b.weeklyRating - a.weeklyRating;
  });
}
