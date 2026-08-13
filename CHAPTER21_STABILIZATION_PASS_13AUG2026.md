# Chapter 21 Stabilization Pass — 13 Aug 2026

- Canonical mounted asset routing fixed for module-relative assets.
- Post-create Download ZIP button removed; export capability remains internal/fallback.
- Post-mint NFT commands: whales, entrants, movers, retention, activity, sales, pulse, wallet, refresh, clear.
- Mint/minter/velocity commands removed from post-mint command surface.
- Added /api/nft-postmint analytics using Blockscout transfer history + current holder state.
- OpenSea Render secret synchronization now verifies the env var after write before deploy.
- Marketplace data still requires OPENSEA_API_KEY in the CTB Builder server environment; generated source never contains the secret.
