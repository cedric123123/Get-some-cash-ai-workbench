const http = require('http');
const fs = require('fs');
const path = require('path');
const { Repository } = require('./lib/repository');
const { createApi } = require('./lib/api');

const root = __dirname;
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

function createServer(options = {}) {
  const repository = options.repository || new Repository(options.dataDir || process.env.GAOQIAN_DATA_DIR || path.join(root, '.data'));
  const api = createApi(repository, options);
return http.createServer((req, res) => {
  if ((req.url || '').startsWith('/api/')) {
    let pathname;
    try { pathname = decodeURIComponent(req.url.split('?')[0]); }
    catch { res.writeHead(400); return res.end('Bad request'); }
    return api(req, res, pathname);
  }
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    return res.end('Method not allowed');
  }
  let requestedPath;
  try {
    requestedPath = decodeURIComponent((req.url || '/').split('?')[0]);
    if (requestedPath.includes('\0')) throw new Error('Invalid path');
  } catch {
    res.writeHead(400);
    return res.end('Bad request');
  }
  if (requestedPath === '/') requestedPath = '/index.html';
  const filePath = path.resolve(root, `.${requestedPath}`);

  if (filePath !== root && !filePath.startsWith(`${root}${path.sep}`)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  if (!['index.html', 'app.js', 'csv.js', 'store-ui.js', 'styles.css'].includes(path.relative(root, filePath))) {
    res.writeHead(404);
    return res.end('Not found');
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(error.code === 'ENOENT' ? 404 : 500, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end(error.code === 'ENOENT' ? 'Not found' : 'Server error');
    }
    const extension = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': mimeTypes[extension] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : content);
  });
});
}

if (require.main === module) {
  createServer().listen(process.env.PORT || 4173, '127.0.0.1', () => {
    console.log(`搞钱事务所 is running at http://127.0.0.1:${process.env.PORT || 4173}`);
  });
}
module.exports = { createServer };
