const https = require('https');
https.get("https://api.club-champions.eu/team?clubId=7072551&platform=ps5", res => {
  let body = "";
  res.on("data", d => body += d);
  res.on("end", () => {
    console.log(body.substring(0, 1000));
  });
});
