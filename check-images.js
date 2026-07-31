const urls = [
  "https://media.contentapi.ea.com/content/dam/eacom/fc/pro-clubs/reputation-tier1.png",
  "https://media.contentapi.ea.com/content/dam/eacom/fc/pro-clubs/reputation-tier2.png",
  "https://media.contentapi.ea.com/content/dam/eacom/fc/pro-clubs/reputation-tier3.png",
  "https://media.contentapi.ea.com/content/dam/eacom/fc/pro-clubs/reputation-tier4.png",
  "https://media.contentapi.ea.com/content/dam/eacom/fc/pro-clubs/reputation-tier5.png",
  "https://media.contentapi.ea.com/content/dam/eacom/fc/pro-clubs/reputation-tier6.png",
  "https://media.contentapi.ea.com/content/dam/ea/fc/fc-24/pro-clubs/reputation-tier1.png"
];

async function check() {
  for (const url of urls) {
    const res = await fetch(url, { method: "HEAD" });
    console.log(res.status, url);
  }
}
check();
