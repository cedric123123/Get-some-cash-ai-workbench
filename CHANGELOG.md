# Changelog

All notable changes to this project are documented here.

## [1.0.1] - 2026-09-11

### Store API foundation

- Add a dedicated store API page with registration, credential readiness, manual synchronization and paginated records.
- Persist store metadata and snapshots atomically under the ignored `.data` directory, isolated by store ID.
- Implement a signed Taobao read-only adapter for shop identity, on-sale products and a bounded seven-day order window; live authorization testing is still required.
- Preserve platform IDs, keep prior snapshots after failed jobs and recover interrupted jobs after restart.
- Restrict local API requests by Host/Origin and require a session token for writes.
- Keep Pinduoduo and JD visibly unavailable until official endpoint details are verified; do not substitute demo data.

### Fixed

- Parse quoted CSV fields, embedded newlines, escaped quotes and BOM correctly.
- Validate platforms, prices, inventory and conversion rates; preserve missing numeric values and report duplicate IDs and invalid rows.
- Preview valid records and row errors before confirming a local import; disable unsupported order/metric imports.
- Restore competitor search after empty results and retain product actions after searching.
- Escape imported fields and identifiers in generated HTML.
- Handle malformed request paths without crashing; limit static responses to public application assets.
- Derive task/competitor navigation counts from current records.

### Added

- Dependency-free regression tests: run `npm test`.

## [1.0.0] - 2026-09-11

### Added

- A local-first AI e-commerce operations workbench for Taobao, Pinduoduo and JD sellers.
- Business overview, product and inventory, campaigns, content studio, orders and fulfillment, tasks and approvals, insights, integrations, and settings modules.
- Competitor monitoring with public-information snapshots, price/activity/content signals, opportunity cards, local CSV import, and manual review flows.
- Bilingual project introduction, local launch script, and V1.0.0 release package.

### Safety boundaries

- Built-in figures are demo data until a user imports data or configures an authorized connector.
- No platform credentials, cookies, browser login state, or write operations are collected or executed by this V1.0.0 prototype.
