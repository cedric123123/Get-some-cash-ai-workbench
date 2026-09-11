const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const crypto = require('node:crypto');

function context(document = { querySelector: () => ({}) }) {
  const source = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
  const ctx = vm.createContext({ document, crypto, CommerceCsv: require('../csv') });
  vm.runInContext(source.slice(0, source.lastIndexOf("document.querySelectorAll('.nav-item[data-view]')")), ctx);
  return ctx;
}

test('Imported conversion and identifiers cannot create HTML markup', () => {
  const ctx = context();
  const html = vm.runInContext(`productTable([{id: '" data-bad="yes', name:'<b>name</b>', platform:'tb', sales:null, stock:null, conversion:'<img src=x onerror=alert(1)>', status:'watch', risk:'待核验'}])`, ctx);
  assert.ok(!html.includes('<img'));
  assert.ok(!html.includes('<b>name</b>'));
  assert.ok(html.includes('待核验'));
  const option = vm.runInContext(`STATE.products = [{id:'"><img src=x>', name:'商品'}]; creativeModal()`, ctx);
  assert.ok(!option.includes('<img'));
});

test('Competitor search can recover after an empty result', () => {
  let searchHandler, hasContainer = true, html = '';
  const search = { addEventListener: (_, handler) => { searchHandler = handler; } };
  const table = { set outerHTML(value) { html = value; hasContainer = value.includes('class="competitor-table"'); } };
  const app = {
    querySelectorAll: () => [],
    querySelector: selector => selector === '#competitor-search' ? search : selector === '.competitor-table' && hasContainer ? table : null
  };
  const ctx = context({ querySelector: selector => selector === '#app-content' ? app : {} });
  vm.runInContext('bindViewEvents()', ctx);
  searchHandler({ target: { value: 'not-a-product-123' } });
  assert.ok(html.includes('empty-row'));
  searchHandler({ target: { value: '' } });
  assert.ok(html.includes('competitor-row'));
});

test('Preparing a CSV does not mutate state; confirming adds valid records once', () => {
  const ctx = context();
  const result = vm.runInContext(`(() => {
    STATE.products = [];
    const prepared = CommerceCsv.prepare('name,platform,sku,stock\\n商品,pd,A,10', 'products');
    const before = STATE.products.length;
    const first = commitCsvRecords(prepared.records, 'products');
    const second = commitCsvRecords(prepared.records, 'products');
    return [before, first, second, STATE.products.length];
  })()`, ctx);
  assert.deepEqual(Array.from(result), [0, 1, 0, 1]);
});
