const { test } = require('node:test');
const assert = require('node:assert/strict');
const csv = require('../csv');

test('CSV handles BOM, quoted commas, escaped quotes, CRLF and multiline fields', () => {
  const text = '\uFEFFname,platform,sku,stock\r\n"杯子,\r\n""礼盒""",京东,A,10\r\n';
  const result = csv.prepare(text, 'products');
  assert.equal(result.errors.length, 0);
  assert.equal(result.records[0].name, '杯子,\r\n"礼盒"');
  assert.equal(result.records[0].id, 'A');
  assert.equal(result.records[0].platform, 'jd');
  assert.equal(result.records[0].stock, 10);
});
test('Invalid quotes and required headers fail before import', () => {
  assert.throws(() => csv.parse('name\n"broken'), /未闭合/);
  assert.throws(() => csv.parse('name\n"a"bad'), /引号/);
  assert.throws(() => csv.prepare('name\n商品', 'products'), /必需表头/);
  assert.throws(() => csv.prepare('name,商品名称,platform\na,b,jd', 'products'), /多个表头/);
});
test('All supported platform codes are normalized; unknown platforms are rejected', () => {
  for (const key of ['pd', 'pdd', 'pinduoduo', '拼多多']) assert.equal(csv.platform(key), 'pd');
  for (const key of ['tb', 'taobao', '天猫']) assert.equal(csv.platform(key), 'tb');
  for (const key of ['jd', '京东']) assert.equal(csv.platform(key), 'jd');
  assert.throws(() => csv.platform('unknown'));
});
test('Negative and malformed numeric data are rejected instead of rewritten', () => {
  for (const price of ['-12', '99-129', '1万', '1.2.3', '1,23']) {
    const result = csv.prepare(`name,platform,price\n商品,pd,"${price}"`, 'competitors');
    assert.equal(result.records.length, 0);
    assert.equal(result.errors.length, 1);
  }
  assert.equal(csv.number('￥1,299.50元', '价格', { currency: true }), 1299.5);
  assert.throws(() => csv.number('1.5', '库存', { integer: true }));
});
test('Unknown quantities stay null; zero remains zero', () => {
  const result = csv.prepare('name,platform,stock,sales,conversion\na,pd,,0,5.2%', 'products');
  assert.deepEqual([result.records[0].stock, result.records[0].sales, result.records[0].conversion], [null, 0, '5.2%']);
  assert.equal(csv.number('0', '价格'), 0);
});
test('Duplicate IDs and wrong column counts are reported with source line numbers', () => {
  const result = csv.prepare('name,platform,id\na,pd,A\nb,jd,A\nc,tb,EXISTING\nd,jd,X,extra', 'products', ['EXISTING']);
  assert.equal(result.records.length, 1);
  assert.deepEqual(result.errors.map(error => error.line), [3, 4, 5]);
});
test('HTML and out of range values are rejected as conversion rates', () => {
  for (const value of ['<b>test</b>', '101%', '-1']) {
    assert.equal(csv.prepare(`name,platform,conversion\na,pd,${value}`, 'products').records.length, 0);
  }
});
