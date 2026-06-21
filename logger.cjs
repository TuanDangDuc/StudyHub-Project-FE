const http = require('http');
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  let body = '';
  req.on('data', chunk => body += chunk.toString());
  req.on('end', () => {
    console.log("--- LOG RECEIVED ---");
    try {
      console.log(JSON.parse(body));
    } catch(e) {
      console.log(body);
    }
    res.end('ok');
  });
});
server.listen(9999, () => console.log('Logger listening on 9999'));
