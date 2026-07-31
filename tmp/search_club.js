const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve(data);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  const chunks = [
    'main-JBQBE5WL.js',
    'chunk-J54DGFRX.js',
    'chunk-SKGNQVC2.js',
    'chunk-77XROBT2.js',
    'chunk-656XDAUS.js',
    'chunk-NW5M56WI.js',
    'chunk-VWNL7P5G.js',
    'chunk-XC7XHBWH.js',
    'chunk-TPAMJDQA.js',
    'chunk-WS5CMDGA.js',
    'chunk-QYXWECOB.js'
  ];

  console.log('Starting search...');
  for (const chunk of chunks) {
    const url = `https://club-champions.eu/${chunk}`;
    try {
      const content = await fetchUrl(url);
      // Let's search for SVG paths or image URLs
      const regex = /["']([^"']*\.(png|svg|jpg|gif))["']/g;
      let match;
      const images = [];
      while ((match = regex.exec(content)) !== null) {
        images.push(match[1]);
      }
      if (images.length > 0) {
        console.log(`--- ${chunk} (${images.length} images) ---`);
        console.log(images.slice(0, 10));
      }
    } catch (e) {
      console.error(`Error fetching ${chunk}:`, e.message);
    }
  }
}

main();
