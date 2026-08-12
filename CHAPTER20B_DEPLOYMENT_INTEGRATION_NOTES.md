# Chapter 20B — Deployment Integration Test Candidate

Date: 12 August 2026
Baseline: Community_Terminal_Builder_CHAPTER20_FINAL_CLEANED_CANONICAL_12AUG2026.zip
Status: TEST CANDIDATE — not canonical until user acceptance.

## Integrated workflow
Configure → Validate → Auto-save → Create Terminal → Deploy → Return Live URL

## Changes
- Removed automatic ZIP download after generation.
- Removed the mock `terminal.xyz` URL from the post-build completion flow.
- Added a primary `DEPLOY TERMINAL` action after a successful build.
- Retained `DOWNLOAD ZIP` as an explicit fallback/manual-hosting action.
- Reused the existing protected server-side GitHub + Render deployment engine.
- Reused release readiness, build fingerprint validation, one-time authorization, exact confirmation phrase, expiry, and lockout safeguards.
- First `CREATE` deployment no longer requires a pre-existing public acceptance result; `UPDATE` deployments still require public acceptance.
- Automatically selects CREATE for projects without a prior connected deployment and UPDATE for projects with a saved deployment record.
- Render deployment polling now also retrieves the service public URL, allowing CTB to return the live URL even when it was absent from the initial service response.
- Added Chapter 20B regression coverage.

## Verification
- Full CTB `npm test`: PASS.
- Local builder `/health`: PASS.
- Local `/api/integrations` secret-safe disabled-state smoke test: PASS.

## Remaining live acceptance
A real connected deployment still requires the builder host to be configured with the existing server-side GitHub and Render credentials and release policy environment variables. Live provider execution has not been performed in this offline build environment.

## FIX5 — 12 Aug 2026
- Canonical terminal identity now derives from Ticker: `<ticker-lowercase>@robinhood`.
- Builder Terminal User is read-only and re-derived from Ticker on edit/load/generation.
- Quick deployment derives one canonical GitHub/Render target from the generated project snapshot and passes it explicitly to release readiness, authorization, and deployment.
- Builder app.js uses an explicit FIX5 cache-busting query string for local candidate testing.
- Full regression suite passes.
