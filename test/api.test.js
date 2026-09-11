const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { createServer } = require('../server');
const { Repository } = require('../lib/repository');
const { ConnectorError } = require('../lib/connectors');

async function setup(t, options = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'gaoqian-api-test-'));
  const repository = new Repository(directory);
  const server = createServer({ repository, ...options });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(directory, { recursive: true, force: true });
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const { token } = await (await fetch(base + '/api/session')).json();
  async function request(route, body, headers = {}) {
    return new Promise((resolve, reject) => {
      const req = http.request(base + route, {
        method: body === undefined ? 'GET' : 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Workspace-Token': token, ...headers }
      }, response => {
        let text = '';
        response.on('data', chunk => { text += chunk; });
        response.on('end', () => resolve({ status: response.statusCode, data: JSON.parse(text) }));
      });
      req.on('error', reject);
      req.end(body === undefined ? undefined : JSON.stringify(body));
    });
  }
  async function add(credentialRef, platform = 'tb') {
    return (await request('/api/stores', { name: credentialRef, platform, credentialRef })).data.store;
  }
  async function completed(id) {
    for (let i = 0; i < 100; i++) {
      const result = await request(`/api/stores/${id}/sync-status`);
      if (result.data.sync.state !== 'running') return result.data;
      await new Promise(resolve => setTimeout(resolve, 5));
    }
    throw new Error('Sync did not finish');
  }
  return { request, add, repository, directory, completed };
}

test('Store metadata persists without credentials; invalid input and cross-origin writes fail', async t => {
  const api = await setup(t);
  assert.equal((await api.request('/api/stores', { name: 'x', platform: 'bad', credentialRef: 'A' })).status, 400);
  const payload = { name: 'A', platform: 'tb', credentialRef: 'A' };
  assert.equal((await api.request('/api/stores', payload, { Origin: 'https://example.com' })).status, 403);
  assert.equal((await api.request('/api/stores', payload, { 'X-Workspace-Token': '' })).status, 403);
  assert.equal((await api.request('/api/stores', payload, { Host: 'attacker.test' })).status, 403);
  const created = await api.request('/api/stores', { ...payload, appSecret: 'must-not-store' });
  assert.equal(created.status, 201);
  assert.equal((await api.request('/api/stores', payload)).status, 409);
  assert.equal(new Repository(api.directory).read().stores.length, 1);
  assert.ok(!fs.readFileSync(path.join(api.directory, 'workspace.json'), 'utf8').includes('must-not-store'));
  assert.equal((await api.request(`/api/stores/${created.data.store.id}/sync`, {})).status, 422);
});

test('Unsupported platforms cannot send upstream requests', async t => {
  let calls = 0;
  const api = await setup(t, { sync: async () => { calls++; } });
  const store = await api.add('PDD', 'pd');
  assert.equal((await api.request(`/api/stores/${store.id}/sync`, {})).status, 422);
  assert.equal(calls, 0);
});

test('Sync isolates stores, suppresses duplicate jobs and preserves cache on failure', async t => {
  let release, fail = false;
  const env = { GAOQIAN_A_APP_KEY: 'key', GAOQIAN_A_APP_SECRET: 'secret', GAOQIAN_A_ACCESS_TOKEN: 'token' };
  const api = await setup(t, { env, sync: async store => {
    if (fail) throw new ConnectorError('NETWORK_ERROR', '平台连接失败');
    await new Promise(resolve => { release = resolve; });
    return { remoteShopId: '123', profile: { name: '真实店铺' }, products: [{ id: 'PRODUCT', name: '测试商品', stock: 3, storeId: store.id }], orders: [], coverage: { description: '测试范围' } };
  } });
  const a = await api.add('A'), b = await api.add('B');
  assert.equal((await api.request(`/api/stores/${a.id}/sync`, {})).status, 202);
  assert.equal((await api.request(`/api/stores/${a.id}/sync`, {})).status, 409);
  release();
  assert.equal((await api.completed(a.id)).sync.state, 'success');
  assert.equal((await api.request(`/api/stores/${a.id}/products`)).data.total, 1);
  assert.equal((await api.request(`/api/stores/${b.id}/products`)).data.total, 0);
  fail = true;
  await api.request(`/api/stores/${a.id}/sync`, {});
  const failure = await api.completed(a.id);
  assert.equal(failure.sync.state, 'failed');
  assert.ok(failure.sync.lastSuccessAt);
  assert.equal((await api.request(`/api/stores/${a.id}/products`)).data.total, 1);
  const persisted = new Repository(api.directory).read();
  assert.equal(persisted.stores[0].products.length, 1);
  assert.ok(!JSON.stringify(persisted).includes('secret'));
});

test('A restart marks interrupted sync failed without clearing prior data', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gaoqian-restart-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const repo = new Repository(dir);
  repo.update(data => data.stores.push({ id: 'x', products: [{ id: 'saved' }], sync: { state: 'running' } }));
  const restarted = new Repository(dir);
  assert.equal(restarted.read().stores[0].sync.state, 'failed');
  assert.equal(restarted.read().stores[0].products[0].id, 'saved');
});
