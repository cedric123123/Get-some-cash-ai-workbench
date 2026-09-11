const app = document.querySelector('#app-content');
const viewCrumb = document.querySelector('#view-crumb');
const modalRoot = document.querySelector('#modal-root');
const modalBackdrop = document.querySelector('#modal-backdrop');
const toastStack = document.querySelector('#toast-stack');

const STATE = {
  view: 'dashboard',
  platform: 'all',
  taskCount: 4,
  products: [
    { id: 'S-240901', name: '云感防晒霜 SPF50+ 50ml', platform: 'tb', sales: 1286, stock: 342, conversion: '5.82%', status: 'good', risk: '正常', thumb: 'warm' },
    { id: 'S-240919', name: '真丝睡眠眼罩 · 雾粉色', platform: 'pd', sales: 996, stock: 48, conversion: '4.36%', status: 'watch', risk: '低库存', thumb: 'pink' },
    { id: 'S-240882', name: '随行不锈钢保温杯 480ml', platform: 'jd', sales: 742, stock: 581, conversion: '3.91%', status: 'good', risk: '正常', thumb: 'blue' },
    { id: 'S-240930', name: '轻量通勤双肩包 · 深灰', platform: 'tb', sales: 619, stock: 106, conversion: '3.55%', status: 'good', risk: '正常', thumb: 'warm' },
    { id: 'S-240857', name: '氨基酸洁面慕斯 150ml', platform: 'pd', sales: 533, stock: 36, conversion: '2.74%', status: 'watch', risk: '内容待审', thumb: 'pink' },
    { id: 'S-240801', name: '儿童学饮保温杯 350ml', platform: 'jd', sales: 428, stock: 213, conversion: '3.08%', status: 'good', risk: '正常', thumb: 'blue' }
  ],
  tasks: [
    { title: '确认防晒霜「秋日焕新」活动价格', meta: '淘宝 · 截止今天 16:00', level: 'urgent', state: 'todo' },
    { title: '补充真丝眼罩的安全库存', meta: '拼多多 · 建议补货 180 件', level: 'urgent', state: 'todo' },
    { title: '审核洁面慕斯详情页素材', meta: '内容工坊 · 3 张待审核', level: 'normal', state: 'review' },
    { title: '核对京东 8 月对账单', meta: '财务 · 差异 ¥128.40', level: 'normal', state: 'review' }
  ],
  competitors: [
    { id: 'C-1001', name: '森呼吸 SPF50+ 防晒乳 50g', brand: '森呼吸官方旗舰店', platform: 'tb', price: 109, change: -10, sales: '5,200+', rating: '4.9', status: 'price', observedAt: '今天 09:18', thumb: 'warm', tags: ['防晒', '通勤', '轻薄'] },
    { id: 'C-1002', name: '绵眠真丝睡眠眼罩 · 桑蚕丝', brand: '绵眠优选店', platform: 'pd', price: 49.9, change: -8, sales: '10 万+', rating: '4.8', status: 'promo', observedAt: '今天 08:42', thumb: 'pink', tags: ['真丝', '礼盒', '睡眠'] },
    { id: 'C-1003', name: '北屿 316L 保温杯 480ml', brand: '北屿厨具京东自营', platform: 'jd', price: 139, change: 0, sales: '2,000+', rating: '4.9', status: 'stable', observedAt: '昨天 21:06', thumb: 'blue', tags: ['316L', '保温', '通勤'] },
    { id: 'C-1004', name: '净研氨基酸洁面慕斯 150ml', brand: '净研官方旗舰店', platform: 'tb', price: 79, change: 12, sales: '3,600+', rating: '4.8', status: 'content', observedAt: '昨天 18:35', thumb: 'warm', tags: ['氨基酸', '洁面', '敏感肌'] },
    { id: 'C-1005', name: '极简轻量双肩包 · 14 英寸', brand: '轻行生活拼购店', platform: 'pd', price: 85.9, change: -4, sales: '8,000+', rating: '4.7', status: 'stable', observedAt: '昨天 16:20', thumb: 'pink', tags: ['通勤', '防泼水', '轻量'] }
  ],
  integrations: [
    { key: 'taobao', name: '淘宝 / 天猫', abbreviation: '淘', type: 'taobao', status: 'pending', description: '尚未授权 · 可通过官方开放平台接入' },
    { key: 'pdd', name: '拼多多', abbreviation: '拼', type: 'pdd', status: 'pending', description: '尚未授权 · 可通过商家自研系统接入' },
    { key: 'jd', name: '京东', abbreviation: '京', type: 'jd', status: 'pending', description: '尚未授权 · 需商家授权与应用审核' },
    { key: 'csv', name: 'CSV / Excel 导入', abbreviation: 'CSV', type: 'csv', status: 'online', description: '已启用 · 本地导入，不会上传你的原始文件' }
  ],
  routines: [
    { icon: '◇', title: '低库存巡检', description: '每日扫描安全库存，生成补货建议', active: true },
    { icon: '↗', title: '价格与利润预警', description: '检测活动价、佣金、运费造成的毛利异常', active: true },
    { icon: '▣', title: '履约 SLA 看板', description: '识别待发货、临期、异常物流订单', active: false },
    { icon: '✦', title: '内容合规检查', description: '对绝对化、功效、证据缺失等文案打标', active: true }
  ]
};

const PLATFORM = {
  tb: { label: '淘宝', long: '淘宝 / 天猫', className: 'tb', icon: '淘' },
  pd: { label: '拼多多', long: '拼多多', className: 'pd', icon: '拼' },
  jd: { label: '京东', long: '京东', className: 'jd', icon: '京' }
};

const viewMeta = {
  stores: { title: '店铺接口', subtitle: '官方 API 店铺数据与同步状态' },
  dashboard: { title: '经营总览', subtitle: '把商品、活动、履约与内容经营收进同一个决策面板。' },
  products: { title: '商品与库存', subtitle: '统一 SKU，分别维护淘宝、拼多多和京东的商品映射与健康度。' },
  campaigns: { title: '营销活动', subtitle: '查看活动节奏、预算效率与待审批的价格动作。' },
  content: { title: '内容工坊', subtitle: '从商品事实到平台化创意；先规划、审核，再产出素材。' },
  orders: { title: '订单与履约', subtitle: '聚合待发货、售后与物流风险，优先处理影响体验的订单。' },
  tasks: { title: '任务与审批', subtitle: '把有影响的操作放进清晰、可复核的行动队列。' },
  insights: { title: '数据洞察', subtitle: '基于已同步或导入的数据生成有证据的经营建议。' },
  competitors: { title: '竞品监控', subtitle: '用带时间戳的价格、活动与内容快照，找到可验证的经营机会。' },
  integrations: { title: '平台连接', subtitle: '连接器默认只读；写入、发布和改价必须在授权与审批后开启。' },
  settings: { title: '工作台设置', subtitle: '配置经营规则、通知方式与智能例行任务。' }
};

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' })[char]);
}

function platformTag(key) {
  const platform = PLATFORM[key];
  return `<span class="platform-tag ${platform.className}">${platform.long}</span>`;
}

function thumb(type = 'warm') {
  return `<span class="product-thumb ${type === 'warm' ? '' : type}" aria-hidden="true"></span>`;
}

function statusTag(status) {
  return status === 'good'
    ? '<span class="status-tag good">健康</span>'
    : '<span class="status-tag watch">需关注</span>';
}

function titleBlock(view) {
  const meta = viewMeta[view];
  return `<div class="page-heading">
    <div><h1>${meta.title}</h1><p>${meta.subtitle}</p></div>
    ${headingActions(view)}
  </div>`;
}

function headingActions(view) {
  const contextual = {
    dashboard: `<button class="button" data-open-modal="import">⇩ 导入数据</button><button class="button primary" data-open-modal="task">＋ 新建任务</button>`,
    products: `<button class="button" data-open-modal="mapping">⇄ 平台映射</button><button class="button primary" data-open-modal="product">＋ 新建商品</button>`,
    campaigns: `<button class="button" data-open-modal="task">▣ 新建活动任务</button><button class="button primary" data-open-modal="campaign">＋ 创建活动</button>`,
    content: `<button class="button" data-toast="已打开素材资产库">▤ 素材资产库</button><button class="button primary" data-open-modal="creative">✦ 新建内容任务</button>`,
    orders: `<button class="button" data-open-modal="import">⇩ 导入订单</button><button class="button primary" data-open-modal="task">＋ 创建履约任务</button>`,
    tasks: `<button class="button" data-toast="已筛选出本周任务">▤ 本周</button><button class="button primary" data-open-modal="task">＋ 新建任务</button>`,
    insights: `<button class="button" data-toast="报告已加入导出队列">⇩ 导出报告</button><button class="button primary" data-open-modal="assistant">✦ 询问小星</button>`,
    competitors: `<button class="button" data-open-modal="competitor-import">⇩ 导入监测清单</button><button class="button primary" data-open-modal="competitor">＋ 添加竞品</button>`,
    integrations: `<button class="button" data-open-modal="import">⇩ 本地导入</button><button class="button primary" data-open-modal="connect">＋ 连接平台</button>`,
    settings: `<button class="button" data-toast="设置已自动保存">↻ 恢复默认</button><button class="button primary" data-toast="设置已保存">保存设置</button>`
  };
  return `<div class="heading-actions">${contextual[view]}</div>`;
}

function platformFilter() {
  const options = [['all', '全部'], ['tb', '淘宝'], ['pd', '拼多多'], ['jd', '京东']];
  return `<div class="platform-filter" role="group" aria-label="选择平台">${options.map(([key, label]) => `<button data-platform="${key}" class="${STATE.platform === key ? 'active' : ''}">${label}</button>`).join('')}</div>`;
}

