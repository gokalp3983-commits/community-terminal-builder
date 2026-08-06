"use strict";

let CONFIG;
let MODULES;
let MARKET_REFRESH_MS = 30_000;
let hasMarketData = false;

const boot = document.getElementById("boot");
const output = document.getElementById("output");
const promptRow = document.getElementById("promptRow");
const input = document.getElementById("commandInput");
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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const promptText = () => `${CONFIG.project.promptUser}@${CONFIG.project.promptHost}:~$`;

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

function renderModules() {
  const container = document.getElementById("modulesList");
  container.innerHTML = "";
  for (const [key, module] of Object.entries(MODULES)) {
    const button = document.createElement("button");
    button.className = `module${module.status === "COMPLETE" ? " live" : ""}`;
    button.type = "button";
    button.dataset.module = key;
    button.innerHTML = `
      <div class="module-command">&gt; ${escapeHtml(module.command)}</div>
      <div class="module-title">${escapeHtml(module.title)}</div>
      <div class="module-copy">${escapeHtml(module.description)}</div>
      <span class="module-status${module.status === "COMPLETE" ? " live-status" : ""}">[ ${escapeHtml(module.status)} ]</span>`;
    button.addEventListener("click", () => {
      input.value = module.command;
      input.focus();
      input.setSelectionRange(module.command.length, module.command.length);
    });
    container.appendChild(button);
  }
}

function applyConfig() {
  const { project, branding, links } = CONFIG;
  const title = `${project.name} Community Terminal`;
  document.title = title;
  document.getElementById("pageDescription").content = `${title} — ${project.description}`;
  document.getElementById("themeColor").content = branding.themeColor;
  document.getElementById("terminalShell").setAttribute("aria-label", title);
  document.getElementById("homeLink").href = links.home;
  document.getElementById("homeLink").title = `Return to ${title}`;
  document.getElementById("mascot").src = branding.mascot;
  document.getElementById("mascot").alt = branding.mascotAlt;
  document.getElementById("terminalTitle").textContent = title.toUpperCase();
  document.getElementById("terminalSubtitle").innerHTML = `Independent Community Tools <span aria-hidden="true">•</span> ${escapeHtml(project.ecosystem)} Ecosystem`;
  document.getElementById("marketPanel").setAttribute("aria-label", `Live ${project.name} market data`);
  document.getElementById("promptLabel").textContent = promptText();
  document.getElementById("footerVersion").textContent = `${title} ver ${project.version}`;
  document.getElementById("footerCopy").innerHTML = `Independent community-built tools.<br>Not affiliated with or endorsed by the official ${escapeHtml(project.ticker)} team.<br>Built for the ${escapeHtml(project.ecosystem)} ${escapeHtml(project.ticker)} ecosystem.`;
  applyTheme(branding.colors || {});
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
    marketPrice.textContent = `$${market.priceUsd} USD / ${market.priceEth} ETH`;
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
    ["", 120],
    ['[ <span class="green">READY</span> ] Type <span class="red">help</span> for available modules.', 0],
  ];
  for (const [line, delay] of sequence) {
    await sleep(delay);
    write(boot, line || "&nbsp;");
  }
  promptRow.hidden = false;
  input.focus();
}

function echoCommand(command) {
  write(output, `<span class="green">${escapeHtml(promptText())}</span> ${escapeHtml(command)}`);
}

function showHelp() {
  const width = 14;
  const line = (cmd, desc) => write(output, `<span class="cyan">${escapeHtml(cmd.padEnd(width, " "))}</span>${escapeHtml(desc)}`);
  write(output, '<span class="yellow">Available modules</span>');
  for (const module of Object.values(MODULES)) line(module.command, module.title);
  line("about", `About ${CONFIG.project.name} Community Terminal`);
  line("clear", "Clear terminal output");
}

function showAbout() {
  write(output, `<span class="yellow">${escapeHtml(CONFIG.project.name)} Community Terminal</span>`);
  write(output, `Independent terminal-style tools created for the ${escapeHtml(CONFIG.project.name)} community.`);
}

async function launchModule(key) {
  const module = MODULES[key];
  if (!module) return;
  write(output, `Loading module: <span class="yellow">${escapeHtml(module.title)}</span>...`);
  await sleep(350);
  write(output, "Establishing secure connection...");
  await sleep(350);
  write(output, '<span class="green">Launching module in new tab...</span>');
  await sleep(300);
  window.open(module.url, "_blank", "noopener");
}

async function execute(raw) {
  const command = raw.trim();
  const lower = command.toLowerCase();
  if (!command) return;
  echoCommand(command);
  const moduleKey = Object.keys(MODULES).find((key) => {
    const moduleCommand = MODULES[key].command.toLowerCase();
    return lower === moduleCommand || (key === "intel" && lower === "intelligence") || (key === "nft" && lower === "mint");
  });
  if (lower === "help") showHelp();
  else if (moduleKey) await launchModule(moduleKey);
  else if (lower === "about") showAbout();
  else if (lower === "clear") output.innerHTML = "";
  else if (MODULES.whales && lower === `sudo ${MODULES.whales.command.toLowerCase()}`) {
    write(output, '<span class="red">Permission denied.</span>');
    await sleep(350);
    write(output, '<span class="muted">...just kidding.</span>');
    await launchModule("whales");
  } else {
    write(output, `<span class="red">Command not found:</span> ${escapeHtml(command)}`);
    write(output, 'Type <span class="cyan">help</span> to list available modules.');
  }
}

document.getElementById("terminalForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const command = input.value;
  input.value = "";
  input.disabled = true;
  try { await execute(command); } finally { input.disabled = false; input.focus(); }
});

async function start() {
  try {
    CONFIG = await loadConfig();
    const featureForModule = {
      whales: "whaleTracker",
      intel: "memeIntel",
      nft: "nftTerminal",
    };
    MODULES = Object.fromEntries(
      Object.entries(CONFIG.modules)
        .filter(([key]) => CONFIG.features?.[featureForModule[key]] !== false)
        .map(([key, module]) => [key, { ...module, url: CONFIG.links.modules[key] }])
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
