"use strict";
const fs = require("fs");
const path = require("path");
const { createZip } = require("./zip");
const { DEFAULT_TERMINAL_THEME } = require("./theme-contract");
const MASTER_ROOT = path.resolve(__dirname, "..");
const MODULES = ["01_Landing-Page", "02_Whale-Activity-Tracker", "03_NFT-Collection-Terminal", "04_Meme-Intel", "06_Community-Pulse", "07_Timeline"];
const NFT_MULTI_TEMPLATE = "03_NFT-Collection-Terminal-Multi-Phase";
const BUILDER_VERSION = "1.3.2-b";
const CONFIG_SCHEMA_VERSION = 1;
const TERMINAL_ENGINE_VERSION = "1.0.0";

function text(v, fallback = "") { const value = typeof v === "string" ? v.trim() : ""; return value || fallback; }
function bool(v, fallback = false) { return typeof v === "boolean" ? v : fallback; }
function numberOrNull(v) { const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : null; }
function slugify(value) { return text(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function normalizeExternalUrl(value) {
  const raw = text(value);
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^\/\//.test(raw)) return `https:${raw}`;
  return `https://${raw.replace(/^\/+/, "")}`;
}
function normalizeXUrl(value) {
  const raw = text(value);
  if (!raw) return "";
  if (/^@?[A-Za-z0-9_]{1,15}$/.test(raw)) return `https://x.com/${raw.replace(/^@/, "")}`;
  const normalized = normalizeExternalUrl(raw);
  try {
    const url = new URL(normalized);
    if (/(^|\.)twitter\.com$/i.test(url.hostname)) url.hostname = "x.com";
    return url.href.replace(/\/$/, "");
  } catch { return normalized; }
}
function openSeaSlugFromUrl(value) {
  const raw = text(value);
  if (!raw) return "";
  try {
    const parsed = new URL(normalizeExternalUrl(raw));
    if (!/(^|\.)opensea\.io$/i.test(parsed.hostname)) return "";
    const parts = parsed.pathname.split("/").filter(Boolean);
    const index = parts.findIndex(part => part.toLowerCase() === "collection");
    return index >= 0 && parts[index + 1] ? decodeURIComponent(parts[index + 1]).trim() : "";
  } catch { return ""; }
}
function assertAddress(value, field, optional = false) {
  if (optional && !value) return;
  if (!/^0x[a-fA-F0-9]{40}$/.test(value || "")) throw new Error(`${field} must be a valid 0x EVM address.`);
}
function normalize(input) {
  const name = text(input.projectName).toUpperCase();
  if (!name) throw new Error("Project name is required.");
  const id = slugify(input.projectId || name);
  if (!id) throw new Error("Project ID could not be generated.");
  const tickerRaw = text(input.ticker).toUpperCase().replace(/^\$/, "");
  if (!tickerRaw) throw new Error("Ticker is required.");
  const token = text(input.tokenContract);
  const nft = text(input.nftContract);
  assertAddress(token, "Token contract"); assertAddress(nft, "NFT contract", true);
  const nftRequested = bool(input.features?.nftTerminal, Boolean(nft));
  if (nftRequested && !nft) throw new Error("NFT contract is required when NFT Terminal is enabled.");
  const nftEnabled = nftRequested && Boolean(nft);
  const requestedNftMode = ["single","multiple","terminal"].includes(text(input.nft?.mode)) ? text(input.nft?.mode) : "single";
  const openSeaUrl = normalizeExternalUrl(input.links?.openSea);
  const derivedOpenSeaSlug = openSeaSlugFromUrl(openSeaUrl);
  const openSeaSlug = derivedOpenSeaSlug || text(input.nft?.openSeaSlug);
  if (nftEnabled && openSeaUrl && !derivedOpenSeaSlug) throw new Error("OpenSea URL must be a valid collection link (opensea.io/collection/<slug>).");
  const mascot = input.mascot && input.mascot.dataBase64 ? input.mascot : null;
  const ext = mascot ? (text(mascot.extension, "png").replace(/[^a-z0-9]/gi, "").toLowerCase() || "png") : "svg";
  return {
    id, name, ticker: `$${tickerRaw}`, version: text(input.version, "1.0.0"),
    description: text(input.description, `Terminal-style tools for the ${name} community.`),
    ecosystem: text(input.ecosystem, "Robinhood Chain"),
    promptUser: tickerRaw.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 32), promptHost: "robinhood",
    token, nft, dexChain: text(input.dexScreenerChainId, "robinhood"),
    blockscout: text(input.blockscoutApiBase, "https://robinhoodchain.blockscout.com/api/v2").replace(/\/$/, ""),
    colors: { ...DEFAULT_TERMINAL_THEME },
    links: {
      home: text(input.links?.home) || "/", whales: text(input.links?.whales) || "/whales",
      intel: text(input.links?.intel) || "/intel", pulse: text(input.links?.pulse) || "/pulse", timeline: text(input.links?.timeline) || "/timeline", nft: requestedNftMode === "terminal" ? "/nft/terminal" : (text(input.links?.nft) || "/nft"), website: normalizeExternalUrl(input.links?.website),
      x: normalizeXUrl(input.links?.x), telegram: normalizeExternalUrl(input.links?.telegram), explorer: normalizeExternalUrl(input.links?.explorer),
      dexScreener: normalizeExternalUrl(input.links?.dexScreener), openSea: openSeaUrl,
    },
    nftSettings: (() => {
      const requestedMode = requestedNftMode;
      const phases = Array.isArray(input.nft?.mintPhases) ? input.nft.mintPhases.slice(0, 6).map((phase, index) => ({
        id: slugify(phase?.id || phase?.label || `phase-${index + 1}`) || `phase-${index + 1}`,
        label: text(phase?.label, `PHASE ${index + 1}`).toUpperCase(),
        name: text(phase?.name, text(phase?.label, `Phase ${index + 1}`)),
        startsAt: text(phase?.startsAt), endsAt: text(phase?.endsAt),
        price: text(phase?.price, "—"), limit: text(phase?.limit, "—"), timezone: text(phase?.timezone, text(input.nft?.timezone, "UTC")),
      })) : [];
      if (requestedMode === "multiple") {
        if (phases.length < 2) throw new Error("Multiple-phase NFT mint requires at least 2 phases.");
        for (const [index, phase] of phases.entries()) {
          const start = Date.parse(phase.startsAt), end = Date.parse(phase.endsAt);
          if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) throw new Error(`NFT phase ${index + 1} has an invalid start/end schedule.`);
          if (index && start < Date.parse(phases[index - 1].endsAt)) throw new Error(`NFT phase ${index + 1} starts before the previous phase ends.`);
        }
      }
      const mintPrice=text(input.nft?.mintPrice),mintLimit=text(input.nft?.mintLimit);
      if(nftEnabled&&requestedMode==="single"&&!mintPrice)throw new Error("NFT Mint Price is required for single-phase mint. Use 0 or FREE for a free mint.");
      if(nftEnabled&&requestedMode==="single"&&!mintLimit)throw new Error("NFT Mint Per Wallet / Wallet Limit is required for single-phase mint.");
      if(nftEnabled&&requestedMode==="multiple")for(const [index,phase] of phases.entries()){if(!phase.price||phase.price==="—")throw new Error(`NFT phase ${index+1} Mint Price is required.`);if(!phase.limit||phase.limit==="—")throw new Error(`NFT phase ${index+1} Mint Per Wallet / Wallet Limit is required.`)}
      return { collectionName: text(input.nft?.collectionName, `${name} NFT`), openSeaSlug, standard: text(input.nft?.standard), symbol: text(input.nft?.symbol), metadataUriMethod: text(input.nft?.metadataUriMethod), mode: requestedMode, mintAt: requestedMode === "terminal" ? "" : (requestedMode === "multiple" ? phases[0]?.startsAt || text(input.nft?.mintAt) : text(input.nft?.mintAt)), mintEndAt: requestedMode === "terminal" ? null : (text(input.nft?.mintEndAt) || null), mintPrice: requestedMode === "terminal" ? "" : mintPrice, mintLimit: requestedMode === "terminal" ? "" : mintLimit, mintPhases: requestedMode === "multiple" ? phases : [], timezone: text(input.nft?.timezone, "UTC"), supply: numberOrNull(input.nft?.supply), whaleThreshold: numberOrNull(input.nft?.whaleThreshold) || 10 };
    })(),
    features: { landing: true, whaleTracker: bool(input.features?.whaleTracker, true), nftTerminal: nftEnabled, memeIntel: bool(input.features?.memeIntel, true), communityPulse: bool(input.features?.communityPulse, true), timeline: bool(input.features?.timeline, true), liveMarket: bool(input.features?.liveMarket, true) },
    mascot, mascotPath: `/assets/${id}-mascot.${ext}`, mascotExt: ext,
  };
}
function js(value) { return JSON.stringify(value, null, 2); }
function mintDisplayFromIso(value) {
  const raw = text(value);
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/);
  if (!m) return "";
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const zone = m[6] === "Z" ? "UTC" : `GMT${m[6].replace(":00", "").replace(/^\+0/, "+").replace(/^-0/, "-")}`;
  return `${m[3]} ${months[Number(m[2]) - 1]} ${m[1]} at ${m[4]}:${m[5]} ${zone}`;
}
function phaseTimeDisplay(iso, timeZone) {
  const date = new Date(iso || "");
  if (!Number.isFinite(date.getTime())) return "configured time";
  try {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: timeZone || "UTC", day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit", hourCycle:"h23" }).formatToParts(date);
    const x = Object.fromEntries(parts.filter(part => part.type !== "literal").map(part => [part.type, part.value]));
    return `${x.day} ${x.month} · ${x.hour}:${x.minute} · ${timeZone || "UTC"}`;
  } catch { return mintDisplayFromIso(iso) || "configured time"; }
}
function mintFeeDisplay(value) {
  const raw = text(value);
  if (!raw) return "—";
  if (/^free$/i.test(raw) || /^0(?:\.0+)?(?:\s*(?:eth|ron|usd|usdc|usdt))?$/i.test(raw)) return "FREE";
  return raw;
}
function mintLimitDisplay(value) {
  const raw = text(value);
  if (!raw) return "—";
  return raw.replace(/\s*(?:per\s+wallet|\/?wallet)\s*$/i, "").trim() || raw;
}
function phaseDetailsMarkup(price, limit) {
  return `<div class="phase-details phase-details-kv">
                <div class="phase-detail-row"><span class="phase-detail-label">Mint Fee</span><span class="phase-detail-colon" aria-hidden="true">:</span><span class="phase-detail-value">${html(mintFeeDisplay(price))}</span></div>
                <div class="phase-detail-row"><span class="phase-detail-label">Mint per Wallet</span><span class="phase-detail-colon" aria-hidden="true">:</span><span class="phase-detail-value">${html(mintLimitDisplay(limit))}</span></div>
              </div>`;
}
function phaseMarkup(phases) {
  return phases.map((phase, index) => `<section id="phaseCard-${phase.id}" class="phase-countdown-card" data-phase="${phase.id}">
              <div class="phase-card-topline"><span class="phase-kind">[ ${phase.label} ]</span><span id="phaseStatus-${phase.id}" class="phase-status">[ UPCOMING ]</span></div>
              <h2>“${phase.name.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")}”</h2>
              ${phaseDetailsMarkup(phase.price, phase.limit)}
              <div id="phaseCountdown-${phase.id}" class="phase-countdown-value">--D --H --M --S</div>
              <div class="phase-time">Starts ${phaseTimeDisplay(phase.startsAt, phase.timezone)} <span aria-hidden="true">·</span> Ends ${phaseTimeDisplay(phase.endsAt, phase.timezone)}</div>
            </section>`).join("\n\n            ");
}
function phaseCommandMarkup(phases) {
  return phases.map((phase,index)=>`<div id="phaseCommand-${phase.id}" class="market-line market-countdown-line phase-command-line"><span class="market-tag countdown-tag">[ MINT ]</span><span class="market-label">Phase-${index+1}</span><span class="market-colon">:</span><strong id="phaseCommandValue-${phase.id}" class="market-value">--:--:--</strong></div>`).join("\n            ");
}

