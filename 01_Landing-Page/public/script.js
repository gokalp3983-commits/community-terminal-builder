"use strict";

let CONFIG;
let MODULES;
let MARKET_REFRESH_MS = 30_000;
let hasMarketData = false;
const FALLBACK_MODULE_ORDER = ["whales", "intel", "nft", "pulse", "timeline"];

const boot = document.getElementById("boot");
const output = document.getElementById("output");
const marketPanel = document.getElementById("marketPanel");
const marketPriceStatus = document.getElementById("marketPriceStatus");
const marketCapStatus = document.getElementById("marketCapStatus");
const marketHoldersStatus = document.getElementById("marketHoldersStatus");
const marketVolumeStatus = document.getElementById("marketVolumeStatus");
const marketUpdatedStatus = document.getElementById("marketUpdatedStatus");
const marketPrice = document.getElementById("marketPrice");
const marketCap = document.getElementById("marketCap");
const marketHolders = document.getElementById("marketHolders");
const marketVolume = document.getElementById("marketVolume");
const marketUpdated = document.getElementById("marketUpdated");
const tokenContractValue = document.querySelector("[data-token-contract]");
const copyTokenContract = document.querySelector("[data-copy-token-contract]");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function write(target, html) {
  const line = document.createElement("div");
  line.className = "line";
  line.innerHTML = html;
  target.appendChild(line);
  line.scrollIntoView({ block: "nearest" });
}

async function loadConfig() {
  const response = await fetch("/api/config", { headers: { Accept: "application/json" }, cache: "no-store" });
  if (!response.ok) throw new Error("Project configuration is unavailable.");
  return response.json();
}

function applyTheme(colors) {
  const root = document.documentElement;
  const map = {
    background: "--bg", panel: "--panel", green: "--green", yellow: "--yellow",
    cyan: "--cyan", blue: "--blue", orange: "--orange", red: "--red",
    muted: "--muted", line: "--line",
  };
  for (const [key, cssVariable] of Object.entries(map)) {
    if (colors[key]) root.style.setProperty(cssVariable, colors[key]);
  }
}

function setupTokenContract(){const address=CONFIG?.contracts?.token||"";if(tokenContractValue)tokenContractValue.textContent=address||"NOT SET";if(copyTokenContract){copyTokenContract.addEventListener("click",async()=>{if(!address)return;try{await navigator.clipboard.writeText(address);copyTokenContract.textContent="✓";setTimeout(()=>copyTokenContract.textContent="⧉",900)}catch{tokenContractValue?.focus?.()}})}}

function renderModules() {
  const tabs = document.getElementById("quickAccessTabs");
  const explanations = document.getElementById("modulesList");
  tabs.innerHTML = "";
  explanations.innerHTML = "";

  const moduleOrder = Array.isArray(CONFIG?.moduleOrder) ? CONFIG.moduleOrder : FALLBACK_MODULE_ORDER;
  for (const key of moduleOrder) {
    const module = MODULES[key];
    if (!module) continue;
    const tab = document.createElement("button");
    tab.className = "quick-access-tab";
    tab.type = "button";
    tab.dataset.module = key;
    tab.textContent = module.command.toUpperCase();
    tab.setAttribute("aria-label", `Open ${module.title}`);
    tab.addEventListener("click", () => {
      window.open(module.url, "_blank", "noopener");
    });
    tabs.appendChild(tab);

    const row = document.createElement("div");
    row.className = "module-explanation";
    row.dataset.module = key;
    row.innerHTML = `
      <span class="module-explanation-command">&gt; ${escapeHtml(module.command.charAt(0).toUpperCase() + module.command.slice(1))}</span>
      <span class="module-explanation-title">${escapeHtml(module.title)}</span>
      <span class="module-explanation-copy">${escapeHtml(module.description)}</span>`;
    explanations.appendChild(row);
  }
}

