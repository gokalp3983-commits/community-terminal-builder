## Pre-Simplification Mobile Countdown Polish (14 Aug 2026)

- Added a mobile-only responsive correction for NFT mint countdown pages.
- Project/social command links now use a compact two-row phone layout instead of squeezing four fixed-width columns.
- Multi-phase mint cards now force a single-column stack on phone/coarse-pointer layouts, preventing phase titles, mint limits, fees, and status text from colliding.
- Desktop countdown layout, mint/countdown JavaScript, generator/deployment behavior, and terminal styling remain unchanged.

## Chapter 22 — Since Last Visit + Additional Links (14 Aug 2026)

- Corrected NFT **Collection Pulse / Since Last Visit** semantics so a baseline is not reset by background refreshes or ordinary reloads within the same browser-tab visit. The UI now uses **Last visit** language instead of **Previous check / Last check**.
- Made **Collection Pulse / Since Last Visit** collapsible/expandable and preserved the user's collapsed preference locally without changing the visit baseline.
- Added reusable CTB **Additional Links** configuration (up to 5 entries) with Label, Link text, URL, and optional **Highlight red**. Saved/imported projects retain these links.
- Generated NFT terminals render Additional Links between OpenSea and Wallet. Normal links follow the existing terminal color scheme; highlighted links use the bright-red action treatment. This supports entries such as `[ BOT ] Click to access Sniper Bot.` without project-specific hard-coding.

# Community Terminal Builder

## Chapter 22 — NFT Terminal Maintenance Update (2026-08-13)

**Current milestone:** Chapter 22 targeted maintenance on the final accepted CTB baseline.  
**Next product direction:** simplify the Builder UI, then prepare the broader crypto-normie-friendly community-terminal UI transition.

This maintenance pass preserves the final accepted CTB architecture and applies only targeted NFT-terminal fixes:

- Sales panel label is now `MARKET UPDATE` above the unchanged `NFT Sales Tracker`.
- NFT BUY/SELL polling remains on the accepted 15-second refresh cadence.
- Holder-history commands now use explicit windows: `whales` 12h, `entrants` 4h, `movers` 4h, and `retention` 24h.
- Holder-history baselines are sampled every 5 minutes and retained for approximately 26 hours; fresh deployments report `BUILDING BASELINE` until the required history exists instead of reporting misleading zero-change results.
- `whales` and `entrants` now wait for the same holder snapshot used by Holder Analytics instead of racing it and incorrectly reporting that the snapshot is still loading.
- NFT Pulse title is simplified from `CTB NFT PULSE` to `NFT Pulse`.
- NFT Pulse and the `activity` command retry the bounded Blockscout activity cache when it is still warming before rendering data unavailable; the accepted background-cache architecture remains unchanged.
- NFT Pulse `Whale Wallets` continues to fall back to the holder-history snapshot when the separate whale request is temporarily unavailable.
- No OpenSea credential values are stored in the code or README; Render environment-secret handling is unchanged.

**Import/export usability fix:** exported project configuration now includes the saved GitHub repository URL and Public Render URL. Import restores each non-empty value automatically into the Deployment Dashboard while preserving any existing local value when the imported field is blank or absent. Older exports without deployment metadata remain compatible.

## Milestone Status — Chapter 18A Local Builder Ready (2026-08-09)

**Visible Builder version:** `ver 1.0`  
**Current milestone:** **CHAPTER 18A — LOCAL BUILDER READY / LIVE ACCEPTED**  
**Next milestone:** **Future Builder expansion / publishing workflow**

Chapter milestones reached:

| Chapter / milestone | Status | Result |
|---|---|---|
| Chapters 1–12 — Reusable builder, generated terminal packaging, hosted builder, deployment assistant | **MILESTONE PASSED** | Core configurable terminal system established |
| Chapter 13A — Deployment Dashboard & Guided Handoff | **MILESTONE PASSED** | Public acceptance workflow and deployment records verified |
| Chapter 13B — Connected Deployment Prototype | **MILESTONE PASSED** | GitHub + Render connected deployment path proven as an opt-in prototype |
| Chapter 14 — Secure Deployment Control & Release Workflow | **MILESTONE PASSED / CLOSED** | Protected UPDATE EXISTING RELEASE proven end-to-end with GitHub commit, Render deploy, polling and Public Acceptance |
| Chapter 15A — Local Production-Ready Builder | **MILESTONE PASSED / BUILDER MODE FINAL** | Local token + NFT Builder, preview, standalone ZIP generation, generated-package tests and hands-on page acceptance passed |
| Chapter 15B–17 — Simplification, NFT hardening and Builder acceptance | **MILESTONE PASSED** | Simplified guided workflow, NFT generation hardening, branding/preview fixes and public-ready Builder baseline accepted |
| Chapter 18A — Community Pulse + Timeline / HOODRAT live acceptance | **MAJOR MILESTONE PASSED / LIVE** | Added Community Pulse and Timeline, completed live acceptance fixes, then generated and deployed the first automated full Token + NFT Community Terminal: https://hoodrat-community-terminal.onrender.com/ |

**Baseline rule:** this ZIP is the **Community Terminal Builder — Chapter 18A Local Builder Ready** baseline. Future work must branch from it without losing the accepted Guided/Builder workflows, unified deployment architecture, NFT hardening, Community Pulse, Community Timeline, or the HOODRAT live-acceptance fixes.

## Chapter 14B — Protected Publish Action

- Adds a two-step protected release flow: `PREPARE RELEASE` followed by an exact confirmation phrase and `CONFIRM PUBLISH & DEPLOY`.
- A prepared release receives a server-generated, one-time authorization that expires after five minutes.
- The authorization is bound to the exact project, repository name, Render service name, visibility, and release action. Any target change invalidates it.
- A release authorization can be consumed only once; replay attempts are rejected.
- Direct calls to the connected deployment engine without a valid prepared authorization are rejected before GitHub or Render mutations begin.
- Release intent is explicit: `CREATE NEW RELEASE` refuses existing GitHub/Render targets, while `UPDATE EXISTING RELEASE` refuses missing targets.
- Existing Chapter 14A readiness checks remain mandatory. `CONNECTED_DEPLOYMENTS_ENABLED=true` and `RELEASE_ACTIONS_ENABLED=true` are both required server-side.
- GitHub and Render credentials remain server-side and are never returned to or stored by the browser.
- The manual ZIP / GitHub / Render handoff remains available.

### Chapter 14B release sequence

```text
CHECK CONNECTIONS
      ↓
CHECK RELEASE READINESS
      ↓
PREPARE RELEASE
      ↓
TYPE EXACT CONFIRMATION PHRASE
      ↓
CONFIRM PUBLISH & DEPLOY
      ↓
ONE-TIME AUTHORIZATION CONSUMED
```

**Default safety state:** protected release actions remain disabled until the builder operator explicitly enables both connected deployment and release actions on the server.

## Chapter 14A — Secure Release Readiness

- Adds a server-evaluated release-readiness endpoint and product-facing Secure Release Control panel.
- Aggregates project validation, generated-build state, repository target, GitHub/Render server configuration, public acceptance, and secret-protection status.
- Adds a separate `RELEASE_ACTIONS_ENABLED` server policy lock. It defaults to `false`.
- Connected publish actions now require both connected deployments and release actions to be explicitly enabled server-side.
- Browser clients receive only safe readiness booleans/status details; GitHub and Render secrets remain server-side.
- Chapter 14A does not enable production publishing by default.

## v1.3.2-b panel alignment update

- Matched the Deployment Dashboard and Connected Deployment panel widths.
- Preserved responsive alignment on mobile screens.


## v1.3.2-b UI polish update

- Removed public-facing Chapter labels from the builder interface.
- Simplified the header release marker to `v1.3.2-b`.
- Renamed `OPEN RENDER` to `OPEN PUBLIC TERMINAL`.
- Added visible progress, completion time, and button state feedback to `CHECK CONNECTIONS`.
- Updated public acceptance output to identify the current release instead of an outdated chapter.

# Community Terminal Builder — Chapters 1–12