function html(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
function responsiveLinkCopy(desktopCopy, mobileCopy) {
  return `<span class="link-copy-desktop">${html(desktopCopy)}</span><span class="link-copy-mobile">${html(mobileCopy)}</span>`;
}
function projectMarketLinkRows(p, { includeOpenSea = false } = {}) {
  const rows = [
    ["Website", p.links.website, `Visit ${p.name} Official Website`, "Visit Website"],
    ["X", p.links.x, `Visit ${p.name} Official X Account`, "Open X"],
    ["Telegram", p.links.telegram, `Join ${p.name} Official Telegram`, "Open Telegram"],
    ...(includeOpenSea ? [["OpenSea", p.links.openSea || (p.nftSettings.openSeaSlug ? `https://opensea.io/collection/${p.nftSettings.openSeaSlug}/overview` : ""), `View ${p.name} NFT Collection on OpenSea`, "View Collection"]] : []),
  ];
  return rows.filter(([,url]) => url).map(([label,url,copy,mobileCopy]) => `<div class="market-line project-link-row"><span class="market-tag project-link-tag">[ LINK ]</span><span class="market-label">${html(label)}</span><span class="market-colon" aria-hidden="true">:</span><a class="market-value project-link-value" href="${html(url)}" target="_blank" rel="noopener noreferrer">${responsiveLinkCopy(copy,mobileCopy)}</a></div>`).join("\n          ");
}
function countdownProjectLinkRows(p) {
  // Reuse the countdown page's existing command-link area instead of adding a second social block.
  const openSea = p.links.openSea || (p.nftSettings.openSeaSlug ? `https://opensea.io/collection/${p.nftSettings.openSeaSlug}/overview` : "");
  const rows = [
    ["LINK", "WEB", "Website", p.links.website, `Visit ${p.name} Official Website`, "Visit Website"],
    ["OPENSEA", "OPENSEA", "OpenSea", openSea, `View ${p.name} NFT Collection on OpenSea`, "View Collection"],
    ["SOCIALS", "X", "X", p.links.x, `Visit ${p.name} Official X Account`, "Open X"],
    ["SOCIALS", "TELEGRAM", "Telegram", p.links.telegram, `Join ${p.name} Official Telegram`, "Open Telegram"],
  ];
  return rows.filter(([, , , url]) => url).map(([tag,mobileTag,label,url,copy,mobileCopy]) => `          <div class="launch-links-line project-launch-link"><span class="orange"><span class="desktop-launch-tag">[ ${tag} ]</span><span class="mobile-launch-tag">[${mobileTag}]</span></span><span class="project-launch-label">${html(label)}</span><span class="project-launch-colon" aria-hidden="true">:</span><a href="${html(url)}" target="_blank" rel="noopener noreferrer">${responsiveLinkCopy(copy,mobileCopy)}</a></div>`).join("\n");
}
function nftInfoLinkRows(p) {
  // OpenSea already has a canonical collection-info row in the NFT terminal. Do not duplicate it.
  const rows = [
    ["Website", p.links.website, `Visit ${p.name} Official Website`, "Visit Website"],
    ["X", p.links.x, `Visit ${p.name} Official X Account`, "Open X"],
    ["Telegram", p.links.telegram, `Join ${p.name} Official Telegram`, "Open Telegram"],
  ];
  return rows.filter(([,url]) => url).map(([label,url,copy,mobileCopy]) => `        <div class="info-row project-info-link-row"><span>${html(label)}</span><a href="${html(url)}" target="_blank" rel="noopener noreferrer">${responsiveLinkCopy(copy,mobileCopy)}</a></div>`).join("\n");
}

function profileSource(p) {
  const value = {
    project: { id:p.id, name:p.name, displayName:p.name, ticker:p.ticker, version:p.version, description:p.description, ecosystem:p.ecosystem, promptUser:p.promptUser, promptHost:p.promptHost },
    contracts: { token:p.token, nft:p.nft },
    market: { dexScreenerChainId:p.dexChain, blockscoutApiBase:p.blockscout, refreshMs:30000, cacheTtlMs:30000 },
    branding: { mascot:p.mascotPath, mascotAlt:`${p.name} mascot`, themeColor:p.colors.background, colors:p.colors },
    links: { home:p.links.home, modules:{whales:p.links.whales,intel:p.links.intel,nft:p.links.nft,pulse:p.links.pulse,timeline:p.links.timeline}, website:p.links.website,x:p.links.x,telegram:p.links.telegram,explorer:p.links.explorer,dexScreener:p.links.dexScreener,openSea:p.links.openSea },
    nft: p.nftSettings,
    timeline: { events: [] },
    features: p.features,
    moduleOrder: ["whales", "intel", "nft", "pulse", "timeline"],
    modules: {
      whales:{command:"whales",title:"Whale Activity Tracker",description:"Monitor Top-30 whales, DEX activity, and holder rankings.",status:p.features.whaleTracker?"READY":"DISABLED"},
      intel:{command:"intel",title:"Meme Intelligence Terminal",description:"Read market pulse, buy pressure, holder behavior, and transparent risk signals.",status:p.features.memeIntel?"READY":"DISABLED"},
      nft:{command:"nft",title:`${p.name} NFT Terminal`,description:p.features.nftTerminal?"NFT whale analytics and collection statistics.":"NFT collection analytics when configured.",status:p.features.nftTerminal?"READY":"DISABLED"},
      pulse:{command:"pulse",title:"Community Pulse",description:"Synthesize explainable market, holder, whale, fresh-wallet and NFT signals.",status:p.features.communityPulse?"READY":"DISABLED"},
      timeline:{command:"timeline",title:"Community Timeline",description:"Follow project, NFT and community milestones chronologically.",status:p.features.timeline?"READY":"DISABLED"}
    }
  };
  return `"use strict";\nmodule.exports = ${js(value)};\n`;
}
function makeMountableServer(source, moduleName) {
  const marker = source.lastIndexOf("app.listen(");
  if (marker < 0) throw new Error(`Unable to make ${moduleName}/server.js mountable.`);
  let prefix = source.slice(0, marker).trimEnd();
  if (["02_Whale-Activity-Tracker", "04_Meme-Intel", "06_Community-Pulse"].includes(moduleName)) {
    prefix += "\n\nstartActivityBackgroundRefresh();";
  }
  return `${prefix}\n\nmodule.exports = app;\n`;
}
function prefixBrowserRoutes(source, base) {
  return source
    .replace(/(["'`])\/project-config\.js(?:\?[^"'`]*)?\1/g, `$1${base}/project-config.js$1`)
    .replace(/(["'`])\/style\.css(?:\?[^"'`]*)?\1/g, `$1${base}/style.css$1`)
    .replace(/(["'`])\/countdown\.css(?:\?[^"'`]*)?\1/g, `$1${base}/countdown.css$1`)
    .replace(/(["'`])\/whale\.css(?:\?[^"'`]*)?\1/g, `$1${base}/whale.css$1`)
    .replace(/(["'`])\/intel\.css(?:\?[^"'`]*)?\1/g, `$1${base}/intel.css$1`)
    .replace(/(["'`])\/pulse\.css(?:\?[^"'`]*)?\1/g, `$1${base}/pulse.css$1`)
    .replace(/(["'`])\/timeline\.css(?:\?[^"'`]*)?\1/g, `$1${base}/timeline.css$1`)
    .replace(/(["'`])\/project-runtime\.js(?:\?[^"'`]*)?\1/g, `$1${base}/project-runtime.js$1`)
    .replace(/(["'`])\/whale\.js(?:\?[^"'`]*)?\1/g, `$1${base}/whale.js$1`)
    .replace(/(["'`])\/intel\.js(?:\?[^"'`]*)?\1/g, `$1${base}/intel.js$1`)
    .replace(/(["'`])\/pulse\.js(?:\?[^"'`]*)?\1/g, `$1${base}/pulse.js$1`)
    .replace(/(["'`])\/timeline\.js(?:\?[^"'`]*)?\1/g, `$1${base}/timeline.js$1`)
    .replace(/(["'`])\/script\.js(?:\?[^"'`]*)?\1/g, `$1${base}/script.js$1`)
    .replace(/(["'`])\/countdown\.js(?:\?[^"'`]*)?\1/g, `$1${base}/countdown.js$1`)
    .replace(/(["'`])\/binary-background\.js(?:\?[^"'`]*)?\1/g, `$1${base}/binary-background.js$1`)
    .replace(/(["'`])\/assets\//g, `$1${base}/assets/`)
    .replace(/(["'`])assets\//g, `$1${base}/assets/`)
    .replace(/(["'`])\/api\//g, `$1${base}/api/`);
}

function transformModuleFile(moduleName, relativeName, data, p) {
  let source = data.toString("utf8");
  if (moduleName === "03_NFT-Collection-Terminal") {
    const nftName = p.nftSettings.collectionName || `${p.name} NFT`;
    const openSea = p.links.openSea || (p.nftSettings.openSeaSlug ? `https://opensea.io/collection/${p.nftSettings.openSeaSlug}/overview` : "#");
    const nftSupply = p.nftSettings.supply == null ? 0 : p.nftSettings.supply;
    source = source
      .replaceAll("__CTB_NFT_COLLECTION_NAME_UPPER__", nftName.toUpperCase())
      .replaceAll("__CTB_PROJECT_NAME_UPPER__", p.name)
      .replaceAll("__CTB_PROJECT_NAME__", p.name)
      .replaceAll("__CTB_TICKER_PLAIN__", p.ticker.replace(/^\$/, ""))
      .replaceAll("__CTB_TICKER__", p.ticker)
      .replaceAll("__CTB_PROJECT_VERSION__", p.version)
      .replaceAll("__CTB_OPENSEA_URL__", openSea)
      .replaceAll("__CTB_X_URL__", p.links.x || "#")
      .replaceAll("__CTB_MASCOT_PATH__", p.mascotPath)
      .replaceAll("__CTB_PROJECT_ID__", p.id)
      .replaceAll("__CTB_NFT_SUPPLY__", String(nftSupply))
      .replaceAll("__CTB_MINT_FEE__", mintFeeDisplay(p.nftSettings.mintPrice))
      .replaceAll("__CTB_MINT_LIMIT__", mintLimitDisplay(p.nftSettings.mintLimit));

    if (relativeName === "server.js") {
      if (p.nftSettings.mode === "terminal") source = source.replace('app.get("/", (req, res) => {\n  renderProjectPage("index.html", "/", req, res);\n});', 'app.get("/", (req, res) => {\n  renderProjectPage("terminal.html", "/terminal", req, res);\n});');
      return Buffer.from(makeMountableServer(source, moduleName));
    }

    if (p.nftSettings.mode === "multiple") {
      if (/\.(css|js|html)$/.test(relativeName)) {
        source = source
          .replaceAll("#d4af37", p.colors.yellow)
          .replaceAll("#D4AF37", p.colors.yellow)
          .replaceAll("#6f5a1d", p.colors.line)
          .replaceAll("#ff3b30", p.colors.red)
          .replaceAll("#d7d7d7", p.colors.muted);
      }
      if (relativeName === "public/countdown.css") {
        const columns = Math.min(3, Math.max(2, p.nftSettings.mintPhases.length));
        source = source.replace(/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/, `grid-template-columns:repeat(${columns},minmax(0,1fr))`);
      }
      if (relativeName === "public/index.html") {
        const phases = p.nftSettings.mintPhases;
        source = source.replace(/            <div id="phaseCommand-allowlist1"[\s\S]*?<div id="phaseCommand-public"[^\n]*<\/div>/, phaseCommandMarkup(phases));
        source = source.replace(/          <div class="phase-countdown-grid"[^>]*>[\s\S]*?          <\/div>\n          <div class="launch-actions">/, `          <div class="phase-countdown-grid" aria-label="${p.name} mint phase schedule">\n            ${phaseMarkup(phases)}\n          </div>\n          <div class="launch-actions">`);
        const xLine = p.links.x ? `<div class="launch-links-line"><span class="orange">[ SOCIALS ]</span> <a href="${p.links.x}" target="_blank" rel="noopener noreferrer">${p.name} X Account</a></div>` : "";
        source = source.replace(/          <div class="launch-links-line"><span class="orange">\[ SOCIALS \]<\/span>[\s\S]*?<\/div>/, `          ${xLine}`);
      }
    } else if (relativeName === "public/countdown.js") {
      const mintAt = p.nftSettings.mintAt || "1970-01-01T00:00:00Z";
      source = source.replace(/const MINT_AT = new Date\([^\n]+\);/, `const MINT_AT = new Date(${JSON.stringify(mintAt)});`);
    }

    if (relativeName === "public/index.html") {
      const socialRows = countdownProjectLinkRows(p);
      // Replace the existing OpenSea/Socials command area as one unit so configured rows are never duplicated.
      source = source.replace(/\n\s*<div class="launch-links-line"><span class="orange">\[ OPENSEA \]<\/span>[\s\S]*?<\/div>(?:\n\s*<div class="launch-links-line"><span class="orange">\[ SOCIALS \]<\/span>[\s\S]*?<\/div>)?/, socialRows ? `\n${socialRows}` : "");
      source = source.replace(/<a class="terminal-action" href="(?:#|https:\/\/opensea\.io\/collection\/[^"]+)"([^>]*)>\[ VISIT OPENSEA \]<\/a>/g, `<a class="terminal-action" href="${openSea}" data-opensea-action$1>[ VISIT OPENSEA ]</a>`);
      source = source.replace(/<a class="terminal-action" href="(?:#|https:\/\/opensea\.io\/collection\/[^"]+)"([^>]*)>VISIT OPENSEA<\/a>/g, `<a class="terminal-action" href="${openSea}" data-opensea-action$1>VISIT OPENSEA</a>`);
      const mintDisplay = mintDisplayFromIso(p.nftSettings.mintAt);
      source = source
        .replace(/<h1>[^<]*<\/h1>/, `<h1>${p.name} COMMUNITY TERMINAL</h1>`)
        .replace(/<div id="mintReady" class="line"><span class="orange">\[ UPCOMING \]<\/span><span class="log-copy-desktop">Mint begins at [^<]*<\/span><span class="log-copy-mobile">[^<]*<\/span><\/div>/, `<div id="mintReady" class="line"><span class="orange">[ UPCOMING ]</span><span class="log-copy-desktop">Mint begins on ${mintDisplay || "the configured mint time"}.</span><span class="log-copy-mobile">Mint scheduled.</span></div>`)
        .replace(/after the mint begins at [^<]*<\/p>/, `after the mint begins on ${mintDisplay || "the configured mint time"}.</p>`)
        .replaceAll("[ ENTER NFT TERMINAL ]", "[ VISIT NFT TERMINAL ]")
        .replaceAll("ENTER NFT TERMINAL", "VISIT NFT TERMINAL");
      source = source.replace(/<div class="footer-version">\s*[^<]+\s*<\/div>/, `<div class="footer-version">\n            ${p.name} Community Terminal\n          </div>`);
    }
    if (relativeName === "public/script.js") {
      const mintDisplay = mintDisplayFromIso(p.nftSettings.mintAt);
      source = source.replace(/Mint begins at \d{2}:\d{2} GMT[+-]\d+\./g, `Mint begins on ${mintDisplay || "the configured mint time"}.`);
    }
    if (relativeName === "public/terminal.html") {
      const infoLinks = nftInfoLinkRows(p);
      source = source.replace(/(<div class="info-row">\s*<span>NFT Contract<\/span>[\s\S]*?<\/div>)/, infoLinks ? `$1\n${infoLinks}` : "$1");
      source = source.replace(/<a\s+href="#" data-opensea-link/g, '<a href="#" data-opensea-link');
      source = source.replace(/<a\s+href="#" data-opensea-link([\s\S]*?)>\s*View ([^<]+) NFT Collection on OpenSea\s*<\/a>/, '<a href="#" data-opensea-action$1><span class="link-copy-desktop">View $2 NFT Collection on OpenSea</span><span class="link-copy-mobile">View Collection</span></a>');
      source = source.replace(/<span data-project-version><\/span>/, `${p.name} NFT Terminal`);
    }
    if (["public/project-runtime.js", "public/countdown.js"].includes(relativeName)) {
      source = source.replace(/(["'])\/terminal\1/g, `$1/nft/terminal$1`);
      if (relativeName === "public/project-runtime.js") source = source.replace(/:\s*c\.links\.home/g, ': "/nft"');
    }
    if (relativeName === "public/index.html") {
      source = source.replaceAll('href="/terminal"', 'href="/nft/terminal"');
    }
  }
  if (relativeName === "server.js") return Buffer.from(makeMountableServer(source, moduleName));
  if (relativeName === "public/index.html" && ["01_Landing-Page", "02_Whale-Activity-Tracker", "04_Meme-Intel", "06_Community-Pulse", "07_Timeline"].includes(moduleName)) {
    const links = projectMarketLinkRows(p, { includeOpenSea: true });
    if (links) source = source.replace(/(<div class="market-line contract-address-line"[^>]*>[\s\S]*?<\/div>)/, `$1\n          ${links}`);
  }
  if (relativeName === "public/index.html" && moduleName !== "03_NFT-Collection-Terminal") {
    const faviconHref = p.mascot ? `assets/${p.id}-mascot.${p.mascotExt}` : "favicon.png";
    source = source.replace("</head>", `  <link rel="icon" href="${faviconHref}">\n  <link rel="apple-touch-icon" href="${faviconHref}">\n</head>`);
  }
  const bases = {"02_Whale-Activity-Tracker":"/whales", "03_NFT-Collection-Terminal":"/nft", "04_Meme-Intel":"/intel", "06_Community-Pulse":"/pulse", "07_Timeline":"/timeline"};
  if (bases[moduleName] && relativeName.startsWith("public/") && /\.(html|js)$/.test(relativeName)) {
    source = prefixBrowserRoutes(source, bases[moduleName]);
    return Buffer.from(source);
  }
  return Buffer.from(source);
}

function walkModule(dir, prefix, moduleName, entries, p, relative = "") {
  for (const item of fs.readdirSync(dir, { withFileTypes:true })) {
    if (["node_modules", ".git"].includes(item.name)) continue;
    if (["hoodrat-mascot.jpeg", "stonkbrokers-mascot.jpg", "stonkbrokers-mascot.svg"].includes(item.name)) continue;
    const full = path.join(dir, item.name);
    const relLocal = relative ? path.posix.join(relative, item.name) : item.name;
    const relZip = path.posix.join(prefix, item.name);
    if (item.isDirectory()) walkModule(full, relZip, moduleName, entries, p, relLocal);
    else entries.push({name:relZip,data:transformModuleFile(moduleName, relLocal, fs.readFileSync(full), p),mtime:fs.statSync(full).mtime});
  }
}
function rootPackage(p) {
  return JSON.stringify({
    name:`${p.id}-community-terminal`,
    version:p.version,
    private:true,
    description:`Unified ${p.name} Community Terminal`,
    main:"server.js",
    scripts:{start:"node server.js",check:"node --check server.js",test:"node validate-generated.js","test:deployed":"node verify-deployment.js"},
    engines:{node:">=18"},
    dependencies:{express:"^4.21.2"}
  }, null, 2) + "\n";
}
function rootServer() {
  return [
    '"use strict";',
    'const express=require("express");',
    'const config=require("./config");',
    'const app=express();',
    'const port=Number(process.env.PORT||3000);',
    'const startedAt=new Date();',
    'app.disable("x-powered-by");',
    'app.set("trust proxy",1);',
    'app.use((req,res,next)=>{',
    '  res.setHeader("X-Content-Type-Options","nosniff");',
    '  res.setHeader("X-Frame-Options","SAMEORIGIN");',
    '  res.setHeader("Referrer-Policy","strict-origin-when-cross-origin");',
    '  res.setHeader("Permissions-Policy","camera=(), microphone=(), geolocation=()");',
    '  res.setHeader("Cross-Origin-Resource-Policy","same-origin");',
    '  next();',
    '});',
    'const healthHandler=(_req,res)=>res.status(200).json({ok:true,status:"healthy",project:config.project.name,version:config.project.version,uptimeSeconds:Math.floor(process.uptime()),timestamp:new Date().toISOString()});',
    'app.get("/health",healthHandler);',
    'app.get("/healthz",healthHandler);',
    'app.get("/status",(req,res)=>res.status(200).json({',
    '  ok:true,',
    '  project:{id:config.project.id,name:config.project.name,ticker:config.project.ticker,version:config.project.version},',
    '  server:{startedAt:startedAt.toISOString(),uptimeSeconds:Math.floor(process.uptime()),environment:process.env.NODE_ENV||"development",port},',
    '  moduleOrder:Array.isArray(config.moduleOrder)?config.moduleOrder:["whales","intel","nft","pulse","timeline"],',
    '  modules:{landing:true,whales:Boolean(config.features.whaleTracker),intel:Boolean(config.features.memeIntel),nft:Boolean(config.features.nftTerminal),pulse:Boolean(config.features.communityPulse),timeline:Boolean(config.features.timeline),landingMarket:Boolean(config.features.liveMarket)},',
    '  routes:{home:"/",health:"/healthz",healthLegacy:"/health",status:"/status",whales:config.features.whaleTracker?"/whales":null,intel:config.features.memeIntel?"/intel":null,pulse:config.features.communityPulse?"/pulse":null,timeline:config.features.timeline?"/timeline":null,nft:config.features.nftTerminal?(config.nft?.mode==="terminal"?"/nft/terminal":"/nft"):null}',
    '}));',
    'if(config.features.whaleTracker) app.use("/whales",require("./02_Whale-Activity-Tracker/server"));',
    'if(config.features.nftTerminal) app.use("/nft",require("./03_NFT-Collection-Terminal/server"));',
    'if(config.features.memeIntel) app.use("/intel",require("./04_Meme-Intel/server"));',
    'if(config.features.communityPulse) app.use("/pulse",require("./06_Community-Pulse/server"));',
    'if(config.features.timeline) app.use("/timeline",require("./07_Timeline/server"));',
    'app.use("/",require("./01_Landing-Page/server"));',
    'app.use((err,req,res,next)=>{',
    '  console.error(`[ ERROR ] ${req.method} ${req.originalUrl}:`,err && err.message ? err.message : err);',
    '  if(res.headersSent) return next(err);',
    '  res.status(500).json({ok:false,error:"INTERNAL_SERVER_ERROR",message:process.env.NODE_ENV==="production"?"The terminal encountered an unexpected error.":String(err && err.message || err)});',
    '});',
    'app.listen(port,"0.0.0.0",()=>{',
    '  console.log(`\n[ READY ] ${config.project.name} Community Terminal: http://localhost:${port}`);',
    '  console.log(`[ READY ] Health: http://localhost:${port}/healthz`);',
    '  console.log(`[ READY ] Status: http://localhost:${port}/status`);',
    '  if(config.features.whaleTracker) console.log(`[ READY ] Whale Tracker: http://localhost:${port}/whales`);',
    '  if(config.features.memeIntel) console.log(`[ READY ] Meme Intel: http://localhost:${port}/intel`);',
    '  if(config.features.nftTerminal) console.log(`[ READY ] NFT Terminal: http://localhost:${port}/nft`);',
    '  if(config.features.communityPulse) console.log(`[ READY ] Community Pulse: http://localhost:${port}/pulse`);',
    '  if(config.features.timeline) console.log(`[ READY ] Community Timeline: http://localhost:${port}/timeline`);',
    '  console.log("");',
    '});',
    ''
  ].join("\n");
}

function renderYaml(p) {
  const serviceName = `${p.id}-community-terminal`.slice(0, 63);
  return `services:
  - type: web
    name: ${serviceName}
    runtime: node
    plan: free
    buildCommand: npm install
    startCommand: npm start
    healthCheckPath: /healthz
    autoDeploy: true
    envVars:
      - key: NODE_ENV
        value: production
      - key: NODE_VERSION
        value: 20
`;
}
function envExample() {
  return `# Optional local overrides
PORT=3000
NODE_ENV=development
`;
}

function walk(dir, prefix, entries) {
  for (const item of fs.readdirSync(dir, { withFileTypes:true })) {
    if (["node_modules", ".git"].includes(item.name)) continue;
    const full = path.join(dir, item.name); const rel = path.posix.join(prefix, item.name);
    if (item.isDirectory()) walk(full, rel, entries); else entries.push({name:rel,data:fs.readFileSync(full),mtime:fs.statSync(full).mtime});
  }
}
function defaultMascot(name) {
  const initials = name.slice(0, 2);
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" rx="72" fill="#03100b"/><circle cx="256" cy="256" r="170" fill="#39ff14" opacity=".15"/><text x="256" y="292" text-anchor="middle" font-family="monospace" font-size="130" font-weight="700" fill="#39ff14">${initials}</text></svg>`);
}

function canonicalFooterRuntime(p, moduleName) {
  const ticker = String(p.ticker || "").replace(/^\$/, "");
  const displayTicker = ticker || p.name;
  const base = moduleName === "01_Landing-Page" ? "" : ({"02_Whale-Activity-Tracker":"/whales","03_NFT-Collection-Terminal":"/nft","04_Meme-Intel":"/intel","06_Community-Pulse":"/pulse","07_Timeline":"/timeline"}[moduleName] || "");
  const openSeaLine = moduleName === "03_NFT-Collection-Terminal" ? '<span class="ctb-footer-opensea">NFT Collection statistics powered by OpenSea API.</span>' : "";
  const html = `<footer class="footer ctb-canonical-footer"><span class="ctb-footer-title">${displayTicker} Community Terminal</span><span class="ctb-footer-version">ver ${p.version}</span>${openSeaLine}<div class="builder-signature" aria-label="Built by Gokalp @Gokalp8339"><img class="builder-signature-avatar" src="${base}/assets/gokalp-hoodrat-signature.png" alt="Gokalp Hoodrat NFT avatar"><div class="builder-signature-copy"><span class="builder-signature-label">Built by</span><span class="builder-signature-name">Gokalp</span><a class="x-credit builder-signature-handle" href="https://x.com/Gokalp8339" target="_blank" rel="noopener noreferrer">𝕏 @Gokalp8339</a></div></div><div class="builder-signature-disclaimer">Not affiliated with or endorsed by the official $${ticker} team.</div></footer>`;
  return `(function(){function render(){var host=document.getElementById("terminal-footer");if(!host)return;host.innerHTML=${JSON.stringify(html)};host.style.borderTop="2px solid #ff2d2d";host.style.marginTop="18px";host.style.paddingTop="12px";host.style.textAlign="center";var title=host.querySelector(".ctb-footer-title"),version=host.querySelector(".ctb-footer-version"),sea=host.querySelector(".ctb-footer-opensea");if(title){title.style.display="block";title.style.textAlign="center"}if(version){version.style.display="block";version.style.textAlign="center";version.style.marginBottom="9px"}if(sea){sea.style.display="block";sea.style.textAlign="center";sea.style.marginBottom="10px"}}if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",render);else render();setTimeout(render,0);})();\n`;
}

function generatedValidator(p) {
  return [
    '"use strict";',
    'const fs=require("fs");',
    'const path=require("path");',
    'const {execFileSync}=require("child_process");',
    'const config=require("./config");',
    'const checks=[];',
    'function pass(name,ok){if(!ok)throw new Error(`FAIL: ${name}`);checks.push(name);console.log(`[ PASS ] ${name}`)}',
    `pass("active profile",config.project.id===${JSON.stringify(p.id)});`,
    'pass("root server",fs.existsSync("server.js"));',
    'pass("Render Blueprint",fs.existsSync("render.yaml"));',
    'pass("environment example",fs.existsSync(".env.example"));',
    'pass("deployment verifier",fs.existsSync("verify-deployment.js"));',
    'pass("release metadata",fs.existsSync("terminal-release.json"));',
    'pass("landing favicon",fs.existsSync(path.join("01_Landing-Page","public","favicon.png"))||fs.readFileSync(path.join("01_Landing-Page","public","index.html"),"utf8").includes("assets/"));',
    'const source=fs.readFileSync("server.js","utf8");',
    `pass("health route",source.includes('app.get("/health"'));`,
    `pass("healthz route",source.includes('app.get("/healthz"'));`,
    `pass("status route",source.includes('app.get("/status"'));`,
    'execFileSync(process.execPath,["--check","server.js"]);',
    'execFileSync(process.execPath,["--check","verify-deployment.js"]);',
    'for(const moduleName of ["01_Landing-Page","02_Whale-Activity-Tracker","03_NFT-Collection-Terminal","04_Meme-Intel","06_Community-Pulse","07_Timeline"])execFileSync(process.execPath,["--check",path.join(moduleName,"server.js")]);',
    `pass("NFT feature state",config.features.nftTerminal===${p.features.nftTerminal});`,
    'console.log(`\nRelease validation passed (${checks.length} checks).`);',
    ''
  ].join("\n");
}

function generatedDeploymentVerifier(p) {
  const expected={whales:Boolean(p.features.whaleTracker),intel:Boolean(p.features.memeIntel),pulse:Boolean(p.features.communityPulse),timeline:Boolean(p.features.timeline),nft:Boolean(p.features.nftTerminal)};
  return [
    '"use strict";',
    'const raw=process.argv[2]||process.env.TERMINAL_PUBLIC_URL;',
    'if(!raw){console.error("Usage: npm run test:deployed -- https://YOUR-TERMINAL.onrender.com");process.exit(2)}',
    'const base=raw.replace(/\\\/$/,"");',
    `const expected=${JSON.stringify(expected)};`,
    'const timeoutMs=Number(process.env.ACCEPTANCE_TIMEOUT_MS||30000);',
    'function pass(x){console.log(`[ PASS ] ${x}`)}',
    'function check(ok,x){if(!ok)throw new Error(x);pass(x)}',
    'const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));',
    'async function get(path,attempts=5){let lastError;for(let attempt=1;attempt<=attempts;attempt+=1){const c=new AbortController();const t=setTimeout(()=>c.abort(),timeoutMs);try{const response=await fetch(`${base}${path}`,{redirect:"follow",signal:c.signal});const transient=(response.status===404&&response.headers.get("x-render-routing")==="no-server")||[502,503,504].includes(response.status);if(!transient)return response;lastError=new Error(`${path} returned HTTP ${response.status}`)}catch(error){lastError=error}finally{clearTimeout(t)}if(attempt<attempts){console.log(`[ RETRY ] ${path} attempt ${attempt}/${attempts}`);await sleep(3000)}}throw lastError}',
    '(async()=>{',
    ' console.log(`[ ACCEPTANCE ] Public terminal: ${base}`);',
    ' const home=await get("/");check(home.status===200,"Landing Page returned HTTP 200");const html=await home.text();check(html.length>100,"Landing Page returned content");check(home.headers.get("x-content-type-options")==="nosniff","Security headers present");',
    ' const health=await get("/healthz");check(health.status===200,"/healthz returned HTTP 200");const h=await health.json();check(h.ok===true&&h.status==="healthy","/healthz is healthy");',
    ' const status=await get("/status");check(status.status===200,"/status returned HTTP 200");const s=await status.json();check(s.ok===true,"/status returned ok:true");check(s.modules.whales===expected.whales&&s.modules.intel===expected.intel&&s.modules.pulse===expected.pulse&&s.modules.timeline===expected.timeline&&s.modules.nft===expected.nft,"Mounted modules match generated profile");',
    ' for(const [name,on] of Object.entries(expected)){if(!on)continue;const r=await get(`/${name}`);check(r.status===200,`/${name} returned HTTP 200`)}',
    ' console.log("\\n[ ACCEPTED ] Public terminal deployment passed current release checks.");',
    '})().catch(e=>{console.error(`\\n[ FAIL ] ${e.name==="AbortError"?`Timed out after ${timeoutMs}ms`:e.message}`);process.exit(1)});',
    ''
  ].join("\n");
}

function releaseMetadata(p) {
  return JSON.stringify({
    product: "Community Terminal",
    project: { id:p.id, name:p.name, ticker:p.ticker, version:p.version, ecosystem:p.ecosystem },
    builder: { version:BUILDER_VERSION, configSchemaVersion:CONFIG_SCHEMA_VERSION, terminalEngineVersion:TERMINAL_ENGINE_VERSION },
    generatedAt: new Date().toISOString(),
    releaseStatus: "deployment-ready",
    chain: { type:"EVM", dexScreenerChainId:p.dexChain, blockscoutApiBase:p.blockscout },
    enabledModules: ["landing", ...(p.features.whaleTracker?["whales"]:[]), ...(p.features.memeIntel?["intel"]:[]), ...(p.features.nftTerminal?["nft"]:[]), ...(p.features.communityPulse?["pulse"]:[]), ...(p.features.timeline?["timeline"]:[])],
    routes: { home:"/", health:"/healthz", healthLegacy:"/health", status:"/status", whales:p.features.whaleTracker?"/whales":null, intel:p.features.memeIntel?"/intel":null, nft:p.features.nftTerminal?(p.nftSettings.mode==="terminal"?"/nft/terminal":"/nft"):null, pulse:p.features.communityPulse?"/pulse":null, timeline:p.features.timeline?"/timeline":null },
    deployment: { provider:"Render Blueprint compatible", blueprint:"render.yaml", publicAcceptanceCommand:"npm run test:deployed -- https://YOUR-TERMINAL.onrender.com" }
  }, null, 2) + "\n";
}
function generatedReadme(p) { return `# ${p.name} Community Terminal

Generated with Community Terminal Builder **v${BUILDER_VERSION}**.

Release metadata: \`terminal-release.json\`

Built by Gokalp — X: @Gokalp8339 (https://x.com/Gokalp8339)

## Release provenance

- Builder: v${BUILDER_VERSION}
- Config schema: v${CONFIG_SCHEMA_VERSION}
- Terminal engine: v${TERMINAL_ENGINE_VERSION}
- Release status: deployment-ready

## Local run

From this root folder:

\`\`\`bash
npm install
npm start
\`\`\`

Open **http://localhost:3000**.

Validate the generated package before launch:

\`\`\`bash
npm test
\`\`\`

## Enabled routes

- Landing Page: / 
- Whale Tracker: /whales (${p.features.whaleTracker ? "enabled" : "disabled"})
- Meme Intel: /intel (${p.features.memeIntel ? "enabled" : "disabled"})
- Community Pulse: /pulse (${p.features.communityPulse ? "enabled" : "disabled"})
- Community Timeline: /timeline (${p.features.timeline ? "enabled" : "disabled"})
- NFT Terminal: ${p.nftSettings.mode === "terminal" ? "/nft/terminal" : "/nft"} (${p.features.nftTerminal ? "enabled" : "disabled"})
- Render health check: /healthz
- Legacy health alias: /health
- Runtime status: /status

All enabled pages share one Node server and one port.

## Render deployment

1. Extract this folder and test it locally.
2. Create a GitHub repository and push the complete folder.
3. In Render, create a new **Blueprint** and select the repository.
4. Render reads \`render.yaml\`, installs dependencies, starts the server, and checks \`/healthz\`.
5. After deployment, open your Render URL. Internal routes remain relative, so they work on the public domain automatically.

The generated \`.env.example\` documents optional local environment variables. Do not commit private secrets to the project.

## Public acceptance test

After deployment, verify the real public URL from this root folder:

\`\`\`bash
npm run test:deployed -- https://YOUR-TERMINAL.onrender.com
\`\`\`

This checks the Landing Page, security headers, \`/healthz\`, \`/status\`, and every enabled module route. Free hosting may cold-start, so the acceptance tool allows a 30-second response window by default.
`; }
function generate(input) {
  const p = normalize(input); const root = `${p.name.replace(/[^A-Z0-9]+/g, "_")}_Community_Terminal`;
  const entries = [];
  for (const moduleName of MODULES) {
    const sourceName = moduleName === "03_NFT-Collection-Terminal" && p.nftSettings.mode === "multiple" ? NFT_MULTI_TEMPLATE : moduleName;
    walkModule(path.join(MASTER_ROOT, sourceName), `${root}/${moduleName}`, moduleName, entries, p);
  }
  for (const moduleName of MODULES) {
    const base = moduleName === "01_Landing-Page" ? "" : ({"02_Whale-Activity-Tracker":"/whales","03_NFT-Collection-Terminal":"/nft","04_Meme-Intel":"/intel","06_Community-Pulse":"/pulse","07_Timeline":"/timeline"}[moduleName] || "");
    entries.push({name:`${root}/${moduleName}/public/canonical-footer.js`,data:canonicalFooterRuntime(p,moduleName)});
    for (const entry of entries) {
      if (entry.name.startsWith(`${root}/${moduleName}/public/`) && entry.name.endsWith(".html")) {
        let html=entry.data.toString("utf8");
        if(!html.includes("canonical-footer.js")) html=html.replace("</body>",`  <script src="${base}/canonical-footer.js"></script>\n</body>`);
        entry.data=Buffer.from(html);
      }
    }
  }
  if (p.nftSettings.mode === "terminal") {
    for (let i = entries.length - 1; i >= 0; i--) {
      if (/\/03_NFT-Collection-Terminal\/public\/(?:index\.html|countdown\.js|countdown\.css)$/.test(entries[i].name)) entries.splice(i, 1);
    }
  }
  walk(path.join(MASTER_ROOT, "config"), `${root}/config`, entries);
  for (let i = entries.length - 1; i >= 0; i--) {
    if (/\/config\/projects\//.test(entries[i].name) || /\/config\/project\.config\.js$/.test(entries[i].name)) entries.splice(i, 1);
  }
  entries.push({name:`${root}/config/projects/${p.id}.js`,data:profileSource(p)});
  entries.push({name:`${root}/config/project.config.js`,data:`"use strict";\nmodule.exports = require("./projects/${p.id}");\n`});
  entries.push({name:`${root}/README.md`,data:generatedReadme(p)});
  entries.push({name:`${root}/package.json`,data:rootPackage(p)});
  entries.push({name:`${root}/server.js`,data:rootServer()});
  entries.push({name:`${root}/validate-generated.js`,data:generatedValidator(p)});
  entries.push({name:`${root}/verify-deployment.js`,data:generatedDeploymentVerifier(p)});
  entries.push({name:`${root}/terminal-release.json`,data:releaseMetadata(p)});
  entries.push({name:`${root}/render.yaml`,data:renderYaml(p)});
  entries.push({name:`${root}/.env.example`,data:envExample()});
  const mascotData = p.mascot ? Buffer.from(p.mascot.dataBase64, "base64") : defaultMascot(p.name);
  const defaultFavicon = fs.readFileSync(path.join(__dirname, "public", "favicon.png"));
  for (const moduleName of MODULES) {
    entries.push({name:`${root}/${moduleName}/public${p.mascotPath}`,data:mascotData});
    if (!p.mascot) entries.push({name:`${root}/${moduleName}/public/favicon.png`,data:defaultFavicon});
  }
  return { buffer:createZip(entries), filename:`${root}.zip`, project:p, entryCount:entries.length, root, entries };
}
module.exports = { generate, normalize };
