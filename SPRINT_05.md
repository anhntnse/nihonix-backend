# Sprint 05 — Offline content and progress

Implemented locally, 2026-11-15. Android documentation: ../Nihonix/docs/contracts/sprint-05-api.md and docs/sprints/sprint-05-report.md.

Changes: complete six-kind catalog manifest; public GET ETag/304; successful legacy entity-sync response; authenticated progress batch/changes/summary; persistent idempotency receipts, account-row serialization and timestamp/UUID LWW.

Migration: src/database/migrations/1794700000000-OfflineProgress.ts. Creates learning_progress and progress_receipts, with user cascade deletion. Existing migration runner discovers it. No manual shared-schema migration/deployment was run by this task. Existing local development configuration has DATABASE_SYNCHRONIZE=true, so an already-running development watcher/restart can automatically synchronize the new entity tables; this is distinct from the controlled migration fixtures. Migration rollback drops progress/receipts, so preserve data before operational rollback.

Run npm run build, npm test -- --runInBand, npm run test:sprint04 and npm run test:sprint05. Integration scripts require local PostgreSQL and create/drop only unique temporary schemas. SMTP/AI/media calls are absent/stubbed.

Client sends X-Nihonix-Account with protected sync requests; mismatch with JWT owner returns409. Never accept user_id from request body. Receipts retain account lifetime; changing retention needs a full-resync protocol. Unknown catalog items/future clocks are durable per-item rejections; same mutation+same payload replays exact outcome, changed payload returns409. Batch validation limits50, delta limit100, account-ordered versions use decimal strings.

Shared rollout, HTTPS release endpoint, real device background/Doze and multi-device acceptance remain release gates. After implementation review, the user authorized grouped commits and push to the current repository branches; deployment remains separate.
