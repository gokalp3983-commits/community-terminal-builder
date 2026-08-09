# $SHELL Token & Community Terminal Platform — Future Roadmap

**Document type:** Future-plan / product roadmap  
**Status:** Planning only — not part of the current Builder Mode implementation  
**Last updated:** 2026-08-08

This document intentionally stays separate from the main `README.md`. The main README records what the Community Terminal Builder has actually implemented and passed. This file captures the longer-term `$SHELL` utility-token, hosted-platform, ecosystem, and future-module direction until those items enter active development.

## 1. Product vision

The long-term idea is a recognizable **Community Terminal ecosystem on Robinhood Chain**: each community can create a terminal with the same core terminal DNA while retaining its own identity, token/NFT configuration, mascot, links, and enabled modules.

The main `$SHELL` site can act as the **mother terminal** for the ecosystem. A possible top-level navigation model is:

```text
HOME
TOKEN
COMMUNITY BUILDER
TERMINALS
ABOUT
```

The visual language should remain consistent with the Builder's accepted terminal contract:

- black terminal background;
- bright-green signature outer page frame;
- orange structural framing/headings;
- bright white primary text and important values;
- cyan links, prompts, highlights, and selected metrics;
- green LIVE / OK / READY / positive states;
- red negative states, errors, and warnings;
- compact terminal typography and information density.

## 2. `$SHELL` positioning

`$SHELL` is envisioned as a **utility token**, not a meme token.

Possible utility areas, subject to later design and implementation:

- payment for creating or publishing a Community Terminal;
- discounts or access tiers;
- ecosystem features and services;
- transparent usage-linked buyback/burn mechanics if implemented exactly as advertised.

A future payment model could allow Robinhood ETH or `$SHELL`. One concept is that ETH revenue could be used to buy back `$SHELL` and burn it, while direct `$SHELL` payments could potentially burn according to the final token/economic design.

**Important:** none of these token-economy claims should be presented publicly as active until the actual contracts, treasury logic, accounting, and user-facing behavior implement them exactly.

## 3. Possible hosted route architecture

A central route model is preferred as a concept over requiring a separate subdomain for every community. Example only:

```text
terminal.xyz/
terminal.xyz/token
terminal.xyz/builder
terminal.xyz/terminals
terminal.xyz/about

terminal.xyz/X1234
terminal.xyz/X1234/whales
terminal.xyz/X1234/intel
terminal.xyz/X1234/nft
terminal.xyz/X1234/nft/terminal
```

The `.xyz` part belongs to the domain only; it should not be repeated inside project route names.

The standalone generated ZIP must remain available as an advanced/fallback/export option even if central hosting becomes the normal public experience.

## 4. Platform architecture candidates

No architecture choice is locked yet. The options discussed are:

### A. Separate deployment per community

The current Builder model: each community gets its own generated project, GitHub repository, and hosting service.

Strengths: strong isolation and straightforward ownership.  
Trade-off: operating cost and deployment overhead grow with every community.

### B. Central multi-tenant platform

Projects become stored configuration records and a shared terminal engine renders `/PROJECT/...` routes.

Strengths: simpler public publishing and much lower per-project deployment overhead.  
Trade-off: requires project persistence, ownership, isolation, abuse protection, caching, and a stronger shared runtime.

### C. Hybrid

Normal projects use central hosting, while advanced/premium users can export or deploy standalone terminals.

This remains an attractive long-term possibility, but no decision should be made before the simplified end-user Builder has been built and evaluated.

## 5. Roadmap

The current working roadmap is:

| Phase | Goal | Status |
|---|---|---|
| Chapter 15A | Finish/freeze reliable local Builder | **PASSED — Builder Mode Final** |
| Chapter 15B | Simplify public-facing/end-user Builder flow | **NEXT** |
| Chapter 16 | Extract terminal configuration/rendering engine | FUTURE |
| Chapter 17 | Multi-project routing such as `/X1234/...` | FUTURE |
| Chapter 18 | PostgreSQL-backed project persistence | FUTURE |
| Chapter 19 | Wallet ownership + My Terminals | FUTURE |
| Chapter 20 | Public Preview → Publish workflow | FUTURE |
| Chapter 21 | Payment layer | FUTURE |
| Chapter 22 | `$SHELL` payment + buyback/burn design/implementation | FUTURE |
| Chapter 23 | Production hardening, monitoring, rate/abuse protection | FUTURE |
| Chapter 24 | Public `$SHELL` / platform launch | FUTURE |

The sequence can change as implementation teaches us more. No later phase should be treated as committed infrastructure before the preceding product experience is proven.

## 6. Chapter 15B target experience

The next milestone should hide developer complexity from normal users while retaining Builder Mode underneath.

