# Community Terminal Builder

**Release:** Chapter 11 — Public Deployment Acceptance Toolkit  
**Builder version:** 1.1.0  
**Status:** Public-deployment acceptance candidate  
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
| Actual public Render acceptance run | PENDING USER DEPLOYMENT |
| Accounts and cloud project storage | NOT INCLUDED |
| Automatic GitHub/Render account actions | NOT INCLUDED |
| Payments and subscriptions | NOT INCLUDED |

The technical builder is approximately **97% complete**. Chapter 11 supplies repeatable tests for the actual public builder and terminal URLs. The remaining work is the external deployment itself, live upstream API observation, and optional commercial infrastructure.

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
Push Chapter 10 to a GitHub repository
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

The Blueprint uses:

```text
Root directory: 05_Community-Terminal-Builder
Start command: npm start
Health check: /health
NODE_ENV: production
```

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

## 8. Generate and run a terminal

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

## 9. Security and operational boundaries

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

## 10. Current workflow

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

## 11. Recommended next chapter

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

After stable v1.0, optional product chapters can add accounts, cloud storage, GitHub publishing, one-click deployment, custom domains, branding plans and payments.


## Chapter 11 acceptance record

Fill this after the real Render deployment:

```text
Builder public URL:        PENDING
Builder acceptance:        PENDING
Generated project:         PENDING
Terminal public URL:       PENDING
Terminal acceptance:       PENDING
Cold-start observation:    PENDING
Live API observation:      PENDING
Critical issues:           PENDING
Acceptance date:           PENDING
```

A release should be marked **PUBLICLY ACCEPTED** only after both `test:deployed` commands pass and the manual browser checklist is complete.
