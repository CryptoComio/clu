async function test() {
  try {
    const res = await fetch("https://proclubs-api.com.br/api/members?clubId=4545714");
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response starts with:", text.substring(0, 300));
  } catch (err) {
    console.error("Error:", err);
  }
}
test();