function metricCard(label, value, meta, tone, spark, down = false) {
  return `<article class="metric-card ${tone}">
    <span class="metric-label">${label}</span>
    <svg class="metric-spark ${tone}" viewBox="0 0 57 24" aria-hidden="true"><path d="${spark}"/></svg>
    <div class="metric-value">${value}</div>
    <div class="metric-meta ${down ? 'down' : ''}"><strong>${down ? '↓' : '↑'} ${meta}</strong><span>较上期</span></div>
  </article>`;
}

function salesChart() {
  return `<svg class="sales-chart" viewBox="0 0 690 205" preserveAspectRatio="none" role="img" aria-label="近 30 天成交额趋势图">
    <defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#8c84ff" stop-opacity=".25"/><stop offset="1" stop-color="#8c84ff" stop-opacity="0"/></linearGradient></defs>
    <line class="grid" x1="38" y1="20" x2="680" y2="20"/><line class="grid" x1="38" y1="65" x2="680" y2="65"/><line class="grid" x1="38" y1="110" x2="680" y2="110"/><line class="grid" x1="38" y1="155" x2="680" y2="155"/>
    <text class="axis-label" x="0" y="23">12万</text><text class="axis-label" x="3" y="68">8万</text><text class="axis-label" x="3" y="113">4万</text><text class="axis-label" x="18" y="158">0</text>
    <path class="target" d="M38 86 L680 86"/>
    <path class="area" d="M38 145 C57 139,69 151,89 132 S120 125,140 135 S173 119,192 126 S230 102,249 113 S286 89,308 103 S339 120,359 99 S397 103,418 82 S451 92,471 78 S501 108,521 92 S554 54,575 67 S609 44,628 57 S662 34,680 39 L680 155 L38 155Z"/>
    <path class="line" d="M38 145 C57 139,69 151,89 132 S120 125,140 135 S173 119,192 126 S230 102,249 113 S286 89,308 103 S339 120,359 99 S397 103,418 82 S451 92,471 78 S501 108,521 92 S554 54,575 67 S609 44,628 57 S662 34,680 39"/>
    <circle class="point" cx="575" cy="67" r="3.8"/><circle class="point" cx="680" cy="39" r="3.8"/>
    <rect x="632" y="8" rx="5" width="47" height="21" fill="#211e47"/><text x="638" y="22" fill="#fff" font-size="9">¥146,280</text>
    <text class="axis-label" x="38" y="183">8/13</text><text class="axis-label" x="160" y="183">8/20</text><text class="axis-label" x="286" y="183">8/27</text><text class="axis-label" x="412" y="183">9/03</text><text class="axis-label" x="538" y="183">9/10</text><text class="axis-label" x="654" y="183">今天</text>
  </svg>`;
}

function renderDashboard() {
  const visibleProducts = filteredProducts().slice(0, 4);
  return `${titleBlock('dashboard')}
  <section class="metric-grid" aria-label="核心经营指标">
    ${metricCard('成交额', '¥ 1,284,630', '18.6%', 'violet', 'M2 19 10 16 17 18 25 10 33 13 43 5 55 7')}
    ${metricCard('支付订单', '8,392', '12.4%', 'mint', 'M2 17 9 14 16 16 25 8 34 11 42 9 55 3')}
    ${metricCard('平均转化率', '4.68%', '0.37%', 'orange', 'M2 18 10 10 17 14 27 12 35 5 43 8 55 6')}
    ${metricCard('推广 ROI', '3.42', '0.18', 'blue', 'M2 7 10 13 18 11 26 15 35 9 44 12 55 5', true)}
  </section>
  <section class="dashboard-layout">
    <article class="card sales-card card-pad">
      <div class="card-header"><div><h2 class="card-title">成交趋势</h2><p class="card-subtitle">已支付订单 · ${STATE.platform === 'all' ? '全渠道' : PLATFORM[STATE.platform].long}</p></div>${platformFilter()}</div>
      <div class="chart-stat"><strong>¥ 1,284,630</strong><span>↑ 18.6%</span></div>
      <div class="chart-legend"><span><i></i>成交额</span><span><i class="grey"></i>目标线</span></div>
      ${salesChart()}
    </article>
    <article class="card card-pad">
      <div class="card-header"><div><h2 class="card-title">渠道健康度</h2><p class="card-subtitle">示例数据 · 等待平台授权后同步</p></div><button class="text-link" data-view-link="integrations">管理连接</button></div>
      <div class="platform-list">
        <div class="platform-row"><span class="platform-logo taobao">淘</span><div class="platform-row-copy"><strong>淘宝 / 天猫</strong><span>成交额 ¥608,420</span></div><div class="platform-number"><strong>4.93%</strong><span>↑ 0.4%</span></div></div>
        <div class="platform-row"><span class="platform-logo pdd">拼</span><div class="platform-row-copy"><strong>拼多多</strong><span>成交额 ¥397,870</span></div><div class="platform-number"><strong>4.12%</strong><span class="warning">库存 2 项预警</span></div></div>
        <div class="platform-row"><span class="platform-logo jd">京</span><div class="platform-row-copy"><strong>京东</strong><span>成交额 ¥278,340</span></div><div class="platform-number"><strong>4.58%</strong><span>↑ 0.2%</span></div></div>
      </div>
      <div class="platform-footer"><span>连接状态</span><span class="sync-pill">● 本地演示模式</span></div>
    </article>
  </section>
  <section class="card operation-card">
    <div class="operation-grid">
      <div class="operation-col"><div class="mini-header"><h3>待处理事项</h3><button class="text-link" data-view-link="tasks">查看全部</button></div>${taskMiniList()}</div>
      <div class="operation-col"><div class="mini-header"><h3>重点商品</h3><span>近 7 天</span></div>${productMiniList()}</div>
      <div class="operation-col"><div class="mini-header"><h3>订单结构</h3><span>共 8,392 单</span></div><div class="donut-wrap"><div class="donut-holder"><div class="donut"></div><div class="donut-value"><span><strong>82%</strong>已签收</span></div></div><div class="legend-list"><div><span>已签收</span><strong>6,881</strong></div><div><span>运输中</span><strong>932</strong></div><div><span>待发货</span><strong>401</strong></div><div><span>售后中</span><strong>178</strong></div></div></div></div>
    </div>
  </section>
  <section class="card table-card">
    <div class="table-toolbar"><h2>商品经营雷达</h2><div class="search-box">⌕<input id="dashboard-search" placeholder="搜索商品或 SKU" /></div><button class="text-link" data-view-link="products">查看全部商品</button></div>
    ${productTable(visibleProducts, 'dashboard')}
  </section>`;
}

function taskMiniList() {
  return STATE.tasks.slice(0, 3).map(task => `<div class="task-item"><span class="task-check ${task.level === 'urgent' ? 'alert' : ''}"></span><div class="task-content"><strong>${escapeHtml(task.title)}</strong><span>${escapeHtml(task.meta)}</span></div><i class="priority ${task.level === 'urgent' ? 'red' : ''}"></i></div>`).join('');
}

function productMiniList() {
  return STATE.products.slice(0, 3).map(product => `<div class="product-mini">${thumb(product.thumb)}<div class="product-mini-copy"><strong>${escapeHtml(product.name)}</strong><span>销量 ${Number.isFinite(product.sales) ? product.sales.toLocaleString() : '待核验'} · <b class="stock ${Number.isFinite(product.stock) && product.stock < 80 ? 'low' : ''}">库存 ${Number.isFinite(product.stock) ? product.stock : '待核验'}</b></span></div><span class="platform-tag ${PLATFORM[product.platform].className}">${PLATFORM[product.platform].label}</span></div>`).join('');
}

function productTable(products, context) {
  const empty = `<tr><td colspan="8"><div class="empty-row">没有匹配的商品。试试调整搜索条件或平台筛选。</div></td></tr>`;
  return `<table class="data-table"><thead><tr><th>商品</th><th>渠道</th><th>近 30 天销量</th><th>库存</th><th>转化率</th><th>状态</th><th>风险提示</th><th></th></tr></thead><tbody>${products.length ? products.map(product => `<tr>
      <td><div class="product-cell">${thumb(product.thumb)}<div><div class="product-name">${escapeHtml(product.name)}</div><div class="sku">${escapeHtml(product.id)}</div></div></div></td>
      <td>${platformTag(product.platform)}</td><td>${Number.isFinite(product.sales) ? product.sales.toLocaleString() : '待核验'}</td><td><span class="${Number.isFinite(product.stock) && product.stock < 80 ? 'stock low' : 'stock'}">${Number.isFinite(product.stock) ? product.stock : '待核验'}</span></td><td>${escapeHtml(product.conversion)}</td><td>${statusTag(product.status)}</td><td><span class="risk-tag ${product.risk !== '正常' ? 'high' : ''}">${product.risk}</span></td><td><button class="row-action" data-toast="已打开 ${escapeHtml(product.name)} 的经营详情">查看</button></td>
    </tr>`).join('') : empty}</tbody></table>`;
}

function filteredProducts() {
  return STATE.platform === 'all' ? STATE.products : STATE.products.filter(product => product.platform === STATE.platform);
}

