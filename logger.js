const http = require('http');
const server = http.createServer((req, res) => {
  let body = '';
  req.on('data', chunk => body += chunk.toString());
  req.on('end', () => {
    console.log("--- LOG RECEIVED ---");
    try {
      console.log(JSON.parse(body));
    } catch(e) {
      console.log(body);
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end('ok');
  });
});
server.listen(9999, () => console.log('Logger listening on 9999'));
