# Sprint07 — AI quota and practice handoff

Implemented2026-11-15. Local verification passed: backend build/Jest84 (14 suites), isolated PostgreSQL Sprint05/06/07 fixtures; Android unit/full ordinary instrumented suite,3 same-APK restart fixtures and lint/debug/release packaging. Configured-provider/shared rollout remains open.

Reuses NestJS/TypeORM/PostgreSQL and existing Gemini configuration. Daily defaults: flashcards2, shared fill_blank/multiple_choice3, max15 items, reset00:00 Asia/Ho_Chi_Minh. Optional AI_FLASHCARDS_DAILY_LIMIT/AI_PRACTICE_DAILY_LIMIT integer0–100. Configured metadata checks key presence; it does not call a provider.

Authenticated GET /api/ai/quota, GET /api/ai/requests/:id and POST /api/ai/requests/:id/cancel expose the durable request ledger. Generation reserves under user lock, performs one bounded attempt outside the lock, then atomically persists validated results and success. Identical UUID/payload replays; failed/cancelled/expired work does not consume successful allowance. Maximum2 unfinished calls/account includes cancelled workers until exit/lease expiry. Logs retain safe IDs/codes only.

Existing /api/practice/fill-blank and /multiple-choice generate strict owner-private sessions. /practice/sets now returns bounded pages; detail omits answers before completion. /practice/submit atomically grades, writes a receipt and one completion event. No automatic learned-status change, streak aggregation or inferred duration. Legacy completed rows keep stored exercise results and may have no new receipt.

POST /api/flashcards/generate now returns a preview request snapshot, rather than saving a set. Explicit save uses Sprint06 writer/sync. This is an intentional legacy response/behavior change; native had no prior generation caller.

Migration1794872800000 adds ai_generation_requests, practice_submissions and practice_completion_events, preserving existing sessions/exercises. Down drops new metadata and is not a safe production quota rollback. No manual shared migration/deployment performed. Existing development synchronize=true may update a running local watcher.

Verification commands, sequential:
- npm run build
- npm test -- --runInBand
- npm run test:sprint05
- npm run test:sprint06
- npm run test:sprint07

Sprint07 fixture uses temporary local PostgreSQL schema, real JWT HTTP, deterministic provider/mail, and cleanup. Covers reservation concurrency/replay/refund, cancellation/expiry/midnight, malformed output, private previews, grading/replay, rollback, ownership and migration. Fresh review reproduced cancelled failed-worker lease retention and legacy completed-result display; backend slot release and native read-only fallback fix these.

Full native API/plan/report are in sibling Nihonix/docs/contracts/sprint-07-api.md and docs/sprints/. Remaining rollout: configured Gemini key/model acceptance, shared migration/HTTPS, physical/cross-device/background checks. Receipt/cache compaction and minor request-alias/freshness/recovery follow-ups are documented in the contract. No SMTP/provider credential/model changes and no real provider calls in fixtures.
