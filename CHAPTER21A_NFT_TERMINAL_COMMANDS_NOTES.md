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
