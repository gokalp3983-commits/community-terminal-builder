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