Target normal-user flow:

```text
Project
   ↓
Token / NFT Details
   ↓
Choose Modules
   ↓
Branding
   ↓
Preview
   ↓
Confirm
   ↓
Generate / Publish
```

Normal users should not need to understand GitHub internals, Render service IDs, release fingerprints, one-time release authorization mechanics, or diagnostics unless those details are needed for troubleshooting or advanced mode.

## 7. Current module philosophy

The current strong V1 module set is intentionally compact:

- **Landing** — project identity and essential live token facts;
- **Whale** — holder concentration, large holders, and wallet behavior;
- **Intel** — project/community intelligence;
- **NFT** — optional dedicated NFT experience based on the canonical FINAL NFT-ONLY implementation.

The product should not become a clone of Dexscreener or a generic trading dashboard. Full candlestick charts, elaborate trading interfaces, swaps, order books, generic token discovery, and generic trending rankings are not priorities when established products already do those jobs well.

A useful filter for future modules is:

> Does this tell the community something useful about its own project that would otherwise require several sites or manual investigation?

## 8. New Module Candidates — definite additions

These two candidates are marked as **definite future additions** once the Builder/end-user foundation is ready. Their exact data sources, commands, scoring rules, and UI will be designed later.

### Candidate 1 — Community Pulse

A synthesized project-status module, **not a price chart**. It should combine meaningful community-specific signals into a concise terminal view.

Potential signals:

```text
[ POSITIVE ] Holder count rising
[ FLOW ]     Top wallets net accumulating
[ ACTIVE ]   New wallets entering
[ NFT ]      Collection activity elevated
[ WATCH ]    Top-10 concentration increased
[ TREASURY ] Meaningful treasury movement detected
```

Potential command family:

```text
pulse
pulse holders
pulse whales
pulse wallets
pulse nft
pulse risk
pulse 24h
pulse 7d
```

The final module should favor explainable signals over a mysterious composite score. If a score is ever added, its methodology must be transparent and defensible.

### Candidate 2 — Timeline / Logbook

A chronological project/community history that records meaningful events and gives every terminal its own evolving logbook.

Potential events:

- project/token launch;
- NFT mint;
- holder-count milestones;
- volume/activity records;
- burns or supply changes;
- listings;
- treasury events;
- governance votes/proposals;
- major verified announcements;
- other important community milestones.

Potential command family:

```text
timeline
logbook
timeline latest
timeline 30d
timeline milestones
timeline nft
timeline treasury
timeline governance
```

The goal is not to scrape noise. It should surface meaningful, attributable events and allow users to inspect a project's history directly from its terminal.

## 9. Other future command/module candidates

These remain exploratory rather than committed:

```text
holders       Holder distribution and concentration
buyers        Meaningful recent accumulation
sellers       Meaningful recent distribution
newwallets    Newly entering wallets
smartmoney    Notable wallet activity, only with responsible definitions
flows         Net movement into/out of tracked wallet groups
activity      Unusual on-chain activity
milestones    Holder, volume, burn, supply, or NFT milestones
treasury      Public treasury activity
links         Verified ecosystem links
status        Contract/network/API health
announcements Verified project/community updates
calendar      Upcoming project/community events
verify        Official contract/link verification
alerts        User-defined notable-event thresholds
```

Future additions should be validated with real Robinhood Chain communities before being promoted into the core Builder module list.

## 10. Community/network effect

A restrained attribution such as:

```text
Built with SHELL · Create your terminal
```

could eventually connect community terminals back to the mother terminal and make the ecosystem recognizable. This should remain subtle and useful rather than intrusive.

The cultural goal is for users to naturally say: **“check the terminal.”**

## 11. Possible future infrastructure components

Only when the product reaches the relevant chapters, likely components may include:

- one main web/Node service;
- PostgreSQL for project/configuration persistence;
- object storage for logos/assets;
- server-side caching for RPC/API data;
- wallet-based identity/ownership;
- payment verification;
- rate limiting and abuse protection;
- GitHub for source/release management;
- Render or another host initially;
- Cloudflare or equivalent for DNS/SSL/caching/protection if useful.

External RPC/API calls are likely to matter more to scaling than raw CPU for early terminal traffic, so caching, deduplication, provider limits, and resilient data handling should be designed before simply increasing compute.

## 12. Decision rule

Do **not** lock domain, hosting architecture, wallet stack, payment system, token economics, or multi-tenant design merely because they appear in this roadmap.

First:

1. keep the **Builder Mode Final** baseline safe;
2. build Chapter 15B and see the simplified end-user experience;
3. evaluate it with trusted Robinhood Chain users;
4. then make the next architecture/product decision with evidence.