**Release:** Chapter 12 — Deployment Assistant & Release Provenance  
**Builder version:** 1.2.1  
**Status:** Chapter 12 is live at https://community-terminal-builder.onrender.com; offline and public builder regression suites passed; generated-terminal public acceptance remains in progress  
**Built by:** Gokalp — X: [@Gokalp8339](https://x.com/Gokalp8339)

## 1. What this project is

Community Terminal Builder converts one reusable terminal master into branded, ready-to-run community terminal applications.

A user enters a project name, ticker, token contract, optional NFT contract, colors, mascot, links and feature choices. The builder validates those values, previews the Landing Page and generates a ZIP containing one unified Node application.

Each generated terminal can expose:

```text
/          Landing Page
/whales    Whale Activity Tracker
/intel     Meme Intelligence Terminal
/pulse     Community Pulse, when enabled
/timeline  Community Timeline, when enabled
/nft       NFT Collection Terminal, when enabled
/health    Hosting health check
/status    Project and module diagnostics
```

All enabled pages share one server, one domain and one public port.

## 2. Current product status

| Capability | Status |
|---|---|
| Reusable multi-project terminal master | DONE |
| Central project configuration | DONE |
| Config-driven Landing, Whale, NFT and Intel modules | DONE |
| STONKBROKERS and HOODRAT proof profiles | DONE |
| Branding and contract leakage cleanup | DONE |
| Browser-based ZIP generator | DONE |
| Feature-aware module visibility | DONE |
| Single-server generated output | DONE |
| Landing Page preview | DONE |
| Terminal-style builder interface | DONE |
| Local project workspace | DONE |
| Save, load, duplicate, import and export | DONE |
| Render packaging for generated terminals | DONE |
| Generated-terminal health and status routes | DONE |
| Four-scenario RC1 validation suite | DONE |
| Hosted-ready builder server | DONE |
| Builder health, status and production headers | DONE |
| Public builder acceptance verifier | DONE |
| Generated-terminal public acceptance verifier | DONE |
| Public builder deployed to Render | ACCEPTED |
| Chapter 12 deployed from GitHub to Render | ACCEPTED |
| Chapter 12 offline regression suite | PASSED |
| Chapter 12 public deployment regression suite | PASSED |
| Hosted ZIP generation | ACCEPTED |
| Generated terminal local landing and commands | PASSED |
| Multi-quote market selection | FIXED IN 11.1 |
| Public generated-terminal acceptance | PENDING |
| Accounts and cloud project storage | NOT INCLUDED |
| Automatic GitHub/Render account actions | NOT INCLUDED |
| Payments and subscriptions | NOT INCLUDED |

The technical builder is approximately **97% complete**. The public builder is live and has passed both the original Chapter 11 acceptance suite and the Chapter 12 post-deployment regression run. Chapter 12 was pushed to GitHub, automatically redeployed by Render, and verified with the complete local and public test suites. A real generated JACKET terminal previously exposed a WETH-only market-selection assumption on Robinhood Chain; Chapter 11.1 fixed that limitation before the generated terminal is deployed publicly.

## 3. Chapter history

### Chapter 1 — Central configuration foundation

- Audited the original STONKBROKERS all-in-one terminal.
- Identified hardcoded names, contracts, colors, mascots, prompts, links and feature values.
- Added a central configuration layer.
- Converted the Landing Page while preserving its appearance and behavior.

### Chapter 2 — All modules become configurable

- Converted Whale Activity Tracker, NFT Collection Terminal and Meme Intel.
- Added STONKBROKERS and HOODRAT profiles.
- Added profile selection.
- Corrected Meme Intel Top-10 and Top-30 concentration field mismatches.

### Chapter 3 — Leakage cleanup

- Removed copied contracts, names, links and NFT defaults from module code.
- Centralized explorer, marketplace and ecosystem settings.
- Removed unsafe fallbacks to another project.

### Chapter 4 — Master validation

- Added structural, profile, syntax and asset validation.
- Verified both proof profiles.
- Established the reusable master as the source for future generation.

### Chapter 5 — Generator MVP

- Added the browser form.
- Added project identity, contracts, branding, links and feature controls.
- Added ZIP generation.
- Fixed required-link defaults and generated-profile activation.
- Made disabled NFT features disappear rather than showing misleading commands.

### Chapter 6 — One server, one port and polished UI

- Unified generated modules under one Node server.
- Added `/whales`, `/intel` and optional `/nft` routes.
- Redesigned the builder with terminal typography, glow, binary background and Build Console.
- Added English mascot upload controls.
- Added Landing Page preview in a separate tab.
- Added Gokalp builder credit.

### Chapter 7 — Production packaging

- Added `render.yaml` to generated terminals.
- Added `.env.example`.
- Added `/health` and `/status` to generated projects.
- Added security headers and safer production errors.

### Chapter 8 — Local Project Workspace

- Added browser-local save and load.
- Added NEW, SAVE, DUPLICATE, EXPORT, IMPORT and DELETE actions.
- Added DRAFT and READY states.
- Added schema-versioned JSON backups.
- Added safe duplication that clears contracts and external links.

### Chapter 9 — RC1 quality gate

- Added four real generation scenarios: token-only, token + NFT, minimal and fully customized.
- Added one-command release validation with `npm test`.
- Added generated-project self-tests.
- Added explicit market-data errors such as `PAIR NOT FOUND`, `API RATE LIMITED` and `UPSTREAM TIMEOUT`.
- RC1 passed with four valid ZIPs, eight diagnostic-route checks and zero critical offline issues.

### Chapter 10 — Hosted Builder MVP

Chapter 10 makes the **builder itself** suitable for public hosting while keeping project storage local-first.

Added:

- root `render.yaml` for deploying the builder;
- root `.env.example`;
- builder `/health` route;
- builder `/status` and `/api/builder-status` routes;
- automatic LOCAL/HOSTED status in the builder title bar;
- production security headers and Content Security Policy;
- generation request-size limits;
- basic per-IP generation rate limiting;
- request and header timeouts;
- graceful shutdown for hosting platforms;
- hosted-builder regression tests;
- truthful local-first storage model: saved projects remain in the user browser.

Chapter 10 does **not** add accounts, cloud storage or payments. Hosting the builder does not automatically move saved projects to a server. Form data is sent to the server only when generating a ZIP; saved workspace data remains in browser storage.

### Chapter 11 — Public Deployment Acceptance Toolkit

Chapter 11 prepares the product for a real public acceptance run without claiming that an external deployment has already happened.

Added:

- `verify-public-builder.js` for testing a hosted builder URL;
- `npm run test:deployed -- URL` in the builder;
- real hosted ZIP-generation verification;
- generated `verify-deployment.js` in every terminal ZIP;
- `npm run test:deployed -- URL` in every generated terminal;
- checks for public Landing Page availability, security headers, `/health`, `/status`, enabled module routes and ZIP integrity;
- a configurable 30-second timeout for free-hosting cold starts;
- an offline regression test proving the acceptance toolkit itself works;
- a documented builder → generated terminal → public acceptance workflow.

Chapter 11 does not create GitHub repositories or Render services automatically. Those actions require the owner's accounts and authorization. It provides repeatable evidence once the services are deployed.

### Chapter 11.1 — Robinhood multi-quote market hotfix

The first real hosted-builder acceptance run was completed at:

```text
https://community-terminal-builder.onrender.com
```

The public builder passed homepage, security-header, `/health`, `/status`, `/api/builder-status`, hosted ZIP-generation, filename and ZIP-signature checks.

A real token named **JACKET** was then generated from the hosted builder. Its Landing Page, terminal commands and local routes worked, but Whale Activity Tracker and Meme Intel repeatedly reported:

```text
No liquid JACKET/WETH market found
```

The token was valid. The selected Robinhood Chain pool was **JACKET/NVDA**, revealing that the market selector incorrectly required the quote symbol to be WETH or ETH.

The fix:

- removed the hardcoded WETH/ETH quote filter;
- kept the configured community token as the DexScreener base token so `priceUsd` remains correct;
- accepted any quote asset with positive USD price and liquidity, including NVDA, USDC, tokenized stocks and future Robinhood assets;
- ranked matching pools by USD liquidity and selected the strongest usable market;
- returned `pairName`, `pairBaseSymbol` and `pairQuoteSymbol` dynamically;
- changed liquidity-pool labels and command descriptions to show the actual pair;
- replaced repeated full market-error stack traces with compact `[market]` warnings;
- added release-regression checks proving Whale and Intel no longer contain the WETH-only selector.

The resulting behavior is:

```text
Before: TOKEN/WETH only
After:  highest-liquidity TOKEN/ANY-QUOTE market on the configured chain
```

This does not make the project Robinhood-only. Chain behavior remains configuration-driven through the DexScreener chain ID and Blockscout-compatible explorer API. The hotfix simply makes Robinhood Chain's NVDA and other tokenized-asset pairs first-class valid markets while preserving WETH pairs on every supported chain.

## 4. Run the builder locally

```bash
cd 05_Community-Terminal-Builder
npm start
```

Open:

```text
http://localhost:3050
```

Diagnostics:

```text
http://localhost:3050/health
http://localhost:3050/status
```

No `npm install` is required for the builder because it uses Node.js built-in modules only.

## 5. Run all tests

From the builder folder:

```bash
npm test
```

This runs:

1. the Chapter 9 four-scenario release suite;
2. the Chapter 10 hosted-builder route and security test;
3. the Chapter 11 public-deployment acceptance-toolkit regression test.

Expected final results include:

```text
[ RELEASE ] RC1
[ PASS ] Test profiles: 4
[ PASS ] Generated ZIPs verified: 4
[ PASS ] Diagnostic routes checked: 8
[ PASS ] Builder /health
[ PASS ] Builder /status
[ PASS ] Hosted builder home and security headers
[ PASS ] Chapter 11 public-deployment acceptance toolkit
```

## 6. Deploy the builder to Render

The repository root contains `render.yaml` configured for the builder in `05_Community-Terminal-Builder`.

Recommended workflow:

```text
Push the current chapter to the GitHub repository
        ↓
Open Render
        ↓
Create a new Blueprint
        ↓
Select the repository
        ↓
Render reads render.yaml
        ↓
Deploy the Community Terminal Builder
```

The Blueprint uses the free Render plan and starts from the repository root:

```text
Plan: free
Start command: cd 05_Community-Terminal-Builder && npm start
Health check: /health
NODE_ENV: production
```

During the Chapter 11 deployment, Render rejected the original `rootDir` Blueprint field in the live setup. The compatible fix was to remove `rootDir` and place the directory change directly in `startCommand`. This exact configuration is now included in the root `render.yaml`.

After deployment, verify:

```text
https://YOUR-BUILDER.onrender.com/
https://YOUR-BUILDER.onrender.com/health
https://YOUR-BUILDER.onrender.com/status
```

## 7. Chapter 11 public acceptance workflow

### A. Deploy and verify the builder

After pushing the repository and deploying the root `render.yaml`, run from `05_Community-Terminal-Builder`:

```bash
npm run test:deployed -- https://YOUR-BUILDER.onrender.com
```

The verifier checks:

- builder home and product identity;
- Content Security Policy and `nosniff` header;
- `/health`, `/status` and `/api/builder-status`;
- browser-local storage declaration;
- one real hosted ZIP-generation request;
- returned ZIP MIME type, filename and binary signature.

Expected ending:

```text
[ ACCEPTED ] Public builder deployment passed Chapter 11 checks.
```

### B. Generate and deploy a real terminal

Use the hosted builder to generate a project, push the extracted generated folder to its own repository and deploy its included `render.yaml`.

From the generated terminal root, run:

```bash
npm run test:deployed -- https://YOUR-TERMINAL.onrender.com
```

The generated verifier checks:

- Landing Page HTTP response;
- security headers;
- `/health` and `/status`;
- mounted-module state against the generated profile;
- every enabled public module route.

Expected ending:

```text
[ ACCEPTED ] Public terminal deployment passed Chapter 11 checks.
```

### C. Manual browser acceptance

After automated acceptance passes, manually verify:

1. preview and generated Landing Page match;
2. mascot transparency and theme colors are correct;
3. terminal commands open same-domain routes;
4. workspace SAVE/LOAD survives browser restart;
5. EXPORT locally and IMPORT on the hosted origin work;
6. live DexScreener and Blockscout states are understandable;
7. mobile layout remains usable;
8. Render cold starts recover without broken UI.

Record the public URLs and observations before declaring the release publicly accepted.

## 8. Local-first project storage

Saved projects are stored under the builder origin in browser local storage.

Examples:

```text
Local builder:  http://localhost:3050
Hosted builder: https://YOUR-BUILDER.onrender.com
```

These are different browser storage origins. Projects saved locally will not automatically appear on the hosted builder, and projects saved on the hosted builder remain in that browser profile.

Use **EXPORT** and **IMPORT** to move projects between computers, browsers or origins.

Clearing browser site data removes locally saved projects. Exported JSON is the portable backup.

## 9. Generate and run a terminal

1. Create or load a project.
2. Fill identity, contracts, branding, links and feature settings.
3. Preview the Landing Page.
4. Generate the ZIP.
5. Extract it.
6. From the generated project root, run:

```bash
npm install
npm test
npm start
```

Open:

```text
http://localhost:3000
http://localhost:3000/health
http://localhost:3000/status
```

## 10. Security and operational boundaries

Chapter 10 includes practical baseline protection, not enterprise security certification.

Implemented:

- strict request-size limits;
- basic generation rate limiting;
- security headers;
- Content Security Policy;
- method restrictions;
- path traversal protection;
- production-safe error responses;
- graceful shutdown.

Important boundaries:

- Rate limiting is in memory and resets when the service restarts.
- There are no accounts or authorization controls.
- Generated ZIPs are produced in memory and are not intentionally retained.
- Browser-saved projects are not backed up by the hosted server.
- Public deployment should be monitored for resource use and abuse.

## 11. Current workflow

```text
Open local or hosted Community Terminal Builder
        ↓
Create, import or load a browser-saved project
        ↓
Configure and preview
        ↓
Generate the terminal ZIP
        ↓
Run generated npm test
        ↓
Run locally
        ↓
Verify /health and /status
        ↓
Push generated terminal to GitHub
        ↓
Deploy with its generated render.yaml
```

## 12. Public deployment acceptance plan

### Chapter 11 — Live Deployment Acceptance and Stable v1.0

Before accounts or payments, deploy the Chapter 10 builder and at least two generated terminals publicly.

Acceptance targets:

- hosted builder cold start and ZIP generation;
- browser-local save/load on the hosted origin;
- token-only generated terminal deployment;
- token + NFT generated terminal deployment;
- navigation under one public domain;
- `/health` and `/status` on all deployments;
- real DexScreener and Blockscout behavior;
- HTTP 429, timeout and cache-warming diagnostics;
- mobile browser acceptance;
- first stable release checklist and version tag.

Chapter 11 established the public builder and acceptance toolkit. Chapter 12 now adds the deployment assistant and release provenance described later in this README.


## Chapter 11 acceptance record

Fill this after the real Render deployment:

```text
Builder public URL:        https://community-terminal-builder.onrender.com
Builder acceptance:        PASSED — Chapter 11 automated public checks
Chapter 12 deployment:     PASSED — GitHub push and automatic Render redeploy
Chapter 12 offline tests:  PASSED
Chapter 12 public tests:   PASSED
Hosted ZIP generation:     PASSED
Security headers:          PASSED
Health/status routes:      PASSED
Generated project:         JACKET — local landing, commands and routes passed
Terminal public URL:       PENDING
Terminal acceptance:       PENDING
Cold-start observation:    Builder recovered and passed public verifier
Live API observation:      Multi-quote issue found and fixed for JACKET/NVDA
Critical issues:           0 known in current builder regression suites
Acceptance date:           2026-08-06
```

A release should be marked **PUBLICLY ACCEPTED** only after both `test:deployed` commands pass and the manual browser checklist is complete.


## Chapter 11.2 — Contract guardrails, chain visibility and favicon identity

Chapter 11 public testing revealed two additional product-quality needs after the JACKET/NVDA market-selector hotfix.

### EVM support must be explicit

The current Whale Activity and Meme Intel engines parse EVM wallets, ERC-20 transfers and Blockscout-compatible data. They are configurable across Ethereum and compatible EVM networks, but they are not yet Solana/SPL adapters. The builder now says **EVM ONLY** directly beside the token-contract field rather than leaving that limitation implicit.

The token CA field now performs layered inline checks:

```text
[ FAIL ] Invalid 0x format
[ UNSUPPORTED ] Address appears non-EVM
[ WARN ] Valid EVM address, but market is on a different selected chain
[ WARN ] Valid format, but no DexScreener market was returned
[ PASS ] Chain, live pair and liquidity detected
```

The builder validates the 42-character `0x` format locally, then asks its own `/api/validate-contract` endpoint to inspect DexScreener pairs. A detected market on another chain produces a mismatch warning instead of silently generating a misleading configuration. The server-side generator continues to reject malformed token and NFT contracts even when browser validation is bypassed.

The generated Landing Page now displays the configured chain and a shortened, clickable token contract near the project identity. This makes the deployed terminal's network scope visible to visitors.

### Multi-quote issue found with JACKET

The real JACKET test on Robinhood Chain used a liquid `JACKET/NVDA` pool. Earlier code incorrectly required `TOKEN/WETH`, producing `No liquid JACKET/WETH market found` even though a valid market existed. Chapter 11.1 changed Whale Activity and Meme Intel to select the strongest usable pair on the configured chain and display the actual quote symbol. WETH, NVDA, USDC, WBNB and other liquid quote assets are therefore handled by the same selector.

### Browser-tab identity

The public builder now has a dedicated neon-green `>_` favicon in PNG, ICO and Apple touch-icon formats. The live builder URL is:

```text
https://community-terminal-builder.onrender.com
```

Generated terminals use the project's uploaded mascot/logo as their favicon. When no logo is supplied, they receive the default Community Terminal `>_` favicon. Every module page receives the favicon link, so `/`, `/whales`, `/intel` and `/nft` retain the project identity in browser tabs.

### Chapter 11.2 validation additions

The offline suite now verifies:

- the builder favicon route and MIME type;
- visible EVM contract guidance;
- generated favicon files and page links;
- generated chain and contract identity elements;
- multi-quote selection in both activity modules;
- the existing hosted-builder and generated-ZIP regression suite.


## Chapter 12 — Deployment Assistant and release provenance

Chapter 12 turns a successful ZIP generation into a guided release workflow. The terminal engine remains local-first and deployment-provider neutral; this chapter does not store GitHub or Render credentials and does not create services automatically.

### Post-generation launch screen

After a ZIP is returned, the builder now opens a **BUILD COMPLETE** panel showing the project, package name, enabled modules and deployment readiness. The user can download the same ZIP again without rebuilding and copy project-specific commands for:

- local installation, validation and startup;
- Git initialization and first GitHub push;
- Render Blueprint deployment and public acceptance testing.

The dialog makes the next action explicit while retaining the normal browser download. Chapter 12 therefore bridges the gap between “a ZIP appeared” and “this project is ready to launch.”

### Generated release files

Every generated terminal now contains:

```text
terminal-release.json
deployment-guide.txt
```

`terminal-release.json` records the builder version, config-schema version, terminal-engine version, generation timestamp, EVM chain configuration, enabled modules, mounted routes and deployment-ready status. It provides machine-readable provenance for support, migration and future regeneration.

`deployment-guide.txt` contains copy-ready local, GitHub, Render and public-acceptance instructions using the generated project name and recommended repository slug. The project still contains only one Markdown file: its root `README.md`.

### Visible version identity

The Chapter 12 builder interface displayed:

```text
CTB CORE v1.2.1 // CONFIG SCHEMA v1 // TERMINAL ENGINE v1.0.0
```

Exported browser project JSON also records the builder and terminal-engine versions. These identifiers separate three concepts that will evolve independently:

- the hosted builder product;
- the saved configuration schema;
- the generated terminal runtime engine.

### Chapter 12 boundaries

Chapter 12 is a deployment assistant, not yet one-click deployment. Users still authorize GitHub and Render manually. No OAuth token, repository credential or cloud project is stored by the Community Terminal Builder. This keeps the current public service safe and simple while preparing the exact workflow that a later integration chapter can automate.

### Validation additions

The offline release suite now verifies that all four generated scenarios include valid release metadata, an enabled-module manifest, the deployment guide and the existing generated validator. Hosted-builder tests verify the Chapter 12 completion dialog and visible version strip alongside the Chapter 11 favicon and EVM-contract guardrails.

### Current public service

```text
https://community-terminal-builder.onrender.com
```

Chapter 12 was pushed to the GitHub `main` branch and Render redeployed the public builder automatically. After the deployment reported **Live**, the complete offline suite and the public `test:deployed` regression suite both passed.

Confirmed Chapter 12 public state:

```text
PUBLIC BUILDER                 LIVE
CHAPTER 12 DEPLOYMENT          COMPLETE
OFFLINE TEST SUITE             PASS
PUBLIC DEPLOYMENT TEST         PASS
HOSTED ZIP GENERATION          PASS
SECURITY HEADERS               PASS
HEALTH / STATUS ROUTES         PASS
```

This proves that the Deployment Assistant and release-provenance changes did not regress the already accepted hosted-builder behavior. The generated JACKET terminal was then deployed publicly at:

```text
https://jacket-community-terminal.onrender.com
```

Its public acceptance suite passed the Landing Page, security headers, `/healthz`, `/status`, `/whales`, `/intel`, and generated-module manifest checks. The same generated terminal was also validated locally, including live `JACKET/NVDA` market data.

### Chapter 12 real-world fixes

The JACKET deployment exposed several issues that were fixed in the Chapter 12 codebase and generator templates:

- Render intermittently returned `x-render-routing: no-server` for `/health`; generated projects now preserve `/health` as a compatibility alias, use `/healthz` for Render health checks, and public verification retries transient routing failures.
- the Landing Page `/api/config` response omitted `contracts` and chain fields; generated pages now receive the token contract, DexScreener chain ID, and Blockscout API base.
- the Landing Page retained an old WETH/ETH-only pair filter; it now chooses the strongest valid liquid pair and reports the real quote symbol, including `JACKET/NVDA`.
- uploaded mascot images could be unnecessarily large and slow on free hosting; raster uploads are now resized to a maximum of 384 pixels and converted to optimized WebP before generation. SVG uploads remain unchanged.

```text
LOCAL TESTS                         COMPLETED SUCCESSFULLY
RENDER DEPLOYMENT TESTS             COMPLETED SUCCESSFULLY
PUBLIC GENERATED TERMINAL TESTS     COMPLETED SUCCESSFULLY
CHAPTER 12 END-TO-END ACCEPTANCE    COMPLETE
```

## Recommended Chapter 13

The next major chapter can prototype optional one-click GitHub + Render publishing. Chapter 12 has now completed local, hosted-builder, generated-terminal, and public Render acceptance successfully. The integration must use explicit OAuth permissions, minimal scopes, safe token handling, visible deployment progress and failure recovery.


## Chapter 13A — Deployment Dashboard & Guided Handoff

Chapter 13A advances the hosted builder to `CTB CORE v1.3.0-B` while keeping config schema v1 and terminal engine v1.0.0. The `A` suffix identifies the guided handoff stage; Chapter 13B is reserved for connected account deployment.

Chapter 13A turns the proven manual deployment process into a guided, persistent workflow without requesting GitHub or Render credentials. Each locally saved project can now record its GitHub repository URL, public Render URL, and latest public-acceptance result. The dashboard provides direct links to GitHub and Render and can run server-side acceptance checks against the deployed terminal, avoiding browser CORS restrictions.

The public acceptance action verifies the Landing Page, security headers, `/healthz`, `/status`, and every module enabled in the current builder profile. Results are stored in browser-local deployment metadata and displayed as `PUBLIC ACCEPTED`, `URL SAVED`, or `NOT DEPLOYED`. This keeps the Chapter 8 local-first privacy model intact.

Chapter 13A deliberately does **not** request OAuth tokens, create repositories, or create Render services. Those connected-account capabilities are reserved for **Chapter 13B — GitHub + Render Integration Prototype**. Chapter 13B will examine user-owned GitHub and Render authorization, automatic repository creation, source upload, service creation, deployment polling, and live-URL return.

### Chapter 13A acceptance target

```text
GENERATE TERMINAL ZIP                 SUPPORTED
COPY LOCAL / GITHUB / RENDER STEPS    SUPPORTED
SAVE GITHUB REPOSITORY URL            SUPPORTED
SAVE PUBLIC RENDER URL                SUPPORTED
OPEN DEPLOYMENT DESTINATIONS          SUPPORTED
RUN PUBLIC ACCEPTANCE FROM BUILDER    SUPPORTED
STORE ACCEPTANCE RESULT LOCALLY       SUPPORTED
CONNECTED ACCOUNT DEPLOYMENT          RESERVED FOR CHAPTER 13B
```

Chapter 12 remains the completed and proven end-to-end baseline: local tests, public builder tests, hosted ZIP generation, public JACKET deployment, Render diagnostics, and JACKET/NVDA live-market tests completed successfully.


### Chapter 13A — Deployment Dashboard & Guided Handoff

Chapter 13A added browser-local deployment records for each saved project. It stores the GitHub repository URL, Render public URL and latest public acceptance result, and it can verify the Landing Page, security headers, `/healthz`, `/status` and enabled module routes through the builder backend. The JACKET deployment was loaded into the live builder and reached `PUBLIC ACCEPTED`. During testing, a sleeping free Render instance initially caused every route to fail. The verifier now retries temporary `404 x-render-routing: no-server`, `502`, `503`, `504`, timeout and fetch failures before producing a final result.

### Chapter 13B — GitHub + Render Integration Prototype

Chapter 13B adds an opt-in connected deployment path while preserving the Chapter 13A manual workflow.

The prototype can:

- generate the terminal source in memory;
- create a GitHub repository or update an existing one;
- publish the complete generated tree to the `main` branch using GitHub's Git Data API;
- create a Render web service from that repository, or trigger a redeploy of an existing same-name service;
- return repository, commit, service and public-URL metadata to the dashboard;
- store only non-secret deployment metadata in browser-local storage.

Security boundaries:

- connected deployment is disabled by default;
- GitHub and Render credentials exist only as server environment variables;
- API keys are never returned to JavaScript or saved in browser storage;
- the UI reports connection readiness without exposing secret values;
- the existing ZIP export and manual deployment path remains available at all times;
- this is an operator-connected prototype, not yet per-user OAuth or a multi-tenant account system.

Required server variables:

```text
CONNECTED_DEPLOYMENTS_ENABLED=true
GITHUB_TOKEN=<server-side GitHub token>
GITHUB_OWNER=<optional GitHub username>
RENDER_API_KEY=<server-side Render API key>
RENDER_OWNER_ID=<Render workspace ID>
RENDER_REGION=oregon
```

The live public builder should remain in disconnected mode until the operator intentionally configures these secrets in Render. A later account chapter can replace operator credentials with user-owned OAuth sessions, encrypted token storage, permission scopes, revocation and multi-user isolation.

```text
CHAPTER 13A GUIDED HANDOFF TESTS       COMPLETED SUCCESSFULLY
CHAPTER 13A PUBLIC ACCEPTANCE          COMPLETED SUCCESSFULLY
CHAPTER 13B OFFLINE PROVIDER MOCKS     COMPLETED SUCCESSFULLY
CONNECTED DEPLOYMENT LIVE TEST         PENDING OPERATOR CREDENTIALS
```

## Chapter 14 — Secure Deployment Control & Release Workflow

Chapter 14 turns the Chapter 13B connected-deployment prototype into a guarded release system. The deployment provider credentials remain server-side and the connected release path remains opt-in.

### Chapter 14A — Release Readiness Layer

Chapter 14A introduced a server-evaluated release-readiness model. A release candidate is evaluated across project validity, generated-build state, repository/service target, GitHub connectivity, Render connectivity, latest saved public acceptance, and secret-protection status. The release policy is a separate server-side gate controlled by `RELEASE_ACTIONS_ENABLED`; a technically ready project is still blocked from release while that policy is off.

The JACKET acceptance exercise confirmed the intended separation:

```text
PROJECT CONFIGURATION          READY
GENERATED BUILD                READY
REPOSITORY TARGET              READY
PUBLIC ACCEPTANCE              READY
SERVER CREDENTIALS PROTECTED   READY
GITHUB / RENDER CONNECTIONS    READY WHEN OPERATOR-CONFIGURED
RELEASE POLICY                 INDEPENDENT SERVER-SIDE LOCK
SECRETS EXPOSED TO BROWSER     NO
```

### Chapter 14B — Protected Publish Action

Chapter 14B adds a deliberate two-stage protected release flow:

```text
CHECK RELEASE READINESS
        ↓
PREPARE RELEASE
        ↓
ONE-TIME AUTHORIZATION (5 MINUTES)
        ↓
EXACT HUMAN CONFIRMATION PHRASE
        ↓
CONFIRM PUBLISH & DEPLOY
```

A prepared authorization is tied to the exact project, GitHub repository, Render service, repository visibility, and CREATE/UPDATE release mode. It is one-time, expires after five minutes, and becomes unusable when the target changes. The browser receives only non-secret authorization metadata; GitHub and Render credentials remain on the Builder server.

Chapter 14B local acceptance exposed and fixed an Enter-key form bug: pressing Enter after an incorrect confirmation phrase previously fell through to the Builder's main generation form and downloaded another terminal ZIP. Enter is now intercepted inside the release-confirmation field and cannot generate or deploy anything.

The finalization patch adds a three-attempt confirmation guard. An incorrect phrase submitted with Enter produces an in-app warning with the remaining attempts. After three failed attempts, the prepared release authorization is invalidated server-side and the user must run `PREPARE RELEASE` again. An exact phrase enables the final publish/deploy control but still does not publish until the user explicitly clicks it.

### Persistent generated-build fingerprint

During Chapter 14B testing, loading a previously saved project caused `Generated build` to return to `BLOCKED` after a Builder restart even when the project had not changed. The Builder had been treating generation as an in-memory session event.

The finalization patch now persists a server-generated SHA-256 build fingerprint with the saved project when ZIP generation succeeds. Release Readiness compares that fingerprint against the current project configuration:

```text
UNCHANGED SAVED PROJECT + MATCHING FINGERPRINT   GENERATED BUILD = READY
PROJECT MODIFIED AFTER GENERATION                GENERATED BUILD = STALE / BLOCKED
LEGACY PROJECT WITHOUT FINGERPRINT               REGENERATE ONCE
```

This keeps release state conservative without requiring users to regenerate an identical package after every Builder restart.

During final browser acceptance, the first persistence implementation exposed one more edge case: pressing `SAVE` after generation rebuilt the saved-project record but preserved `lastGeneratedAt` only, accidentally dropping `generatedFingerprint`. The result was `Generated build = BLOCKED` after restart even though the unchanged project had been generated successfully. The final persistence hotfix now preserves both `lastGeneratedAt` and `generatedFingerprint` whenever an existing saved project is updated.

### Chapter 14B finalization verification

The offline regression suite passes with the finalization patch, including existing generator, hosted-builder, acceptance-toolkit, connected-deployment, Chapter 14A readiness, and Chapter 14B protected-release coverage. New automated checks verify deterministic build fingerprints, stale-build invalidation, exact confirmation, one-time/replay protection, target-change invalidation, and three-attempt confirmation lockout.

```text
ENTER-KEY RELEASE CONFIRMATION HOTFIX       PASS
INCORRECT PHRASE DOES NOT GENERATE ZIP      PASS
EXACT PHRASE ENABLES FINAL CONTROL           PASS
PERSISTED BUILD FINGERPRINT TEST             PASS
STALE BUILD INVALIDATION TEST                PASS
THREE-ATTEMPT SERVER LOCKOUT TEST            PASS
FULL OFFLINE REGRESSION SUITE                PASS
FIRST REAL PROTECTED UPDATE                  PENDING FINAL LOCAL ACCEPTANCE
```

`README.md` is intentionally maintained as the project's running history as well as its setup and operating reference. Chapter discoveries, acceptance results, safety decisions, and hotfixes should continue to be recorded here as the Builder evolves.


## Chapter 14C — Final Polish/Fix

Chapter 14C finalizes the protected-release experience discovered through live Chapter 14B acceptance testing. It keeps the Chapter 14 security boundary intact while making release state more trustworthy and the operator workflow clearer.

- **Real provider validation before release:** `CHECK CONNECTIONS` now performs read-only API verification against GitHub and Render instead of only checking whether environment variables exist. GitHub verifies the authenticated account; Render verifies that the configured workspace is accessible. Invalid credentials stay blocked before release preparation.
- **Generation auto-save:** a successful ZIP generation now automatically saves the active project, generated timestamp, and build fingerprint. Users no longer need to remember a separate SAVE action after generation.
- **Confirmation phrase UX:** the required phrase is labeled explicitly as `Confirmation phrase:` above the input field. The label remains green and the exact phrase is highlighted in orange.
- **Three-attempt confirmation guard retained:** three incorrect Enter-key validations invalidate the one-time release authorization and require `PREPARE RELEASE` again.
- **Build Console polish:** the panel is now explicitly `BUILD CONSOLE / STATUS OUTPUT`. The fake editable command prompt/blinking cursor was removed because the panel is diagnostic output, not an interactive shell. Its existing side-panel location is retained for now.
- **Disabled controls:** disabled release controls use a `not-allowed` cursor instead of a busy/wait cursor.
- **Security boundary:** GitHub and Render secrets remain server-side and are never returned to or stored by the browser. Release policy remains environment-controlled.

### Chapter 14C acceptance focus

1. Generate once and verify the project is auto-saved with its build fingerprint.
2. Restart/load the project and verify `Generated build` remains READY without regenerating.
3. Verify valid GitHub/Render credentials show PASS and an invalid token shows FAIL during `CHECK CONNECTIONS`, before release preparation.
4. Verify the confirmation phrase appears above its input with the updated labeling.
5. Verify the Build Console behaves as status output rather than suggesting an interactive shell.

### Chapter 14C — Final Polish/Fix (final UI polish)

- Established a page-wide text hierarchy: section/status accents remain neon, field labels use a distinct medium terminal green, real loaded/user-entered values render bright white, and placeholders/help text remain intentionally dim. Auto-restored values use the same bright treatment as manually entered values because both represent real project data.
- Added a prominent temporary `ZIP generated — project auto-saved ✓` toast after successful generation while retaining the detailed status-line message. Generation continues to persist the build fingerprint automatically.
- Fixed the Build Console `[ LIVE ]` status alignment so the marker remains intact on narrow layouts and only the explanatory copy may wrap.
- Retained the Chapter 14C real read-only GitHub/Render credential validation, protected-release phrase layout, three-attempt authorization lockout, and server-side secret boundary.



## Chapter 14C — Accepted Release Workflow + Final UI Cleanup (2026-08-07)

Chapter 14C completed a real protected **UPDATE EXISTING RELEASE** acceptance run against the existing `jacket-community-terminal` GitHub repository and Render service. The Builder created a new GitHub commit, started the Render deployment, and the deployed public terminal subsequently passed Public Acceptance for the landing page, security headers, `/healthz`, `/status`, `/whales`, and `/intel`.

Final cleanup applied after acceptance (no repeat 14C acceptance run required):

- restored/auto-loaded repository and Render service values use the same bright-white treatment as manually entered real values;
- field labels remain medium terminal green and placeholders/help copy remain dim;
- Repository visibility checkbox and label are aligned as one control;
- disabled Release action selects retain a dark terminal background and readable muted text;
- protected-release output now uses semantic terminal colors for action, URLs, commit, status, success, and failure;
- release progress now says **Deploying the website...** instead of leaving a terse raw `deploying` state;
- a non-blocking deployment notification explains that the user should wait for completion;
- the Builder now polls Render after starting a deployment and automatically transitions the release display to **live/success**, **failed**, or a bounded **status unknown** state rather than remaining stuck on `deploying`;
- Chapter 14C remains on the existing visible `v1.3.2-b` baseline until a later intentional version bump.

Scope note: Chapter 14C proved the **update-existing** path. Full first-time provisioning / **CREATE NEW RELEASE** acceptance (new GitHub repository + new Render service from the Builder) remains a separate next-phase concern for Chapter 15.


## Chapter 14 — Closed (2026-08-07)

Chapter 14 is formally closed after successful end-to-end acceptance of the protected **UPDATE EXISTING RELEASE** workflow and the final operator-feedback refinements. The accepted path is: generated build → saved build fingerprint → Public Acceptance → verified GitHub/Render connections → Release Readiness → one-time protected authorization → exact confirmation phrase → GitHub update → Render deployment → automatic Render status polling → live public terminal.

The final closure refinement separates transient progress feedback from completion acknowledgement:

- **Deployment started** remains a non-blocking toast and now stays visible for approximately five seconds.
- **Deployment successful** is now a persistent terminal-styled modal that does not auto-dismiss. It displays the public URL and requires the operator to choose **OPEN WEBSITE** or **OK / CLOSE**.
- The live URL opens in a new tab with `noopener,noreferrer`; no credential or secret data is included in the completion dialog.
- Render polling remains authoritative for the Builder's transition from `Deploying the website...` to `live`, `failed`, or bounded `status unknown`.
- The real Chapter 14 acceptance run finished with the deployed JACKET terminal passing Public Acceptance across the landing page, security headers, `/healthz`, `/status`, `/whales`, and `/intel`.

No additional Chapter 14 acceptance run is required for this final presentation-only refinement. The same deployment completion behavior can be exercised naturally during Chapter 15 work. **Chapter 15 begins from this closed Chapter 14 baseline.**

## Chapter 15 — Started (2026-08-08)

Chapter 15 begins from the formally closed Chapter 14 developer-ready baseline. The immediate operating goal is to make the Community Terminal Builder dependable for **local use first**: build a new token/community terminal locally, preview it, download the generated ZIP, then manually publish that generated package to a new GitHub repository and Render service when needed. Automated first-time provisioning remains a later Chapter 15 phase rather than a prerequisite for real use.

### Chapter 15A — Local Builder Readiness + Default Theme Contract

The FINAL NFT-ONLY BASE CODE supplied on 2026-08-08 is adopted as the canonical NFT functional reference and as the visual/UI reference for all generated terminals. NFT-only functionality remains modular and must not be copied into unrelated terminal types without an explicit feature requirement.

The Builder now formalizes the shared default terminal visual contract:

- black terminal background;
- orange structure, borders, headings, and primary framing;
- green only for LIVE / OK / READY and other positive system states;
- bright white for primary readable text and important values;
- cyan for highlights, links, prompts, and selected/key metrics;
- red for negative movement, errors, and warnings;
- terminal monospace typography, compact information density, responsive/mobile behavior, and restrained color hierarchy remain baseline requirements.

A dedicated `theme-contract.js` now owns the default generated color tokens used by the generator rather than scattering those defaults inline. `test-theme-contract.js` is part of the normal regression suite and guards the shared module CSS against accidental drift from the canonical terminal palette and typography.

The visible Builder version remains **v1.3.2-b**. Chapter 15A does not change the accepted Chapter 14 protected update-existing workflow and does not require re-running the full Chapter 14 live acceptance unless a later Chapter 15 change touches that path.

## Chapter 15A — Local Production-Ready Builder (UI/NFT integration checkpoint)

Status: **ACTIVE — post-first-local-acceptance fixes applied**.

Local acceptance completed on 2026-08-08:
- Builder local startup: PASS.
- Generated token/community ZIP validation: PASS (12 generated-package checks).
- Generated project installed and ran independently from the Builder: PASS.
- Landing, Whale, and Intel command flows: PASS.
- Chapter 14 protected release behavior was not changed and therefore was not re-run live.

Chapter 15A UI amendments from the local acceptance pass:
- Non-NFT generated terminal pages now show a full, untruncated cyan `[ CA ] Contract : <address>` row immediately above `[ LIVE ] Updated`.
- The token contract address remains selectable and includes a dedicated copy control.
- The Community Terminal header is not used for the new CA row; the previous landing header network/contract strip was removed.
- Non-NFT structural borders now use a brighter/crisper treatment derived from the help-panel framing, with orange as the default structural color.
- Landing, Whale, Intel, and future token-centric non-NFT pages should follow this shared CA/border convention.

NFT isolation / canonical source rule:
- The uploaded **FINAL NFT-ONLY BASE CODE (08 Aug 2026)** is the canonical NFT terminal implementation.
- The Builder NFT module has been refreshed from that base, preserving the two-page NFT architecture under the mounted community route: `/nft` for mint countdown/launch and `/nft/terminal` for the collection terminal.
- Shared token CA-row amendments are **not** injected into NFT pages.
- NFT generation preserves NFT-specific Floor Price, Holders, 24h NFT Volume, mint tracker, holder rankings, sales/buyer/seller activity, premium-sale treatment, responsive behavior, binary side background, modal behavior, and pre-mint/live states from the canonical NFT base.
- Builder NFT inputs now include collection name, total supply, mint time (ISO 8601), OpenSea link/slug, and NFT contract so the canonical NFT base can be parameterized without mixing fungible-token metrics into it.

Next acceptance profile:
- Generate a **meme-token Community Terminal with NFT enabled**.
- Verify the shared non-NFT CA/copy/border amendments on Landing, Whale, and Intel.
- Verify `/nft` and `/nft/terminal` follow the FINAL NFT-ONLY implementation and remain isolated from shared token CA-row changes.


### Chapter 15A — NFT mint-time confirmation safety (2026-08-08)

Before the meme-token + NFT acceptance run, NFT schedule entry was changed from a raw ISO-8601 text field to a safer operator flow. This change affects the **Builder input/confirmation experience only**; it does not redesign or inject shared token UI into the canonical NFT terminal pages.

- NFT-enabled projects now collect **Mint date**, **Mint time**, and **Timezone** separately.
- The Builder offers **USE MY TIMEZONE**, populated from the user's browser/computer timezone. IANA timezone names (for example `Europe/Bucharest`) are used so daylight-saving rules are handled rather than relying on a hard-coded GMT offset.
- The Builder converts the chosen schedule internally to an ISO-8601 timestamp with an explicit offset before passing it to the FINAL NFT-ONLY countdown code.
- The schedule is compared with the user's current computer/browser time and reports a future, near-term (less than one hour), or already-past state.
- When NFT Terminal is enabled, **GENERATE TERMINAL ZIP is gated by an explicit NFT mint-time confirmation modal**. The modal shows the interpreted NFT mint time, the user's current computer time, timezone context, and a time-state check.
- The modal states that this value controls the NFT countdown/launch state and provides **GO BACK & EDIT** and **CONFIRM & PROCEED** actions. The Builder does not silently change the entered schedule.
- NFT mint date/time/timezone are required for an NFT-enabled generation. Non-NFT projects are unaffected.
- Saved/imported projects remain compatible with the existing canonical `nft.mintAt` ISO value; new saves also retain the selected timezone for clearer restoration.
- The uploaded **FINAL NFT-ONLY BASE CODE** remains the canonical NFT page implementation. This safety flow only parameterizes its mint time and does not apply the shared non-NFT CA-row convention to NFT pages.

Acceptance target remains a **meme-token Community Terminal with NFT enabled**, verifying both the shared non-NFT UI amendments and the isolated FINAL NFT-ONLY `/nft` + `/nft/terminal` implementation.


### Chapter 15A — Meme + NFT local acceptance fixes (08 Aug 2026)
- Local Builder and standalone generated-package validation passed before the HOODRAT meme + NFT acceptance run.
- Fixed NFT-enabled ZIP generation confirmation path so user-facing date formatting no longer blocks generation.
- NFT mint schedule UX now keeps **Use My Timezone** as a helper that fills the timezone field, while leaving a completed mint-schedule block triggers a separate **Confirm / Change** review modal.
- The mint review shows browser/computer timezone, a human-readable mint schedule, and relative time until mint. Raw ISO-8601 remains internal for countdown logic only. Editing the schedule invalidates prior confirmation.
- Non-NFT Landing / Whale / Intel pages show the full cyan token contract address with copy control immediately above Updated; NFT pages remain untouched and continue to use the FINAL NFT-ONLY base implementation.
- Tightened live metric label/value spacing to match the compact information density of the FINAL NFT-ONLY reference.
- Strengthened orange structural framing consistently and aligned non-NFT footer-area styling to the FINAL NFT-ONLY footer visual treatment without copying NFT-specific footer content or behavior.
- FINAL NFT-ONLY BASE remains the canonical source for NFT terminal generation.


### Chapter 15A — local meme + NFT acceptance polish (8 Aug 2026)

The local HOODRAT token + HOODRAT NFT acceptance proved that the Community Terminal Builder can generate a standalone combined token/NFT terminal package. The generated ZIP installed, validated, and ran locally with Landing, Whale, Intel, NFT launch, and NFT terminal routes. This pass also recorded and corrected the remaining visual/fidelity issues found during hands-on acceptance:

- The outermost page frame is now a fixed bright-green signature border on every generated page, independent of project input.
- Non-NFT internal structure remains orange; NFT internal panels preserve the FINAL NFT-ONLY BASE muted-green border/divider treatment.
- Non-NFT token CA copy controls are borderless/minimal while preserving full-address copy behavior.
- Non-NFT footer structure/style now follows the FINAL NFT-ONLY footer area's compact typography, spacing, divider, title, information line, and attribution treatment without importing NFT-specific logic.
- NFT launch heading is normalized to `<PROJECT NAME> NFT COLLECTION TERMINAL`.
- NFT launch action wording is `VISIT NFT TERMINAL`.
- NFT footer heading is normalized to `<PROJECT NAME> NFT Terminal`.
- The `[ UPCOMING ] Mint begins at ...` display now comes from the exact confirmed Builder mint timestamp; countdown calculation itself was already correct and remains unchanged.
- The canonical FINAL NFT-ONLY BASE remains the NFT implementation source of truth.

The visible Builder version remains `v1.3.2-b`.

## Chapter 15A — Builder Mode Final (2026-08-08)

**Milestone: PASSED / FROZEN BASELINE**

The local Builder acceptance cycle is complete and this package is designated **Community Terminal Builder — Builder Mode Final**. It is the developer/operator baseline for future work.

Final Chapter 15A acceptance record:

- Builder regression suite passed during the local acceptance cycle.
- Fresh generated token/community ZIP installed, validated, and ran independently.
- Landing, Whale, Intel, NFT launch, and NFT terminal routes were inspected during the HOODRAT token + NFT acceptance pass.
- Global bright-green outer frame, compact non-NFT metric layout, full token CA row, borderless CA copy control, shared non-NFT footer treatment, NFT naming, NFT launch wording, confirmed mint-time display, and canonical muted-green NFT internal borders were accepted.
- Builder Landing Preview now restores visible `:` separators between metric labels and values and includes the same compact Community Terminal footer treatment used by generated pages.
- The visible Builder version remains `v1.3.2-b`; the milestone name changes, not the public version string.
- Chapter 14 protected release controls remain available underneath and are not discarded by the upcoming simplified user experience.

### Next chapter — Chapter 15B

Chapter 15B will focus on a simplified end-user Builder experience. Infrastructure, payment, `$SHELL`, and multi-tenant platform decisions remain future-roadmap work and are intentionally separated into **`SHELL Token_Readme.md`**.

## Chapter 16 — FINAL NFT base carry-over (2026-08-08)

Chapter 16 starts from the frozen **Builder Mode Final / Chapter 15A** baseline and carries the last two fixes from the canonical `FINAL_NFT-ONY_BASE_CODE_08AUG2026-1415GMT3` implementation into CTB's isolated NFT module.

- **Server-rendered social/link preview metadata:** both NFT entry routes now render project metadata in the initial HTML response. Open Graph title, description, URL, image and site name, plus X/Twitter card/title/description/image, are emitted with real project values. The social image is absolute. Shared-link crawlers no longer depend on client-side placeholder replacement. In generated Community Terminals the renderer respects the mounted `/nft` and `/nft/terminal` request path.
- **Mobile first-paint / instant fit:** `index.html` and `terminal.html` contain a tiny critical first-paint style block that constrains page/shell/workspace widths, protects overflow, applies `min-width:0` to the NFT layout containers, constrains long terminal dividers, protects media width, and forces the single-column NFT workspace at the responsive breakpoint before the external stylesheet arrives. Matching durable rules remain in `style.css`. The viewport remains `width=device-width,initial-scale=1`; browser zoom/accessibility is not disabled.
- Chapter 15A CTB-specific visual adaptations are intentionally retained, including the **bright-green outer page frame** and the canonical muted-green NFT internal border hierarchy. NFT-specific OpenSea/Blockscout behavior remains isolated to the NFT module.
- The visible Builder version remains `v1.3.2-b`. `SHELL Token_Readme.md` remains the separate future roadmap.



## Chapter 16 — Dual NFT mint architecture + canonical 09 Aug parity (2026-08-09)

Chapter 16 expands the isolated NFT generator from one fixed mint timestamp into two canonical NFT launch paths while keeping the frozen Chapter 15A Builder contracts intact.

- CTB now carries **two internal NFT templates**: the refreshed canonical **single-phase** base and a separate canonical **multiple-phase** base. Generated output still uses the same public `03_NFT-Collection-Terminal` module path; the Builder selects the internal template from the configured mint structure.
- The Builder NFT section now exposes **Mint Structure → Single Phase / Multiple Phases**. Single Phase keeps the existing date, time and timezone workflow. Multiple Phases exposes a repeatable **2–6 phase editor** with phase label, public phase name, start/end date and time, per-phase timezone, mint price and wallet limit.
- Multiple-phase schedules are normalized into `nft.mode = "multiple"` plus `nft.mintPhases[]`. Generation rejects missing/invalid phase ranges and phase overlaps. Single-phase saved/imported configurations remain backward-compatible with the prior `nft.mintAt` + `nft.timezone` shape.
- The generated multiple-phase landing page creates exactly the configured number of phase command rows/cards rather than assuming a fixed three-phase collection. Phase labels, names, price/limit values and schedule times are injected from Builder configuration.
- Both NFT paths preserve the Chapter 16 Part-A contracts: **server-rendered OG/X metadata**, mounted `/nft` + `/nft/terminal` URL awareness, accessible first-paint viewport protection, and the Chapter 15A **bright-green outer frame**.
- The embedded single-phase base is refreshed to the 09 Aug canonical source, including **Collection Pulse / Since Last Visit** and final mint-completion lifecycle handling. The multiple-phase path also retains Collection Pulse while adding phase-specific launch lifecycle behavior.
- CTB-specific theme isolation remains enforced. Project-specific 888 Society names/URLs are not allowed to leak into generic generated multi-phase projects, and the multi-phase template is recolored through the CTB project/theme configuration instead of making the 888 palette a global Builder default.
- JavaScript-driven NFT navigation is namespace-safe as well as static HTML links: generated runtime redirects use `/nft/terminal` inside a unified Community Terminal.
- Added `test-chapter16-dual-nft.js` to protect the Mint Structure UI, both template paths, phase-count parity, Collection Pulse carry-over, route namespacing, SSR behavior, outer-frame contract, and branding isolation.

The visible Builder version remains `v1.3.2-b`. Chapter 16 remains open for further capability work. The currently planned next major chapter after Chapter 16 is **Chapter 17 — User-Friendly Simplification**; the older Chapter 15B simplification note is retained as historical planning context but is superseded by the Chapter 17 roadmap.

### Chapter 16 — Dual NFT acceptance fixes (09 Aug 2026)
- Fixed Builder Mint Structure dropdown option readability on the dark UI.
- Multiple-phase phase editor now initializes an empty End Date from the entered Start Date while keeping End Date editable for multi-day mints.
- Fixed generated NFT mascot resolution under the mounted `/nft` namespace so `/nft` and `/nft/terminal` use the uploaded/generated mascot reliably.
- Restored the canonical multiple-phase NFT terminal ice-blue outer frame instead of the earlier blanket CTB green-frame override; NFT sales window styling remains unchanged.
- Hardened NFT terminal mascot presentation so transparent/non-square artwork is not forced into a black square/composited tile; glow remains on the visible artwork.
- Full CTB release/regression suite and dual-NFT generation regression pass after these fixes.

### Chapter 16 — NFT acceptance refinement + Builder brand preview (09 Aug 2026)

The hands-on two-phase HOODRAT acceptance pass identified the remaining UI/branding edge cases and these are now protected as Chapter 16 contracts:

- **Dynamic phase End Date autofill:** every phase card, including cards created later with `+ Add Phase`, initializes an empty End Date from the entered Start Date. End Date remains editable for multi-day phases.
- **Sequential phase validation:** each phase must begin at or after the previous phase ends. Equal-time handoff is valid; overlap blocks generation in both Builder validation and generator normalization.
- **NFT countdown logo path:** fixed the multi-phase template transformation order that could rewrite `888-society-mark.png` into a non-existent project-specific `*-mark.png` before the mascot replacement ran. Generated `/nft` now points to the actual mounted mascot asset and also loads `project-runtime.js` for runtime branding parity.
- **Generic uploaded-logo treatment:** CTB-generated multi-phase NFT pages no longer inherit the 888-specific glow animation/filter. Arbitrary uploaded logos preserve their natural canvas/transparency without revealing a square halo; the NFT terminal and countdown use the same neutral logo treatment.
- **Builder brand preview:** the Build Console now shows the uploaded/saved project logo so branding can be visually confirmed before ZIP generation. The pop-up Landing Preview also supports persisted mascot data, not only a newly selected file.
- **Mounted social image URL:** SSR social metadata uses the `/nft/assets/...` mounted mascot path when rendered inside a unified Community Terminal.
- Mint Structure native dropdown options retain explicit dark background / bright text styling for browser consistency.
- Whale Activity Tracker and Meme Intel were intentionally left untouched during this refinement after manual acceptance passed.

The full CTB regression suite passes after this refinement. The visible Builder version remains `v1.3.2-b` and Chapter 16 remains open until final manual visual acceptance.

### Chapter 16 — Mint Structure selector polish (09 Aug 2026)

- Fresh Builder sessions now show an explicit **Please select mint structure** placeholder instead of silently defaulting the NFT mint mode.
- The Mint Structure control is styled as part of the CTB dark terminal UI, including dark native option surfaces, bright readable choices, muted placeholder text, green focus treatment and dark color-scheme hints for browser consistency.
- NFT generation requires an explicit Single Phase or Multiple Phases choice when the NFT terminal is enabled. Existing saved/imported NFT configurations still restore their recorded single/multiple mode.
- The full CTB regression suite passes after this UI polish.


### Chapter 16 final NFT acceptance polish
- Hardened the multi-phase NFT Sales Tracker floor summary so long pending/live values stay inside the cyan summary frame at narrow desktop/sidebar widths.
- Preserved the accepted dual-NFT logo, phase scheduling, preview, mounted-route, and canonical multi-phase ice-blue border behavior.


## Chapter 17 — User-Friendly Simplification (started 2026-08-09)

Chapter 17 starts from the frozen `Community_Terminal_Builder_CHAPTER16_FINAL_ACCEPTANCE_09AUG2026` baseline. The Chapter 16 generator, canonical single/multiple NFT architecture, SSR metadata, first-paint protection, release controls, config schema, and visible Builder version `v1.3.2-b` remain unchanged unless a later Chapter 17 acceptance decision explicitly requires otherwise.

### Chapter 17A — Guided Mode foundation

- Added **Guided Mode** as the default Builder presentation for non-developer use.
- Preserved the complete existing operator interface as **Builder Mode**, switchable without reloading or changing project data.
- Guided Mode hides protected deployment/release dashboards, low-level chain/API fields, expert identity fields, and advanced project workspace actions while leaving their values and behavior intact.
- NFT-specific collection/schedule inputs now stay out of the normal flow until **NFT Terminal** is enabled.
- Technical labels were softened in the visible flow: `IDENTITY` → `PROJECT`, `CONTRACTS & DATA` → `TOKEN & NFT`, and `FEATURE FLAGS` → `MODULES`.
- No generator schema, generated terminal code, Chapter 16 NFT behavior, or deployment security boundary is changed by this checkpoint.


### Chapter 17A visual hotfixes + Chapter 17B Guided Workflow preview (09 Aug 2026)

- Fixed fresh Guided project prompt defaults so hidden advanced terminal identity fields cannot generate an empty `project.promptUser` / `project.promptHost`.
- Fixed uploaded logo presentation across generated Landing, Whale, Meme Intel, single-phase NFT, and multiple-phase NFT templates. Non-square/transparent logos now keep their natural aspect ratio and can use a larger header footprint instead of being forced into a 42–64 px square.
- Added visual relationship validation for multiple NFT mint phases. When a phase ends before it starts, the offending End Date/End Time inputs stay red even while focused; when a later phase overlaps the prior phase, that phase's Start Date/Start Time inputs are marked red. Existing blocking logic is unchanged.
- Guided Mode now presents a five-step overview: **Project → Token/NFT → Branding → Links → Modules**.
- Guided Mode hides the developer-style Build Console, centers the form as the main task, adds plain-language guidance to each step, and increases secondary/helper text size and contrast.
- Default branding colors are no longer visually dominant in Guided Mode; they sit behind an optional **Customize Colors** control. Builder Mode still exposes the full color controls directly.
- Optional NFT contract/settings remain hidden until the NFT Terminal module is enabled.
- Builder Mode, generator schema, protected deployment/release controls, Chapter 16 NFT architecture, and visible version `v1.3.2-b` remain unchanged.


### Chapter 17B acceptance fixes — pre-break build (09 Aug 2026)

- Landing and NFT headers now use a deliberate responsive **logo display slot** (`220×86` desktop, `190×72` mobile with `object-fit: contain`) so small-canvas transparent artwork is visibly enlarged without stretching. Whale Activity Tracker styling remains untouched because manual acceptance already passed there.
- Multiple-phase schedule validation now re-runs on every date/time input/change, so **cross-phase ordering errors appear immediately** instead of waiting for the user to leave the whole mint-schedule block or press Generate. The invariant remains: each next phase must start at or after the previous phase ends.
- Guided Mode keeps the successful immediate ZIP download and hides the redundant **DOWNLOAD ZIP** action from the build-complete dialog. Builder Mode retains the re-download action for operator convenience.
- No generator schema, deployment security behavior, visible Builder version, or accepted Chapter 16 terminal logic changed in this pass.

### Chapter 17 final acceptance polish — SUCCESS (09 Aug 2026)

- Added configured project Website, X, Telegram and OpenSea links to generated terminal surfaces using page-aware placement. Landing, Whale Tracker and Meme Intel show link rows immediately after the token CA row; NFT Countdown reuses its existing launch-command area and existing `[ OPENSEA ]` / `[ SOCIALS ]` conventions; NFT Terminal reuses its collection-information flow and canonical OpenSea row. Existing link areas are reused rather than duplicated.
- Link rows are emitted **only when a URL is configured**. Blank Website/X/Telegram/OpenSea inputs produce no placeholder row, no “not provided” copy, and no empty visual gap. The NFT Terminal also hides its canonical OpenSea information row when no OpenSea destination exists.
- Shared generated links use the terminal's clickable ice-blue treatment and open configured external URLs safely in a new tab.
- Existing NFT **VISIT OPENSEA** actions remain visible. When no OpenSea URL/slug is configured, clicking the action stays on the current page and displays a red terminal-style error: `OpenSea link not configured for this collection.`
- Increased the reserved live-status column width so long states such as `[ PAIR NOT FOUND ]` do not collide with metric labels. Font size is preserved rather than squeezed smaller.
- Added `test-chapter17-final-links.js` to protect configured-link rendering, blank-link omission, OpenSea fallback behavior, and long-status row spacing.
- Full Community Terminal Builder regression suite passes after the final Chapter 17 polish.

**Chapter 17 — User-Friendly Simplification: SUCCESS / ACCEPTED.** The visible Builder version remains `v1.3.2-b`.

### Chapter 17 Final Public-Ready Polish — 09 Aug 2026
- Community Terminal Builder now opens to a clean NEW PROJECT workspace on every fresh page load; browser-local saved projects remain available only by explicit selection.
- CTB visible branding finalized: legacy header build-version label removed, footer shows `ver 1.0`, and the builder credit X link uses ice blue (`#6FD3FF`).
- Generated external project URLs are normalized to absolute HTTPS links when users enter bare domains such as `www.example.xyz`, preventing subpage-relative URLs such as `/whales/www.example.xyz`.
- NFT countdown configured Website/X/Telegram/OpenSea rows reuse the native command-link area with aligned desktop/mobile layout; blank links remain invisible and existing OpenSea actions retain their in-page not-configured warning.
- Full regression suite passes after these final Chapter 17 fixes.


## Chapter 17 — DONE (09 Aug 2026)

Final public-ready polish accepted: Guided Mode simplification, fresh NEW PROJECT startup, conditional shared project links with absolute URL normalization, NFT countdown command-row alignment, provider-neutral `[ WALLET ]` labeling, simplified CTB header/footer (`ver 1.0`), and removal of decorative binary background textures for a clean black presentation.


## Chapter 18 — Community Pulse + Timeline (started 2026-08-09)

Chapter 18 starts from the frozen `Community_Terminal_Builder_CHAPTER17_DONE_09AUG2026` baseline. Chapter 17 remains accepted and frozen.

### Chapter 18A — New module foundation

### Chapter 18A — Live UI acceptance polish
- Landing page: ice-blue Quick Access tabs with a compact, non-clickable Available Terminals explanation area.
- NFT: header-logo size/hover behavior aligned with the accepted module treatment.
- Whales / Intel / Pulse / Timeline: non-NFT sub-terminal titles use terminal green.
- Timeline: main outer terminal frame uses the canonical bright-green border.
- Community Pulse only: internal signal/info boxes use bright-white borders to reduce orange visual weight.


- Added two first-class optional Builder modules alongside Whale Tracker, Meme Intel, and NFT Terminal: **Community Pulse** and **Community Timeline**.
- **Community Pulse** mounts at `/pulse` and provides an explainable synthesis of available market direction, holder concentration, Top-30 whale flow, newly observed/unranked buyer flow, and NFT configuration state. It does not provide price targets, predictions, or opaque scoring. Missing/rate-limited signals are shown as unavailable/building rather than invented.
- Community Pulse is independently mountable and does not require Meme Intel to be enabled. It reuses the proven on-chain/market data machinery inside its own module boundary.
- **Community Timeline** mounts at `/timeline` and presents chronological configured/known milestones. NFT single-phase and multiple-phase launch schedule events are generated automatically from NFT configuration. Empty history is represented explicitly rather than populated with fabricated events.
- Both modules are integrated into Builder Guided/Builder Mode feature selection, Build Console routes, Landing Preview, generated project config, landing command/module list, unified root server status, release metadata, generated README, deployment verifier, and hosted public acceptance checks.
- Fresh projects enable Community Pulse and Timeline by default; imported Chapter 17 projects without the new flags remain backward-compatible and receive the new default-enabled module behavior unless explicitly disabled after loading.
- Existing Whale, Intel, NFT, deployment, release, SSR metadata, first-paint, and Chapter 17 simplification contracts remain unchanged.

### Chapter 18A mint schedule UX hotfix — 09 Aug 2026

- Fixed multiple-phase Start Date → End Date synchronization discovered during the HOODRAT Builder acceptance run.
- When End Date was auto-filled from Start Date, later Start Date edits now keep End Date synchronized.
- A deliberate user edit to End Date breaks the auto-link and is preserved, allowing multi-day mint phases without the Builder overwriting the manual schedule.
- The behavior applies to both typed date edits and native date-picker changes through the existing delegated `input` / `change` handlers.

## Chapter 18A — Live HOODRAT Acceptance Fixes (09 Aug 2026)

Live rebuilding/deployment of HOODRAT exposed and fixed three Builder UX/integration issues while preserving the Chapter 17 DONE baseline and the new Community Pulse + Timeline modules:

- Mint phase End Date now continues to follow Start Date while it remains auto-managed; a deliberate manual End Date remains respected, including after loading saved phase data.
- Landing Preview project mascot/logo now uses full-fit contain behavior without fixed-height cropping.
- OpenSea collection slug is now internal and automatically derived from the pasted OpenSea collection URL (including `/overview` URLs). Invalid OpenSea non-collection URLs block generation instead of producing a terminal with broken OpenSea API calls.
- Community Pulse and Timeline remain first-class generated modules and are covered by Chapter 18A generation/regression tests.

Full release regression suite: PASS.


### Chapter 18A — Final visual consistency polish (09 Aug 2026)

- Community Pulse and Community Timeline subpage titles now use terminal green beneath the shared project header, matching the accepted subcommand-page visual hierarchy.
- Pulse and Timeline now use the canonical `terminal-footer` wrapper so their footer spacing, borders, credit treatment, and link styling match the established Whale / Intel / NFT subcommand family.
- No data, routing, generation, OpenSea, NFT schedule, deployment, or Chapter 17 behavior changed in this polish pass.
- Chapter 18A regression coverage now protects both the green subpage-title treatment and canonical footer wrapper.

### Chapter 18A — SUCCESS / Live Generated-Terminal Baseline Accepted (09 Aug 2026)

- CTB generated the complete HOODRAT Community Terminal ZIP, which was deployed live as a single unified Community Terminal and used as the Chapter 18A real-world acceptance target.
- The accepted generated-terminal UX is now carried back into CTB as the baseline for future Community Terminal generation.
- Landing terminal order is fixed to **Whales → Intel → NFT → Pulse → Timeline** in both Quick Access and Available Terminals.
- Whale Activity Tracker and Meme Intel use inline Quick Commands plus clickable Available Commands, a single manual/output console, one-command-at-a-time locking, `clear` terminal reset, and a lightweight `> Back to commands` return link after completed output.
- Intel Quick Commands are **STATUS · SCAN · PULSE · PRESSURE · LIVE**. Whale Quick Commands remain **WHALES · WHALES12 · ACTIVITY · MOVERS · STATS**.
- Shared live-status rows use compact stable spacing based on the longest `[ CONNECTING ]` state; `Updated` is treated as a green live metric above ice-blue project links.
- Community Pulse and Community Timeline use flat terminal-style separators instead of boxed internal cards/events. Timeline preserves its green chronological rail/dots.
- Generated page footers use the accepted compact Builder credit + non-affiliation treatment; NFT retains its OpenSea/API information notice where applicable.
- Generated ZIPs no longer include the redundant `deployment-guide.txt` / GitHub helper file.
- HOODRAT live acceptance remains the canonical Chapter 18A reference for future generated Community Terminals.

**Chapter 18A — SUCCESS / ACCEPTED.**

### Chapter 18A — Final HOODRAT baseline sync (10 Aug 2026)

- Synced the final accepted HOODRAT generated-terminal UX back into the Builder templates so future generated terminals inherit the same production baseline.
- Preserved the canonical module sequence **Whales → Intel → NFT → Pulse → Timeline** across config, generated landing data, Builder previews, status metadata, startup logging, and release metadata.
- Fixed the legacy landing CSS `order` override that could visually force Pulse/Timeline ahead of NFT even when JavaScript/config order was correct; Chapter 18A tests now protect both data order and CSS order.
- Community Pulse keeps the accepted open-line layout with detached vertical/horizontal separators; Community Timeline keeps the flat chronology with stronger event tags and dim-orange event separators.
- Generated terminal packages remain free of the redundant GitHub/deployment helper file.
- Full CTB regression suite passes after the final synchronization.


## MAJOR MILESTONE — First Automated Full Token + NFT Community Terminal LIVE (2026-08-09)

**Community Terminal Builder has successfully generated and deployed its first complete real-world Token + NFT community terminal.**

- **Project:** HOODRAT
- **Generated by:** Community Terminal Builder — Chapter 18A
- **Architecture:** One unified Node/Render service
- **Modules:** Whale Activity Tracker, Meme Intelligence Terminal, Community Pulse, Community Timeline, NFT Collection Terminal
- **Live deployment:** https://hoodrat-community-terminal.onrender.com/
- **Acceptance result:** **LIVE / PASSED**

This milestone proves that CTB can take a previously hand-built Token + NFT community terminal, regenerate it through the automated Builder workflow, package it as a standalone ZIP, replace the legacy multi-service deployment with a unified service, and serve the complete community terminal live with real token, holder, whale, OpenSea/NFT, Pulse and Timeline functionality.

The HOODRAT live acceptance run also validated the Chapter 18A production fixes: automatic OpenSea slug derivation, NFT sales/floor recovery, mint Start→End date synchronization, full-fit Landing Preview mascot rendering, the two new Community Pulse and Community Timeline modules, the ice-blue landing Quick Access tab pattern with compact non-clickable terminal explanations, and NFT header-logo size/hover parity with the other module pages.

### Chapter 18B — Mobile link polish + generated wallet-limit wording (10 Aug 2026)

- Chapter 18B starts from the frozen accepted Chapter 18A HOODRAT-synchronized baseline.
- Builder wallet-limit input/UI behavior remains unchanged; generated multi-phase NFT cards now render the configured value as `<number> per Wallet` (for example, `FREE · 2 per Wallet`).
- Added mobile-only compact copy for long ice-blue project/social links while preserving the full accepted desktop wording.
- Mobile compact values are: `Visit Website`, `Open X`, `Open Telegram`, and `View Collection`.
- NFT mint countdown also uses `Visit NFT Terminal` on mobile and a tighter phone-only command-row grid so link values have more usable width.
- The responsive copy applies only to generated pages that actually expose these project/social link rows: Landing, Whales, Meme Intel, NFT mint countdown, and NFT Terminal. Pulse/Timeline are unchanged because they do not contain this link block.
- Desktop link wording and Builder UI remain unchanged.
- Added Chapter 18B regression coverage; full CTB test suite passes.
- Project mascot navigation is standardized across generated pages: clicking the mascot asks for confirmation before returning to the unified main landing page `/`.
- Builder color/theme customization is removed; generated terminals use the fixed canonical CTB/HOODRAT visual system while project mascot and token/NFT/project information remain configurable.
- Generate ZIP now automatically saves the latest Builder configuration **before** requesting the package, so users no longer need to press SAVE manually first. If the browser cannot persist the configuration, generation stops with the normal error state instead of producing a package from an unsaved workflow.
- Added a dedicated Chapter 18B pre-generation auto-save regression check.


## Chapter 19 — Canonical Template Neutralization & Generator Hardening (10 Aug 2026)

Chapter 19 starts from the frozen **Chapter 18B FINAL / ACCEPTED** baseline and intentionally preserves the accepted generated-terminal design, routes, module order, mobile behavior, SSR metadata, NFT behavior, and Generate ZIP auto-save workflow.

### Chapter 19 implementation

- Neutralized both canonical NFT source templates so normal generation no longer depends on historical GangsterRobins or 888 Society branding, URLs, mascot paths, package identity, state-key wording, CSS comments, or reference supply values.
- Replaced historical brand-cleanup substitutions in `05_Community-Terminal-Builder/generator.js` with explicit CTB template placeholders for project identity, NFT collection identity, OpenSea URL, X URL, mascot path, project ID, and NFT supply.
- Removed obsolete generator cleanup paths that existed only to rewrite historical reference-project values.
- Removed hard-coded NFT fallback supply values inherited from earlier reference collections; generated NFT supply now comes from the configured project value rather than an old collection constant.
- Neutralized legacy project labels in canonical CSS comments and package-lock root metadata without changing runtime behavior or visual styling.
- Generated ZIP assembly now excludes legacy HOODRAT / STONKBROKERS reference mascot assets while preserving those assets inside the CTB source/reference environment where they are still used by historical fixture validation.
- Removed the stale generated-project README reference to `deployment-guide.txt`; generated project documentation now references only files that are actually shipped.
- Added `test-chapter19-template-neutrality.js`, which validates single-phase NFT, multiple-phase NFT, and token-only generation and scans generated filenames/content for historical project names, known legacy contracts/URLs, removed helper-file references, and unresolved `__CTB_` template markers.
- Updated the Chapter 16 dual-NFT regression assertion so it verifies the preserved generic-logo parity behavior using neutral terminology rather than requiring the literal phrase `888-specific glow`.
- Added the Chapter 19 neutrality test to the standard Builder `npm test` release suite.

### Chapter 19 acceptance state

- Complete existing CTB regression suite: **PASS**.
- Chapter 16 SSR metadata + mobile first-paint protections: **PASS**.
- Chapter 16 dual NFT structure/parity: **PASS**.
- Chapter 17 simplification/shared-link contracts: **PASS**.
- Chapter 18A Community Pulse + Timeline contracts: **PASS**.
- Chapter 18B mobile wording, wallet-limit output, mascot-home confirmation, fixed theme, auto-save generation, and market-order polish: **PASS**.
- Chapter 19 single-phase generated-package neutrality: **PASS**.
- Chapter 19 multiple-phase generated-package neutrality: **PASS**.
- Chapter 19 token-only generated-package neutrality: **PASS**.
- Chapter 19 acceptance polish: Whales and Meme Intel no longer auto-focus the command prompt on initial page load, so both pages open naturally at the top while preserving focus after user command interactions and intentional “Back to commands” scrolling.
- `validate-master.js` now validates all canonical generated modules, including the multi-phase NFT template, Community Pulse, and Timeline, while legacy HOODRAT / STONKBROKERS mascot fixture checks are limited to the source modules that intentionally retain those reference assets.
- Post-polish master validation and the complete Builder regression suite through Chapter 19: **PASS**.

**Chapter 19 implementation is complete and ready for user acceptance.** The visible Builder version remains `v1.3.2-b` / footer `ver 1.0`; Chapter 19 does not introduce a product-version bump or visual redesign.

### Chapter 19 — Consolidated user-acceptance UX pass (10 Aug 2026)

Hands-on generation testing against a fresh `CHAPTER19TEST` configuration produced the following accepted Builder and generated-output refinements:

- Builder public startup remains deliberately project-neutral: a fresh Builder session opens a blank NEW PROJECT workspace and never silently auto-loads the previously active token/NFT/project configuration. Saved projects remain available only through explicit user selection.
- `NFT Contract Address (optional)` is now always visible directly beneath the token contract. Entering a valid NFT CA automatically enables the NFT Terminal module; manually disabling NFT while an NFT CA remains configured now produces an explicit mismatch warning rather than silently ignoring the NFT configuration.
- NFT collection and launch settings were moved out of `04 LINKS` into a dedicated `05 NFT MINT DETAILS` section. Modules move to step `06`, keeping the guided flow semantically ordered.
- NFT mint confirmation is now explicit rather than focus-driven. Leaving/changing a mint field no longer opens the final confirmation dialog. Users press **CONFIRM NFT MINT DETAILS** after completing the collection/mint settings, and NFT-enabled generation remains blocked until the current mint details are confirmed.
- Any later NFT mint-detail change invalidates the prior confirmation and requires confirmation again before generation.
- Mint start times earlier than the user's current computer/local time now trigger an immediate dedicated warning with **GO BACK AND EDIT** / **KEEP THIS SCHEDULE**, preserving legitimate already-started/rebuild use cases without silently accepting an accidental past schedule.
- X/Twitter input now accepts handles such as `@CHAPTER19TEST` as well as complete URLs. Handle input is centrally normalized to a valid `https://x.com/<handle>` URL before generation so all generated X links resolve consistently.
- Single-phase NFT countdowns now show an explicit day component above 24 hours (for example `8d 04:35:12`) and retain `HH:MM:SS` below one day. Multi-phase countdowns follow the same compact terminal convention.
- Builder Landing Preview was refreshed to mirror the accepted generated Landing Page command structure instead of the older card preview. It now uses **QUICK ACCESS TO TERMINALS** plus **AVAILABLE TERMINALS** and preserves the canonical **Whales → Intel → NFT → Pulse → Timeline** order.
- The acceptance-stage Create flow now presents the post-generation UI as the intended final product: **TERMINAL READY**, a shareable terminal URL, **OPEN TERMINAL**, **COPY LINK**, and **CLOSE**. During local Chapter 19 testing the underlying source ZIP is still downloaded silently for inspection, while the visible success dialog uses a project-derived mock hosted URL such as `https://www.terminal.xyz/CHAPTER19TEST-landing-page`. The production product will replace that mock URL with the real deployed terminal URL and will not expose ZIP packaging as an end-user workflow.
- Added `test-chapter19-acceptance-ux.js` and updated superseded Chapter 17 UI assertions so the release suite protects the new dedicated NFT section, explicit confirmation model, X-handle normalization, day-aware countdown, preview parity, final-product success dialog, and clean-start contract.
- Post-acceptance master validation: **PASS**.
- Complete Builder regression suite through the consolidated Chapter 19 UX pass: **PASS**.

**Chapter 19 remains READY FOR ACCEPTANCE pending the second hands-on Builder/generated-terminal test.**


### Chapter 19 — Final acceptance-state polish (10 Aug 2026)

The second hands-on Chapter 19 acceptance pass tightened NFT state safety and final launch presentation without changing the accepted generated-terminal design:

- NFT mint confirmation now requires a valid NFT Contract Address first. If NFT Terminal is enabled while its CA is empty/invalid, both explicit mint confirmation and generation stop with a clear NFT contract requirement. Changing or deleting the NFT CA invalidates any prior mint confirmation.
- The generator now independently rejects an NFT-enabled payload with no NFT contract instead of silently degrading it into token-only output. This provides a server-side safety net in addition to Builder validation.
- Manually unchecking **NFT TERMINAL** while NFT configuration exists now opens a dedicated **DISABLE NFT TERMINAL?** dialog. **KEEP NFT TERMINAL** restores/keeps the module enabled; **DISABLE NFT TERMINAL** excludes NFT from that build while preserving the entered NFT CA and mint configuration for later re-enablement. No NFT data is silently deleted.
- The past-mint schedule warning received final action styling: the safe edit action is clearly green/readable, **KEEP THIS SCHEDULE** is visibly orange/secondary, spacing is tightened, close/Escape behaves like returning to edit, and actions stack on narrow mobile layouts. Keeping a past schedule acknowledges only the time warning and does not count as final NFT mint confirmation.
- The Terminal Ready success copy now reads **“Your terminal has been created with the modules listed below.”** while retaining the final-product module badges, mock live URL, **OPEN TERMINAL**, **COPY LINK**, and **CLOSE** actions used during acceptance.
- NFT countdowns above 24 hours now use the fixed terminal-style **DD:HH:MM:SS** convention with an explicit `D` marker (for example `08D:04:06:02`); countdowns below one day remain `HH:MM:SS`. Single-phase and multi-phase templates use the same convention.
- The single-phase pre-mint status now includes the complete scheduled date, time, and timezone (for example, **“Mint begins on 18 Aug 2026 at 15:00 GMT+3.”**) instead of showing only a clock time. The runtime fallback status is generated with the same date-aware wording.
- Chapter 19 acceptance regression coverage was extended to protect NFT-CA-before-confirmation/generation, the safe disable dialog/data-preservation contract, final success wording, fixed day countdown format, and date-aware upcoming mint status.
- Post-fix `validate-master.js`: **PASS**.
- Complete Builder regression suite through Chapter 19: **PASS**.

**Chapter 19 remains READY FOR ACCEPTANCE pending the next hands-on Builder/generated-terminal verification.**

### Chapter 19 — Final mobile command-output containment

- Added a mobile-only containment rule for data-heavy command results in both Whale Activity Tracker and Meme Intelligence Terminal.
- Wide tables/rankings/transaction-style outputs now scroll horizontally inside the command-result area instead of widening the entire page beyond the viewport.
- Desktop layout remains unchanged.
- Added Chapter 19 regression coverage for the mobile Whales/Intel containment contract.

### Chapter 19 — Final hands-on NFT state + validation acceptance pass (10 Aug 2026)

- Fixed the NFT module state machine so a valid NFT CA auto-enables NFT only when the contract is entered/edited; a deliberate manual NFT disable is no longer immediately overridden by generic form updates. The explicit **KEEP NFT TERMINAL / DISABLE NFT TERMINAL** confirmation remains authoritative, and disabling preserves the entered NFT configuration.
- NFT Mint Details confirmation is now treated as one committed state. After a successful explicit confirmation, **CREATE TERMINAL** reuses that confirmation and does not ask again unless the NFT CA, collection/supply data, mint structure, schedule, price, wallet limit, or phase configuration changes.
- Single-phase mint configuration now includes required **Mint Price** and **Mint Per Wallet** fields. Multiple-phase validation enforces Mint Price and Mint Per Wallet / Wallet Limit for every configured phase. Free mints must be expressed explicitly with a valid value such as `FREE` or `0`, not by leaving price blank.
- Switching **Single Phase → Multiple Phases** now preserves the single-phase values as Phase 1. Switching back maps equivalent Phase 1 values into the single-phase fields. Structure changes invalidate confirmation but do not silently discard user-entered mint data.
- OpenSea validation now uses inline field feedback: invalid collection URLs turn the OpenSea input red and display the specific `opensea.io/collection/<slug>` requirement directly below the field. The inline state clears automatically after correction.
- The Branding section now shows a non-blocking, alignment-safe red warning directly below the mascot/logo uploader when no project logo is selected. It explains that generation can continue without a logo but recommends one for project identity, recognition, and social/link previews; the warning disappears automatically after a logo is selected.
- Unified the NFT page header hierarchy with every other Community Terminal module. Both the NFT mint/countdown page and NFT terminal page now use the orange `<PROJECT> COMMUNITY TERMINAL • ONLINE` main header, the standard ecosystem subtitle, and the green **NFT Collection Terminal** opened-page title. This is applied to both canonical single-phase and multi-phase NFT templates.
- Updated superseded historical test fixtures/assertions for the new required single-phase mint fields and unified NFT header contract.
- Added Chapter 19 acceptance assertions covering inline OpenSea/logo validation, required mint price/wallet limits, phase data preservation, scoped NFT CA auto-enable behavior, persistent mint confirmation state, and single/multi NFT header parity.
- `validate-master.js`: **PASS**.
- Complete CTB regression suite through Chapter 19: **PASS**.
- Fresh generated single-phase and multi-phase NFT package header spot checks: **PASS**.

**Chapter 19 is ready for the final hands-on NFT acceptance test.**

### Chapter 19 — Final NFT subtitle parity fix (10 Aug 2026)

- Restored the standard `Independent Community Tools • <Ecosystem> Ecosystem` subtitle as a visible line on both NFT pages.
- The NFT mint/countdown page and NFT terminal page now fully match the canonical Community Terminal header stack: orange `<PROJECT> COMMUNITY TERMINAL • ONLINE`, standard ecosystem subtitle, and green **NFT Collection Terminal** module title.
- Applied to both canonical single-phase and multi-phase NFT templates; the same display fix is mirrored in the live HOODRAT NFT source.
- Extended Chapter 19 regression coverage so the NFT subtitle must be present in markup and remain visibly enabled by CSS.

**Chapter 19 is ready for the final full hands-on acceptance test.**

### Chapter 19 — FINAL ACCEPTED closeout (10 Aug 2026)

- Final hands-on NFT acceptance testing completed successfully: NFT module disable protection, one-time mint confirmation persistence, confirmation invalidation after NFT edits/CA deletion, required Mint Price and Mint per Wallet validation, single-to-multiple Phase 1 preservation, multi-phase required-field validation, optional/invalid OpenSea handling, no-logo inline warning, past-mint schedule warning, countdown/date presentation, generated NFT header parity, and NFT subtitle visibility were verified.
- Final phase-card readability polish replaces unlabeled compact fee/limit text with two explicit aligned terminal-style rows: `Mint Fee : <value>` and `Mint per Wallet : <value>`. Free mints render `Mint Fee : FREE`. The rule applies to single-phase generation and every phase in multi-phase generation.
- The phase detail alignment is implemented structurally with label/colon/value columns so values begin at the same horizontal position on desktop and mobile.
- Full master validation and the complete Builder regression suite were rerun after the final phase-detail change.

**Chapter 19 is COMPLETE / FINAL ACCEPTED / ARCHIVED.** This archive is the canonical baseline for Chapter 20.



## Chapter 20 — Spritehood QA carry-over (11 Aug 2026)

Chapter 20 starts from the Chapter 19 FINAL ACCEPTED baseline and carries generic NFT UX improvements proven during the Spritehood pre-mint deployment back into CTB while preserving the accepted CTB palette and Builder-driven project data.

- Preserved the Chapter 19 visual contract: black background, orange structure/headings, terminal green status, bright white primary text, ice-blue links/highlights, red errors/warnings, and bright-green outer page frame.
- No Spritehood banner, brick background, favicon, project branding, hardcoded links/data, or yellow/purple palette entered CTB.
- Both canonical single-phase and multi-phase NFT templates now use the cleaner `Pending mint...` pre-mint data wording.
- NFT Terminal pre-mint `Updated` now shows the actual local refresh time rather than `AWAITING MINT`; all six market status tags update consistently.
- Mobile-only boot/status copy is shorter while desktop wording remains detailed.
- Mobile NFT market rows use compact aligned status/label/colon/value columns to prevent collisions such as `Top Sale 24h`.
- Countdown project/social rows now use compact phone tags (`[WEB]`, `[OPENSEA]`, `[X]`, `[TELEGRAM]`, `[TERMINAL]`) while desktop tags remain unchanged.
- Countdown action buttons now use the canonical CTB ice-blue clickable-action treatment.
- NFT CA, social links, mint phases, mint date/time, mint price and wallet limits remain user-entered Builder data and are not replaced by Spritehood-style TBA contract/schedule states.

This is the Chapter 20 NFT UX carry-over pass; deployment-flow integration remains the next Chapter 20 workstream.


## Chapter 20 — Acceptance Candidate (11 Aug 2026)

- Preserved the Chapter 19 final CTB palette and current ZIP-generation workflow; real deployment/live-URL integration remains a later Chapter 20 step.
- Applied Spritehood-proven generic NFT UX refinements without importing Spritehood branding, artwork, background, favicon, or yellow/purple palette.
- Fixed NFT countdown boot/status tag-to-message column alignment on desktop and mobile.
- Single-phase countdown now places Mint Fee and Mint per Wallet directly below the primary countdown with stronger CTB-palette emphasis.
- Multi-phase phase-card mint detail rows are left-aligned with the countdown column and the unwanted ice-blue divider above them is removed.
- Restored project mascot/logo rendering on both NFT countdown and NFT terminal pages with mount-aware NFT asset paths.
- Restored canonical Community Terminal footer styling on NFT pages; NFT pages add the OpenSea API information note and omit the obsolete OpenSea listings sentence.
- Project identity/disclaimer copy uses the project name rather than a dollar-prefixed ticker.
- Single-phase mint configuration now includes end date/time and transfers the complete schedule, timezone, fee and wallet limit to Phase 1 when switching to multiple phases; switching back restores the complete Phase 1 values.
- Builder Landing Preview mascot uses the same 220x86 contain slot as generated Community Terminal headers for closer scale parity.

## Chapter 20 — Final cleanup / canonical-source freeze (12 Aug 2026)

Chapter 20 closes with a source-of-truth cleanup prompted by direct NFT-only generation testing.

- The latest accepted CTB archive now **supersedes all previous standalone base codes and derived templates**. This includes prior NFT-only single-phase bases, NFT-only multi-phase bases, token-only bases, and project-specific derivative templates. Future generation starts from the latest accepted CTB archive.
- NFT-only generation is now a CTB extraction/configuration workflow: select the appropriate CTB NFT module, inject the user-supplied project/mint data and logo/assets, strip unrelated Community Terminal hierarchy where required, validate, and package.
- The canonical multi-phase NFT runtime is now **strictly configuration-driven**. Visible phase labels, phase names, start/end schedule, mint fee, wallet limit, countdown state, and phase command rows are derived from `PROJECT_CONFIG.nft.mintPhases`.
- Removed historical project-specific fallback phase names, dates, prices, and limits from the canonical multi-phase runtime/template. Missing phase configuration produces a neutral `NOT CONFIGURED` state instead of another project's sample data.
- Added Chapter 20 regression coverage to reject historical/sample phase leakage and verify that generated multi-phase projects contain the values supplied in configuration.
- The CTB20 accepted NFT layout, responsive behavior, OpenSea/holder/sales/wallet logic, footer contract, palette, and Chapter 19/20 accepted UX remain unchanged by this cleanup.
- Deployment integration is intentionally deferred to the next workstream.

**Chapter 20 is COMPLETE / CLEANED / CANONICAL.**  
The next workstream is **CTB Chapter-20B — Deployment Integration**.



## Chapter 20B / Chapter 21 — Consolidated Development Record (13 Aug 2026)


### Consolidated from `CHAPTER20B_DEPLOYMENT_INTEGRATION_NOTES.md`

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

### Consolidated from `CHAPTER21A_NFT_CONTRACT_DISCOVERY_CHECKPOINT2_13AUG2026.md`

# CTB Chapter 21A — NFT Contract Discovery Checkpoint 2

Built from the source-neutralized Chapter 21A checkpoint, itself derived from accepted Chapter 20B commit 463be82.

Scope: project-specific NFT Terminal only. Robinhood NFT Radar is not included yet.

## Added
- Modular ChainDataProvider for Robinhood Chain RPC + Blockscout.
- Conservative NFT contract auto-discovery in Builder.
- ERC-721 / ERC-1155 detection using ERC-165 with Blockscout indexed fallback.
- Collection name, symbol, supply and holder-count discovery where available.
- Contract bytecode verification through Robinhood Chain public RPC.
- Explorer URL derivation.
- Metadata URI method identification (`tokenURI(uint256)` / `uri(uint256)`) without guessing a token ID.
- Builder auto-fills discovered collection name/supply only when safe; existing user-entered values are preserved.
- Discovery never invents OpenSea mapping, mint price, wallet limit or mint schedule.
- Generated NFT terminals expose `/api/contract-discovery`.
- NFT `contract` command now displays live/discovered standard, collection, symbol, supply, metadata method and explorer link.
- Single-phase and multi-phase templates both carry the same discovery layer.

## Data architecture
- Chain-native facts: Robinhood RPC + Blockscout.
- Marketplace data remains optional and separate.
- Public Robinhood RPC is used for basic reads; no API key is required by this checkpoint.
- No secrets are exposed client-side.

## Regression
- Full existing CTB test suite: PASS.
- Chapter 21 command regression: PASS.
- New Chapter 21 NFT discovery regression: PASS.
- Generated-package propagation check: PASS.

This is a test checkpoint, not a new canonical acceptance baseline.

### Consolidated from `CHAPTER21A_NFT_TERMINAL_COMMANDS_NOTES.md`

# CTB Chapter 21A — NFT Terminal Command Interface

Baseline: Chapter 20B accepted canonical state, GitHub commit `463be82`.

This checkpoint changes only the project-specific NFT Terminal interaction layer. Robinhood NFT Radar and new backend intelligence/provider refactors are not included yet.

Implemented in both single-phase and multi-phase NFT templates:

- Whale-Tracker-style project-derived command prompt.
- Five primary buttons: MINT, HOLDERS, WHALES, MARKET, WALLET.
- WALLET prefills `wallet ` and requires a user-supplied address.
- Clickable explained commands: mint, holders, whales, market, wallet <address>, status, floor, sales, collection, contract, refresh, clear.
- No `help` command. The clickable Quick Commands area is the command documentation.
- Commands reuse the existing Chapter 20B NFT APIs; no fake CTB Pulse or new intelligence endpoints are introduced in this checkpoint.
- Existing NFT UI panels, mint lifecycle, OpenSea integration, Blockscout integration, generator behavior, deployment integration, and ZIP fallback remain intact.

Regression protection:

- Added `test-chapter21-nft-terminal-commands.js`.
- Added the Chapter 21A regression to the builder `npm test` chain.
- Validates both canonical NFT templates and both generated single/multi-phase outputs.

### Consolidated from `CHAPTER21_FIX_BATCH_NOTES_13AUG2026.txt`

CTB Chapter 21 manual-test fix batch — 13 Aug 2026

Fixes from fresh HOODRAT generation test:
1. Preserve explicit UPDATE EXISTING release mode in build-complete flow.
2. Package creator Hoodrat footer avatar asset into generated NFT projects.
3. Align NFT Quick/Available Commands visual hierarchy with Whale Tracker.
4. Rename current mint output header to MINT STATUS.
5. Add deeper mint-history analytics endpoint and use it in commands.
6. Propagate OPENSEA_API_KEY server-side into connected Render services when configured.
7. Normalize NFT Terminal project logo dimensions to project-wide accepted size.
8. Add copy-wallet and Blockscout outbound actions to NFT whale/wallet/sales outputs.
9. Remove redundant floor/collection/contract/status/market commands from command guide/dispatcher.
10. Add clickable Back to commands after command output.
11. Add deeper commands: minters, distribution, activity; deepen mint/holders/whales/wallet/sales.

Manual acceptance still required.

### Consolidated from `CHAPTER21_PREFLIGHT_SOURCE_NEUTRALIZATION_12AUG2026.txt`

Chapter 21 preflight source-neutralization
Date: 12 Aug 2026

- Canonical raw CTB modules now boot from a neutral `template` profile.
- Removed active HOODRAT and STONKBROKERS project profiles from `config/projects`.
- Removed legacy HOODRAT / STONKBROKERS mascot assets from runnable source modules.
- Added a neutral CTB placeholder mascot to every runnable UI module.
- Generated-project behavior remains configuration-driven; generated terminals still receive their own project config/assets.
- Historical project names remain only where intentionally required by regression tests or project history documentation.
- Chapter 21 NFT Terminal command checkpoint remains included unchanged functionally.

### Consolidated from `CHAPTER21_STABILIZATION_PASS_13AUG2026.md`

# Chapter 21 Stabilization Pass — 13 Aug 2026

- Canonical mounted asset routing fixed for module-relative assets.
- Post-create Download ZIP button removed; export capability remains internal/fallback.
- Post-mint NFT commands: whales, entrants, movers, retention, activity, sales, pulse, wallet, refresh, clear.
- Mint/minter/velocity commands removed from post-mint command surface.
- Added /api/nft-postmint analytics using Blockscout transfer history + current holder state.
- OpenSea Render secret synchronization now verifies the env var after write before deploy.
- Marketplace data still requires OPENSEA_API_KEY in the CTB Builder server environment; generated source never contains the secret.

### Chapter 21 current stabilization notes

- Live Builder connected deployment requires `CONNECTED_DEPLOYMENTS_ENABLED=true` and `RELEASE_ACTIONS_ENABLED=true`; GitHub/Render/OpenSea secrets remain server-side.
- Fresh GitHub CREATE now initializes the repository at creation and waits for the `main` ref before publishing the generated tree, preventing the transient `Git Repository is empty` failure seen in live TEST-3.
- The Builder itself now uses the canonical red-boundary/footer/signature visual grammar, titled `Community Terminal Builder` / `ver 1.0`, without a project-team disclaimer.
- Chapter 21 uses a fresh browser-local saved-project namespace (`ctb.projects.v2`) so legacy CTB test saves do not appear in the Chapter 21 production workspace.
- Standalone Chapter 20B/21 checkpoint/fix-note files are consolidated into this README; `SHELL Token_Readme.md` remains separate by design.


## Chapter 21 final stabilization candidate — 13 Aug 2026

Latest manual-test fixes before complete Hoodrat acceptance:
- Landing configuration no longer depends on a single dynamic endpoint: generated projects include a static `01_Landing-Page/public/project-config.json` fallback and the Landing runtime tries it before `/api/config`.
- Post-creation deployment modal no longer exposes Open Terminal / Copy Link before deployment is complete; final success dialog remains Open Website + Close.
- NFT post-mint `retention` establishes a holder baseline on first observation and reports retention against that baseline on later observations.
- NFT post-mint commands support explicit cancellation, automatic cancellation when a new command starts, and an 18-second interactive timeout.
- Entrants/movers post-mint transfer scans are bounded to a smaller recent-page window for interactive responsiveness.
- Canonical generated footer remains shared across every generated module and uses the single `/ctb-shared/gokalp-hoodrat-signature.png` creator-avatar route.


## Chapter 21 — FINAL ACCEPTANCE — 13 Aug 2026

Chapter 21 Final Acceptance incorporates the live HOODRAT validation fixes.

- NFT `activity` and NFT Pulse 24h activity metrics use the bounded background activity cache instead of interactive Blockscout pagination; the last successful snapshot survives upstream timeout/rate-limit events.
- On mobile only, the Chapter 21 NFT command suite is placed below the NFT Buy/Sell tracker; desktop layout remains unchanged.
- On mobile only, NFT, Whale and Intel boot/status prompt copy is shortened to fit the terminal width cleanly; desktop wording remains unchanged.
- Existing accepted Landing, footer, deployment, configuration-driven generation, and working Chapter 21 command behavior remain unchanged.

Final acceptance archive: `Community_Terminal_Builder_CHAPTER21_FINAL_ACCEPTANCE_13AUG2026.zip`.


# 🚀🚀🚀 HUGE MILESTONE — CTB IS NOW A PROVEN LIVE PROJECT FACTORY — 13 Aug 2026

Chapter 21 marks the point where Community Terminal Builder stopped being only a builder prototype and proved the complete real-world operating model on a live project.

**HOODRAT is now running CTB Chapter 21 generated code.** The live project is no longer dependent on a separately hand-maintained Hoodrat source tree for normal updates. CTB can load the project configuration, regenerate the project, update its existing GitHub repository, allow Render to redeploy it, and preserve the same public live service.

This validates the full production loop:

`Exported Project Config → CTB → Validate / Generate → UPDATE EXISTING → GitHub → Render → Live Community Terminal`

### What this milestone proves

- CTB can configure and generate a complete multi-module Community Terminal from project data.
- CTB can deploy a fresh generated project through the connected GitHub + Render workflow.
- CTB can safely update an existing project repository instead of requiring manual code edits.
- A real live project — HOODRAT — has been transitioned onto CTB-generated Chapter 21 code.
- Project-specific source folders are no longer required as the normal maintenance model for CTB-managed projects.
- The portable project-specific artifact is now the exported CTB configuration (`*-config.json`), including project identity, contracts, links, enabled modules, NFT settings and embedded optimized mascot data.
- A saved project configuration can be loaded back into CTB and used to regenerate or update that project.
- Generated projects remain configuration-driven and project-neutral at the template level; project data is supplied by the exported configuration.
- GitHub stores the generated project source; Render serves the deployed project; CTB remains the control center.

### New maintenance model

The accepted direction after Chapter 21 is:

`One CTB codebase + small exported project configurations + generated GitHub repositories + Render services`

instead of:

`one manually maintained local source-code folder per project`.

The previous standalone Hoodrat local folder can therefore remain only as a historical/reference backup. Normal future Hoodrat changes should originate from CTB by loading the latest Hoodrat configuration and using the CTB update workflow.

### Chapter 21 preservation rule

The final accepted Chapter 21 implementation is the **proven-working engineering baseline** for all future UI/product work. It should be preserved unchanged as the fallback reference before Chapter 22 begins. Internally, this baseline may be thought of as the **PROVEN WORKING / NOT FUN** edition: technically proven, intentionally preserved before the complete product-experience redesign.

Chapter 21 should be marked **COMPLETE / CLEANED / CANONICAL** only after the final live acceptance pass confirms the Final Acceptance build in production. Until that last check is recorded, the archive remains the Final Acceptance candidate rather than a silently assumed canonical closure.

# Chapter 22 Roadmap — Product Experience Overhaul

Chapter 22 begins only from the preserved Chapter 21 proven-working baseline. Its purpose is not to rewrite the working engine. Its purpose is to transform the product surface.

## Goal 1 — Simplify CTB to the maximum useful extent

The user should provide project facts and make a few meaningful choices; CTB should make the technical decisions. Development-era concepts such as Builder Mode, deployment plumbing, release mechanics, technical validation detail and internal engineering controls should be automated, hidden, or moved behind a clearly separated advanced/developer surface wherever possible.

Target experience:

`Project → Modules → Conditional NFT Setup → Preview → Create / Update → Live URL`

The normal user flow should not feel like operating CTB's engineering console.

## Goal 2 — Make CTB and every generated terminal crypto-normy ready

Redesign the complete visual and interaction layer of both the Builder and generated Community Terminal pages. Move away from the current hacker-terminal/developer aesthetic toward an approachable, fun, crypto-native, meme-friendly experience that communities will want to use and share.

Core principle:

**Simple enough for a normy. Powerful enough underneath.**

The Chapter 21 data providers, analytics, generation architecture, configuration discipline, deployment workflow and safety gates remain the functional foundation. Chapter 22 should change the surface aggressively while protecting that proven engine.

### Chapter 22 — NFT-only generation correction (13 Aug 2026)

- NFT-only projects no longer require a fungible-token contract address when NFT Terminal is the only enabled module and Landing market data is disabled.
- True NFT-only output now opens the NFT countdown/mint experience from the public root instead of generating a token-style landing page as the primary UI.
- Native browser date/time picker affordances were restored for NFT mint schedule fields, including multi-phase schedule inputs.
- Multi-phase active phase command rows now show the phase remaining time when an end time is configured instead of only `MINT IS LIVE`.
- Token-enabled Community Terminal behavior remains unchanged.


### Chapter 22 — NFT-only browser validation correction (13 Aug 2026)

- Fixed a remaining browser-native validation regression that still forced **Token CA** on a fresh NFT-only project even though the generator already supported NFT-only output.
- Removed the hard-coded HTML `required` attribute from Token CA and made the native requirement follow the selected module profile dynamically.
- Token CA remains required for token-based terminals, but is explicitly skipped when **NFT Terminal is the only enabled terminal profile**.
- The Builder contract status now reports that Token CA is not required for a true NFT-only terminal instead of blocking creation.
- Strengthened Chapter 22 NFT-only regression coverage so a hard-coded Token CA requirement cannot return unnoticed.

### Chapter 22 — Duplicate phase-label countdown fix (13 Aug 2026)

- Fixed a multi-phase NFT countdown bug where two phases using the same visible label (for example two `ALLOWLIST` stages) could receive the same internal phase ID.
- Duplicate internal IDs caused the browser to update the first matching countdown element while a later phase remained stuck at `--D --H --M --S` even though its name, price, wallet limit, and schedule text were present.
- Builder-created multi-phase projects now use stable position-based internal IDs (`phase-1`, `phase-2`, etc.) that are independent from user-visible phase labels.
- Generator normalization now also enforces unique internal phase IDs for imported/custom project data, preserving compatibility with previously saved projects and duplicate labels.
- Added a Chapter 22 regression test covering a three-phase schedule with duplicate `ALLOWLIST` labels and requiring a unique countdown binding for every phase.

### Chapter 22 — NFT-only deployment handoff parity (13 Aug 2026)

- Fixed the Terminal Ready / connected-deployment summary for true NFT-only projects so it lists **NFT** only instead of the misleading **LANDING + NFT** combination.
- NFT-only public links shown by CTB now point to the actual generated entry route: `/nft` for countdown/mint builds and `/nft/terminal` for Terminal Only builds. The stored Render service root URL remains unchanged for deployment bookkeeping and public acceptance checks.
- The same NFT-aware public entry URL is used by the final deployment-success dialog.
- Added Chapter 22 regression coverage to prevent LANDING from reappearing in NFT-only deployment handoff UI.

### Chapter 22 — Final mascot persistence + plain footer ticker polish (13 Aug 2026)

- Fixed an NFT header mascot hydration regression where the server-rendered mascot initially appeared correctly and was then replaced by a broken image after client runtime initialization. NFT runtime now preserves a valid server-rendered mascot source and only resolves a config-derived source when the image has no source yet.
- Applied the mascot persistence rule to both canonical single-phase and multi-phase NFT templates.
- Removed CTB's automatic `$` prefix from the canonical generated disclaimer footer. Token and NFT terminals now always render the plain normalized ticker/name form, for example `Not affiliated with or endorsed by the official HOODBIRDS team.`
- Updated module runtime footer fallbacks so a saved ticker that already contains a leading `$` is normalized before disclaimer rendering.
- Added Chapter 22 regression coverage for both mascot persistence and the global no-`$` disclaimer rule.

### Chapter 22 — Pre-mint Blockscout graceful-state correction (13 Aug 2026)

- Canonical NFT templates now treat Blockscout `404` responses before the configured first mint phase as an expected **pre-mint / not-indexed-yet** state instead of a hard provider failure.
- `/api/mint-stats` returns a normal HTTP 200 `WAITING` payload with zero minted/holders while the scheduled mint has not started and Blockscout has not indexed the NFT contract yet.
- `/api/nft-whales` returns a normal pending holder snapshot with zero holders/whales before mint rather than escalating `no holders yet` into a 502/500-style failure path.
- `/api/nft-activity` returns an **awaiting on-chain activity** state before the first indexed NFT transfer, avoiding noisy Blockscout error logs during a valid countdown period.
- `/api/mint-intelligence` and `/api/nft-postmint` now expose pre-mint pending states without creating false holder-history baselines before any holders exist.
- NFT command output and **NFT Pulse** distinguish pre-mint states (`AWAITING ACTIVITY`, `NO HOLDERS YET`) from genuine provider outages.
- The existing Blockscout endpoint URLs and post-mint error handling remain unchanged; only the known scheduled pre-mint 404/no-data case is softened.

### Chapter 22 — Mint-live phase context + deploy decision color correction (13 Aug 2026)

- Replaced the generic multi-phase countdown subtitle `one or more mint phases are active or underway` with a cumulative, configuration-driven phase summary beneath **MINT IS LIVE**.
- After the first phase opens, the banner shows `PHASE-1 (Configured Phase Name)`; after later phases open it accumulates them with ` & `, for example `PHASE-1 (GTDs) & PHASE-2 (FCFs)`.
- Once every configured phase has opened, the phase-summary line disappears and the banner intentionally returns to **MINT IS LIVE** only.
- The cumulative line updates while the page remains open, uses the actual configured phase names, and is slightly larger/more prominent than the removed generic subtitle while remaining secondary to the main mint-live heading.
- In CTB's Terminal Ready deployment decision area, **DEPLOY / CONFIRM & DEPLOY** remain green while **CLOSE** is now red to prevent accidental cancellation when the two actions are adjacent.
- Added Chapter 22 regression coverage for the cumulative phase logic, the final-phase collapse behavior, and the red/green deployment decision hierarchy.


## Post-acceptance cleanup — deployment readiness, mint warning, mascot cleanup, landing height (14 Aug 2026)

- Past mint schedule warnings are now keyed only to the actual schedule date/time values, so editing price, wallet limit, phase label/name, links, or other non-time fields does not repeatedly reopen the warning. A materially changed past schedule can warn again.
- Connected deployment now waits up to three minutes for the public terminal and requires two consecutive successful public checks before declaring the website ready. The verification checks the public entry page, health/status, enabled module routes, and Landing CSS/JS when Landing is enabled.
- Canonical generated pages include a small style-readiness guard so navigation does not visibly flash raw unstyled HTML while stylesheets are still arriving.
- Mascot/logo upload now includes optional **REMOVE BACKGROUND (BETA)** processing with an in-Builder preview and a **USE ORIGINAL** fallback. The original upload is never silently modified.
- Landing terminal height is content-driven so the green border ends shortly after Available Terminals/footer rather than filling unused viewport space.

### Pre-simplification footer identity alignment (14 Aug 2026)

- Changed the generated footer disclaimer to use **Project Name** rather than **Ticker**: `Not affiliated with or endorsed by the official <Project Name> team.`
- This keeps the disclaimer identity aligned with the project name used by the Community Terminal header, while ticker-specific labels remain unchanged elsewhere.
- Applied the rule to the canonical shared generated footer, NFT template fallbacks, and the Whale Tracker, Meme Intel, Community Pulse, and Timeline runtime footer fallbacks.
- Updated Chapter 22 regression coverage so a project whose name differs from its ticker must render the project name in the disclaimer.

### Pre-simplification footer title identity alignment (14 Aug 2026)

- Changed the generated footer title from **Ticker + `Community Terminal`** to **Project Name + `Community Terminal`**.
- The `ver 1.0` line and all existing footer styling remain unchanged.
- This aligns the footer title with the Project Name used by the main Community Terminal header and the already-corrected project-team disclaimer.
- Applied the rule to the canonical shared generated footer, NFT template fallbacks, and the Whale Tracker, Meme Intel, Community Pulse, and Timeline runtime footer fallbacks.
- Updated Chapter 22 regression coverage so a project whose name differs from its ticker must render the Project Name in the footer title.

