"use strict";

const express = require("express");
const path = require("path");
const config = require("../config");

const app = express();
const port = Number(process.env.PORT || 3000);
const REQUEST_TIMEOUT_MS = 15_000;
let priceCache = null;

function getOrderedModules() {
  const order = Array.isArray(config.moduleOrder) ? config.moduleOrder : ["whales", "intel", "nft", "pulse", "timeline"];
  return Object.fromEntries(order.filter((key) => config.modules?.[key]).map((key) => [key, config.modules[key]]));
}

app.disable("x-powered-by");
app.use(express.static(path.join(__dirname, "public"), { extensions: ["html"], maxAge: 0 }));

function formatPriceUsd(value) {
  const price = Number(value);
  if (!Number.isFinite(price) || price <= 0) return null;
  if (price >= 1) return price.toFixed(4);
  if (price >= 0.01) return price.toFixed(6);
  return price.toFixed(8);
}

function formatPriceEth(value) {
  const price = Number(value);
  if (!Number.isFinite(price) || price <= 0) return null;
  return price.toFixed(10).replace(/0+$/, "").replace(/\.$/, "");
}

function formatCompactUsd(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(2)}B`;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(2)}K`;
  return `$${amount.toFixed(2)}`;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": `${config.project.id}-community-terminal/${config.project.version}`,
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) { const error = new Error(`HTTP ${response.status}`); error.status = response.status; throw error; }
  return response.json();
}

async function getProjectMarket() {
  if (priceCache && Date.now() - priceCache.fetchedAt < config.market.cacheTtlMs) return priceCache;

  const url = `https://api.dexscreener.com/token-pairs/v1/${config.market.dexScreenerChainId}/${config.contracts.token}`;
  const pairs = await fetchJson(url);
  if (!Array.isArray(pairs)) throw new Error("Unexpected DexScreener response");

  const tokenLower = config.contracts.token.toLowerCase();
  const selected = pairs
    .filter((pair) => {
      const baseAddress = String(pair?.baseToken?.address || "").toLowerCase();
      const quoteAddress = String(pair?.quoteToken?.address || "").toLowerCase();
      const tokenMatches = baseAddress === tokenLower || quoteAddress === tokenLower;
      const liquidityUsd = Number(pair?.liquidity?.usd || 0);
      const priceUsd = Number(pair?.priceUsd || 0);
      return tokenMatches && liquidityUsd > 0 && priceUsd > 0;
    })
    .sort((a, b) => {
      const aBase = String(a?.baseToken?.address || "").toLowerCase() === tokenLower ? 1 : 0;
      const bBase = String(b?.baseToken?.address || "").toLowerCase() === tokenLower ? 1 : 0;
      if (aBase !== bBase) return bBase - aBase;
      return Number(b?.liquidity?.usd || 0) - Number(a?.liquidity?.usd || 0);
    })[0];

  if (!selected) throw new Error(`No liquid ${config.project.name} pair found`);

  let holdersCount = null;
  try {
    const tokenInfo = await fetchJson(`${config.market.blockscoutApiBase}/tokens/${config.contracts.token}`);
    const parsedHolders = Number(tokenInfo?.holders_count);
    holdersCount = Number.isFinite(parsedHolders) ? Math.trunc(parsedHolders) : null;
  } catch (error) {
    console.error("Holder-count lookup failed:", error);
  }

  priceCache = {
    fetchedAt: Date.now(),
    priceUsd: Number(selected.priceUsd),
    priceQuote: Number(selected.priceNative),
    quoteSymbol: String(selected?.quoteToken?.symbol || "QUOTE").toUpperCase(),
    pairLabel: `${selected?.baseToken?.symbol || config.project.name}/${selected?.quoteToken?.symbol || "QUOTE"}`,
    marketCapUsd: Number(selected.marketCap || selected.fdv || 0),
    volume24hUsd: Number(selected?.volume?.h24 || 0),
    holdersCount,
  };
  return priceCache;
}

app.get("/api/config", (_req, res) => {
  res.json({
    project: config.project,
    branding: config.branding,
    links: config.links,
    features: config.features,
    moduleOrder: Array.isArray(config.moduleOrder) ? config.moduleOrder : ["whales", "intel", "nft", "pulse", "timeline"],
    modules: getOrderedModules(),
    contracts: config.contracts,
    market: {
      refreshMs: config.market.refreshMs,
      dexScreenerChainId: config.market.dexScreenerChainId,
      blockscoutApiBase: config.market.blockscoutApiBase,
    },
  });
});

app.get("/api/price", async (_req, res) => {
  if (!config.features.liveMarket) return res.status(404).json({ available: false, error: "Live market data is disabled." });
  try {
    const market = await getProjectMarket();
    res.json({
      available: true,
      priceUsd: formatPriceUsd(market.priceUsd),
      priceQuote: formatPriceEth(market.priceQuote),
      quoteSymbol: market.quoteSymbol,
      pairLabel: market.pairLabel,
      marketCapDisplay: formatCompactUsd(market.marketCapUsd),
      holdersDisplay: Number.isFinite(market.holdersCount) ? market.holdersCount.toLocaleString("en-US") : "NO HOLDER DATA",
      volume24hDisplay: formatCompactUsd(market.volume24hUsd) || "NO VOLUME DATA",
    });
  } catch (error) {
    console.error("Market lookup failed:", error);
    const message = String(error && error.message || error);
    const code = error && error.status === 429 ? "API_RATE_LIMITED"
      : /No liquid .* pair found/i.test(message) ? "PAIR_NOT_FOUND"
      : /timeout|aborted/i.test(message) ? "UPSTREAM_TIMEOUT"
      : "DATA_SOURCE_UNAVAILABLE";
    res.status(code === "PAIR_NOT_FOUND" ? 404 : 503).json({ available: false, code, error: code.replaceAll("_", " ") });
  }
});

app.get("/health", (_req, res) => res.json({ status: "ok", app: `${config.project.name} Community Terminal`, version: config.project.version }));
app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.listen(port, "0.0.0.0", () => {
  console.log("");
  console.log(`[ OK ] ${config.project.name} Community Terminal server started.`);
  console.log(`[ READY ] Open: http://localhost:${port}`);
  console.log("");
});
