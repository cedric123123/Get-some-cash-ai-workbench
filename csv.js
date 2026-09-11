(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CommerceCsv = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function parse(text) {
    text = String(text).replace(/^\uFEFF/, '');
    const rows = [];
    let row = [], field = '', quoted = false, closed = false, line = 1, startLine = 1;
    function finishField() { row.push(field); field = ''; closed = false; }
    function finishRow() {
      finishField();
      if (row.some(value => value.trim())) rows.push({ values: row, line: startLine });
      row = [];
    }
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (quoted) {
        if (char === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else { quoted = false; closed = true; }
        } else {
          field += char;
          if (char === '\n' || (char === '\r' && text[i + 1] !== '\n')) line++;
        }
      } else if (char === ',') finishField();
      else if (char === '\r' || char === '\n') {
        finishRow();
        if (char === '\r' && text[i + 1] === '\n') i++;
        line++; startLine = line;
      } else if (char === '"' && field === '' && !closed) quoted = true;
      else if (closed || char === '"') throw new Error(`第 ${line} 行引号格式错误`);
      else field += char;
    }
    if (quoted) throw new Error(`第 ${startLine} 行开始的引号未闭合`);
    finishRow();
    return rows;
  }

  function platform(raw) {
    const value = String(raw).trim().toLowerCase();
    if (['tb', 'taobao', 'tmall', '淘宝', '天猫', '淘宝/天猫', '淘宝 / 天猫'].includes(value)) return 'tb';
    if (['pd', 'pdd', 'pinduoduo', '拼多多'].includes(value)) return 'pd';
    if (['jd', 'jingdong', '京东'].includes(value)) return 'jd';
    throw new Error('平台缺失或无法识别，请填写淘宝、拼多多或京东');
  }

  function number(raw, label, options = {}) {
    let value = String(raw ?? '').trim();
    if (!value || ['—', '--', '待核验', '未知', 'n/a'].includes(value.toLowerCase())) return null;
    if (options.currency) value = value.replace(/^[¥￥]\s*/, '').replace(/\s*元$/, '');
    if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(value)) throw new Error(`${label}须为非负数，不能含价格区间或单位缩写`);
    const result = Number(value.replace(/,/g, ''));
    if (!Number.isFinite(result) || result > Number.MAX_SAFE_INTEGER || (options.integer && !Number.isSafeInteger(result))) throw new Error(`${label}超出范围或不是整数`);
    return result;
  }

  const aliases = {
    name: ['name', '商品名称', '商品', '竞品名称'],
    id: ['sku', '商品sku', '内部sku', 'id', '竞品id'],
    platform: ['platform', '平台'], sales: ['sales', '销量'], stock: ['stock', '库存'],
    conversion: ['conversion', '转化率'], price: ['price', '价格', '展示价格'],
    brand: ['brand', '店铺', '品牌', '店铺/品牌'], tags: ['tags', '标签', '监测标签']
  };

  function prepare(text, kind, existingIds = []) {
    const rows = parse(text);
    if (rows.length < 2) throw new Error('CSV 需要表头和至少一行数据');
    const headers = rows.shift().values.map(value => value.trim().toLowerCase());
    const indexes = {};
    for (const [key, names] of Object.entries(aliases)) {
      const matches = headers.map((header, index) => names.includes(header) ? index : -1).filter(index => index >= 0);
      if (matches.length > 1) throw new Error(`${key} 对应多个表头，请仅保留一列`);
      indexes[key] = matches[0] ?? -1;
    }
    if (indexes.name < 0 || indexes.platform < 0) throw new Error('缺少必需表头：商品名称、平台');
    const known = new Set(existingIds);
    const records = [], errors = [];
    for (const row of rows) {
      try {
        if (row.values.length !== headers.length) throw new Error('列数与表头不一致');
        const get = key => (row.values[indexes[key]] || '').trim();
        const name = get('name');
        if (!name) throw new Error('商品名称不能为空');
        const id = get('id');
        if (id && known.has(id)) throw new Error(`编号 ${id} 已存在，本次不覆盖`);
        const item = { name, id, platform: platform(get('platform')) };
        if (kind === 'products') {
          item.sales = number(get('sales'), '销量', { integer: true });
          item.stock = number(get('stock'), '库存', { integer: true });
          const conversion = number(get('conversion').replace(/%$/, ''), '转化率');
          if (conversion !== null && conversion > 100) throw new Error('转化率应在 0–100% 之间');
          item.conversion = conversion === null ? '—' : `${conversion}%`;
        } else if (kind === 'competitors') {
          item.price = number(get('price'), '价格', { currency: true });
          item.brand = get('brand') || '未标注店铺';
          item.tags = get('tags').split(/[/，,]/).map(tag => tag.trim()).filter(Boolean).slice(0, 3);
          if (!item.tags.length) item.tags = ['待分类'];
        } else throw new Error('暂不支持此导入类型');
        if (id) known.add(id);
        records.push(item);
      } catch (error) { errors.push({ line: row.line, message: error.message }); }
    }
    return { records, errors, total: rows.length };
  }
  return { parse, prepare, platform, number };
});
