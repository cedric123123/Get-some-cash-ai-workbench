# Gaoqian Office — AI E-commerce Operations Workbench

> **V1.0.0** · A local-first workbench for Taobao/Tmall, Pinduoduo, and JD sellers.

[简体中文](README.md)

## What it does

Gaoqian Office brings the daily operating surface of a Chinese e-commerce business into one workspace:

- Business overview for GMV, orders, conversion, ROI, channel health, and product signals.
- Unified product and inventory concepts across Taobao/Tmall, Pinduoduo, and JD.
- Campaign planning, price and margin checks, and approval-ready task flows.
- Content studio for product facts, selling points, visual plans, and compliance review.
- Order, fulfillment, after-sales, and SLA risk views.
- Competitor monitoring through timestamped public-information snapshots, price/activity/content signals, local CSV import, and human review tasks.
- Connector status and a clear path toward read-only, officially authorized integrations.

## Important boundary

V1.0.0 is an interactive local prototype with demo data and local CSV parsing. It does not call Taobao, Pinduoduo, or JD APIs; it does not collect credentials or cookies; and it never changes prices, listings, orders, or any other external platform data.

## Quick start

Node.js 18+ is required.

```bash
git clone https://github.com/cedric123123/gaoqian-ai-ecommerce-ops-workbench.git
cd gaoqian-ai-ecommerce-ops-workbench
npm start
```

Then open [http://127.0.0.1:4173](http://127.0.0.1:4173). On Windows, you can also double-click `启动工作台.cmd`.

## Welcome to try and evaluate

You are warmly welcome to try V1.0.0 and share practical feedback. Useful evaluation topics include:

1. Whether the main operating flow fits your store's daily workflow.
2. Which data-import fields, product mappings, or competitor-monitoring views are missing.
3. What should be prioritized before official, read-only platform integrations are added.
4. Any usability issue, confusing wording, visual defect, or incorrect assumption.

Please use [GitHub Issues](https://github.com/cedric123123/gaoqian-ai-ecommerce-ops-workbench/issues) for reproducible problems and feature ideas. Never include platform passwords, cookies, API tokens, private customer details, or screenshots containing sensitive data.

## Roadmap

- CSV/XLSX field mapping, validation, import history, and rollback.
- SQLite/PostgreSQL-backed product, task, approval, import, and audit records.
- Server-side, least-privilege, read-only official connectors.
- Reviewable action plans before any potential platform write operation.

## Version

See [CHANGELOG.md](CHANGELOG.md) for V1.0.0 notes.
