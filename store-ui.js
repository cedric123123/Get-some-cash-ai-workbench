const StoreUI = (() => {
  let host = null, token = '', stores = [], selected = '', resource = 'products', page = 1;
  let records = null, error = '', busy = false, timer = null, generation = 0;
  const labels = { tb: '淘宝 / 天猫', pd: '拼多多', jd: '京东' };
  const status = { idle: '待同步', running: '同步中', success: '同步成功', failed: '同步失败' };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const time = value => value ? new Date(value).toLocaleString('zh-CN') : '尚未同步';
  const number = value => value === null || value === undefined ? '待核验' : esc(value);
  async function request(url, options = {}) {
    const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', 'X-Workspace-Token': token }, signal: AbortSignal.timeout(20000) });
    let data;
    try { data = await response.json(); } catch { throw new Error('数据服务不可用，请重启新版服务后重试'); }
    if (!response.ok) throw new Error(data.error || '请求失败');
    return data;
  }
  function paint() {
    if (!host) return;
    const existingForm = host.querySelector('#store-create');
    const draft = existingForm ? Object.fromEntries(new FormData(existingForm)) : null;
    const store = stores.find(item => item.id === selected);
    const canSync = store?.capability.implemented && store.credentialConfigured && store.sync.state !== 'running';
    host.innerHTML = `<div class="page-heading"><div><h1>店铺接口</h1><p>真实店铺数据单独保存；显示本次查询范围与最后成功同步时间。</p></div><button class="button" data-store-action="refresh" ${busy ? 'disabled' : ''}>刷新状态</button></div>
      ${error ? `<div class="store-error" role="alert">${esc(error)}</div>` : ''}
      <section class="card view-card"><h2>登记店铺连接</h2><p>填写店铺名称和服务端配置代号。密钥与授权令牌在运行服务的环境中配置。</p>
        <form id="store-create" class="store-create"><label>店铺名称<input name="name" maxlength="80" required placeholder="例如：淘宝旗舰店" /></label><label>平台<select name="platform"><option value="tb">淘宝 / 天猫</option><option value="pd">拼多多（待接入）</option><option value="jd">京东（待接入）</option></select></label><label>配置代号<input name="credentialRef" required pattern="[A-Z][A-Z0-9_]{0,39}" maxlength="40" placeholder="MAIN_TAOBAO" /></label><label>平台店铺 ID（选填）<input name="remoteShopId" pattern="[0-9]{1,30}" maxlength="30" placeholder="首次成功同步后绑定" /></label><button class="button primary" ${busy ? 'disabled' : ''}>登记店铺</button></form>
      </section>
      <section class="card view-card store-panel"><div class="card-header"><h2>已登记店铺</h2><span>${stores.length} 家</span></div>
      ${stores.length ? `<label>选择店铺 <select id="store-select">${stores.map(item => `<option value="${esc(item.id)}" ${selected === item.id ? 'selected' : ''}>${esc(item.name)} · ${labels[item.platform]}</option>`).join('')}</select></label>` : '<p>尚未登记店铺。登记后配置对应授权，即可开始同步。</p>'}
      ${store ? `<div class="store-status"><strong>${esc(store.profile?.name || store.name)}</strong><span>${labels[store.platform]} · ${status[store.sync.state]}</span><span>最后成功：${esc(time(store.sync.lastSuccessAt))}</span><span>平台店铺 ID：${esc(store.remoteShopId || '待绑定')}</span><span>凭证：${store.credentialConfigured ? '已在服务端配置（待请求验证）' : '待配置'}</span></div>
        <p>${esc(store.capability.description)}</p>
        ${!store.credentialConfigured && store.capability.implemented ? `<p>配置以下服务端环境变量后重启：<code>GAOQIAN_${esc(store.credentialRef)}_APP_KEY</code>、<code>GAOQIAN_${esc(store.credentialRef)}_APP_SECRET</code>、<code>GAOQIAN_${esc(store.credentialRef)}_ACCESS_TOKEN</code>。</p>` : ''}
        ${store.sync.error ? `<div class="store-error">${esc(store.sync.error)}${store.sync.lastSuccessAt ? '；下方保留上次成功数据。' : ''}</div>` : ''}
        <button class="button primary" data-store-action="sync" ${!canSync || busy ? 'disabled' : ''}>${store.sync.state === 'running' ? '正在同步…' : '同步官方数据'}</button>
        <div class="store-tabs">${[['products','在售商品'],['inventory','商品库存'],['orders','订单']].map(([key,label]) => `<button class="button ${key === resource ? 'primary' : ''}" data-store-resource="${key}" ${busy ? 'disabled' : ''}>${label}</button>`).join('')}</div>
        <p>${esc(records?.coverage?.description || '等待首次同步，当前没有平台数据。')}</p>
        ${table()}` : ''}</section>`;
    host.querySelector('#store-create').addEventListener('submit', create);
    if (draft) for (const [key, value] of Object.entries(draft)) host.querySelector('#store-create').elements.namedItem(key).value = value;
    host.querySelector('#store-select')?.addEventListener('change', event => { selected = event.target.value; page = 1; records = null; refresh(); });
    host.querySelectorAll('[data-store-resource]').forEach(button => button.addEventListener('click', () => { resource = button.dataset.storeResource; page = 1; records = null; refresh(); }));
    host.querySelectorAll('[data-store-action]').forEach(button => button.addEventListener('click', () => {
      const action = button.dataset.storeAction;
      if (action === 'sync') synchronize();
      else { if (action === 'next') page++; if (action === 'previous') page--; refresh(); }
    }));
  }
  function table() {
    if (!records) return '<p>正在读取本地同步记录…</p>';
    const orders = resource === 'orders';
    const rows = records.items.map(item => orders
      ? `<tr><td>${esc(item.id)}</td><td>${esc(item.status)}</td><td>${number(item.payment)}</td><td>${esc(item.created)}</td></tr>`
      : `<tr><td>${esc(item.id)}</td><td>${esc(item.name)}</td><td>${number(item.stock)}</td><td>${resource === 'inventory' ? esc(time(item.syncedAt)) : number(item.price)}</td></tr>`).join('');
    return `<div class="store-table"><table class="data-table"><thead><tr>${(orders ? ['订单号','平台状态','实付款（元）','创建时间'] : ['商品 ID','名称','商品库存',resource === 'inventory' ? '同步时间' : '价格（元）']).map(label=>`<th>${label}</th>`).join('')}</tr></thead><tbody>${rows || '<tr><td colspan="4">当前查询范围内没有数据。</td></tr>'}</tbody></table></div><div class="store-pagination"><span>共 ${records.total} 条 · 第 ${page} 页</span><button class="button" data-store-action="previous" ${page <= 1 || busy ? 'disabled' : ''}>上一页</button><button class="button" data-store-action="next" ${page * 50 >= records.total || busy ? 'disabled' : ''}>下一页</button></div>`;
  }
  async function refresh() {
    const current = ++generation;
    clearTimeout(timer);
    busy = true; error = ''; paint();
    try {
      const session = await request('/api/session');
      const result = await request('/api/stores');
      if (!host || current !== generation) return;
      token = session.token; stores = result.stores;
      if (!stores.some(item => item.id === selected)) selected = stores[0]?.id || '';
      const data = selected ? await request(`/api/stores/${selected}/${resource}?page=${page}`) : null;
      if (!host || current !== generation) return;
      records = data;
    } catch (failure) { if (current === generation) error = failure.message; }
    finally {
      if (host && current === generation) {
        busy = false; paint();
        if (stores.some(item => item.sync.state === 'running')) timer = setTimeout(refresh, 2000);
      }
    }
  }
  async function create(event) {
    event.preventDefault();
    if (busy) return;
    const input = Object.fromEntries(new FormData(event.target));
    const current = generation;
    busy = true;
    event.target.querySelector('button').disabled = true;
    try {
      const data = await request('/api/stores', { method: 'POST', body: JSON.stringify(input) });
      if (!host || current !== generation) return;
      event.target.reset();
      selected = data.store.id; page = 1; records = null; await refresh();
    } catch (failure) { if (host && current === generation) { error = failure.message; busy = false; paint(); } }
  }
  async function synchronize() {
    if (busy) return;
    busy = true; error = ''; paint();
    try { await request(`/api/stores/${selected}/sync`, { method: 'POST', body: '{}' }); await refresh(); }
    catch (failure) { error = failure.message; busy = false; paint(); }
  }
  return {
    mount(container) { host = container; refresh(); },
    unmount() { host = null; generation++; clearTimeout(timer); }
  };
})();
