"use strict";

const config = require("./project.config");

function requireText(value, path) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing required configuration value: ${path}`);
  }
}

function requireAddress(value, path, { optional = false } = {}) {
  if (optional && !value) return;
  requireText(value, path);
  if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
    throw new Error(`Invalid EVM contract address in configuration: ${path}`);
  }
}

function validateProjectConfig(value) {
  requireText(value?.project?.name, "project.name");
  requireText(value?.project?.ticker, "project.ticker");
  requireText(value?.project?.version, "project.version");
  requireText(value?.project?.promptUser, "project.promptUser");
  requireText(value?.project?.promptHost, "project.promptHost");
  const tokenRequired = Boolean(value?.features?.landing || value?.features?.whaleTracker || value?.features?.memeIntel || value?.features?.communityPulse || value?.features?.timeline || value?.features?.liveMarket);
  requireAddress(value?.contracts?.token, "contracts.token", { optional: !tokenRequired });
  requireAddress(value?.contracts?.nft, "contracts.nft", { optional: true });
  requireText(value?.market?.dexScreenerChainId, "market.dexScreenerChainId");
  requireText(value?.market?.blockscoutApiBase, "market.blockscoutApiBase");
  requireText(value?.branding?.mascot, "branding.mascot");
  requireText(value?.links?.home, "links.home");

  const canonicalModuleOrder = ["whales", "intel", "nft", "pulse", "timeline"];
  const moduleOrder = Array.isArray(value?.moduleOrder) ? value.moduleOrder : canonicalModuleOrder;
  if (moduleOrder.length !== canonicalModuleOrder.length || moduleOrder.some((key, index) => key !== canonicalModuleOrder[index])) {
    throw new Error("Invalid moduleOrder configuration. Expected whales, intel, nft, pulse, timeline.");
  }
  for (const key of canonicalModuleOrder) {
    if (!value?.modules?.[key]) continue;
    requireText(value.modules[key].command, `modules.${key}.command`);
    requireText(value.modules[key].title, `modules.${key}.title`);
  }

  return value;
}

module.exports = Object.freeze(validateProjectConfig(config));
