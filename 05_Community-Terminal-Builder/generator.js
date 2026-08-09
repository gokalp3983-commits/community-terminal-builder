"use strict";
const fs = require("fs");
const path = require("path");
const { createZip } = require("./zip");
const { DEFAULT_TERMINAL_THEME } = require("./theme-contract");
const MASTER_ROOT = path.resolve(__dirname, "..");
const MODULES = ["01_Landing-Page", "02_Whale-Activity-Tracker", "03_NFT-Collection-Terminal", "04_Meme-Intel"];
const NFT_MULTI_TEMPLATE = "03_NFT-Collection-Terminal-Multi-Phase";
const BUILDER_VERSION = "1.3.2-b";
const CONFIG_SCHEMA_VERSION = 1;
const TERMINAL_ENGINE_VERSION = "1.0.0";

function text(v, fallback = "") { const value = typeof v === "string" ? v.trim() : ""; return value || fallback; }
function bool(v, fallback = false) { return typeof v === "boolean" ? v : fallback; }
function numberOrNull(v) { const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : null; }
function slugify(value) { return text(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
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
  const nftEnabled = bool(input.features?.nftTerminal, Boolean(nft)) && Boolean(nft);
  const mascot = input.mascot && input.mascot.dataBase64 ? input.mascot : null;
  const ext = mascot ? (text(mascot.extension, "png").replace(/[^a-z0-9]/gi, "").toLowerCase() || "png") : "svg";
  return {
    id, name, ticker: `$${tickerRaw}`, version: text(input.version, "1.0.0"),
    description: text(input.description, `Terminal-style tools for the ${name} community.`),
    ecosystem: text(input.ecosystem, "Robinhood Chain"),
    promptUser: text(input.promptUser, id), promptHost: text(input.promptHost, "terminal"),
    token, nft, dexChain: text(input.dexScreenerChainId, "robinhood"),
    blockscout: text(input.blockscoutApiBase, "https://robinhoodchain.blockscout.com/api/v2").replace(/\/$/, ""),
    colors: {
      background: text(input.colors?.background, DEFAULT_TERMINAL_THEME.background), panel: text(input.colors?.panel, DEFAULT_TERMINAL_THEME.panel),
      green: text(input.colors?.primary, DEFAULT_TERMINAL_THEME.green), yellow: text(input.colors?.accent, DEFAULT_TERMINAL_THEME.yellow),
      cyan: text(input.colors?.cyan, DEFAULT_TERMINAL_THEME.cyan), blue: text(input.colors?.blue, DEFAULT_TERMINAL_THEME.blue),
      orange: text(input.colors?.orange, DEFAULT_TERMINAL_THEME.orange), red: text(input.colors?.red, DEFAULT_TERMINAL_THEME.red),
      muted: text(input.colors?.muted, DEFAULT_TERMINAL_THEME.muted), line: text(input.colors?.line, DEFAULT_TERMINAL_THEME.line),
    },
    links: {
      home: text(input.links?.home) || "/", whales: text(input.links?.whales) || "/whales",
      intel: text(input.links?.intel) || "/intel", nft: text(input.links?.nft) || "/nft", website: text(input.links?.website),
      x: text(input.links?.x), telegram: text(input.links?.telegram), explorer: text(input.links?.explorer),
      dexScreener: text(input.links?.dexScreener), openSea: text(input.links?.openSea),
    },
    nftSettings: (() => {
      const requestedMode = text(input.nft?.mode, "single") === "multiple" ? "multiple" : "single";
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
      return { collectionName: text(input.nft?.collectionName, `${name} NFT`), openSeaSlug: text(input.nft?.openSeaSlug), mode: requestedMode, mintAt: requestedMode === "multiple" ? phases[0]?.startsAt || text(input.nft?.mintAt) : text(input.nft?.mintAt), mintEndAt: text(input.nft?.mintEndAt) || null, mintPhases: requestedMode === "multiple" ? phases : [], timezone: text(input.nft?.timezone, "UTC"), supply: numberOrNull(input.nft?.supply), whaleThreshold: numberOrNull(input.nft?.whaleThreshold) || 10 };
    })(),
    features: { landing: true, whaleTracker: bool(input.features?.whaleTracker, true), nftTerminal: nftEnabled, memeIntel: bool(input.features?.memeIntel, true), liveMarket: bool(input.features?.liveMarket, true) },
    mascot, mascotPath: `/assets/${id}-mascot.${ext}`, mascotExt: ext,
  };
}
function js(value) { return JSON.stringify(value, null, 2); }
function mintDisplayFromIso(value) {
  const raw = text(value);
  const m = raw.match(/^\d{4}-\d{2}-\d{2}T(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/);
  if (!m) return "";
  let zone = m[3] === "Z" ? "UTC" : `GMT${m[3].replace(":00", "").replace(/^\+0/, "+").replace(/^-0/, "-")}`;
  return `${m[1]}:${m[2]} ${zone}`;
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
function phaseMarkup(phases) {
  return phases.map((phase, index) => `<section id="phaseCard-${phase.id}" class="phase-countdown-card" data-phase="${phase.id}">
              <div class="phase-card-topline"><span class="phase-kind">[ ${phase.label} ]</span><span id="phaseStatus-${phase.id}" class="phase-status">[ UPCOMING ]</span></div>
              <h2>“${phase.name.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")}”</h2>
              <div class="phase-details">${phase.price} <span aria-hidden="true">·</span> ${phase.limit}</div>
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
function projectMarketLinkRows(p, { includeOpenSea = false } = {}) {
  const rows = [
    ["Website", p.links.website, `Visit ${p.name} Official Website`],
    ["X", p.links.x, `Visit ${p.name} Official X Account`],
    ["Telegram", p.links.telegram, `Join ${p.name} Official Telegram`],
    ...(includeOpenSea ? [["OpenSea", p.links.openSea || (p.nftSettings.openSeaSlug ? `https://opensea.io/collection/${p.nftSettings.openSeaSlug}/overview` : ""), `View ${p.name} NFT Collection on OpenSea`]] : []),
  ];
  return rows.filter(([,url]) => url).map(([label,url,copy]) => `<div class="market-line project-link-row"><span class="market-tag project-link-tag">[ LINK ]</span><span class="market-label">${html(label)}</span><span class="market-colon" aria-hidden="true">:</span><a class="market-value project-link-value" href="${html(url)}" target="_blank" rel="noopener noreferrer">${html(copy)}</a></div>`).join("\n          ");
}
function countdownProjectLinkRows(p) {
  // Reuse the countdown page's existing command-link area instead of adding a second social block.
  const openSea = p.links.openSea || (p.nftSettings.openSeaSlug ? `https://opensea.io/collection/${p.nftSettings.openSeaSlug}/overview` : "");
  const rows = [
    ["LINK", "Website", p.links.website, `Visit ${p.name} Official Website`],
    ["OPENSEA", "OpenSea", openSea, `View ${p.name} NFT Collection on OpenSea`],
    ["SOCIALS", "X", p.links.x, `Visit ${p.name} Official X Account`],
    ["SOCIALS", "Telegram", p.links.telegram, `Join ${p.name} Official Telegram`],
  ];
  return rows.filter(([, , url]) => url).map(([tag,label,url,copy]) => `          <div class="launch-links-line project-launch-link"><span class="orange">[ ${tag} ]</span> <span class="project-launch-label">${html(label)} :</span> <a href="${html(url)}" target="_blank" rel="noopener noreferrer">${html(copy)}</a></div>`).join("\n");
}
function nftInfoLinkRows(p) {
  // OpenSea already has a canonical collection-info row in the NFT terminal. Do not duplicate it.
  const rows = [
    ["Website", p.links.website, `Visit ${p.name} Official Website`],
    ["X", p.links.x, `Visit ${p.name} Official X Account`],
    ["Telegram", p.links.telegram, `Join ${p.name} Official Telegram`],
  ];
  return rows.filter(([,url]) => url).map(([label,url,copy]) => `        <div class="info-row project-info-link-row"><span>${html(label)}</span><a href="${html(url)}" target="_blank" rel="noopener noreferrer">${html(copy)}</a></div>`).join("\n");
}

function profileSource(p) {
  const value = {
    project: { id:p.id, name:p.name, displayName:p.name, ticker:p.ticker, version:p.version, description:p.description, ecosystem:p.ecosystem, promptUser:p.promptUser, promptHost:p.promptHost },
    contracts: { token:p.token, nft:p.nft },
    market: { dexScreenerChainId:p.dexChain, blockscoutApiBase:p.blockscout, refreshMs:30000, cacheTtlMs:30000 },
    branding: { mascot:p.mascotPath, mascotAlt:`${p.name} mascot`, themeColor:p.colors.background, colors:p.colors },
    links: { home:p.links.home, modules:{whales:p.links.whales,intel:p.links.intel,nft:p.links.nft}, website:p.links.website,x:p.links.x,telegram:p.links.telegram,explorer:p.links.explorer,dexScreener:p.links.dexScreener,openSea:p.links.openSea },
    nft: p.nftSettings,
    features: p.features,
    modules: {
      whales:{command:"whales",title:"Whale Activity Tracker",description:"Monitor Top-30 whales, DEX activity, and holder rankings.",status:p.features.whaleTracker?"READY":"DISABLED"},
      intel:{command:"intel",title:"Meme Intelligence Terminal",description:"Read market pulse, buy pressure, holder behavior, and transparent risk signals.",status:p.features.memeIntel?"READY":"DISABLED"},
      nft:{command:"nft",title:`${p.name} NFT Terminal`,description:p.features.nftTerminal?"NFT whale analytics and collection statistics.":"NFT collection analytics when configured.",status:p.features.nftTerminal?"READY":"DISABLED"}
    }
  };
  return `"use strict";\nmodule.exports = ${js(value)};\n`;
}
function makeMountableServer(source, moduleName) {
  const marker = source.lastIndexOf("app.listen(");
  if (marker < 0) throw new Error(`Unable to make ${moduleName}/server.js mountable.`);
  let prefix = source.slice(0, marker).trimEnd();
  if (["02_Whale-Activity-Tracker", "04_Meme-Intel"].includes(moduleName)) {
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
    .replace(/(["'`])\/project-runtime\.js(?:\?[^"'`]*)?\1/g, `$1${base}/project-runtime.js$1`)
    .replace(/(["'`])\/whale\.js(?:\?[^"'`]*)?\1/g, `$1${base}/whale.js$1`)
    .replace(/(["'`])\/intel\.js(?:\?[^"'`]*)?\1/g, `$1${base}/intel.js$1`)
    .replace(/(["'`])\/script\.js(?:\?[^"'`]*)?\1/g, `$1${base}/script.js$1`)
    .replace(/(["'`])\/countdown\.js(?:\?[^"'`]*)?\1/g, `$1${base}/countdown.js$1`)
    .replace(/(["'`])\/binary-background\.js(?:\?[^"'`]*)?\1/g, `$1${base}/binary-background.js$1`)
    .replace(/(["'`])\/assets\//g, `$1${base}/assets/`)
    .replace(/(["'`])\/api\//g, `$1${base}/api/`);
}

function transformModuleFile(moduleName, relativeName, data, p) {
  let source = data.toString("utf8");
  if (relativeName === "server.js") {
    if (moduleName === "03_NFT-Collection-Terminal") {
      source = source
        .replaceAll("888 Society NFT Terminal", `${p.name} NFT Terminal`)
        .replaceAll("888 SOCIETY", p.name)
        .replaceAll("888 Society", p.name)
        .replaceAll("/assets/888-society-mark.png", p.mascotPath)
        .replaceAll("/assets/gangsterrobins-mascot.png", p.mascotPath);
    }
    return Buffer.from(makeMountableServer(source, moduleName));
  }
  if (moduleName === "03_NFT-Collection-Terminal") {
    const nftName = p.nftSettings.collectionName || `${p.name} NFT`;
    const openSea = p.links.openSea || (p.nftSettings.openSeaSlug ? `https://opensea.io/collection/${p.nftSettings.openSeaSlug}/overview` : "#");
    source = source
      .replaceAll("GANGSTERROBINS NFT", nftName.toUpperCase())
      .replaceAll("GANGSTERROBINS", p.name)
      .replaceAll("GangsterRobins", p.name)
      .replaceAll("888 SOCIETY", p.name)
      .replaceAll("888 Society", p.name)
      .replaceAll("https://opensea.io/collection/gangsterrobins/overview", openSea)
      .replaceAll("https://opensea.io/collection/888-society-605141138/overview", openSea)
      .replaceAll("/assets/gangsterrobins-mascot.png", p.mascotPath)
      .replaceAll("/assets/gangsterrobins-favicon.png", p.mascotPath)
      .replaceAll("/assets/888-society-mark.png", p.mascotPath)
      .replaceAll("/assets/888-favicon.png", p.mascotPath)
      .replaceAll("888-society", p.id);

    if (p.nftSettings.mode === "multiple") {
      source = source.replaceAll("888-phase-live-seen", `${p.id}-phase-live-seen`).replaceAll("gold 888 mascot", `${p.name} mascot`);
      if (["public/terminal.html", "public/script.js"].includes(relativeName) && p.nftSettings.supply) source = source.replace(/\b888\b/g, String(p.nftSettings.supply));
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
        .replace(/<h1>[^<]*<\/h1>/, `<h1>${p.name} NFT COLLECTION TERMINAL</h1>`)
        .replace(/<div id="mintReady" class="line"><span class="orange">\[ UPCOMING \]<\/span> Mint begins at [^<]*<\/div>/, `<div id="mintReady" class="line"><span class="orange">[ UPCOMING ]</span> Mint begins at ${mintDisplay || "the configured mint time"}.</div>`)
        .replace(/after the mint begins at [^<]*<\/p>/, `after the mint begins at ${mintDisplay || "the configured mint time"}.</p>`)
        .replaceAll("[ ENTER NFT TERMINAL ]", "[ VISIT NFT TERMINAL ]")
        .replaceAll("ENTER NFT TERMINAL", "VISIT NFT TERMINAL");
      source = source.replace(/<div class="footer-version">\s*[^<]+\s*<\/div>/, `<div class="footer-version">\n            ${p.name} NFT Terminal\n          </div>`);
    }
    if (relativeName === "public/terminal.html") {
      const infoLinks = nftInfoLinkRows(p);
      source = source.replace(/(<div class="info-row">\s*<span>NFT Contract<\/span>[\s\S]*?<\/div>)/, infoLinks ? `$1\n${infoLinks}` : "$1");
      source = source.replace(/<a\s+href="#" data-opensea-link/g, '<a href="#" data-opensea-link');
      source = source.replace(/<a\s+href="#" data-opensea-link([\s\S]*?)>\s*View ([^<]+) NFT Collection on OpenSea\s*<\/a>/, '<a href="#" data-opensea-action$1>View $2 NFT Collection on OpenSea</a>');
      source = source.replace(/<span data-project-version><\/span>/, `${p.name} NFT Terminal`);
    }
    if (["public/terminal.html", "public/script.js"].includes(relativeName) && p.nftSettings.supply) {
      source = source.replaceAll("420", String(p.nftSettings.supply)).replaceAll("10014", String(p.nftSettings.supply)).replaceAll("10,014", Number(p.nftSettings.supply).toLocaleString("en-US"));
    }
    if (["public/project-runtime.js", "public/countdown.js"].includes(relativeName)) {
      source = source.replace(/(["'])\/terminal\1/g, `$1/nft/terminal$1`);
      if (relativeName === "public/project-runtime.js") source = source.replace(/:\s*c\.links\.home/g, ': "/nft"');
    }
    if (relativeName === "public/index.html") {
      source = source.replaceAll('href="/terminal"', 'href="/nft/terminal"');
      source = source.replaceAll('href="/" title=', 'href="/nft" title=');
    }
  }
  if (relativeName === "public/index.html" && ["01_Landing-Page", "02_Whale-Activity-Tracker", "04_Meme-Intel"].includes(moduleName)) {
    const links = projectMarketLinkRows(p, { includeOpenSea: true });
    if (links) source = source.replace(/(<div class="market-line contract-address-line"[^>]*>[\s\S]*?<\/div>)/, `$1\n          ${links}`);
  }
  if (relativeName === "public/index.html" && moduleName !== "03_NFT-Collection-Terminal") {
    const faviconHref = p.mascot ? `assets/${p.id}-mascot.${p.mascotExt}` : "favicon.png";
    source = source.replace("</head>", `  <link rel="icon" href="${faviconHref}">\n  <link rel="apple-touch-icon" href="${faviconHref}">\n</head>`);
  }
  const bases = {"02_Whale-Activity-Tracker":"/whales", "03_NFT-Collection-Terminal":"/nft", "04_Meme-Intel":"/intel"};
  if (bases[moduleName] && relativeName.startsWith("public/") && /\.(html|js)$/.test(relativeName)) {
    source = prefixBrowserRoutes(source, bases[moduleName]);
    return Buffer.from(source);
  }
  return Buffer.from(source);
}

function walkModule(dir, prefix, moduleName, entries, p, relative = "") {
  for (const item of fs.readdirSync(dir, { withFileTypes:true })) {
    if (["node_modules", ".git"].includes(item.name)) continue;
    if (moduleName === "03_NFT-Collection-Terminal" && relative === "public" && item.name === "assets") continue;
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
    '  modules:{landing:true,whales:Boolean(config.features.whaleTracker),intel:Boolean(config.features.memeIntel),nft:Boolean(config.features.nftTerminal),landingMarket:Boolean(config.features.liveMarket)},',
    '  routes:{home:"/",health:"/healthz",healthLegacy:"/health",status:"/status",whales:config.features.whaleTracker?"/whales":null,intel:config.features.memeIntel?"/intel":null,nft:config.features.nftTerminal?"/nft":null}',
    '}));',
    'if(config.features.whaleTracker) app.use("/whales",require("./02_Whale-Activity-Tracker/server"));',
    'if(config.features.nftTerminal) app.use("/nft",require("./03_NFT-Collection-Terminal/server"));',
    'if(config.features.memeIntel) app.use("/intel",require("./04_Meme-Intel/server"));',
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
    'pass("deployment guide",fs.existsSync("deployment-guide.txt"));',
    'pass("landing favicon",fs.existsSync(path.join("01_Landing-Page","public","favicon.png"))||fs.readFileSync(path.join("01_Landing-Page","public","index.html"),"utf8").includes("assets/"));',
    'const source=fs.readFileSync("server.js","utf8");',
    `pass("health route",source.includes('app.get("/health"'));`,
    `pass("healthz route",source.includes('app.get("/healthz"'));`,
    `pass("status route",source.includes('app.get("/status"'));`,
    'execFileSync(process.execPath,["--check","server.js"]);',
    'execFileSync(process.execPath,["--check","verify-deployment.js"]);',
    'for(const moduleName of ["01_Landing-Page","02_Whale-Activity-Tracker","03_NFT-Collection-Terminal","04_Meme-Intel"])execFileSync(process.execPath,["--check",path.join(moduleName,"server.js")]);',
    `pass("NFT feature state",config.features.nftTerminal===${p.features.nftTerminal});`,
    'console.log(`\nRelease validation passed (${checks.length} checks).`);',
    ''
  ].join("\n");
}

function generatedDeploymentVerifier(p) {
  const expected={whales:Boolean(p.features.whaleTracker),intel:Boolean(p.features.memeIntel),nft:Boolean(p.features.nftTerminal)};
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
    ' const status=await get("/status");check(status.status===200,"/status returned HTTP 200");const s=await status.json();check(s.ok===true,"/status returned ok:true");check(s.modules.whales===expected.whales&&s.modules.intel===expected.intel&&s.modules.nft===expected.nft,"Mounted modules match generated profile");',
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
    enabledModules: ["landing", ...(p.features.whaleTracker?["whales"]:[]), ...(p.features.memeIntel?["intel"]:[]), ...(p.features.nftTerminal?["nft"]:[])],
    routes: { home:"/", health:"/healthz", healthLegacy:"/health", status:"/status", whales:p.features.whaleTracker?"/whales":null, intel:p.features.memeIntel?"/intel":null, nft:p.features.nftTerminal?"/nft":null },
    deployment: { provider:"Render Blueprint compatible", blueprint:"render.yaml", publicAcceptanceCommand:"npm run test:deployed -- https://YOUR-TERMINAL.onrender.com" }
  }, null, 2) + "\n";
}
function deploymentGuide(p) {
  const repo=`${p.id}-community-terminal`;
  return `[ COMMUNITY TERMINAL DEPLOYMENT GUIDE ]

PROJECT: ${p.name}
REPOSITORY SUGGESTION: ${repo}
BUILDER VERSION: ${BUILDER_VERSION}
CONFIG SCHEMA: ${CONFIG_SCHEMA_VERSION}
TERMINAL ENGINE: ${TERMINAL_ENGINE_VERSION}

1. LOCAL VALIDATION

cd ${p.name.replace(/[^A-Z0-9]+/g, "_")}_Community_Terminal
npm install
npm test
npm start

Open http://localhost:3000 and verify /healthz and /status.

2. GITHUB

git init
git add .
git commit -m "Initial ${p.name} Community Terminal"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/${repo}.git
git push -u origin main

3. RENDER

Create a new Blueprint from the GitHub repository. Render reads render.yaml, installs dependencies, starts the service, and checks /healthz.

4. PUBLIC ACCEPTANCE

npm run test:deployed -- https://YOUR-TERMINAL.onrender.com

Keep terminal-release.json with the deployment. It records the builder, schema, engine, modules, routes and generation time.
`;
}
function generatedReadme(p) { return `# ${p.name} Community Terminal

Generated with Community Terminal Builder **v${BUILDER_VERSION}**.

Release metadata: \`terminal-release.json\`  
Copy-ready deployment instructions: \`deployment-guide.txt\`

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
- NFT Terminal: /nft (${p.features.nftTerminal ? "enabled" : "disabled"})
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
  entries.push({name:`${root}/deployment-guide.txt`,data:deploymentGuide(p)});
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
