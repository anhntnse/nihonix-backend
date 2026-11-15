# Sprint 06 — Private flashcards

Implemented and locally verified on2026-11-15. Backend build,71 Jest tests and isolated PostgreSQL/HTTP Sprint04/05/06 fixtures pass. Large delta snapshots are byte-budgeted in PostgreSQL. Android114 unit/45 ordinary instrumented tests, both same-APK process-restart fixtures and lint/debug/release packaging pass. Android canonical documentation: ../Nihonix/docs/contracts/sprint-06-api.md and ../Nihonix/docs/sprints/sprint-06-report.md.

- Existing folder/set/bulk routes now enforce owner chains and delegate to one transactional writer.
- POST /api/flashcards/sync/batch and GET /api/flashcards/sync/changes add immutable UUID receipts, payload hashes, CAS versions, dependencies and deletion heads.
- Folder child writes bump the parent version; stale folder deletion conflicts. Bulk validation and conditional upserts prevent foreign-parent writes, including concurrent fresh UUID collisions.
- Migration1794786400000 adds nullable folder ownership and sync tables; legacy unowned rows are preserved and hidden. Account deletion cascades owned records/receipts/heads.
- JSON limit8MiB under /api/flashcards only; ordinary routes retain100KiB. No SMTP configuration or new AI provider/quota integration.
- npm run test:sprint06 uses a temporary local PostgreSQL schema, real JWT HTTP flows and stubbed email/AI. Tests migration preservation, isolation, bulk rollback, receipt replay, concurrency, cascades, cursor paging, large Japanese payloads and413.
- Shared migration/deployment and real HTTPS/multi-device acceptance remain pending. DATABASE_SYNCHRONIZE=true was pre-existing locally; a development watcher may synchronize entities automatically. No manual shared-schema migration was run.
- User subsequently authorized separate schema/contracts, API/ownership and documentation commits, then push on the existing main branch. Deployment remains separate.
