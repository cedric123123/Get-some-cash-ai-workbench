const crypto = require('node:crypto');
const { capabilities, credentials, configured, syncTaobao, ConnectorError } = require('./connectors');

function createApi(repository, options = {}) {
  const token = crypto.randomBytes(32).toString('hex');
  const jobs = new Map();
  const env = options.env || process.env;
  const sync = options.sync || syncTaobao;
  function summary(store) {
    const { products, orders, ...rest } = store;
    return { ...rest, credentialConfigured: configured(credentials(store, env)), capability: capabilities[store.platform], counts: { products: products.length, orders: orders.length } };
  }
  function send(res, code, data) {
    res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(JSON.stringify(data));
  }
  async function body(req) {
    if (!req.headers['content-type']?.startsWith('application/json')) throw Object.assign(new Error('需要 JSON 请求'), { status: 415 });
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 16384) throw Object.assign(new Error('请求内容过大'), { status: 413 });
      chunks.push(chunk);
    }
    try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); }
    catch { throw Object.assign(new Error('JSON 格式错误'), { status: 400 }); }
  }
  return async (req, res, pathname) => {
    try {
      const expectedHost = `${req.headers.host || ''}`;
      const port = req.socket.localPort;
      if (![ `127.0.0.1:${port}`, `localhost:${port}` ].includes(expectedHost) ||
          (req.headers.origin && req.headers.origin !== `http://${expectedHost}`)) return send(res, 403, { error: '仅接受本地同源访问' });
      if (!['GET', 'POST'].includes(req.method)) return send(res, 405, { error: '不支持的请求方法' });
      if (req.method === 'POST' && req.headers['x-workspace-token'] !== token) return send(res, 403, { error: '会话已失效，请刷新页面' });
      if (req.method === 'GET' && pathname === '/api/session') return send(res, 200, { token, capabilities });
      if (pathname === '/api/stores') {
        if (req.method === 'GET') return send(res, 200, { stores: repository.read().stores.map(summary) });
        const input = await body(req);
        if (!input || typeof input.name !== 'string' || !input.name.trim() || input.name.length > 80 ||
            !Object.hasOwn(capabilities, input.platform) || !/^[A-Z][A-Z0-9_]{0,39}$/.test(input.credentialRef || '') ||
            (input.remoteShopId && (typeof input.remoteShopId !== 'string' || !/^\d{1,30}$/.test(input.remoteShopId)))) return send(res, 400, { error: '请检查店铺名称、平台、配置代号和店铺 ID' });
        if (repository.read().stores.some(store => store.credentialRef === input.credentialRef)) return send(res, 409, { error: '配置代号已绑定其他店铺' });
        const store = { id: crypto.randomUUID(), name: input.name.trim(), platform: input.platform, credentialRef: input.credentialRef,
          remoteShopId: input.remoteShopId || null, createdAt: new Date().toISOString(), profile: null, products: [], orders: [],
          sync: { state: 'idle', lastSuccessAt: null, error: null }, coverage: null };
        repository.update(data => data.stores.push(store));
        return send(res, 201, { store: summary(store) });
      }
      const match = pathname.match(/^\/api\/stores\/([a-f0-9-]+)\/(products|orders|inventory|sync-status|sync)$/);
      if (!match) return send(res, 404, { error: '接口不存在' });
      const [, id, resource] = match;
      const store = repository.read().stores.find(item => item.id === id);
      if (!store) return send(res, 404, { error: '店铺不存在' });
      if (resource === 'sync' && req.method === 'POST') {
        await body(req);
        if (jobs.has(id)) return send(res, 409, { error: '该店铺正在同步' });
        if (!capabilities[store.platform].implemented) return send(res, 422, { error: capabilities[store.platform].description });
        const auth = credentials(store, env);
        if (!configured(auth)) return send(res, 422, { error: '服务端尚未配置该店铺的应用密钥与授权令牌' });
        const startedAt = new Date().toISOString();
        repository.update(data => { data.stores.find(item => item.id === id).sync = { ...store.sync, state: 'running', startedAt, error: null }; });
        const job = Promise.resolve().then(() => sync(store, auth)).then(result => {
          repository.update(data => {
            const target = data.stores.find(item => item.id === id);
            Object.assign(target, result);
            target.sync = { state: 'success', startedAt, lastSuccessAt: new Date().toISOString(), error: null };
          });
        }).catch(error => {
          repository.update(data => {
            const target = data.stores.find(item => item.id === id);
            target.sync = { ...target.sync, state: 'failed', error: error instanceof ConnectorError ? error.message : '同步失败，已保留上次成功数据', code: error instanceof ConnectorError ? error.code : 'SYNC_FAILED' };
          });
        }).finally(() => jobs.delete(id));
        jobs.set(id, job);
        // Observe final persistence errors without logging sensitive payloads.
        job.catch(() => console.error('Unable to persist sync status'));
        return send(res, 202, { state: 'running' });
      }
      if (req.method !== 'GET' || resource === 'sync') return send(res, 405, { error: '不支持的请求方法' });
      if (resource === 'sync-status') return send(res, 200, { sync: store.sync, coverage: store.coverage });
      const query = new URL(req.url, 'http://localhost').searchParams;
      const page = Math.max(1, Number(query.get('page')) || 1);
      if (!Number.isSafeInteger(page)) return send(res, 400, { error: '页码无效' });
      const list = resource === 'inventory' ? store.products.map(item => ({ id: item.id, name: item.name, stock: item.stock, source: item.source, syncedAt: item.syncedAt })) : store[resource];
      return send(res, 200, { items: list.slice((page - 1) * 50, page * 50), total: list.length, page, pageSize: 50, sync: store.sync, coverage: store.coverage });
    } catch (error) { return send(res, error.status || 500, { error: error.status ? error.message : '本地数据服务异常，请检查数据目录是否可写' }); }
  };
}
module.exports = { createApi };
