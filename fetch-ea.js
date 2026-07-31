import fs from 'fs';

const mapRegionIdToName = (regionId) => {
  const id = parseInt(regionId);
  const mappings = {
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

async function run() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json'
  };
  
  try {
    const o = await fetch("https://proclubs.ea.com/api/fc/clubs/overallStats?clubIds=4545714&platform=common-gen5", { headers });
    if (o.ok) {
      const data = await o.json();
      if (Array.isArray(data)) {
        const processedData = data.map(clubData => ({
          ...clubData,
          region: mapRegionIdToName(clubData.regionId)
        }));
        fs.writeFileSync('ea-overall.json', JSON.stringify(processedData, null, 2));
      } else {
        fs.writeFileSync('ea-overall.json', JSON.stringify(data, null, 2));
      }
    } else {
      console.error("Failed to fetch overallStats:", o.status);
    }
  } catch (err) {
    console.error("Error fetching overallStats:", err);
  }

  try {
    const m = await fetch("https://proclubs.ea.com/api/fc/members/stats?clubId=4545714&platform=common-gen5", { headers });
    if (m.ok) {
      fs.writeFileSync('ea-members.json', await m.text());
    }
  } catch (err) {
    console.error("Error fetching members:", err);
  }

  try {
    const ma = await fetch("https://proclubs.ea.com/api/fc/clubs/matches?matchType=leagueMatch&clubIds=4545714&platform=common-gen5", { headers });
    if (ma.ok) {
      fs.writeFileSync('ea-matches.json', await ma.text());
    }
  } catch (err) {
    console.error("Error fetching matches:", err);
  }
}
run();