function renderProducts() {
  return `${titleBlock('products')}
  <section class="metric-grid">
    ${metricCard('在售 SKU', '236', '8 个本周新增', 'violet', 'M2 18 10 16 16 12 25 14 33 8 43 9 55 4')}
    ${metricCard('需补货 SKU', '12', '3 项高优先级', 'orange', 'M2 7 10 8 17 12 25 12 33 17 44 18 55 20', true)}
    ${metricCard('待完善内容', '27', '含 8 份详情页', 'blue', 'M2 19 11 18 19 15 27 17 36 12 44 9 55 6')}
    ${metricCard('映射异常', '4', '需核对平台规格', 'mint', 'M2 18 9 12 19 16 29 10 39 13 47 5 55 7')}
  </section>
  <section class="view-grid"><article class="card view-card"><div class="card-header"><div><h2>商品主数据</h2><p class="card-subtitle">一个商品事实，衍生多个平台的标题、属性、价格与素材版本。</p></div>${platformFilter()}</div><div class="table-card card">${productTable(filteredProducts(), 'products')}</div></article>
  <aside class="card view-card"><h2>商品健康建议</h2><p>基于当前演示数据生成；真实建议应附带平台同步时间与来源证据。</p><div class="insight-list"><div class="insight"><span class="insight-mark">!</span><div class="insight-copy"><strong>真丝眼罩库存仅可覆盖约 3 天</strong><span>建议在创建补货单前，先核实近 7 日的日均销量和在途库存。</span></div></div><div class="insight"><span class="insight-mark">✦</span><div class="insight-copy"><strong>洁面慕斯详情页完成度较低</strong><span>可从内容工坊生成卖点结构草稿，再由运营或法务审核声明。</span></div></div><div class="insight"><span class="insight-mark">⌁</span><div class="insight-copy"><strong>京东保温杯转化稳定</strong><span>适合以现有视觉资产为基线，测试一个首屏卖点变体。</span></div></div></div></aside></section>`;
}

function renderCampaigns() {
  return `${titleBlock('campaigns')}
  <section class="view-grid"><article class="card view-card"><div class="card-header"><div><h2>进行中的活动</h2><p class="card-subtitle">活动动作在执行前保留预算、价格和素材审批记录。</p></div>${platformFilter()}</div><div class="campaign-list">
    <div class="campaign-item"><span class="campaign-icon">↗</span><div class="campaign-copy"><strong>秋日焕新 · 防晒霜套装</strong><span>淘宝 / 天猫 · 9 月 8 日 — 9 月 15 日</span><div class="progress"><i style="width:68%"></i></div></div><div class="campaign-kpi"><strong>ROI 4.12</strong><span>↑ 0.38</span></div></div>
    <div class="campaign-item"><span class="campaign-icon">✦</span><div class="campaign-copy"><strong>百亿补贴 · 真丝眼罩</strong><span>拼多多 · 9 月 10 日 — 9 月 18 日</span><div class="progress"><i style="width:40%"></i></div></div><div class="campaign-kpi"><strong>ROI 2.87</strong><span>预算 40%</span></div></div>
    <div class="campaign-item"><span class="campaign-icon">▣</span><div class="campaign-copy"><strong>京东秒杀 · 保温杯</strong><span>京东 · 9 月 12 日 — 9 月 14 日</span><div class="progress"><i style="width:18%"></i></div></div><div class="campaign-kpi"><strong>待审批</strong><span>价格策略</span></div></div>
  </div></article><aside class="card view-card"><h2>活动前检查</h2><p>建立“计划 → 审核 → 执行 → 复盘”的安全闭环。</p><div class="settings-list"><div class="setting-row"><span class="setting-icon">1</span><div class="setting-copy"><strong>商品价格与最低毛利</strong><span>先计算平台扣点、运费和优惠分摊</span></div><span class="status-tag good">已通过</span></div><div class="setting-row"><span class="setting-icon">2</span><div class="setting-copy"><strong>库存与履约能力</strong><span>拼多多眼罩需补货后再扩大流量</span></div><span class="status-tag watch">注意</span></div><div class="setting-row"><span class="setting-icon">3</span><div class="setting-copy"><strong>素材与宣传合规</strong><span>所有功效、对比和认证应有证据支持</span></div><span class="status-tag watch">待审</span></div></div></aside></section>
  <section class="section-grid" style="margin-top:15px"><article class="card feature-card"><span class="feature-icon">◈</span><h3>定价模拟器</h3><p>将活动价、优惠券、平台佣金和运费纳入单品利润预览。</p><button class="text-link" data-open-modal="campaign">创建模拟 →</button></article><article class="card feature-card mint-bg"><span class="feature-icon">⌁</span><h3>活动复盘</h3><p>比较流量、转化、客单与净利润，而不只看表面成交额。</p><button class="text-link" data-view-link="insights">查看洞察 →</button></article><article class="card feature-card orange-bg"><span class="feature-icon">✓</span><h3>审批队列</h3><p>由独立运营者确认价格、预算和素材后才产生写入动作。</p><button class="text-link" data-view-link="tasks">进入审批 →</button></article></section>`;
}

function renderContent() {
  return `${titleBlock('content')}
  <section class="view-grid"><article class="card view-card creative-studio"><div class="card-header"><div><h2>内容生产台</h2><p class="card-subtitle">把产品事实、目标人群和平台规范转成可审核的素材任务。</p></div><span class="status-tag good">演示任务</span></div>
    <div class="creative-stage"><div class="creative-preview"><span class="bottle"></span></div><div class="creative-brief"><h3>云感防晒霜 · 秋日焕新</h3><div class="brief-points"><div><b>商品事实：</b>SPF50+、通勤防晒、轻薄肤感</div><div><b>目标人群：</b>20–35 岁城市通勤人群</div><div><b>输出：</b>主图 5 张 · 详情页 8 屏 · 淘宝首图文案</div><div><b>风险检查：</b>防晒效能、时长等陈述需补充证据</div></div><div class="creative-actions"><button class="button small" data-toast="已打开 Prompt 与版式规划">查看规划</button><button class="button small primary" data-open-modal="creative">生成新版本</button></div></div></div><div class="studio-history"><span class="history-tile"></span><span class="history-tile"></span><span class="history-tile"></span><span class="history-tile"></span></div></article>
  <aside class="card view-card"><h2>内容任务队列</h2><p>生成并不代表可直接发布；请先完成素材与合规审核。</p><div class="task-item"><span class="task-check alert"></span><div class="task-content"><strong>洁面慕斯 · 详情页 8 屏</strong><span>等待卖点声明审核 · 拼多多</span></div><i class="priority red"></i></div><div class="task-item"><span class="task-check"></span><div class="task-content"><strong>保温杯 · 京东主图变体</strong><span>正在生成第 2/5 张</span></div><i class="priority"></i></div><div class="task-item"><span class="task-check"></span><div class="task-content"><strong>眼罩 · 小红书种草图文</strong><span>计划已生成，待确认 Prompt</span></div><i class="priority"></i></div><button class="button" style="width:100%;margin-top:13px" data-open-modal="creative">＋ 创建内容任务</button></aside></section>
  <section class="section-grid" style="margin-top:15px"><article class="card feature-card"><span class="feature-icon">◒</span><h3>商品事实卡</h3><p>集中维护规格、材质、资质和证据，作为所有内容的可追溯来源。</p><button class="text-link" data-toast="商品事实卡功能已规划">管理事实卡 →</button></article><article class="card feature-card mint-bg"><span class="feature-icon">▤</span><h3>平台版式模板</h3><p>按淘宝、拼多多、京东的素材尺寸和展示逻辑输出成套草稿。</p><button class="text-link" data-toast="模板库包含在下一步集成计划中">浏览模板 →</button></article><article class="card feature-card orange-bg"><span class="feature-icon">✓</span><h3>合规与证据</h3><p>对绝对化、比较和功效类文案提示审核，不自动杜撰背书。</p><button class="text-link" data-view-link="tasks">查看待审 →</button></article></section>`;
}

function renderOrders() {
  return `${titleBlock('orders')}
  <section class="metric-grid">${metricCard('待发货订单', '401', '36 单临近 SLA', 'orange', 'M2 7 10 8 18 11 27 12 34 15 42 17 55 20', true)}${metricCard('运输中订单', '932', '时效正常', 'blue', 'M2 18 10 16 19 12 26 14 36 9 45 7 55 4')}${metricCard('售后处理中', '178', '12 单超 24 小时', 'violet', 'M2 11 11 9 20 12 29 7 39 14 47 10 55 5')}${metricCard('履约及时率', '97.3%', '0.6%', 'mint', 'M2 18 10 14 18 15 26 10 36 9 46 6 55 4')}</section>
  <section class="view-grid"><article class="card view-card"><div class="card-header"><div><h2>优先处理订单</h2><p class="card-subtitle">本地演示数据；连接平台或导入文件后可查看真实订单。</p></div><button class="text-link" data-open-modal="import">导入订单</button></div><table class="data-table"><thead><tr><th>订单号</th><th>平台</th><th>状态</th><th>风险</th><th>金额</th><th></th></tr></thead><tbody><tr><td><span class="product-name">TB202609110482</span><div class="sku">云感防晒霜 × 2</div></td><td>${platformTag('tb')}</td><td><span class="status-tag watch">待发货</span></td><td><span class="risk-tag high">距 SLA 1h 12m</span></td><td>¥ 238.00</td><td><button class="row-action" data-open-modal="task">创建任务</button></td></tr><tr><td><span class="product-name">PDD202609118839</span><div class="sku">真丝睡眠眼罩 × 1</div></td><td>${platformTag('pd')}</td><td><span class="status-tag watch">售后中</span></td><td><span class="risk-tag high">等待举证</span></td><td>¥ 89.00</td><td><button class="row-action" data-open-modal="task">创建任务</button></td></tr><tr><td><span class="product-name">JD202609114029</span><div class="sku">随行保温杯 × 1</div></td><td>${platformTag('jd')}</td><td><span class="status-tag good">运输中</span></td><td><span class="risk-tag">正常</span></td><td>¥ 159.00</td><td><button class="row-action" data-toast="已打开订单详情">查看</button></td></tr></tbody></table></article><aside class="card view-card"><h2>履约提醒</h2><p>把订单异常转化为有人负责的行动，而不是只留在表格里。</p><div class="insight-list"><div class="insight"><span class="insight-mark">!</span><div class="insight-copy"><strong>36 单临近发货时限</strong><span>优先检查库存、面单和仓库截单时间。</span></div></div><div class="insight"><span class="insight-mark">⌁</span><div class="insight-copy"><strong>拼多多 8 单等待售后举证</strong><span>建立证据包和处理时限，避免超时影响店铺指标。</span></div></div><div class="insight"><span class="insight-mark">✓</span><div class="insight-copy"><strong>京东履约 SLA 保持稳定</strong><span>可把当前仓库处理时段记录为运营基线。</span></div></div></div></aside></section>`;
}

