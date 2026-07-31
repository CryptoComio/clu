async function run() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json'
  };
  
  const url = "https://proclubs.ea.com/api/fc/clubs/matches?matchType=playoffMatch&clubIds=4545714&platform=common-gen5";
  try {
    const res = await fetch(url, { headers });
    if (res.status === 200) {
      const json = await res.json();
      if (json.length > 0) {
        console.log("Match keys:", Object.keys(json[0]));
        console.log("Club 4545714 stats:", json[0].clubs["4545714"]);
      }
    }
  } catch (e) {
    console.log("Failed:", e.message);
  }
}
run();



