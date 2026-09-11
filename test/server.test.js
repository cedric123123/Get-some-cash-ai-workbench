const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createServer } = require('../server');

test('Static server survives malformed requests and only serves public assets', async t => {
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const request = (path, method = 'GET') => new Promise((resolve, reject) => {
    http.request({ hostname: '127.0.0.1', port: server.address().port, path, method }, res => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body }));
    }).on('error', reject).end();
  });
  assert.equal((await request('/%')).status, 400);
  assert.equal((await request('/%00')).status, 400);
  assert.equal((await request('/?v=1')).status, 200);
  assert.equal((await request('/csv.js')).status, 200);
  assert.equal((await request('/.git/config')).status, 404);
  assert.equal((await request('/package.json')).status, 404);
  assert.equal((await request('/%2e%2e/server.js')).status, 403);
  assert.equal((await request('/', 'POST')).status, 405);
  const head = await request('/', 'HEAD');
  assert.equal(head.status, 200);
  assert.equal(head.body, '');
});
