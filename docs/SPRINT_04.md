# Sprint 04 learning content

Implemented 2026-11-15. New public catalog projection routes: GET /api/catalog/{kind} and /api/catalog/{kind}/{identifier}. Kinds: vocabulary-items, vocabulary-sets, grammar-sub-topics, grammar-patterns. Existing routes remain unchanged.

List queries: page (1–10000), page_size (1–100, default 20), q (literal substring, max 120), topic_id UUID, level_code N5–N1. Vocabulary items also accept set_id; patterns accept sub_topic_slug. Lists return schema_version, items, total, page, page_size, has_more and SHA-256 version. Group details expose counts; children remain paginated. Sets use UUID detail keys; other kinds use slugs.

Vocabulary/grammar authoring now inherits the parent level and rejects explicitly conflicting levels before AI is invoked. Admin-only mutation guards remain.

Validation: npm run build; npm test -- --runInBand (55 tests); npm run test:sprint04 (actual PostgreSQL in a temporary schema); npm run test:sprint03 (authoring/session regression).

No new schema migration, shared seed or provider call is needed. Deploy/restart the matching build and demonstrate the updated Android client against existing content. Offline persistence/progress remain Sprint 05.

Canonical API/report are in the sibling Nihonix repository under docs/contracts/sprint-04-api.md and docs/sprints/sprint-04-report.md.