function renderTasks() {
  const columns = [
    ['待处理', STATE.tasks.filter(task => task.state === 'todo'), 'todo'],
    ['审核中', STATE.tasks.filter(task => task.state === 'review'), 'review'],
    ['本周完成', [{ title: '同步 9 月商品映射草稿', meta: '昨天 · 林映' }, { title: '检查 8 月推广成本', meta: '周一 · 小星' }], 'done']
  ];
  return `${titleBlock('tasks')}
  <section class="card view-card"><div class="card-header"><div><h2>行动看板</h2><p class="card-subtitle">所有外部副作用应在“待处理 → 审核中 → 已执行”之间留下记录。</p></div><span class="status-tag good">${STATE.taskCount} 项待办</span></div><div class="task-board">${columns.map(([title, tasks, type]) => `<div class="task-column"><div class="task-column-header"><span>${title}</span><span>${tasks.length}</span></div>${tasks.map(task => `<article class="board-ticket"><strong>${escapeHtml(task.title)}</strong><div class="ticket-footer"><span>${escapeHtml(task.meta)}</span>${type === 'review' ? '<span class="tiny-pill">待审核</span>' : type === 'done' ? '<span class="tiny-pill green">完成</span>' : '<span class="tiny-avatar">映</span>'}</div></article>`).join('') || '<div class="empty-row">当前没有任务</div>'}</div>`).join('')}</div></section>
  <section class="section-grid" style="margin-top:15px"><article class="card feature-card"><span class="feature-icon">◉</span><h3>动作预览</h3><p>改价、发布、库存同步等写入操作先展示差异，再等待确认。</p><button class="text-link" data-toast="动作预览将在连接器接入后启用">了解机制 →</button></article><article class="card feature-card mint-bg"><span class="feature-icon">⌁</span><h3>例行任务</h3><p>低库存、价格异常、履约 SLA 等任务根据规则自动进入这里。</p><button class="text-link" data-view-link="settings">配置例行任务 →</button></article><article class="card feature-card orange-bg"><span class="feature-icon">▣</span><h3>执行留痕</h3><p>每次审批、执行结果和失败原因都应该回流到可追溯日志。</p><button class="text-link" data-toast="审计日志将在真实连接器授权后开放">查看日志 →</button></article></section>`;
}

function renderInsights() {
  return `${titleBlock('insights')}
  <section class="view-grid"><article class="card view-card"><div class="card-header"><div><h2>经营诊断</h2><p class="card-subtitle">每项建议均应连接到源数据、时间范围和不确定性说明。</p></div><span class="status-tag good">数据完整度 74%</span></div><div class="insight-list"><div class="insight"><span class="insight-mark">↗</span><div class="insight-copy"><strong>防晒霜是当前增长主力，但活动结束后应复查利润</strong><span>近 30 天销量 1,286 件、转化率 5.82%。目前未接入真实佣金与广告消耗，无法判断净利润，建议先导入费用明细。</span></div></div><div class="insight"><span class="insight-mark">!</span><div class="insight-copy"><strong>真丝眼罩可能因库存约束错失活动流量</strong><span>样例库存 48 件，若维持近 7 日销量，预计覆盖 3 天。建议核查在途库存和供货周期，再决定是否扩大补贴预算。</span></div></div><div class="insight"><span class="insight-mark">✦</span><div class="insight-copy"><strong>京东保温杯适合做首图 A/B 测试</strong><span>销量与转化稳定，适合作为低风险试验对象。建议只变化首屏核心卖点，并固定价格与投放条件。</span></div></div></div></article><aside class="card view-card"><h2>渠道贡献</h2><p>基于演示成交额的归因结构。</p><div class="stacked-bars"><div class="bar-item"><div class="bar-label"><span>淘宝 / 天猫</span><strong>47.4%</strong></div><div class="bar-track"><i style="width:47.4%"></i></div></div><div class="bar-item"><div class="bar-label"><span>拼多多</span><strong>31.0%</strong></div><div class="bar-track"><i style="width:31%"></i></div></div><div class="bar-item"><div class="bar-label"><span>京东</span><strong>21.6%</strong></div><div class="bar-track"><i style="width:21.6%"></i></div></div></div><button class="button" style="width:100%;margin-top:21px" data-open-modal="assistant">✦ 让小星解释数据</button></aside></section>
  <section class="section-grid" style="margin-top:15px"><article class="card feature-card"><span class="feature-icon">⌁</span><h3>商品诊断卡</h3><p>按主图、详情页、人群、数据和策略五个层面整理证据与下一步。</p><button class="text-link" data-view-link="products">查看商品 →</button></article><article class="card feature-card mint-bg"><span class="feature-icon">◷</span><h3>周期经营报告</h3><p>把日/周/月报告做成可追问的事实摘要，而不是无法验证的结论。</p><button class="text-link" data-toast="报告模板已加入产品路线图">创建报告 →</button></article><article class="card feature-card orange-bg"><span class="feature-icon">▣</span><h3>证据与数据源</h3><p>连接器、导入文件和人工标注会被区分展示，防止混淆事实来源。</p><button class="text-link" data-view-link="integrations">查看连接器 →</button></article></section>`;
}

function competitorStatus(status) {
  const labels = {
    price: ['降价', 'price'],
    promo: ['活动中', 'promo'],
    content: ['内容更新', 'content'],
    stable: ['稳定', 'stable']
  };
  const [label, tone] = labels[status] || labels.stable;
  return `<span class="competitor-status ${tone}">${label}</span>`;
}

function priceChange(change) {
  if (!change) return '<span class="price-change flat">— 稳定</span>';
  const direction = change > 0 ? '↑' : '↓';
  return `<span class="price-change ${change > 0 ? 'up' : 'down'}">${direction} ¥${Math.abs(change).toFixed(0)}</span>`;
}

function displayCompetitorPrice(price) {
  return Number.isFinite(price) ? `¥ ${price.toFixed(2)}` : '待核验';
}

function competitorTable(items) {
  if (!items.length) return '<div class="competitor-table"><div class="empty-row">当前筛选条件下没有竞品。你可以添加商品链接、导入清单或切换平台。</div></div>';
  return `<div class="competitor-table">${items.map(item => `<article class="competitor-row">
    <div class="competitor-product">${thumb(item.thumb)}<div class="competitor-product-copy"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.brand)} · ${escapeHtml(item.id)}</span><div class="competitor-tags">${item.tags.map(tag => `<i>${escapeHtml(tag)}</i>`).join('')}</div></div></div>
    <div class="competitor-platform">${platformTag(item.platform)}<span>${escapeHtml(item.observedAt)} 快照</span></div>
    <div class="competitor-price"><strong class="${Number.isFinite(item.price) ? '' : 'unverified-price'}">${displayCompetitorPrice(item.price)}</strong>${Number.isFinite(item.price) ? priceChange(item.change) : '<span class="price-change flat">未提供展示价格</span>'}</div>
    <div class="competitor-sales"><strong>${item.sales}</strong><span>评价 ${item.rating}</span></div>
    <div class="competitor-action">${competitorStatus(item.status)}<button class="row-action" data-competitor-detail="${escapeHtml(item.id)}">查看快照</button></div>
  </article>`).join('')}</div>`;
}

function competitorPriceChart() {
  return `<svg class="competitor-chart" viewBox="0 0 650 216" preserveAspectRatio="none" role="img" aria-label="防晒品类近 14 天价格轨迹">
    <line class="grid" x1="32" y1="28" x2="638" y2="28"/><line class="grid" x1="32" y1="76" x2="638" y2="76"/><line class="grid" x1="32" y1="124" x2="638" y2="124"/><line class="grid" x1="32" y1="172" x2="638" y2="172"/>
    <text class="axis-label" x="0" y="31">¥129</text><text class="axis-label" x="0" y="79">¥109</text><text class="axis-label" x="0" y="127">¥89</text><text class="axis-label" x="0" y="175">¥69</text>
    <path class="competitor-line own" d="M32 66 L80 64 L127 66 L174 62 L220 64 L267 60 L315 61 L362 57 L409 57 L456 54 L504 54 L551 53 L598 52 L638 50"/>
    <path class="competitor-line rival-a" d="M32 48 L80 48 L127 47 L174 48 L220 47 L267 48 L315 82 L362 83 L409 84 L456 85 L504 84 L551 83 L598 84 L638 84"/>
    <path class="competitor-line rival-b" d="M32 117 L80 118 L127 117 L174 115 L220 117 L267 117 L315 116 L362 115 L409 116 L456 116 L504 115 L551 116 L598 114 L638 115"/>
    <circle class="chart-end own" cx="638" cy="50" r="3.7"/><circle class="chart-end rival-a" cx="638" cy="84" r="3.7"/><circle class="chart-end rival-b" cx="638" cy="115" r="3.7"/>
    <text class="axis-label" x="32" y="200">8/29</text><text class="axis-label" x="185" y="200">9/02</text><text class="axis-label" x="338" y="200">9/06</text><text class="axis-label" x="491" y="200">9/10</text><text class="axis-label" x="615" y="200">今天</text>
  </svg>`;
}

