# Sprint 02 rollout

Account/profile changes are implemented and locally tested on 2026-11-14. Build, 27 unit tests and npm run test:sprint02 passed. The integration harness creates/removes a unique local PostgreSQL schema and fakes mail/media providers.

Migration: 1794614400000-SprintTwoAccounts. Review database backup/rollback and existing migration scripts before applying to the target environment. Production migration discovery uses dist/src/database/migrations/*.js. No shared database migration or server restart has been performed.

Configure real SMTP and Cloudinary, apply the reviewed migration, then restart the matching build. Existing users remain unverified and must verify email; existing tokens require signing in again. Demonstrate register/verify/login, recovery, profile persistence, avatar upload/deletion and session revocation with real providers. Account deletion removes avatar before database deletion and preserves account on provider failure. Review backup retention and distributed gateway rate limits before release.

Canonical documentation is in the sibling Android checkout: ../Nihonix/docs/contracts/sprint-02-api.md and ../Nihonix/docs/sprints/sprint-02-report.md. Production HTTPS URL remains to be supplied.
