"use strict";

const { ChainDataProvider, normalizeAddress, parseQuantity } = require("./chain-data-provider");

const ERC721_INTERFACE = "0x80ac58cd";
const ERC1155_INTERFACE = "0xd9b67a26";

function text(value) {
  const out = String(value == null ? "" : value).trim();
  return out || null;
}

function normalizeStandard(value) {
  const raw = String(value || "").toUpperCase().replace(/[_\s]/g, "-");
  if (raw.includes("1155")) return "ERC-1155";
  if (raw.includes("721")) return "ERC-721";
  return null;
}

function first(...values) {
  for (const value of values) if (value !== null && value !== undefined && value !== "") return value;
  return null;
}

async function discoverNftContract(address, options = {}) {
  const normalized = normalizeAddress(address);
  const provider = options.provider || new ChainDataProvider(options);

  const [codeResult, tokenInfo, erc721, erc1155, rpcName, rpcSymbol, rpcSupply] = await Promise.all([
    provider.getCode(normalized).then(value => ({ ok: true, value })).catch(error => ({ ok: false, error: error.message })),
    provider.getTokenInfo(normalized),
    provider.supportsInterface(normalized, ERC721_INTERFACE),
    provider.supportsInterface(normalized, ERC1155_INTERFACE),
    provider.readString(normalized, "0x06fdde03"), // name()
    provider.readString(normalized, "0x95d89b41"), // symbol()
    provider.readUint(normalized, "0x18160ddd"),   // totalSupply()
  ]);

  const hasCode = codeResult.ok ? Boolean(codeResult.value && !/^0x0*$/i.test(codeResult.value)) : null;
  const indexedStandard = normalizeStandard(tokenInfo?.type || tokenInfo?.token_type || tokenInfo?.standard);
  let standard = null;
  let standardSource = null;
  if (erc721 === true && erc1155 !== true) { standard = "ERC-721"; standardSource = "RPC ERC-165"; }
  else if (erc1155 === true && erc721 !== true) { standard = "ERC-1155"; standardSource = "RPC ERC-165"; }
  else if (indexedStandard) { standard = indexedStandard; standardSource = "Blockscout index"; }
  else if (erc721 === true) { standard = "ERC-721"; standardSource = "RPC ERC-165"; }
  else if (erc1155 === true) { standard = "ERC-1155"; standardSource = "RPC ERC-165"; }

  const collectionName = first(text(tokenInfo?.name), text(rpcName));
  const symbol = first(text(tokenInfo?.symbol), text(rpcSymbol));
  const safeSupply = first(parseQuantity(tokenInfo?.total_supply), parseQuantity(tokenInfo?.totalSupply), parseQuantity(rpcSupply));
  const holders = first(parseQuantity(tokenInfo?.holders_count), parseQuantity(tokenInfo?.holdersCount));

  const warnings = [];
  if (hasCode === false) warnings.push("No contract bytecode was found at this address on Robinhood Chain.");
  if (!standard) warnings.push("ERC-721 / ERC-1155 standard could not be confirmed safely.");
  if (!collectionName) warnings.push("Collection name could not be discovered.");
  if (safeSupply == null) warnings.push("Total supply could not be discovered safely.");
  if (!tokenInfo) warnings.push("Blockscout has not indexed token metadata for this contract yet, or the index is temporarily unavailable.");
  if (!codeResult.ok) warnings.push("Robinhood RPC contract verification is temporarily unavailable.");

  const validNft = hasCode !== false && Boolean(standard || indexedStandard);
  return {
    ok: true,
    address: normalized,
    chain: { name: "Robinhood Chain", chainId: 4663 },
    contract: { hasCode, verifiedByRpc: codeResult.ok, explorerUrl: provider.explorerUrl(normalized) },
    nft: {
      detected: validNft,
      standard,
      standardSource,
      collectionName,
      symbol,
      supply: safeSupply,
      holders,
      metadataUriMethod: standard === "ERC-1155" ? "uri(uint256)" : standard === "ERC-721" ? "tokenURI(uint256)" : null,
    },
    sources: {
      rpc: { available: codeResult.ok, url: provider.rpcUrl },
      blockscout: { available: Boolean(tokenInfo), apiBase: provider.blockscoutApiBase },
    },
    warnings,
  };
}

module.exports = { discoverNftContract, ERC721_INTERFACE, ERC1155_INTERFACE };