function renderCompetitors() {
  const items = STATE.platform === 'all' ? STATE.competitors : STATE.competitors.filter(item => item.platform === STATE.platform);
  const biggestDrop = STATE.competitors.reduce((current, item) => item.change < current.change ? item : current, STATE.competitors[0]);
  return `${titleBlock('competitors')}
  <section class="competitor-disclaimer"><span class="competitor-disclaimer-mark">◉</span><span><strong>演示监测模式</strong>：当前卡片来自本地样例快照。正式接入应显示数据来源、抓取/同步时间、可访问范围与平台授权状态，不能将推断当作实时竞品事实。</span><button class="text-link" data-open-modal="competitor-import">配置数据源 →</button></section>
  <section class="metric-grid competitor-metrics">
    ${metricCard('监测竞品', String(items.length), '3 个本周新增', 'violet', 'M2 19 10 16 17 17 25 10 34 13 43 7 55 6')}
    ${metricCard('价格变动', '6', '2 个值得跟进', 'orange', 'M2 7 11 10 19 8 26 12 34 13 43 17 55 18', true)}
    ${metricCard('活动与内容更新', '3', '近 24 小时', 'mint', 'M2 16 10 14 17 11 26 12 35 6 44 8 55 4')}
    ${metricCard('可验证机会', '4', '建议人工复核', 'blue', 'M2 18 10 16 18 13 26 12 34 9 43 9 55 5')}
  </section>
  <section class="competitor-layout">
    <article class="card competitor-radar-card"><div class="card-pad"><div class="card-header"><div><h2 class="card-title">价格与活动雷达</h2><p class="card-subtitle">相同/近似商品的公开展示信息对比；价格趋势需结合规格、赠品、券后价和运费解读。</p></div>${platformFilter()}</div><div class="competitor-legend"><span><i class="own"></i>我们的防晒霜 ¥119</span><span><i class="rival-a"></i>森呼吸 ¥109</span><span><i class="rival-b"></i>同类低价带 ¥79</span></div>${competitorPriceChart()}</div><div class="competitor-chart-footer"><span>最后更新：今天 09:18 · 本地演示数据</span><button class="text-link" data-toast="价格轨迹已标记为待验证，尚未生成任何改价建议">查看比较规则</button></div></article>
    <aside class="card competitor-watch-card card-pad"><div class="card-header"><div><h2 class="card-title">今日需要关注</h2><p class="card-subtitle">从变动中筛出可复核事项</p></div><span class="watch-count">3</span></div><div class="watch-list"><div class="watch-item"><span class="watch-icon orange">↓</span><div><strong>${escapeHtml(biggestDrop.name)}</strong><span>券后/标价出现下调，先核对规格与活动机制。</span></div><button class="text-link" data-competitor-detail="${escapeHtml(biggestDrop.id)}">快照</button></div><div class="watch-item"><span class="watch-icon violet">✦</span><div><strong>洁面品类出现新内容结构</strong><span>竞品新增“成分解释 + 使用步骤”模块，可作为内容调研线索。</span></div><button class="text-link" data-open-modal="competitor">记录</button></div><div class="watch-item"><span class="watch-icon mint">⌁</span><div><strong>保温杯价带保持稳定</strong><span>当前差异主要来自材质、容量和售后承诺，不建议仅因标价跟随。</span></div><button class="text-link" data-toast="已加入保温杯的观察说明">标记</button></div></div></aside>
  </section>
  <section class="card competitor-list-card"><div class="table-toolbar"><div><h2>竞品监测清单</h2><p class="card-subtitle">共 ${items.length} 个当前可见商品 · 按平台、类目或自定义标签建立监测组</p></div><div class="search-box">⌕<input id="competitor-search" placeholder="搜索竞品、店铺或标签" /></div><button class="text-link" data-open-modal="competitor">＋ 添加</button></div>${competitorTable(items)}</section>
  <section class="competitor-opportunity-grid"><article class="card opportunity-card"><div class="opportunity-icon violet">⌁</div><div><span class="eyebrow">价格机会</span><h3>防晒霜价带出现 ¥10 下探</h3><p>先比对规格、赠品、优惠券与评价样本，再决定是否建立价格模拟任务。</p><button class="text-link" data-open-modal="task">创建复核任务 →</button></div></article><article class="card opportunity-card"><div class="opportunity-icon mint">✦</div><div><span class="eyebrow">内容机会</span><h3>眼罩竞品强调「礼盒感」与送礼场景</h3><p>可在不复制竞品素材的前提下，为自己的详情页建立差异化故事板。</p><button class="text-link" data-view-link="content">进入内容工坊 →</button></div></article><article class="card opportunity-card"><div class="opportunity-icon orange">✓</div><div><span class="eyebrow">监测规则</span><h3>每个判断都需要保留来源和时间</h3><p>把公开页面快照、价格构成、规格和人工结论一起保存，避免错误跟价。</p><button class="text-link" data-open-modal="competitor-import">管理数据源 →</button></div></article></section>`;
}

function renderIntegrations() {
  const statusText = { online: '已启用', pending: '待连接', offline: '未启用' };
  return `${titleBlock('integrations')}<section class="card view-card" style="margin-bottom:16px"><h2>真实店铺 API 接入</h2><p>在店铺接口页登记店铺、查看服务端配置状态并同步官方数据。下方保留原型连接说明。</p><button class="button primary" data-view-link="stores">进入店铺接口 →</button></section>
  <section class="view-grid"><article class="card view-card"><div class="card-header"><div><h2>数据连接器</h2><p class="card-subtitle">默认只读。真实的订单、商品、库存等写入能力取决于平台 AppKey、权限范围和店铺授权。</p></div><span class="status-tag watch">3 个待授权</span></div><div class="integration-list">${STATE.integrations.map(integration => `<div class="integration-row"><span class="platform-logo ${integration.type === 'csv' ? 'taobao' : integration.type}">${integration.abbreviation}</span><span class="integration-status ${integration.status === 'online' ? '' : integration.status === 'offline' ? 'offline' : 'pending'}"></span><div class="integration-copy"><strong>${integration.name}</strong><span>${integration.description}</span></div><span class="status-tag ${integration.status === 'online' ? 'good' : 'watch'}">${statusText[integration.status]}</span><button class="button small" data-connect="${integration.key}">${integration.status === 'online' ? '管理' : '开始配置'}</button></div>`).join('')}</div></article><aside class="card view-card"><h2>安全接入原则</h2><p>工作台不会用演示数据伪装成平台同步；授权边界会明确呈现。</p><div class="settings-list"><div class="setting-row"><span class="setting-icon">1</span><div class="setting-copy"><strong>最小权限</strong><span>按需申请商品、订单、库存、物流等 scope。</span></div></div><div class="setting-row"><span class="setting-icon">2</span><div class="setting-copy"><strong>先只读，后写入</strong><span>先验证数据读取和差异预览，再开放有副作用操作。</span></div></div><div class="setting-row"><span class="setting-icon">3</span><div class="setting-copy"><strong>审计与重试</strong><span>记录请求、结果、失败原因和幂等标识。</span></div></div></div></aside></section>
  <section class="section-grid" style="margin-top:15px"><article class="card feature-card"><span class="feature-icon">⇩</span><h3>先从文件导入开始</h3><p>支持把现有报表作为本地数据源，验证字段映射和经营看板。</p><button class="text-link" data-open-modal="import">导入 CSV →</button></article><article class="card feature-card mint-bg"><span class="feature-icon">⟁</span><h3>统一适配器层</h3><p>淘宝、拼多多、京东各自保留协议差异，但输出统一的业务对象。</p><button class="text-link" data-toast="适配器设计已写入 README">查看架构 →</button></article><article class="card feature-card orange-bg"><span class="feature-icon">✓</span><h3>写入操作审批</h3><p>上架、改价、发货等动作必须经过预览、确认和结果回执。</p><button class="text-link" data-view-link="tasks">进入审批队列 →</button></article></section>`;
}

function renderSettings() {
  return `${titleBlock('settings')}
  <section class="view-grid"><article class="card view-card"><div class="card-header"><div><h2>智能例行任务</h2><p class="card-subtitle">借鉴成熟店铺运营 SOP，但默认不连接真实平台，也不会自动执行外部写入。</p></div><span class="status-tag good">${STATE.routines.filter(routine => routine.active).length} 个已启用</span></div><div class="settings-list">${STATE.routines.map((routine, index) => `<div class="setting-row"><span class="setting-icon">${routine.icon}</span><div class="setting-copy"><strong>${routine.title}</strong><span>${routine.description}</span></div><button class="switch ${routine.active ? 'on' : ''}" data-routine="${index}" aria-label="切换 ${routine.title}"></button></div>`).join('')}</div></article><aside class="card view-card"><h2>经营规则</h2><p>以“可解释、可确认”为默认，不让智能建议越过你的业务边界。</p><div class="settings-list"><div class="setting-row"><span class="setting-icon">¥</span><div class="setting-copy"><strong>最低毛利预警</strong><span>默认阈值：15%</span></div><button class="text-link" data-toast="毛利阈值设置功能已预留">修改</button></div><div class="setting-row"><span class="setting-icon">▣</span><div class="setting-copy"><strong>库存安全天数</strong><span>默认阈值：7 天</span></div><button class="text-link" data-toast="库存阈值设置功能已预留">修改</button></div><div class="setting-row"><span class="setting-icon">✓</span><div class="setting-copy"><strong>需要人工审批</strong><span>改价、上架、发布、发货等</span></div><button class="switch on" data-toast="该演示规则不可关闭"></button></div></div></aside></section>`;
}

