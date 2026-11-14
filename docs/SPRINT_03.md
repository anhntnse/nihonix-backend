# Sprint 03 rollout

Implemented locally: level counts, complete versioned topic bundles, Admin-only catalog mutations and public app configuration. Canonical contract/report are in the sibling Android repository docs/contracts/sprint-03-api.md and docs/sprints/sprint-03-report.md.

Verification: npm run build; npm test -- --runInBand (40 tests); npm run test:sprint03 (real local PostgreSQL in a unique temporary schema, fake mail/media, no AI calls).

Environment:
- APP_MAINTENANCE=true/false (default false)
- APP_MAINTENANCE_MESSAGE (returned length capped at 500)
- APP_MIN_VERSION_CODE positive integer (default 1)
- APP_UPDATE_URL HTTPS destination without credentials (default Play package URL; verify real listing)
- APP_CONFIG_TTL_SECONDS integer 60–86400 (default 3600)

No Sprint 03 migration is required; apply reviewed Sprint 02 migration first if pending. Deploy/restart matching backend, verify public GET app/config and health, counts/bundles, maintenance/version behavior and Admin write rejection. Existing public catalog reads remain; do not infer a new guest app flow. No shared migration/seeding or server restart was performed by this sprint.
