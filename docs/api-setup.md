# 官方接口开发版使用说明

当前版本：1.0.1。支持本机单用户运行，不应直接暴露到公网。

## 已实现

- 「店铺接口」页登记店铺，并按店铺 ID 分别保存商品和订单缓存。
- 店铺、查询范围、同步结果保存到 `.data/workspace.json`，刷新页面和重启服务后仍保留。写入通过临时文件和重命名完成。
- 淘宝 / 天猫：已实现 `taobao.shop.seller.get`、`taobao.items.onsale.get`、`taobao.trades.sold.get` 的签名与服务端查询。
- 查询覆盖在售商品和最近 7 天创建的默认类型订单；商品库存为商品级数量，不是完整仓库库存或 SKU 明细。
- 手动同步、分页查询、重复同步互斥、失败保留旧缓存；重启后的中断任务标为失败。
- 64 位平台 ID 保留为字符串。只保存业务所需字段，不采集收件地址、电话或买家昵称。

## 暂未实现

- 拼多多和京东的具体业务连接器：官方参数与当前应用权限仍待核验。
- 内置 OAuth 授权回调与自动刷新 token；本版使用商家已获得的有效 token。
- 自动定时同步、增量游标、限流重试和全量历史回补。每次同步最多读取每类列表 100 页，超限报错且保留旧缓存。
- 广告、访客、转化率、售后、SKU 明细及平台写入。
- 原演示区的任务和 CSV 数据持久化。真实接口数据目前在「店铺接口」单独查看。

## 淘宝配置

先在官方开发者平台取得获批应用和店铺授权：[店铺 API](https://developer.alibaba.com/docs/api.htm?apiId=42908)、[商品 API](https://developer.alibaba.com/docs/api.htm?apiId=18)、[交易 API](https://developer.alibaba.com/docs/api.htm?apiId=46)、[签名说明](https://developer.alibaba.com/docs/doc.htm?articleId=101617&docType=1&treeId=1)。文档存在不代表应用已获权限。

1. 启动 `npm start`，进入「店铺接口」，填写店铺名称、平台和配置代号，例如 `MAIN_TAOBAO`。
2. 可填写平台店铺 ID，用于检查授权是否指向正确店铺；留空时首次成功同步后绑定，后续同步会核对该 ID。
3. 停止服务，在启动服务的终端中配置以下环境变量，再启动。本程序不自动读取 `.env` 文件。

```powershell
$env:GAOQIAN_MAIN_TAOBAO_APP_KEY = '<应用 AppKey>'
$env:GAOQIAN_MAIN_TAOBAO_APP_SECRET = '<应用 AppSecret>'
$env:GAOQIAN_MAIN_TAOBAO_ACCESS_TOKEN = '<有效店铺授权 Token>'
npm start
```

请仅在本机配置实际值，不提交到仓库或发到聊天中。前端只显示是否已配置，不会返回上述值。多店铺使用不同配置代号；token 失效时在服务端更换并重启。

4. 点击「同步官方数据」。首次同步成功后，查看商品、商品库存和订单页；失败时按状态提示检查权限、有效期与网络。

当前服务端请求使用 Node 原生 fetch，不自动继承 Windows 浏览器代理。若浏览器能访问而同步超时，应检查运行 Node 的网络环境；不要关闭 TLS 校验。

## 本地 API

- `GET /api/session`：本机会话令牌与平台能力状态。
- `GET /api/stores`：店铺列表、配置状态、同步摘要。
- `POST /api/stores`：登记店铺。参数：`name`、`platform`（tb/pd/jd）、`credentialRef`、可选 `remoteShopId`。
- `POST /api/stores/:id/sync`：启动只读平台同步，返回 202；重复启动返回 409。
- `GET /api/stores/:id/products?page=1`、`orders`、`inventory`：每页 50 条。
- `GET /api/stores/:id/sync-status`：最后成功时间、错误与数据范围。

写请求须使用 JSON 和 `X-Workspace-Token`；前端自动取得令牌。服务仅允许本机 Host 与同源访问，不支持多用户身份或公网部署。

## 数据备份与验证

停止服务后复制 `.data` 目录即可备份。恢复前保留当前文件副本；不要将真实店铺数据上传到 GitHub。可用 `GAOQIAN_DATA_DIR` 指定其他本机数据目录。

运行 `npm test` 可验证签名、平台 ID 精度、分页、店铺隔离、重启恢复与异常处理。测试使用隔离目录和模拟平台响应，不使用真实凭证或访问店铺。
