const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { sign, timestamp, parsePlatformJson, taobaoClient, syncTaobao } = require('../lib/connectors');
const auth = { appKey: 'test-key', appSecret: 'test-secret', accessToken: 'test-token' };

test('TOP signing sorts fields, excludes sign, and uses uppercase HMAC-MD5', () => {
  const expected = crypto.createHmac('md5', 'test-secret').update('bar2foo1').digest('hex').toUpperCase();
  assert.equal(sign({ foo: '1', sign: 'ignored', bar: '2' }, auth.appSecret), expected);
  assert.equal(timestamp(new Date('2026-01-01T18:00:00Z')), '2026-01-02 02:00:00');
});
test('Platform JSON preserves large numeric IDs and quoted text', () => {
  const data = parsePlatformJson('{"tid":1234567890123456789,"text":"1234567890123456789","payment":"99.90","num":2}');
  assert.equal(data.tid, '1234567890123456789');
  assert.equal(data.text, data.tid);
  assert.equal(data.num, 2);
});
test('Only approved query methods reach the fixed HTTPS gateway', async () => {
  let called = false;
  const client = taobaoClient(auth, async (url, options) => {
    called = true;
    assert.equal(url, 'https://eco.taobao.com/router/rest');
    assert.equal(options.redirect, 'error');
    const params = Object.fromEntries(new URLSearchParams(options.body));
    assert.equal(params.sign, sign(params, auth.appSecret));
    return new Response(JSON.stringify({ shop_seller_get_response: { shop: { sid: 1 } } }));
  });
  await assert.rejects(() => client('taobao.item.update', {}), /只读/);
  assert.equal(called, false);
  assert.equal((await client('taobao.shop.seller.get', { fields: 'sid' })).shop.sid, 1);
});
test('Shop identity check, pagination and normalized records use no buyer details', async () => {
  const calls = [];
  const transport = async (_, options) => {
    const params = Object.fromEntries(new URLSearchParams(options.body));
    calls.push(params);
    const shop = { shop_seller_get_response: { shop: { sid: '123', title: '测试店铺' } } };
    const products = { items_onsale_get_response: { total_results: 2, items: { item: [{ num_iid: params.page_no, title: '商品', num: 4, price: '9.90' }] } } };
    const orders = { trades_sold_get_response: { total_results: 1, trades: { trade: [{ tid: 'ORDER', payment: '9.90', status: 'WAIT_SELLER_SEND_GOODS', buyer_nick: 'not-persisted' }] } } };
    return new Response(JSON.stringify(params.method.includes('shop.seller') ? shop : params.method.includes('items.onsale') ? products : orders));
  };
  await assert.rejects(() => syncTaobao({ id: 'store', remoteShopId: 'wrong' }, auth, transport), /不一致/);
  calls.length = 0;
  const result = await syncTaobao({ id: 'store', remoteShopId: '123' }, auth, transport);
  assert.equal(result.products.length, 2);
  assert.equal(result.products[0].storeId, 'store');
  assert.equal(result.products[0].price, 9.9);
  assert.equal(result.orders[0].payment, 9.9);
  assert.ok(!JSON.stringify(result).includes('not-persisted'));
  assert.equal(calls.filter(call => call.method.includes('items.onsale')).length, 2);
  assert.ok(calls.at(-1).start_created);
});
test('Platform errors do not expose upstream message or credentials', async () => {
  const client = taobaoClient(auth, async () => new Response(JSON.stringify({ error_response: { msg: 'test-secret and test-token' } })));
  await assert.rejects(() => client('taobao.shop.seller.get', {}), error => error.code === 'PLATFORM_ERROR' && !error.message.includes('test-secret'));
});
