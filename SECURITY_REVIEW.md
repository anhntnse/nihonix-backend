# Section 02 security handoff — 2026-11-16

Baseline: 91d151ba58f9f84d2a2b6d65c7bae4ecea1f4699. Local changes only; no deployment, shared migrations or real providers.

## API behavior

- GET /api/ai/health is public liveness only: response envelope data is `{status:"ok"}`. It does not invoke Gemini or disclose configured/key readiness.
- GET /api/ai/quota remains authenticated and retains provider readiness required by Android.
- D02 Accepted by user 2026-11-16: all catalog reads and read-only POST entity-sync/check require an active verified JWT session per BR-001. This intentionally replaces public reads. JWT guards execute before conditional GET; private/no-cache and Vary Authorization protect response reuse. Android headers, session-gated cache and account-bound sync are updated together.
- Catalog authoring is Admin-only. Personal data remains owner-scoped; Admin exceptions exist explicitly in Users operations.
- No global JWT guard introduced. A route-inventory test traverses AppModule imports and fails for unreviewed public routes or weakened Admin-only protections. Run it in regression; it does not enforce runtime default-deny.
- Inventory: 20 controllers / 82 routes; 13 public, 63 authenticated/owner or catalog, 6 Admin-only.

## Local evidence

Latest D02 verification: backend build PASS; Jest 18 suites / 101 tests PASS; Sprint03/04/05/09 isolated PostgreSQL/JWT fixtures PASS. Sprint09 rejects guests on all 69 guarded patterns, accepts authenticated catalog, preserves authenticated304 and rejects invalid/revoked/deleted-account JWT before ETag. Android: 146 unit +74 emulator tests PASS, lint/debug builds PASS; four restart fixtures seed/verify PASS. Independent review found one Admin-role-widening test gap, reproduced RED and fixed with an exact Admin-only check; final full regression is green.

```powershell
npm run build
npm test -- --runInBand
npm run test:sprint09
```

Sprint09 requires local PostgreSQL and creates a random schema with scoped search_path, no shared schema migration, cleanup in finally.
Email, Cloudinary, FCM and AI operations are doubles. HTTP tests include all 47 guarded routes anonymously, representative guest/authenticated catalog reads, health/quota, cross-user/Admin actions, token replay/revocation and deletion.

Deletion policy is unchanged: media cleanup failure returns an error and keeps the account for retry; successful cleanup permits DB deletion. The fixture covers failure then retry, 17 direct user FK relationships (at least 8 populated) and child card deletion. It does not prove deletion from provider/log/database backups.

## Dependency audit and carryover

Read-only audit; package.json/lock unchanged:

- Full npm audit: 69 package findings (3 critical / 24 high / 32 moderate / 10 low).
- Omit-dev audit: 60 package findings (2 critical / 23 high / 31 moderate / 4 low).
- These are affected-package aggregates, not proven app exploit counts. npm audit exit 1 is expected with these findings.
- Runtime HTTP parsing chain: Nest platform 11.1.7 / Express 5.1.0 / body-parser 2.2.0 / multer 2.0.2 / path-to-regexp 8.3.0 — prioritize targeted patch and malformed/size/compression/upload regression.
- proxy-addr 2.0.7 is installed; current main.ts does not enable trust proxy. Advisory exploitability depends on trust configuration.
- Critical fast-xml-parser 5.2.5 is under @types/nodemailer/AWS SDK; current SMTP path does not expose SES/XML parsing. Firebase Storage uses a separate 5.12.1 copy. Do not call this a proved app XML exploit.
- jws 3.2.2 is under jsonwebtoken; its advisory excludes jsonwebtoken verify usage. Patch parent chain without inventing a JWT bypass.
- Nodemailer 7.0.10 / validator 13.15.15 need separate migration/input-path review; do not run broad major audit fix.
- Build/types tooling is currently installed as production dependencies, which affects omit-dev counts.
- Confirmed source follow-up: password-reset success logs contain recipient email; Cloudinary logs raw errors. Add logging redaction tests before remediation.
- Retention TTL for logs, expired sessions/challenges, backup expiration and deleted-account restore handling remains Decision-required. Do not compact receipts/tombstones without a full-resync contract.

The Android workspace holds the detailed evidence under docs/planning/remaining-work/evidence/: security-review.md, authorization-matrix.md and dependency-audit.json.
