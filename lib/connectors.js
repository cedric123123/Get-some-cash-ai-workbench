const crypto = require('node:crypto');

const capabilities = {
  tb: { name: '淘宝 / 天猫', implemented: true, description: '店铺资料、在售商品、最近 7 天创建的默认类型订单；需应用权限与有效授权' },
  pd: { name: '拼多多', implemented: false, description: '接口正文与应用权限待核验，暂不发送平台请求' },
  jd: { name: '京东', implemented: false, description: '需确认 POP / 自营业务与接口权限，暂不发送平台请求' }
};
function credentials(store, env = process.env) {
  const prefix = `GAOQIAN_${store.credentialRef}_`;
  return { appKey: env[prefix + 'APP_KEY'], appSecret: env[prefix + 'APP_SECRET'], accessToken: env[prefix + 'ACCESS_TOKEN'] };
}
function configured(value) { return Boolean(value.appKey && value.appSecret && value.accessToken); }
function timestamp(date = new Date()) { return new Date(date.getTime() + 8 * 3600000).toISOString().slice(0, 19).replace('T', ' '); }
function sign(params, secret) {
  const text = Object.keys(params).filter(key => key !== 'sign' && params[key] !== '').sort().map(key => key + params[key]).join('');
  return crypto.createHmac('md5', secret).update(text, 'utf8').digest('hex').toUpperCase();
}
function parsePlatformJson(text) {
  // Preserve 64-bit platform IDs before JSON.parse can round them.
  return JSON.parse(text.replace(/"(?:\\.|[^"\\])*"|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g, (match, numeric) =>
    numeric && /^-?\d+$/.test(numeric) && !Number.isSafeInteger(Number(numeric)) ? JSON.stringify(numeric) : match));
}
class ConnectorError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
const allowedMethods = new Set(['taobao.shop.seller.get', 'taobao.items.onsale.get', 'taobao.trades.sold.get']);
function taobaoClient(auth, transport = fetch) {
  return async (method, input) => {
    if (!allowedMethods.has(method)) throw new ConnectorError('UNSUPPORTED_METHOD', '接口不在只读查询列表中');
    const params = { ...input, method, app_key: auth.appKey, session: auth.accessToken, timestamp: timestamp(), format: 'json', v: '2.0', sign_method: 'hmac' };
    params.sign = sign(params, auth.appSecret);
    let response;
    try {
      response = await transport('https://eco.taobao.com/router/rest', {
        method: 'POST', redirect: 'error', headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
        body: new URLSearchParams(params).toString(), signal: AbortSignal.timeout(15000)
      });
    } catch { throw new ConnectorError('NETWORK_ERROR', '平台连接失败或超时，请检查网络后重试'); }
    if (!response.ok) throw new ConnectorError('HTTP_ERROR', `平台响应异常（HTTP ${response.status}），请稍后重试`);
    let payload;
    try { payload = parsePlatformJson(await response.text()); }
    catch { throw new ConnectorError('INVALID_RESPONSE', '平台返回的数据格式异常'); }
    if (payload.error_response) {
      // Do not persist raw platform errors, request parameters or credentials.
      throw new ConnectorError('PLATFORM_ERROR', '平台拒绝请求，请核对授权有效期、接口权限及调用额度');
    }
    const body = payload[method.replace(/^taobao\./, '').replaceAll('.', '_') + '_response'];
    if (!body || typeof body !== 'object') throw new ConnectorError('INVALID_RESPONSE', '平台响应缺少预期字段');
    return body;
  };
}
function numeric(value) { return value === undefined || value === null || value === '' || !Number.isFinite(Number(value)) ? null : Number(value); }
async function collect(call, method, input, container, itemKey) {
  const result = [];
  for (let page = 1; page <= 100; page++) {
    const body = await call(method, { ...input, page_no: String(page), page_size: '100' });
    const items = body[container]?.[itemKey] ?? [];
    if (!Array.isArray(items)) throw new ConnectorError('INVALID_RESPONSE', '平台列表格式异常');
    result.push(...items);
    const total = numeric(body.total_results);
    if (total === null) throw new ConnectorError('INVALID_RESPONSE', '平台未返回列表总数');
    if (result.length >= total) return result;
    if (!items.length) throw new ConnectorError('INCOMPLETE_RESPONSE', '平台分页数据不完整，本次未覆盖缓存');
  }
  throw new ConnectorError('PAGE_LIMIT', '超过单次同步 100 页上限，本次未覆盖缓存');
}
async function syncTaobao(store, auth, transport) {
  const call = taobaoClient(auth, transport);
  const shopResponse = await call('taobao.shop.seller.get', { fields: 'sid,title,pic_path' });
  const shop = shopResponse.shop;
  if (!shop?.sid) throw new ConnectorError('INVALID_RESPONSE', '未取得平台店铺身份');
  if (store.remoteShopId && store.remoteShopId !== String(shop.sid)) throw new ConnectorError('STORE_MISMATCH', '授权店铺与绑定店铺不一致，请检查服务端配置');
  const items = await collect(call, 'taobao.items.onsale.get', { fields: 'num_iid,title,price,num,outer_id' }, 'items', 'item');
  const end = new Date(), start = new Date(end.getTime() - 7 * 86400000);
  const trades = await collect(call, 'taobao.trades.sold.get', {
    fields: 'tid,status,payment,created,modified', start_created: timestamp(start), end_created: timestamp(end)
  }, 'trades', 'trade');
  const syncedAt = new Date().toISOString();
  const base = { storeId: store.id, platform: 'tb', source: 'official-api', syncedAt };
  return {
    remoteShopId: String(shop.sid), profile: { name: String(shop.title || store.name), sourceId: String(shop.sid), ...base },
    products: items.map(item => {
      if (!item.num_iid) throw new ConnectorError('INVALID_RESPONSE', '商品缺少平台编号');
      return { ...base, sourceId: String(item.num_iid), id: String(item.num_iid), name: String(item.title || ''), sku: String(item.outer_id || ''), price: numeric(item.price), stock: numeric(item.num) };
    }),
    orders: trades.map(trade => {
      if (!trade.tid) throw new ConnectorError('INVALID_RESPONSE', '订单缺少平台编号');
      return { ...base, sourceId: String(trade.tid), id: String(trade.tid), status: String(trade.status || ''), payment: numeric(trade.payment), created: String(trade.created || ''), modified: String(trade.modified || '') };
    }),
    coverage: { ordersFrom: start.toISOString(), ordersTo: end.toISOString(), description: '在售商品；最近 7 天创建的默认类型订单，不含完整历史、全部订单类型、SKU 明细或广告数据' }
  };
}
module.exports = { capabilities, credentials, configured, sign, timestamp, parsePlatformJson, taobaoClient, syncTaobao, ConnectorError };