function applyConfig() {
  const { project, branding, links } = CONFIG;
  const title = `${project.name} Community Terminal`;
  document.title = title;
  document.getElementById("pageDescription").content = `${title} — ${project.description}`;
  document.getElementById("themeColor").content = branding.themeColor;
  document.getElementById("terminalShell").setAttribute("aria-label", title);
  const homeLink = document.getElementById("homeLink");
  homeLink.href = "/";
  homeLink.title = `Return to ${title}`;
  if (!homeLink.dataset.homeConfirmBound) {
    homeLink.addEventListener("click", (event) => {
      if (!window.confirm("Return to the main Community Terminal landing page?")) event.preventDefault();
    });
    homeLink.dataset.homeConfirmBound = "true";
  }
  document.getElementById("mascot").src = branding.mascot;
  document.getElementById("mascot").alt = branding.mascotAlt;
  document.getElementById("terminalTitle").textContent = title.toUpperCase();
  document.getElementById("terminalSubtitle").innerHTML = `Independent Community Tools <span aria-hidden="true">•</span> ${escapeHtml(project.ecosystem)} Ecosystem`;
  document.getElementById("marketPanel").setAttribute("aria-label", `Live ${project.name} market data`);
  document.getElementById("footerCopy").innerHTML = `Built by Gokalp <a class="x-credit" href="https://x.com/Gokalp8339" target="_blank" rel="noopener noreferrer" aria-label="Gokalp8339 on X">X @Gokalp8339</a><br>Not affiliated with or endorsed by the official ${escapeHtml(project.ticker)} team.`;
  applyTheme(branding.colors || {});
  setupTokenContract();
  renderModules();
}

async function getLiveMarket() {
  const response = await fetch("/api/price", { headers: { Accept: "application/json" }, cache: "no-store" });
  const data = await response.json();
  if (!response.ok || !data.available) throw new Error(data.error || "Live market data unavailable.");
  return data;
}

function formatWidgetTime(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function setMarketStatus(text, state = "") {
  for (const element of [marketPriceStatus, marketCapStatus, marketHoldersStatus, marketVolumeStatus, marketUpdatedStatus]) {
    element.textContent = `[ ${text} ]`;
    element.classList.toggle("error", state === "error");
  }
}

async function refreshMarketWidget() {
  setMarketStatus(hasMarketData ? "REFRESHING" : "CONNECTING");
  try {
    const market = await getLiveMarket();
    marketPrice.textContent = `$${market.priceUsd} USD / ${market.priceQuote} ${market.quoteSymbol || "QUOTE"}`;
    marketCap.textContent = market.marketCapDisplay || "NO MARKET CAP DATA";
    marketHolders.textContent = market.holdersDisplay || "NO HOLDER DATA";
    marketVolume.textContent = market.volume24hDisplay || "NO VOLUME DATA";
    marketUpdated.textContent = formatWidgetTime(new Date());
    setMarketStatus("LIVE");
    hasMarketData = true;
  } catch (error) {
    const reason = String(error && error.message || "DATA SOURCE UNAVAILABLE").toUpperCase();
    setMarketStatus(reason, "error");
    if (!hasMarketData) {
      marketPrice.textContent = reason;
      marketCap.textContent = reason;
      marketHolders.textContent = reason;
      marketVolume.textContent = reason;
      marketUpdated.textContent = "—";
    }
  }
}

async function bootSequence() {
  const sequence = [
    [`Initializing ${CONFIG.project.ecosystem}, ${CONFIG.project.name} Community Terminal...`, 250],
    [`Loading ${CONFIG.project.ecosystem}...`, 300],
    ["Loading project registry...", 280],
    ["Loading available project modules...", 320],
    ["", 120],
    ...Object.values(MODULES).map((module) => [`[ <span class="green">${escapeHtml(module.status)}</span> ] ${escapeHtml(module.title)}`, 250]),
    ["", 0],
  ];
  for (const [line, delay] of sequence) {
    await sleep(delay);
    write(boot, line || "&nbsp;");
  }
}

async function start() {
  try {
    CONFIG = await loadConfig();
    const featureForModule = {
      whales: "whaleTracker",
      intel: "memeIntel",
      pulse: "communityPulse",
      timeline: "timeline",
      nft: "nftTerminal",
    };
    MODULES = Object.fromEntries(
      (Array.isArray(CONFIG?.moduleOrder) ? CONFIG.moduleOrder : FALLBACK_MODULE_ORDER)
        .filter((key) => CONFIG.modules?.[key])
        .filter((key) => CONFIG.features?.[featureForModule[key]] !== false)
        .map((key) => [key, { ...CONFIG.modules[key], url: CONFIG.links.modules[key] }])
    );
    MARKET_REFRESH_MS = Number(CONFIG.market?.refreshMs) || 30_000;
    applyConfig();
    if (CONFIG.features.liveMarket) {
      refreshMarketWidget();
      setInterval(refreshMarketWidget, MARKET_REFRESH_MS);
    } else {
      marketPanel.hidden = true;
    }
    await bootSequence();
  } catch (error) {
    console.error(error);
    write(boot, '<span class="red">[ CONFIG ERROR ] Unable to load project configuration.</span>');
  }
}

start();
