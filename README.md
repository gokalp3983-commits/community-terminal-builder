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
