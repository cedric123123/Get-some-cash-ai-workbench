# Gaoqian Office — AI E-commerce Operations Workbench

> **V1.0.1** · A local-first workbench for Taobao/Tmall, Pinduoduo, and JD sellers.

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

The new store API page persists registered stores and synchronized data in the backend. The Taobao read-only connector is implemented but requires an approved application and a valid merchant token; it has not been tested against a live store. Pinduoduo and JD are explicitly unavailable pending endpoint verification. Credentials are supplied only through server environment variables. The original dashboard, tasks and CSV views remain a separate in-memory demo. No marketplace write operations are implemented. See [setup and scope](docs/api-setup.md).

## Quick start

V1.0.1 adds a two-step CSV import: preview valid records and row errors, then confirm. It supports quoted commas, multiline fields, escaped quotes and UTF-8 BOM. Invalid numbers, unknown platforms and duplicate IDs are reported instead of silently rewritten. Missing quantities remain unknown. Files must be UTF-8 CSV and no larger than 5 MB. Only product and competitor imports are implemented; order, metric and XLSX imports are not supported yet. Data still resets on page reload.

Run regression tests with `npm test`.

Node.js 18+ is required.

```bash
git clone https://github.com/cedric123123/gaoqian-ai-ecommerce-ops-workbench.git
cd gaoqian-ai-ecommerce-ops-workbench
npm start
```

Then open [http://127.0.0.1:4173](http://127.0.0.1:4173). On Windows, you can also double-click `启动工作台.cmd`.

## Welcome to try and evaluate

You are warmly welcome to try V1.0.1 and share practical feedback. Useful evaluation topics include:

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

See [CHANGELOG.md](CHANGELOG.md) for V1.0.1 notes.