function render() {
  if (STATE.view === 'stores') {
    viewCrumb.textContent = viewMeta.stores.title;
    document.querySelectorAll('.nav-item[data-view]').forEach(item => item.classList.toggle('active', item.dataset.view === STATE.view));
    StoreUI.mount(app);
    return;
  }
  if (typeof StoreUI !== 'undefined') StoreUI.unmount();
  const renderers = { dashboard: renderDashboard, products: renderProducts, campaigns: renderCampaigns, content: renderContent, orders: renderOrders, tasks: renderTasks, insights: renderInsights, competitors: renderCompetitors, integrations: renderIntegrations, settings: renderSettings };
  app.innerHTML = renderers[STATE.view]();
  viewCrumb.textContent = viewMeta[STATE.view].title;
  document.querySelectorAll('.nav-item[data-view]').forEach(item => item.classList.toggle('active', item.dataset.view === STATE.view));
  document.querySelector('[data-view="tasks"] .nav-count').textContent = STATE.tasks.filter(task => task.state !== 'done').length;
  document.querySelector('[data-view="competitors"] .nav-count').textContent = STATE.competitors.length;
  bindViewEvents();
}

function switchView(view) {
  if (!viewMeta[view]) return;
  STATE.view = view;
  document.querySelector('#sidebar').classList.remove('open');
  render();
}

function bindViewEvents() {
  app.querySelectorAll('[data-view-link]').forEach(button => button.addEventListener('click', () => switchView(button.dataset.viewLink)));
  app.querySelectorAll('[data-platform]').forEach(button => button.addEventListener('click', () => {
    STATE.platform = button.dataset.platform;
    render();
  }));
  app.querySelectorAll('[data-open-modal]').forEach(button => button.addEventListener('click', () => openModal(button.dataset.openModal)));
  app.querySelectorAll('[data-toast]').forEach(button => button.addEventListener('click', () => toast(button.dataset.toast)));
  app.querySelectorAll('[data-connect]').forEach(button => button.addEventListener('click', () => openModal(button.dataset.connect === 'csv' ? 'import' : 'connect', button.dataset.connect)));
  app.querySelectorAll('[data-competitor-detail]').forEach(button => button.addEventListener('click', () => openModal('competitor-detail', button.dataset.competitorDetail)));
  app.querySelectorAll('[data-routine]').forEach(button => button.addEventListener('click', () => {
    const routine = STATE.routines[Number(button.dataset.routine)];
    routine.active = !routine.active;
    render();
    toast(`${routine.title}已${routine.active ? '启用' : '暂停'}`);
  }));
  const dashboardSearch = app.querySelector('#dashboard-search');
  if (dashboardSearch) dashboardSearch.addEventListener('input', event => {
    const query = event.target.value.trim().toLowerCase();
    const productTableContainer = dashboardSearch.closest('.table-card');
    const match = filteredProducts().filter(product => `${product.name} ${escapeHtml(product.id)}`.toLowerCase().includes(query));
    const table = productTableContainer.querySelector('table');
    table.outerHTML = productTable(match, 'dashboard');
    productTableContainer.querySelectorAll('[data-toast]').forEach(button => button.addEventListener('click', () => toast(button.dataset.toast)));
  });
  const competitorSearch = app.querySelector('#competitor-search');
  if (competitorSearch) competitorSearch.addEventListener('input', event => {
    const query = event.target.value.trim().toLowerCase();
    const match = (STATE.platform === 'all' ? STATE.competitors : STATE.competitors.filter(item => item.platform === STATE.platform))
      .filter(item => `${item.name} ${item.brand} ${item.id} ${item.tags.join(' ')}`.toLowerCase().includes(query));
    const table = app.querySelector('.competitor-table');
    if (table) {
      table.outerHTML = competitorTable(match);
      app.querySelectorAll('.competitor-table [data-competitor-detail]').forEach(button => button.addEventListener('click', () => openModal('competitor-detail', button.dataset.competitorDetail)));
    }
  });
}

function toast(message) {
  const item = document.createElement('div');
  item.className = 'toast';
  item.innerHTML = `<i></i><span>${escapeHtml(message)}</span>`;
  toastStack.append(item);
  setTimeout(() => { item.classList.add('out'); setTimeout(() => item.remove(), 230); }, 3000);
}

function closeModal() {
  modalRoot.innerHTML = '';
  modalBackdrop.classList.remove('show');
  modalBackdrop.setAttribute('aria-hidden', 'true');
}

function modalFrame(title, subtitle, body, options = '') {
  return `<section class="modal ${options}" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}"><div class="modal-head"><div><h2>${title}</h2><p>${subtitle}</p></div><button class="icon-button modal-close" data-modal-close aria-label="关闭">×</button></div>${body}</section>`;
}

function openModal(kind, context = '') {
  let content = '';
  if (kind === 'task') content = taskModal();
  if (kind === 'product') content = productModal();
  if (kind === 'campaign') content = campaignModal();
  if (kind === 'creative') content = creativeModal();
  if (kind === 'import') content = importModal();
  if (kind === 'connect') content = connectModal(context);
  if (kind === 'mapping') content = mappingModal();
  if (kind === 'assistant') content = assistantModal();
  if (kind === 'competitor') content = competitorModal();
  if (kind === 'competitor-import') content = competitorImportModal();
  if (kind === 'competitor-detail') content = competitorDetailModal(context);
  modalRoot.innerHTML = content;
  modalBackdrop.classList.add('show');
  modalBackdrop.setAttribute('aria-hidden', 'false');
  bindModalEvents(kind, context);
}

function taskModal() {
  return modalFrame('新建运营任务', '任务会先进入待处理队列；如涉及改价、发布等外部动作，请在执行前单独审批。', `<form class="modal-form" id="task-form"><div class="field"><label for="task-title">任务名称</label><input id="task-title" required maxlength="70" placeholder="例如：核对防晒霜活动价与毛利" /></div><div class="form-row"><div class="field"><label for="task-platform">关联平台</label><select id="task-platform"><option value="tb">淘宝 / 天猫</option><option value="pd">拼多多</option><option value="jd">京东</option><option value="all">全渠道</option></select></div><div class="field"><label for="task-type">任务类型</label><select id="task-type"><option>运营跟进</option><option>库存补货</option><option>内容审核</option><option>活动审批</option><option>履约处理</option></select></div></div><div class="field"><label for="task-note">说明（选填）</label><input id="task-note" maxlength="100" placeholder="补充截止时间、证据链接或需要确认的事项" /></div><div class="modal-footer"><button type="button" class="button" data-modal-close>取消</button><button class="button primary" type="submit">创建任务</button></div></form>`);
}

function productModal() {
  return modalFrame('建立商品主数据', '先建立中性的商品事实，再映射到各个平台的标题、类目、规格与素材。', `<form class="modal-form" id="product-form"><div class="field"><label for="product-name">商品名称</label><input id="product-name" required maxlength="70" placeholder="例如：山茶花氨基酸洁面慕斯 150ml" /></div><div class="form-row"><div class="field"><label for="product-sku">内部 SKU</label><input id="product-sku" required maxlength="30" placeholder="例如：S-241001" /></div><div class="field"><label for="product-platform">首个映射平台</label><select id="product-platform"><option value="tb">淘宝 / 天猫</option><option value="pd">拼多多</option><option value="jd">京东</option></select></div></div><div class="modal-footer"><button type="button" class="button" data-modal-close>取消</button><button class="button primary" type="submit">保存草稿</button></div></form>`);
}

function campaignModal() {
  return modalFrame('创建活动计划', '此处保存活动草稿和利润预估，不会向任何平台写入价格或报名信息。', `<form class="modal-form" id="campaign-form"><div class="field"><label for="campaign-name">活动名称</label><input id="campaign-name" required maxlength="70" placeholder="例如：国庆焕新 · 洁面慕斯" /></div><div class="form-row"><div class="field"><label for="campaign-platform">平台</label><select id="campaign-platform"><option>淘宝 / 天猫</option><option>拼多多</option><option>京东</option></select></div><div class="field"><label for="campaign-budget">预算（元）</label><input id="campaign-budget" type="number" min="0" placeholder="5000" /></div></div><div class="field"><label for="campaign-price">预估活动价（元）</label><input id="campaign-price" type="number" min="0" step="0.01" placeholder="129.00" /></div><div class="modal-footer"><button type="button" class="button" data-modal-close>取消</button><button class="button primary" type="submit">保存活动计划</button></div></form>`);
}

