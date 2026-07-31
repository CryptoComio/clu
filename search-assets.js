async function search() {
  const html = await fetch("https://www.ea.com/ea-sports-fc/pro-clubs").then(r=>r.text());
  console.log(html.match(/reputation[^"']+/g));
}
search();
