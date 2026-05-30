const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = 8000;

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.pdf': 'application/pdf',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

const stripFrontMatter = (filePath, data) => {
  if (path.extname(filePath).toLowerCase() !== '.html') return data;

  const content = data.toString('utf8');
  return Buffer.from(content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, ''), 'utf8');
};

const server = http.createServer((req, res) => {
  let requestPath = (req.url || '/').split('?')[0];
  if (requestPath === '/' || requestPath === '') requestPath = '/index.html';

  const decodedPath = decodeURIComponent(requestPath);
  const candidates = [];

  candidates.push(path.join(root, decodedPath));

  if (decodedPath.endsWith('/')) {
    candidates.push(path.join(root, decodedPath, 'index.html'));
    candidates.push(path.join(root, `${decodedPath.slice(0, -1)}.html`));
  } else if (!path.extname(decodedPath)) {
    candidates.push(path.join(root, `${decodedPath}.html`));
    candidates.push(path.join(root, decodedPath, 'index.html'));
  }

  const tryNext = (index) => {
    if (index >= candidates.length) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const filePath = candidates[index];
    fs.readFile(filePath, (err, data) => {
      if (err) {
        tryNext(index + 1);
        return;
      }

      res.writeHead(200, {
        'Content-Type': mime[path.extname(filePath).toLowerCase()] || 'application/octet-stream'
      });
      res.end(stripFrontMatter(filePath, data));
    });
  };

  tryNext(0);
});

server.listen(port, () => {
  console.log(`Preview server running at http://localhost:${port}`);
});