function creativeModal() {
  return modalFrame('创建内容任务', '先生成策略与版式草稿。涉及功效、认证、对比、销量等声明时，请补充可验证的证据后再发布。', `<form class="modal-form" id="creative-form"><div class="field"><label for="creative-product">选择商品</label><select id="creative-product">${STATE.products.map(product => `<option value="${escapeHtml(product.id)}">${escapeHtml(product.name)}</option>`).join('')}</select></div><div class="form-row"><div class="field"><label for="creative-platform">目标平台</label><select id="creative-platform"><option>淘宝 / 天猫详情页</option><option>拼多多商品图</option><option>京东主图与详情页</option></select></div><div class="field"><label for="creative-output">素材套数</label><select id="creative-output"><option>5 张主图 + 8 屏详情页</option><option>5 张主图变体</option><option>商品种草图文 6 张</option></select></div></div><div class="field"><label for="creative-audience">目标人群与重点卖点</label><input id="creative-audience" maxlength="120" placeholder="例如：通勤肌、轻薄防晒、清爽不粘腻" /></div><div class="modal-footer"><button type="button" class="button" data-modal-close>取消</button><button class="button primary" type="submit">创建策略草稿</button></div></form>`);
}

function importModal() {
  return modalFrame('从本地文件导入', '支持 CSV 表格的演示导入：商品名称、SKU、平台、销量、库存、转化率。文件仅在此浏览器会话内读取。', `<form class="modal-form" id="import-form"><div class="field"><label for="import-file">选择 CSV 文件</label><input id="import-file" type="file" accept=".csv,text/csv" /></div><div class="field"><label for="import-type">导入类型</label><select id="import-type"><option value="products">商品与库存</option><option value="orders" disabled>订单与履约（暂未支持）</option><option value="metrics" disabled>经营指标（暂未支持）</option></select></div><div class="empty-row" id="import-preview">未选择文件。你也可以保留演示数据继续体验工作台。</div><div class="modal-footer"><button type="button" class="button" data-modal-close>取消</button><button class="button primary" type="submit">读取并预览</button></div></form>`);
}

function connectModal(context) {
  const preselect = context === 'pdd' ? 'pd' : context === 'jd' ? 'jd' : 'tb';
  return modalFrame('配置平台连接', '此原型不会收集或验证真实平台密钥。提交后只会在当前页面标记为“配置草稿”。', `<form class="modal-form" id="connect-form"><div class="platform-choose"><button type="button" class="platform-choice ${preselect === 'tb' ? 'selected' : ''}" data-choice="tb"><b>淘 宝 / 天 猫</b>商品、订单、库存</button><button type="button" class="platform-choice ${preselect === 'pd' ? 'selected' : ''}" data-choice="pd"><b>拼 多 多</b>商品、订单、物流</button><button type="button" class="platform-choice ${preselect === 'jd' ? 'selected' : ''}" data-choice="jd"><b>京 东</b>商品、订单、售后</button></div><input id="connect-choice" type="hidden" value="${preselect}" /><div class="field"><label for="connector-name">连接名称</label><input id="connector-name" value="${preselect === 'tb' ? '淘宝' : preselect === 'pd' ? '拼多多' : '京东'} 只读连接" maxlength="50" /></div><div class="field"><label for="connector-scope">拟申请权限</label><select id="connector-scope"><option>仅读取商品、库存、订单</option><option>读取商品、库存、订单和物流</option><option>后续评估写入权限（需审批）</option></select></div><div class="modal-footer"><button type="button" class="button" data-modal-close>取消</button><button class="button primary" type="submit">保存连接草稿</button></div></form>`, 'large');
}

function mappingModal() {
  return modalFrame('平台字段映射', '映射层让相同商品事实在各个平台采用不同标题、类目、规格和素材，而不复制三套真相。', `<div class="modal-form"><div class="settings-list"><div class="setting-row"><span class="platform-logo taobao">淘</span><div class="setting-copy"><strong>淘宝 / 天猫</strong><span>标题、类目、销售属性、图文详情、服务承诺</span></div><span class="status-tag watch">待配置</span></div><div class="setting-row"><span class="platform-logo pdd">拼</span><div class="setting-copy"><strong>拼多多</strong><span>商品标题、规格、轮播图、活动标签、发货规则</span></div><span class="status-tag watch">待配置</span></div><div class="setting-row"><span class="platform-logo jd">京</span><div class="setting-copy"><strong>京东</strong><span>商品信息、属性、主图、详情、售后与库存</span></div><span class="status-tag watch">待配置</span></div></div><div class="modal-footer"><button class="button" data-modal-close>关闭</button><button class="button primary" data-toast="字段映射编辑器已列入下一阶段">创建映射规则</button></div></div>`, 'large');
}

function assistantModal() {
  return modalFrame('小星智能助手', '演示助手只基于当前工作台中的示例数据回答，不会编造尚未同步的店铺事实。', `<div class="ai-conversation" id="ai-conversation"><div class="ai-bubble">你好，我可以帮你梳理经营优先级。当前演示数据里，建议优先处理真丝眼罩的低库存，以及防晒霜活动后的利润复盘。</div></div><form class="assistant-input" id="assistant-form"><input id="assistant-input" maxlength="100" placeholder="例如：今天最需要关注什么？" /><button class="button primary" type="submit">发送</button></form>`);
}

function competitorModal() {
  return modalFrame('添加竞品监测', '记录公开可见的竞品商品信息。不要录入非公开数据、个人信息，或把未经核验的页面信息当作事实。', `<form class="modal-form" id="competitor-form"><div class="field"><label for="competitor-name">竞品商品名称</label><input id="competitor-name" required maxlength="80" placeholder="例如：竞品防晒乳 SPF50+ 50g" /></div><div class="form-row"><div class="field"><label for="competitor-brand">店铺/品牌（选填）</label><input id="competitor-brand" maxlength="60" placeholder="例如：示例官方旗舰店" /></div><div class="field"><label for="competitor-platform">公开展示平台</label><select id="competitor-platform"><option value="tb">淘宝 / 天猫</option><option value="pd">拼多多</option><option value="jd">京东</option></select></div></div><div class="form-row"><div class="field"><label for="competitor-price">展示价格（元）</label><input id="competitor-price" type="number" min="0" step="0.01" required placeholder="109.00" /></div><div class="field"><label for="competitor-tag">监测标签</label><input id="competitor-tag" maxlength="36" placeholder="例如：防晒, 通勤" /></div></div><div class="field"><label for="competitor-note">观察备注（选填）</label><input id="competitor-note" maxlength="100" placeholder="说明规格、券后价、活动或需人工复核的内容" /></div><div class="modal-footer"><button type="button" class="button" data-modal-close>取消</button><button class="button primary" type="submit">保存监测草稿</button></div></form>`);
}

function competitorImportModal() {
  return modalFrame('导入竞品监测清单', '支持本地 CSV：商品名称、店铺/品牌、平台、价格、标签。文件只在此浏览器会话解析；不会执行外部抓取脚本。', `<form class="modal-form" id="competitor-import-form"><div class="field"><label for="competitor-import-file">选择 CSV 文件</label><input id="competitor-import-file" type="file" accept=".csv,text/csv" /></div><div class="field"><label for="competitor-import-mode">数据来源标记</label><select id="competitor-import-mode"><option>人工公开页面记录</option><option>已授权的只读连接器导出</option><option>内部选品调研表</option></select></div><div class="empty-row" id="competitor-import-preview">未选择文件。推荐先导入人工复核过的公开信息，再建立后续同步规则。</div><div class="modal-footer"><button type="button" class="button" data-modal-close>取消</button><button class="button primary" type="submit">读取并预览</button></div></form>`);
}

function competitorDetailModal(id) {
  const item = STATE.competitors.find(competitor => competitor.id === id);
  if (!item) return modalFrame('竞品快照', '未找到该竞品记录。', '<div class="modal-footer"><button class="button primary" data-modal-close>关闭</button></div>');
  return modalFrame('竞品快照', '该记录仅用于研究和人工判断；不代表实时价格、销量或平台官方数据。', `<div class="modal-form"><div class="competitor-detail-hero"><div class="competitor-product">${thumb(item.thumb)}<div class="competitor-product-copy"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.brand)} · ${escapeHtml(item.id)}</span><div class="competitor-tags">${item.tags.map(tag => `<i>${escapeHtml(tag)}</i>`).join('')}</div></div></div>${platformTag(item.platform)}</div><div class="snapshot-grid"><div><span>展示价格</span><strong class="${Number.isFinite(item.price) ? '' : 'unverified-price'}">${displayCompetitorPrice(item.price)}</strong></div><div><span>本次变化</span><strong>${Number.isFinite(item.price) ? (item.change ? `${item.change > 0 ? '↑' : '↓'} ¥${Math.abs(item.change).toFixed(0)}` : '稳定') : '待核验'}</strong></div><div><span>公开评价</span><strong>${item.rating}</strong></div><div><span>快照时间</span><strong>${item.observedAt}</strong></div></div><div class="snapshot-note"><strong>建议下一步</strong><span>核对相同规格、券后/到手价、赠品和运费后，再决定是否创建自己的价格或内容行动计划。</span></div><div class="modal-footer"><button class="button" data-modal-close>关闭</button><button class="button primary" data-open-modal="task">创建复核任务</button></div></div>`, 'large');
}

function bindModalEvents(kind, context) {
  modalRoot.querySelectorAll('[data-modal-close]').forEach(button => button.addEventListener('click', closeModal));
  modalRoot.querySelectorAll('[data-open-modal]').forEach(button => button.addEventListener('click', () => openModal(button.dataset.openModal)));
  const triggerToast = modalRoot.querySelector('[data-toast]');
  if (triggerToast) triggerToast.addEventListener('click', () => toast(triggerToast.dataset.toast));

  const taskForm = modalRoot.querySelector('#task-form');
  if (taskForm) taskForm.addEventListener('submit', event => {
    event.preventDefault();
    const title = taskForm.querySelector('#task-title').value.trim();
    const platform = taskForm.querySelector('#task-platform').value;
    const taskType = taskForm.querySelector('#task-type').value;
    if (!title) return;
    const platformTitle = platform === 'all' ? '全渠道' : PLATFORM[platform].long;
    STATE.tasks.unshift({ title, meta: `${platformTitle} · ${taskType}`, level: 'normal', state: 'todo' });
    STATE.taskCount += 1;
    closeModal(); render(); toast('任务已创建，等待运营人员处理');
  });

  const productForm = modalRoot.querySelector('#product-form');
  if (productForm) productForm.addEventListener('submit', event => {
    event.preventDefault();
    const name = productForm.querySelector('#product-name').value.trim();
    const id = productForm.querySelector('#product-sku').value.trim();
    const platform = productForm.querySelector('#product-platform').value;
    if (!name || !id) return;
    STATE.products.unshift({ id, name, platform, sales: 0, stock: 0, conversion: '—', status: 'watch', risk: '待完善', thumb: platform === 'pd' ? 'pink' : platform === 'jd' ? 'blue' : 'warm' });
    closeModal(); switchView('products'); toast('商品主数据草稿已创建');
  });

  const campaignForm = modalRoot.querySelector('#campaign-form');
  if (campaignForm) campaignForm.addEventListener('submit', event => {
    event.preventDefault();
    const name = campaignForm.querySelector('#campaign-name').value.trim();
    if (!name) return;
    STATE.tasks.unshift({ title: `审核活动计划：${name}`, meta: '营销活动 · 等待审批', level: 'normal', state: 'review' });
    STATE.taskCount += 1;
    closeModal(); switchView('tasks'); toast('活动计划已保存，并已送入审批队列');
  });

  const creativeForm = modalRoot.querySelector('#creative-form');
  if (creativeForm) creativeForm.addEventListener('submit', event => {
    event.preventDefault();
    const productName = creativeForm.querySelector('#creative-product').selectedOptions[0].textContent;
    STATE.tasks.unshift({ title: `审核内容策略：${productName}`, meta: '内容工坊 · 等待审核', level: 'normal', state: 'review' });
    STATE.taskCount += 1;
    closeModal(); switchView('content'); toast('内容策略草稿已创建，尚未调用任何图像或平台服务');
  });

  bindCsvImport('import', 'products');

  modalRoot.querySelectorAll('[data-choice]').forEach(choice => choice.addEventListener('click', () => {
    modalRoot.querySelectorAll('[data-choice]').forEach(item => item.classList.toggle('selected', item === choice));
    modalRoot.querySelector('#connect-choice').value = choice.dataset.choice;
  }));
  const connectForm = modalRoot.querySelector('#connect-form');
  if (connectForm) connectForm.addEventListener('submit', event => {
    event.preventDefault();
    const choice = modalRoot.querySelector('#connect-choice').value;
    const key = choice === 'tb' ? 'taobao' : choice === 'pd' ? 'pdd' : 'jd';
    const integration = STATE.integrations.find(item => item.key === key);
    if (integration) {
      integration.status = 'pending';
      integration.description = '配置草稿已保存 · 尚未提交凭证或请求平台接口';
    }
    closeModal(); switchView('integrations'); toast('连接草稿已保存；请在正式后端中完成 OAuth 与权限校验');
  });

  const assistantForm = modalRoot.querySelector('#assistant-form');
  if (assistantForm) assistantForm.addEventListener('submit', event => {
    event.preventDefault();
    const input = assistantForm.querySelector('#assistant-input');
    const question = input.value.trim();
    if (!question) return;
    const conversation = modalRoot.querySelector('#ai-conversation');
    conversation.insertAdjacentHTML('beforeend', `<div class="ai-bubble user">${escapeHtml(question)}</div>`);
    input.value = '';
    setTimeout(() => {
      conversation.insertAdjacentHTML('beforeend', `<div class="ai-bubble">基于当前演示数据：优先处理 <b>真丝眼罩低库存</b>（48 件）和 <b>洁面慕斯内容待审</b>。真实店铺结论需要先接入或导入订单、库存与费用数据。</div>`);
      conversation.scrollTop = conversation.scrollHeight;
    }, 350);
  });

  const competitorForm = modalRoot.querySelector('#competitor-form');
  if (competitorForm) competitorForm.addEventListener('submit', event => {
    event.preventDefault();
    const name = competitorForm.querySelector('#competitor-name').value.trim();
    const price = Number(competitorForm.querySelector('#competitor-price').value);
    if (!name || !Number.isFinite(price)) return;
    const platform = competitorForm.querySelector('#competitor-platform').value;
    const brand = competitorForm.querySelector('#competitor-brand').value.trim() || '未标注店铺';
    const tags = competitorForm.querySelector('#competitor-tag').value.split(/[,，]/).map(tag => tag.trim()).filter(Boolean).slice(0, 3);
    STATE.competitors.unshift({
      id: `C-${Date.now().toString().slice(-5)}`,
      name,
      brand,
      platform,
      price,
      change: 0,
      sales: '待核验',
      rating: '—',
      status: 'stable',
      observedAt: '刚刚添加',
      thumb: platform === 'pd' ? 'pink' : platform === 'jd' ? 'blue' : 'warm',
      tags: tags.length ? tags : ['待分类']
    });
    closeModal(); switchView('competitors'); toast('竞品监测草稿已保存，等待补充可靠来源与快照时间');
  });

  bindCsvImport('competitor-import', 'competitors');
}

function bindCsvImport(prefix, kind) {
  const form = modalRoot.querySelector('#' + prefix + '-form');
  if (!form) return;
  const input = form.querySelector('input[type="file"]');
  const preview = form.querySelector('#' + prefix + '-preview');
  const button = form.querySelector('button[type="submit"]');
  let prepared = null, revision = 0, busy = false;
  input.addEventListener('change', () => {
    revision++;
    prepared = null;
    button.textContent = '读取并预览';
    preview.textContent = input.files[0] ? '已选择 ' + input.files[0].name + '，点击读取并预览。' : '未选择文件。';
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    if (prepared) {
      const added = commitCsvRecords(prepared.records, kind);
      closeModal();
      switchView(kind === 'products' ? 'products' : 'competitors');
      toast('已导入 ' + added + ' 条记录；跳过 ' + prepared.errors.length + ' 条问题记录');
      return;
    }
    const file = input.files[0];
    if (!file) { toast('请先选择一个 CSV 文件'); return; }
    if (file.size > 5 * 1024 * 1024) { preview.textContent = '文件不能超过 5 MB，请拆分后导入。'; return; }
    const currentRevision = revision;
    busy = true;
    button.disabled = true;
    try {
      const text = await file.text();
      if (!form.isConnected || revision !== currentRevision) return;
      prepared = CommerceCsv.prepare(text, kind, STATE[kind].map(item => item.id));
      const issues = prepared.errors.slice(0, 8).map(error => '<li>第 ' + error.line + ' 行：' + escapeHtml(error.message) + '</li>').join('');
      const sample = prepared.records.slice(0, 5).map(item => '<li>' + escapeHtml(item.name) + ' · ' + PLATFORM[item.platform].label + ' · ' + (kind === 'competitors' ? displayCompetitorPrice(item.price) : '库存 ' + (item.stock ?? '待核验')) + '</li>').join('');
      preview.innerHTML = '<strong>共 ' + prepared.total + ' 条，可导入 ' + prepared.records.length + ' 条，问题 ' + prepared.errors.length + ' 条</strong>' +
        (sample ? '<p>数据预览（前 5 条）</p><ul>' + sample + '</ul>' : '') +
        (issues ? '<p>以下问题行将跳过，请修改原文件后重选：</p><ul>' + issues + '</ul>' + (prepared.errors.length > 8 ? '<p>仅显示前 8 条问题。</p>' : '') : '') +
        '<p>确认前不会更改清单。缺失数值保留为待核验。</p>';
      button.textContent = '确认导入 ' + prepared.records.length + ' 条';
      if (!prepared.records.length) { prepared = null; button.textContent = '重新读取'; }
    } catch (error) {
      prepared = null;
      preview.textContent = '未导入：' + error.message;
    } finally {
      busy = false;
      button.disabled = false;
    }
  });
}

function commitCsvRecords(records, kind) {
  let added = 0;
  for (const record of records) {
    const id = record.id || (kind === 'products' ? 'IMPORT-' : 'C-IMPORT-') + crypto.randomUUID();
    if (STATE[kind].some(item => item.id === id)) continue;
    const thumb = record.platform === 'pd' ? 'pink' : record.platform === 'jd' ? 'blue' : 'warm';
    STATE[kind].unshift(kind === 'products'
      ? { ...record, id, thumb, status: 'watch', risk: '导入待核验' }
      : { ...record, id, thumb, change: 0, sales: '待核验', rating: '—', status: 'stable', observedAt: '导入待核验' });
    added++;
  }
  return added;
}

document.querySelectorAll('.nav-item[data-view]').forEach(item => item.addEventListener('click', () => switchView(item.dataset.view)));
document.querySelectorAll('.topbar [data-toast], .sidebar [data-toast]').forEach(button => button.addEventListener('click', () => toast(button.dataset.toast)));
document.querySelectorAll('.sidebar [data-open-modal]').forEach(button => button.addEventListener('click', () => openModal(button.dataset.openModal)));
document.querySelector('#mobile-menu').addEventListener('click', () => document.querySelector('#sidebar').classList.toggle('open'));
modalBackdrop.addEventListener('click', closeModal);
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeModal(); });

render();
