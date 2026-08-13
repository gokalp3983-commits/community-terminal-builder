"use strict";
const express = require("express");
const path = require("path");
const config = require("../config");
const { discoverNftContract } = require("./lib/nft/contract-discovery");
const fs = require("fs");

const app = express();
const port = Number(process.env.PORT || 3000);

const REQUEST_TIMEOUT_MS = 20_000;


app.disable("x-powered-by");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function requestOrigin(req) {
  const forwardedProto = String(req.get("x-forwarded-proto") || "")
    .split(",")[0]
    .trim();
  const protocol = forwardedProto || req.protocol || "https";
  const forwardedHost = String(req.get("x-forwarded-host") || "")
    .split(",")[0]
    .trim();
  const host = forwardedHost || req.get("host");
  return `${protocol}://${host}`;
}

function renderProjectPage(fileName, pagePath, req, res) {
  const filePath = path.join(__dirname, "public", fileName);
  const origin = requestOrigin(req);
  const requestPath = String(req.originalUrl || req.url || pagePath || "/").split("?")[0] || pagePath || "/";
  const pageUrl = new URL(requestPath, `${origin}/`).toString();
  const mascotPath = config.branding?.mascot || "__CTB_MASCOT_PATH__";
  const mountedMascotPath = requestPath.startsWith("/nft") && mascotPath.startsWith("/assets/") ? `/nft${mascotPath}` : mascotPath;
  const socialImageUrl = new URL(mountedMascotPath, `${origin}/`).toString();
  const projectName = config.project?.displayName || config.project?.name || "NFT";
  const projectDescription =
    config.project?.description || `${projectName} NFT Collection Terminal.`;

  fs.readFile(filePath, "utf8", (error, html) => {
    if (error) {
      console.error(`Unable to render ${fileName}:`, error);
      res.status(500).type("text/plain").send("Unable to load page.");
      return;
    }

    const replacements = {
      "{{PROJECT_NAME}}": projectName,
      "{{PROJECT_TICKER}}": config.project?.ticker || projectName,
      "{{PROJECT_ECOSYSTEM}}": config.project?.ecosystem || "",
      "{{NFT_COLLECTION_NAME}}": config.nft?.collectionName || `${projectName} NFT`,
      "{{PROJECT_DESCRIPTION}}": projectDescription,
      "{{PAGE_URL}}": pageUrl,
      "{{SOCIAL_IMAGE_URL}}": socialImageUrl,
    };

    for (const [token, value] of Object.entries(replacements)) {
      html = html.replaceAll(token, escapeHtml(value));
    }

    res.type("html").send(html);
  });
}

app.get("/project-config.js", (_req, res) => {
  res.type("application/javascript").send(`window.PROJECT_CONFIG=${JSON.stringify({project:config.project,contracts:config.contracts,branding:config.branding,links:config.links,nft:config.nft,features:config.features,modules:config.modules,market:{refreshMs:config.market.refreshMs,blockscoutApiBase:config.market.blockscoutApiBase,blockscoutExplorerBase:new URL(config.market.blockscoutApiBase).origin}})};`);
});

app.get(["/terminal", "/terminal/"], (req, res) => {
  renderProjectPage("terminal.html", "/terminal", req, res);
});

app.get("/", (req, res) => {
  renderProjectPage("index.html", "/", req, res);
});

app.use(express.static(path.join(__dirname, "public")));

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": `${config.project.id}-nft-terminal/${config.project.version}`,
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    app: "NFT Mint Tracker Simulation",
    version: "2.4.2",
  });
});



app.get("/api/contract-discovery", async (_req, res) => {
  try {
    res.json(await discoverNftContract(config.contracts.nft));
  } catch (error) {
    res.status(502).json({ ok: false, error: error.message, code: error.code || "NFT_DISCOVERY_UNAVAILABLE" });
  }
});

const NFT_CONTRACT = process.env.NFT_CONTRACT || config.contracts.nft;
const NFT_MAX_SUPPLY = Number(config.nft.supply || 0);
const BLOCKSCOUT_API_BASE = config.market.blockscoutApiBase;
const MINT_STATS_CACHE_TTL_MS = 5 * 1000;
const MINT_RATE_WINDOW_MS = 10 * 60 * 1000;
const ZERO_ADDRESS =
  "0x0000000000000000000000000000000000000000";

let mintStatsCache = null;
let mintStatsRefreshPromise = null;
let mintHistoryCache = null;
let nftActivityCache = null;
let nftActivityRefreshPromise = null;
let nftActivityBackgroundStarted = false;
let nftActivityBackgroundTimer = null;
const NFT_ACTIVITY_CACHE_TTL_MS = 120_000;
const NFT_ACTIVITY_REFRESH_MS = 180_000;
const NFT_ACTIVITY_PAGE_TIMEOUT_MS = 4_000;

function asNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getAddressHash(value) {
  if (!value) return "";
  if (typeof value === "string") return value.toLowerCase();

  return String(
    value.hash ??
    value.address_hash ??
    value.address ??
    ""
  ).toLowerCase();
}

function getTransferTimestamp(item) {
  const raw =
    item?.timestamp ??
    item?.block_timestamp ??
    item?.transaction?.timestamp ??
    null;

  if (!raw) return null;

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getTransferTokenId(item) {
  const value =
    item?.token_id ??
    item?.total?.token_id ??
    item?.token_ids?.[0] ??
    item?.token?.id ??
    null;

  return value == null ? null : String(value);
}

function getTransferTxHash(item) {
  return String(
    item?.transaction_hash ??
    item?.transaction?.hash ??
    item?.tx_hash ??
    ""
  );
}

function isMintTransfer(item) {
  return getAddressHash(item?.from) === ZERO_ADDRESS;
}

function shortenAddress(address) {
  const value = String(address || "");
  if (value.length < 12) return value || "—";

  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function blockscoutHttpStatus(error) {
  if (Number.isFinite(Number(error?.status))) return Number(error.status);
  const match = String(error?.message || error || "").match(/HTTP\s+(\d{3})/i);
  return match ? Number(match[1]) : null;
}

function configuredMintStartMs() {
  const starts = [];
  const single = Date.parse(String(config.nft?.mintAt || ""));
  if (Number.isFinite(single)) starts.push(single);
  for (const phase of Array.isArray(config.nft?.mintPhases) ? config.nft.mintPhases : []) {
    const value = Date.parse(String(phase?.startsAt || ""));
    if (Number.isFinite(value)) starts.push(value);
  }
  return starts.length ? Math.min(...starts) : null;
}

function isScheduledPreMint() {
  const startsAt = configuredMintStartMs();
  return Number.isFinite(startsAt) && Date.now() < startsAt;
}

function pendingMintStats() {
  return {
    connected: true,
    pending: true,
    indexing: true,
    source: "Robinhood Chain Blockscout",
    status: "WAITING",
    totalSupply: NFT_MAX_SUPPLY,
    minted: 0,
    remaining: NFT_MAX_SUPPLY,
    progressPercent: 0,
    uniqueHolders: 0,
    mintRatePerMinute: 0,
    latestMint: null,
    updatedAt: new Date().toISOString(),
    message: "Mint has not started; awaiting Blockscout indexing."
  };
}

function pendingHolderAnalytics() {
  return {
    connected: true,
    pending: true,
    indexing: true,
    totalHolders: 0,
    totalHeld: 0,
    largestHolder: 0,
    averageHeld: 0,
    medianHeld: 0,
    whaleThreshold: NFT_WHALE_THRESHOLD,
    whaleCount: 0,
    top10ConcentrationPercent: 0,
    top1ConcentrationPercent: 0,
    top1HolderCount: 0,
    distribution: { "1": 0, "2": 0, "3-5": 0, "6-9": 0, "10+": 0 },
    holders: [],
    updatedAt: new Date().toISOString(),
    message: "Mint has not started; no NFT holders indexed yet."
  };
}

function pendingNftActivityData() {
  return {
    connected: true,
    pending: true,
    indexing: true,
    partial: false,
    stale: false,
    transfers1h: 0,
    transfers24h: 0,
    mints1h: 0,
    mints24h: 0,
    uniqueWallets24h: 0,
    recent: [],
    updatedAt: new Date().toISOString(),
    message: "Mint has not started; awaiting on-chain NFT activity."
  };
}

async function fetchBlockscoutJson(pathname, attempt = 0) {
  const response = await fetch(
    `${BLOCKSCOUT_API_BASE}${pathname}`,
    {
      headers: {
        Accept: "application/json",
        "User-Agent": `${config.project.id}-nft-terminal/${config.project.version}`,
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    }
  );

  if (response.status === 429 && attempt < 3) {
    const retryAfterSeconds =
      Number(response.headers.get("retry-after")) || 0;

    const waitMs = retryAfterSeconds > 0
      ? retryAfterSeconds * 1000
      : 1000 * (2 ** attempt);

    await new Promise((resolve) =>
      setTimeout(resolve, waitMs)
    );

    return fetchBlockscoutJson(pathname, attempt + 1);
  }

  if (!response.ok) {
    const error = new Error(`Blockscout request failed: HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

function buildTransfersPath(nextPageParams = null) {
  const base =
    `/tokens/${NFT_CONTRACT}/transfers`;

  if (!nextPageParams) return base;

  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(
    nextPageParams
  )) {
    if (value !== null && value !== undefined) {
      query.set(key, String(value));
    }
  }

  return `${base}?${query.toString()}`;
}

async function fetchRecentMintTransfers() {
  const cutoff = Date.now() - MINT_RATE_WINDOW_MS;
  const mints = [];
  let nextPageParams = null;

  // A few recent pages are enough for rate and latest-mint data.
  // This deliberately avoids crawling the full collection every refresh.
  for (let page = 0; page < 6; page += 1) {
    const payload = await fetchBlockscoutJson(
      buildTransfersPath(nextPageParams)
    );

    const items = Array.isArray(payload?.items)
      ? payload.items
      : [];

    let reachedOldTransfer = false;

    for (const item of items) {
      if (!isMintTransfer(item)) continue;

      const timestamp = getTransferTimestamp(item);

      if (timestamp && timestamp.getTime() < cutoff) {
        reachedOldTransfer = true;
      }

      mints.push({
        timestamp,
        tokenId: getTransferTokenId(item),
        to: getAddressHash(item?.to),
        txHash: getTransferTxHash(item),
      });
    }

    nextPageParams = payload?.next_page_params ?? null;

    if (
      reachedOldTransfer ||
      !nextPageParams ||
      items.length === 0
    ) {
      break;
    }

    // Keep requests spaced to reduce rate-limit pressure.
    await new Promise((resolve) =>
      setTimeout(resolve, 300)
    );
  }

  return mints;
}

async function loadLiveMintStats() {
  let tokenInfo;
  try {
    tokenInfo = await fetchBlockscoutJson(`/tokens/${NFT_CONTRACT}`);
  } catch (error) {
    if (blockscoutHttpStatus(error) === 404 && isScheduledPreMint()) {
      return pendingMintStats();
    }
    throw error;
  }
  const [counters, recentMints] = await Promise.all([
    fetchBlockscoutJson(`/tokens/${NFT_CONTRACT}/counters`).catch(() => null),
    fetchRecentMintTransfers().catch(() => []),
  ]);

  const minted = Math.max(
    0,
    Math.min(
      NFT_MAX_SUPPLY,
      Math.trunc(asNumber(tokenInfo?.total_supply))
    )
  );

  const remaining = Math.max(
    0,
    NFT_MAX_SUPPLY - minted
  );

  const progressPercent =
    NFT_MAX_SUPPLY > 0
      ? (minted / NFT_MAX_SUPPLY) * 100
      : 0;

  const holders = Math.max(
    0,
    Math.trunc(
      asNumber(
        tokenInfo?.holders_count ??
        counters?.token_holders_count
      )
    )
  );

  const windowStart =
    Date.now() - MINT_RATE_WINDOW_MS;

  const mintsInWindow = recentMints.filter(
    (mint) =>
      mint.timestamp &&
      mint.timestamp.getTime() >= windowStart
  );

  const mintRatePerMinute =
    mintsInWindow.length / (
      MINT_RATE_WINDOW_MS / 60_000
    );

  const latest = recentMints
    .filter((mint) => mint.timestamp)
    .sort(
      (a, b) =>
        b.timestamp.getTime() -
        a.timestamp.getTime()
    )[0] ?? recentMints[0] ?? null;

  let status = "WAITING";

  if (minted >= NFT_MAX_SUPPLY) {
    status = "COMPLETE";
  } else if (minted > 0) {
    status = "LIVE";
  }

  return {
    connected: true,
    source: "Robinhood Chain Blockscout",
    status,
    totalSupply: NFT_MAX_SUPPLY,
    minted,
    remaining,
    progressPercent:
      Number(progressPercent.toFixed(2)),
    uniqueHolders: holders,
    mintRatePerMinute:
      Number(mintRatePerMinute.toFixed(1)),
    latestMint: latest
      ? {
          tokenId: latest.tokenId,
          to: latest.to,
          toDisplay: shortenAddress(latest.to),
          txHash: latest.txHash,
          timestamp:
            latest.timestamp?.toISOString() ?? null,
        }
      : null,
    updatedAt: new Date().toISOString(),
  };
}

async function getLiveMintStats() {
  if (
    mintStatsCache &&
    Date.now() - mintStatsCache.fetchedAt <
      MINT_STATS_CACHE_TTL_MS
  ) {
    return {
      ...mintStatsCache.data,
      cacheAgeSeconds: Math.floor(
        (Date.now() - mintStatsCache.fetchedAt) /
        1000
      ),
    };
  }

  if (mintStatsRefreshPromise) {
    return mintStatsRefreshPromise;
  }

  mintStatsRefreshPromise = (async () => {
    try {
      const data = await loadLiveMintStats();

      mintStatsCache = {
        fetchedAt: Date.now(),
        data,
      };

      return {
        ...data,
        cacheAgeSeconds: 0,
      };
    } finally {
      mintStatsRefreshPromise = null;
    }
  })();

  return mintStatsRefreshPromise;
}


async function loadMintHistoryAnalytics(){
  if(mintHistoryCache && Date.now()-mintHistoryCache.fetchedAt < 300000) return mintHistoryCache.data;
  const byWallet=new Map(), minuteBuckets=new Map();let nextPageParams=null,totalMintEvents=0,firstMintAt=null,lastMintAt=null;
  for(let page=0;page<100;page+=1){
    let payload;
    try{payload=await fetchBlockscoutJson(buildTransfersPath(nextPageParams));}
    catch(error){if(totalMintEvents>0)break;throw error;}
    const items=Array.isArray(payload?.items)?payload.items:[];
    for(const item of items){
      if(!isMintTransfer(item)) continue;
      const to=getAddressHash(item?.to); const timestamp=getTransferTimestamp(item);
      if(/^0x[a-f0-9]{40}$/.test(to)){byWallet.set(to,(byWallet.get(to)||0)+1);totalMintEvents+=1;}
      if(timestamp){const ms=timestamp.getTime();if(!firstMintAt||ms<firstMintAt)firstMintAt=ms;if(!lastMintAt||ms>lastMintAt)lastMintAt=ms;const bucket=Math.floor(ms/60000);minuteBuckets.set(bucket,(minuteBuckets.get(bucket)||0)+1);}
    }
    nextPageParams=payload?.next_page_params??null;if(!nextPageParams||items.length===0)break;
    await new Promise(resolve=>setTimeout(resolve,120));
  }
  const counts=[...byWallet.values()]; const largestMint=counts.length?Math.max(...counts):0; const repeatMinters=counts.filter(x=>x>1).length;
  const data={connected:true,uniqueMinters:byWallet.size,totalMintEvents,repeatMinters,largestMint,averageNftsPerMinter:byWallet.size?Number((totalMintEvents/byWallet.size).toFixed(2)):0,firstMintAt:firstMintAt?new Date(firstMintAt).toISOString():null,lastMintAt:lastMintAt?new Date(lastMintAt).toISOString():null,mintDurationMinutes:firstMintAt&&lastMintAt?Number(((lastMintAt-firstMintAt)/60000).toFixed(1)):null,minterAddresses:[...byWallet.keys()],updatedAt:new Date().toISOString()};
  mintHistoryCache={fetchedAt:Date.now(),data};return data;
}
app.get("/api/mint-intelligence",async(_req,res)=>{try{res.json(await loadMintHistoryAnalytics())}catch(error){if(blockscoutHttpStatus(error)===404&&isScheduledPreMint()){res.json({connected:true,pending:true,indexing:true,uniqueMinters:0,totalMintEvents:0,repeatMinters:0,largestMint:0,averageNftsPerMinter:0,firstMintAt:null,lastMintAt:null,mintDurationMinutes:null,minterAddresses:[],updatedAt:new Date().toISOString(),message:"Mint has not started; awaiting mint history."});return;}console.error("[mint-intelligence] failed:",error);res.status(502).json({connected:false,error:"Mint history analytics unavailable."})}});

async function fetchNftActivityPage(pathname){
  const response=await fetch(`${BLOCKSCOUT_API_BASE}${pathname}`,{headers:{Accept:"application/json","User-Agent":`${config.project.id}-nft-terminal/${config.project.version}`},signal:AbortSignal.timeout(NFT_ACTIVITY_PAGE_TIMEOUT_MS)});
  if(!response.ok){const error=new Error(`Blockscout activity request failed: HTTP ${response.status}`);error.status=response.status;throw error;}
  return response.json();
}
async function refreshNftActivityCache(){
  if(nftActivityRefreshPromise) return nftActivityRefreshPromise;
  nftActivityRefreshPromise=(async()=>{
    let nextPageParams=null;const now=Date.now(),oneHour=now-3600000,day=now-86400000,wallets24=new Set();let transfers1h=0,transfers24h=0,mints1h=0,mints24h=0;const recent=[];let partial=false,seenAny=false,reachedWindowEnd=false;
    for(let page=0;page<4;page+=1){
      let payload;
      try{payload=await fetchNftActivityPage(buildTransfersPath(nextPageParams));}
      catch(error){
        if(blockscoutHttpStatus(error)===404 && isScheduledPreMint()){const data=pendingNftActivityData();nftActivityCache={fetchedAt:Date.now(),data};return data;}
        partial=true;console.error("[nft-activity-cache] page failed:",error.message||error);break;
      }
      const items=Array.isArray(payload?.items)?payload.items:[];
      for(const item of items){
        const ts=getTransferTimestamp(item);const ms=ts?.getTime()||0;if(ms>0&&ms<day) reachedWindowEnd=true;
        const mint=isMintTransfer(item);const from=getAddressHash(item?.from),to=getAddressHash(item?.to);
        if(ms>=day){seenAny=true;transfers24h+=1;if(mint)mints24h+=1;if(/^0x[a-f0-9]{40}$/.test(from))wallets24.add(from);if(/^0x[a-f0-9]{40}$/.test(to))wallets24.add(to);}
        if(ms>=oneHour){transfers1h+=1;if(mint)mints1h+=1;}
        if(recent.length<12)recent.push({timestamp:ts?.toISOString()||null,type:mint?"MINT":"TRANSFER",tokenId:getTransferTokenId(item),from,to,txHash:getTransferTxHash(item)});
      }
      nextPageParams=payload?.next_page_params??null;
      if(reachedWindowEnd||!nextPageParams||items.length===0) break;
      await new Promise(resolve=>setTimeout(resolve,80));
    }
    if(!seenAny&&partial&&nftActivityCache?.data) return {...nftActivityCache.data,stale:true,partial:true,cacheAgeSeconds:Math.floor((Date.now()-nftActivityCache.fetchedAt)/1000)};
    const data={connected:true,partial,stale:false,transfers1h,transfers24h,mints1h,mints24h,uniqueWallets24h:wallets24.size,recent,updatedAt:new Date().toISOString()};
    nftActivityCache={fetchedAt:Date.now(),data};return data;
  })();
  try{return await nftActivityRefreshPromise;}finally{nftActivityRefreshPromise=null;}
}
function getCachedNftActivity(){
  if(!nftActivityCache?.data) return null;
  return {...nftActivityCache.data,cacheAgeSeconds:Math.floor((Date.now()-nftActivityCache.fetchedAt)/1000),stale:Date.now()-nftActivityCache.fetchedAt>NFT_ACTIVITY_CACHE_TTL_MS||Boolean(nftActivityCache.data.stale)};
}
function startNftActivityBackgroundRefresh(){
  if(nftActivityBackgroundStarted) return;nftActivityBackgroundStarted=true;
  const warmup=setTimeout(()=>{void refreshNftActivityCache().catch(error=>console.error("[nft-activity-cache] warmup failed:",error.message||error));},1500);warmup.unref?.();
  nftActivityBackgroundTimer=setInterval(()=>{void refreshNftActivityCache().catch(error=>console.error("[nft-activity-cache] refresh failed:",error.message||error));},NFT_ACTIVITY_REFRESH_MS);nftActivityBackgroundTimer.unref?.();
}
app.get("/api/nft-activity",async(_req,res)=>{
  const cached=getCachedNftActivity();
  if(cached){res.json(cached);if(cached.stale&&!nftActivityRefreshPromise) void refreshNftActivityCache().catch(error=>console.error("[nft-activity-cache] background refresh failed:",error.message||error));return;}
  try{const data=await Promise.race([refreshNftActivityCache(),new Promise(resolve=>setTimeout(()=>resolve(null),3500))]);if(data){res.json(data);return;}res.status(202).json({connected:false,warming:true,error:"NFT activity cache is warming. Retry shortly."});}
  catch(error){console.error("[nft-activity] failed:",error);res.status(502).json({connected:false,error:"NFT activity unavailable."});}
});

let nftPostMintCache = null;
const NFT_HOLDER_HISTORY_MAX_MS = 26 * 60 * 60 * 1000;
const NFT_HOLDER_HISTORY_SAMPLE_MS = 5 * 60 * 1000;
const NFT_ENTRANT_WINDOW_MS = 4 * 60 * 60 * 1000;
const NFT_MOVER_WINDOW_MS = 4 * 60 * 60 * 1000;
const NFT_WHALE_WINDOW_MS = 12 * 60 * 60 * 1000;
const NFT_RETENTION_WINDOW_MS = 24 * 60 * 60 * 1000;
const nftHolderHistory = [];

function holderSnapshotFromAnalytics(analytics){
  return new Map((analytics?.holders || []).map(holder => [String(holder.address || "").toLowerCase(), Number(holder.count) || 0]).filter(([address]) => /^0x[a-f0-9]{40}$/.test(address)));
}
function compareHolderSnapshots(previous,current){
  const addresses=new Set([...previous.keys(),...current.keys()]);
  return [...addresses].map(address=>{
    const before=previous.get(address)||0, now=current.get(address)||0;
    return {address,previous:before,current:now,delta:now-before};
  }).filter(item=>item.delta!==0);
}
function baselineForWindow(currentAtMs, windowMs){
  const target=currentAtMs-windowMs;
  const eligible=nftHolderHistory.filter(item=>item.observedAtMs<=target);
  return eligible.length ? eligible[eligible.length-1] : null;
}
function windowComparison(current,currentAtMs,windowMs,threshold){
  const baseline=baselineForWindow(currentAtMs,windowMs);
  if(!baseline) return {ready:false,windowHours:windowMs/3600000,baselineAt:null,changes:[],entrants:[],exits:[],movers:[],whaleMovers:[],whalesEntered:0,whalesExited:0};
  const changes=compareHolderSnapshots(baseline.holders,current);
  const entrants=changes.filter(x=>x.previous===0&&x.current>0).sort((a,b)=>b.delta-a.delta);
  const exits=changes.filter(x=>x.previous>0&&x.current===0).sort((a,b)=>a.delta-b.delta);
  const movers=changes.slice().sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta)).slice(0,20);
  return {ready:true,windowHours:windowMs/3600000,baselineAt:baseline.observedAt,changes,entrants:entrants.slice(0,20),exits:exits.slice(0,20),movers,whaleMovers:movers.filter(x=>x.previous>=threshold||x.current>=threshold),whalesEntered:changes.filter(x=>x.previous<threshold&&x.current>=threshold).length,whalesExited:changes.filter(x=>x.previous>=threshold&&x.current<threshold).length};
}
function retentionForWindow(current,currentAtMs){
  const baseline=baselineForWindow(currentAtMs,NFT_RETENTION_WINDOW_MS);
  if(!baseline) return {available:false,baselineEstablished:nftHolderHistory.length>0,windowHours:24,baselineAt:nftHolderHistory[0]?.observedAt||null,baselineHolders:nftHolderHistory[0]?.holders.size||current.size};
  const addresses=[...baseline.holders.keys()];
  const stillHolding=addresses.filter(address=>(current.get(address)||0)>0).length;
  const newSinceBaseline=[...current.keys()].filter(address=>!baseline.holders.has(address)).length;
  return {available:true,baselineEstablished:true,windowHours:24,baselineAt:baseline.observedAt,baselineHolders:addresses.length,stillHolding,exited:addresses.length-stillHolding,newSinceBaseline,retentionPercent:addresses.length?Number((stillHolding/addresses.length*100).toFixed(2)):100};
}
function recordPostMintHolderObservation(holders){
  if(!holders?.connected || !Array.isArray(holders.holders) || !holders.updatedAt) return;
  if(nftPostMintCache?.sourceUpdatedAt===holders.updatedAt) return;
  const current=holderSnapshotFromAnalytics(holders);
  const observedAtMs=Date.parse(holders.updatedAt)||Date.now();
  const latestHistory=nftHolderHistory[nftHolderHistory.length-1];
  if(!latestHistory || observedAtMs-latestHistory.observedAtMs>=NFT_HOLDER_HISTORY_SAMPLE_MS){
    nftHolderHistory.push({observedAt:holders.updatedAt,observedAtMs,holders:new Map(current)});
  }
  while(nftHolderHistory.length>1 && nftHolderHistory[0].observedAtMs < observedAtMs-NFT_HOLDER_HISTORY_MAX_MS) nftHolderHistory.shift();
  const threshold=Number(holders.whaleThreshold)||10;
  const entrants4h=windowComparison(current,observedAtMs,NFT_ENTRANT_WINDOW_MS,threshold);
  const movers4h=windowComparison(current,observedAtMs,NFT_MOVER_WINDOW_MS,threshold);
  const whales12h=windowComparison(current,observedAtMs,NFT_WHALE_WINDOW_MS,threshold);
  const retention24h=retentionForWindow(current,observedAtMs);
  const data={connected:true,snapshotBased:true,currentAt:holders.updatedAt,whaleThreshold:threshold,currentWhaleCount:Number(holders.whaleCount)||0,windows:{entrants4h,movers4h,whales12h},entrants:entrants4h.entrants,movers:movers4h.movers,whaleMovers:whales12h.whaleMovers,whalesEntered:whales12h.whalesEntered,whalesExited:whales12h.whalesExited,observationReady:entrants4h.ready,previousAt:entrants4h.baselineAt,retention:retention24h,updatedAt:new Date().toISOString()};
  nftPostMintCache={sourceUpdatedAt:holders.updatedAt,data};
}
async function loadPostMintAnalytics(){
  // Commands consume the same holder snapshot used by the on-page Holder Analytics panel.
  // Interactive commands never rescan Blockscout transfer history.
  // If that snapshot is still warming, wait for the holder loader instead of returning a
  // misleading command-level "snapshot still loading" state. No transfer-history rescan occurs.
  if(nftPostMintCache?.data) return nftPostMintCache.data;
  try{
    const holders=nftHoldersCache?.data||await getNftHolderAnalytics();
    if(holders?.pending) return {connected:true,pending:true,warming:true,currentWhaleCount:0,windows:{},updatedAt:new Date().toISOString(),message:"Mint has not started; holder baseline will begin after holders appear."};
    recordPostMintHolderObservation(holders);
    return nftPostMintCache?.data||{connected:false,warming:true,error:"Holder baseline is initializing.",updatedAt:new Date().toISOString()};
  }catch(error){
    console.error("[nft-postmint] holder snapshot failed:",error.message||error);
    return {connected:false,warming:Boolean(nftHoldersPromise),error:"Holder analytics unavailable. Please retry shortly.",updatedAt:new Date().toISOString()};
  }
}
app.get("/api/nft-postmint",async(_req,res)=>{try{res.json(await loadPostMintAnalytics())}catch(error){console.error("[nft-postmint] failed:",error);res.status(502).json({connected:false,error:"Post-mint analytics unavailable."})}});


app.get("/api/mint-stats", async (_req, res) => {
  try {
    const stats = await getLiveMintStats();
    res.json(stats);
  } catch (error) {
    console.error("[mint-stats] failed:", error);

    if (mintStatsCache?.data) {
      res.json({
        ...mintStatsCache.data,
        stale: true,
        error:
          "Live refresh failed; serving last successful data.",
      });
      return;
    }

    res.status(502).json({
      connected: false,
      status: "UNAVAILABLE",
      totalSupply: NFT_MAX_SUPPLY,
      minted: null,
      remaining: null,
      progressPercent: null,
      uniqueHolders: null,
      mintRatePerMinute: null,
      latestMint: null,
      updatedAt: null,
      error:
        "Unable to load live mint data from Blockscout.",
    });
  }
});


const OPENSEA_COLLECTION_SLUG = config.nft.openSeaSlug || "";
const OPENSEA_API_KEY =
  String(process.env.OPENSEA_API_KEY || "").trim();
const OPENSEA_STATS_CACHE_TTL_MS = 60 * 1000;
const FLOOR_TREND_WINDOW_MS = 4 * 60 * 60 * 1000;
const FLOOR_SNAPSHOT_MIN_INTERVAL_MS = 30 * 60 * 1000;
const FLOOR_HISTORY_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const FLOOR_SURGE_THRESHOLD_PERCENT = 25;
const FLOOR_TREND_CACHE_TTL_MS = 2 * 60 * 1000;
const FLOOR_HISTORY_FILE =
  process.env.FLOOR_HISTORY_FILE ||
  path.join(__dirname, "data", "floor-history.json");

let openSeaStatsCache = null;
let floorTrendCache = null;
let floorTrendPromise = null;
let floorHistory = [];

function loadFloorHistory() {
  try {
    if (!fs.existsSync(FLOOR_HISTORY_FILE)) return;
    const parsed = JSON.parse(fs.readFileSync(FLOOR_HISTORY_FILE, "utf8"));
    if (!Array.isArray(parsed)) return;
    floorHistory = parsed.filter((entry) =>
      Number.isFinite(Number(entry?.floorPriceEth)) &&
      Number.isFinite(Number(entry?.timestamp))
    );
  } catch (error) {
    console.warn("[floor-trend] unable to read history:", error.message);
  }
}

function saveFloorHistory() {
  try {
    fs.mkdirSync(path.dirname(FLOOR_HISTORY_FILE), { recursive: true });
    fs.writeFileSync(
      FLOOR_HISTORY_FILE,
      JSON.stringify(floorHistory, null, 2),
      "utf8"
    );
  } catch (error) {
    console.warn("[floor-trend] unable to persist history:", error.message);
  }
}

function recordFloorSnapshot(floorPriceEth, timestamp = Date.now()) {
  const floor = Number(floorPriceEth);
  if (!Number.isFinite(floor) || floor <= 0) return;

  const cutoff = timestamp - FLOOR_HISTORY_RETENTION_MS;
  floorHistory = floorHistory.filter((entry) => entry.timestamp >= cutoff);

  const latest = floorHistory.at(-1);
  if (
    latest &&
    timestamp - latest.timestamp < FLOOR_SNAPSHOT_MIN_INTERVAL_MS
  ) {
    return;
  }

  floorHistory.push({ timestamp, floorPriceEth: floor });
  saveFloorHistory();
}

function getFloorTrend(currentFloorEth, now = Date.now()) {
  const current = Number(currentFloorEth);
  if (!Number.isFinite(current) || current <= 0) {
    return {
      status: "unavailable",
      direction: "neutral",
      percentChange: null,
      baselineFloorEth: null,
      baselineAt: null,
      signal: null,
      thresholdPercent: FLOOR_SURGE_THRESHOLD_PERCENT,
    };
  }

  const target = now - FLOOR_TREND_WINDOW_MS;
  const candidates = floorHistory.filter((entry) => entry.timestamp <= target);
  const baseline = candidates.at(-1);

  if (!baseline) {
    const first = floorHistory[0] || null;
    const elapsedMs = first ? now - first.timestamp : 0;
    return {
      status: "building",
      direction: "neutral",
      percentChange: null,
      baselineFloorEth: first?.floorPriceEth ?? null,
      baselineAt: first ? new Date(first.timestamp).toISOString() : null,
      hoursRemaining: Math.max(
        0,
        Math.ceil((FLOOR_TREND_WINDOW_MS - elapsedMs) / 3_600_000)
      ),
      signal: null,
      thresholdPercent: FLOOR_SURGE_THRESHOLD_PERCENT,
    };
  }

  const percentChange =
    ((current - baseline.floorPriceEth) / baseline.floorPriceEth) * 100;
  const direction = percentChange > 0 ? "up" : percentChange < 0 ? "down" : "neutral";
  const signal =
    percentChange >= FLOOR_SURGE_THRESHOLD_PERCENT
      ? "surge"
      : percentChange <= -FLOOR_SURGE_THRESHOLD_PERCENT
        ? "drop"
        : null;

  return {
    status: "ready",
    direction,
    percentChange,
    baselineFloorEth: baseline.floorPriceEth,
    baselineAt: new Date(baseline.timestamp).toISOString(),
    signal,
    thresholdPercent: FLOOR_SURGE_THRESHOLD_PERCENT,
  };
}

loadFloorHistory();
let openSeaStatsPromise = null;

function formatEthValue(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount < 0) {
    return null;
  }

  if (amount >= 1000) return amount.toFixed(0);
  if (amount >= 100) return amount.toFixed(1);
  if (amount >= 1) return amount.toFixed(3);

  return amount
    .toFixed(4)
    .replace(/0+$/, "")
    .replace(/\.$/, "");
}

function firstFiniteNumber(...values) {
  for (const value of values) {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}


function normalizeFloorHistoryTime(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 1e12 ? value : value * 1000;
  }

  const numeric = Number(value);
  if (Number.isFinite(numeric) && String(value).trim() !== "") {
    return numeric > 1e12 ? numeric : numeric * 1000;
  }

  const parsed = Date.parse(String(value || ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function floorTrendFromBaseline(currentFloorEth, baselineFloorEth, baselineAt) {
  const current = Number(currentFloorEth);
  const baseline = Number(baselineFloorEth);

  if (!Number.isFinite(current) || current <= 0 || !Number.isFinite(baseline) || baseline <= 0) {
    return null;
  }

  const percentChange = ((current - baseline) / baseline) * 100;
  const direction = percentChange > 0 ? "up" : percentChange < 0 ? "down" : "neutral";
  const signal =
    percentChange >= FLOOR_SURGE_THRESHOLD_PERCENT
      ? "surge"
      : percentChange <= -FLOOR_SURGE_THRESHOLD_PERCENT
        ? "drop"
        : null;

  return {
    status: "ready",
    direction,
    percentChange,
    baselineFloorEth: baseline,
    baselineAt: new Date(baselineAt).toISOString(),
    signal,
    thresholdPercent: FLOOR_SURGE_THRESHOLD_PERCENT,
    source: "OpenSea floor history",
  };
}

async function loadOpenSeaFloorTrend(currentFloorEth, now = Date.now()) {
  if (!OPENSEA_API_KEY || !OPENSEA_COLLECTION_SLUG) return null;

  const url = new URL(
    `https://api.opensea.io/api/v2/collections/${encodeURIComponent(OPENSEA_COLLECTION_SLUG)}/floor_prices`
  );
  url.searchParams.set("timeframe", "one_day");
  url.searchParams.set("resolution", "49");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "X-API-KEY": OPENSEA_API_KEY,
      "User-Agent": `${config.project.id}-nft-terminal/${config.project.version}`,
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`OpenSea floor history request failed: HTTP ${response.status}`);
  }

  const payload = await response.json();
  const points = (Array.isArray(payload?.floor_prices) ? payload.floor_prices : [])
    .map((point) => ({
      timestamp: normalizeFloorHistoryTime(point?.time),
      floorPriceEth: firstFiniteNumber(point?.token_unit, point?.tokenUnit),
    }))
    .filter((point) =>
      Number.isFinite(point.timestamp) &&
      Number.isFinite(point.floorPriceEth) &&
      point.floorPriceEth > 0
    )
    .sort((a, b) => a.timestamp - b.timestamp);

  if (!points.length) return null;

  const target = now - FLOOR_TREND_WINDOW_MS;
  const earliest = points[0];
  const latest = points.at(-1);

  // Require the returned history to actually reach back to roughly 4 hours ago.
  // A 90-minute tolerance accommodates bucket boundaries and sparse early data.
  const coverageToleranceMs = 90 * 60 * 1000;
  if (earliest.timestamp > target + coverageToleranceMs) {
    const elapsedMs = Math.max(0, now - earliest.timestamp);
    return {
      status: "building",
      direction: "neutral",
      percentChange: null,
      baselineFloorEth: earliest.floorPriceEth,
      baselineAt: new Date(earliest.timestamp).toISOString(),
      hoursRemaining: Math.max(
        0,
        Math.ceil((FLOOR_TREND_WINDOW_MS - elapsedMs) / 3_600_000)
      ),
      signal: null,
      thresholdPercent: FLOOR_SURGE_THRESHOLD_PERCENT,
      source: "OpenSea floor history",
    };
  }

  const baseline = points.reduce((best, point) => {
    if (!best) return point;
    return Math.abs(point.timestamp - target) < Math.abs(best.timestamp - target)
      ? point
      : best;
  }, null);

  return floorTrendFromBaseline(
    currentFloorEth,
    baseline?.floorPriceEth,
    baseline?.timestamp
  ) || (latest ? floorTrendFromBaseline(currentFloorEth, latest.floorPriceEth, latest.timestamp) : null);
}

async function loadOpenSeaCollectionStats() {
  if (!OPENSEA_API_KEY) {
    return {
      connected: false,
      requiresApiKey: true,
      floorPriceEth: null,
      floorTrend: getFloorTrend(null),
      totalVolumeEth: null,
      sales: null,
      owners: null,
      listed: null,
      source: "OpenSea",
      updatedAt: null,
    };
  }

  const response = await fetch(
    `https://api.opensea.io/api/v2/collections/` +
    `${OPENSEA_COLLECTION_SLUG}/stats`,
    {
      headers: {
        Accept: "application/json",
        "X-API-KEY": OPENSEA_API_KEY,
        "User-Agent": `${config.project.id}-nft-terminal/${config.project.version}`,
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    }
  );

  if (!response.ok) {
    throw new Error(
      `OpenSea stats request failed: HTTP ${response.status}`
    );
  }

  const payload = await response.json();
  const total = payload?.total ?? payload ?? {};

  const floorPriceEth = firstFiniteNumber(
    total?.floor_price,
    total?.floorPrice,
    payload?.floor_price,
    payload?.floorPrice
  );

  const totalVolumeEth = firstFiniteNumber(
    total?.volume,
    total?.total_volume,
    total?.totalVolume,
    payload?.total_volume
  );

  const intervals = Array.isArray(payload?.intervals) ? payload.intervals : [];
  const oneDay = intervals.find((entry) =>
    ["one_day", "1d", "24h"].includes(String(entry?.interval ?? "").toLowerCase())
  ) ?? intervals[0] ?? {};

  const volume24hEth = firstFiniteNumber(
    oneDay?.volume,
    oneDay?.volume_eth,
    payload?.one_day_volume,
    payload?.volume_24h
  );

  const sales = firstFiniteNumber(
    total?.sales,
    total?.total_sales,
    total?.totalSales
  );

  const owners = firstFiniteNumber(
    total?.num_owners,
    total?.numOwners,
    total?.owners
  );

  const listed = firstFiniteNumber(
    total?.num_listed,
    total?.numListed,
    total?.listed
  );

  const snapshotTime = Date.now();
  recordFloorSnapshot(floorPriceEth, snapshotTime);

  // Keep core collection stats fast. The 4h floor trend is fetched through
  // /api/floor-trend so a slower OpenSea history request never blocks the
  // current floor, volume, holders or updated-time UI.
  return {
    connected: true,
    requiresApiKey: false,
    floorPriceEth,
    floorTrend: floorTrendCache?.data ?? null,
    floorPriceDisplay:
      floorPriceEth == null
        ? "UNAVAILABLE"
        : `${formatEthValue(floorPriceEth)} ETH`,
    totalVolumeEth,
    totalVolumeDisplay:
      totalVolumeEth == null
        ? "UNAVAILABLE"
        : `${formatEthValue(totalVolumeEth)} ETH`,
    volume24hEth,
    volume24hDisplay:
      volume24hEth == null
        ? "UNAVAILABLE"
        : `${formatEthValue(volume24hEth)} ETH`,
    sales,
    owners,
    listed,
    source: "OpenSea",
    updatedAt: new Date().toISOString(),
  };
}


async function getOpenSeaFloorTrend(currentFloorEth) {
  const current = Number(currentFloorEth);
  const now = Date.now();

  if (!Number.isFinite(current) || current <= 0) {
    return getFloorTrend(null);
  }

  if (
    floorTrendCache &&
    floorTrendCache.floorPriceEth === current &&
    now - floorTrendCache.fetchedAt < FLOOR_TREND_CACHE_TTL_MS
  ) {
    return floorTrendCache.data;
  }

  if (floorTrendPromise) {
    return floorTrendPromise;
  }

  floorTrendPromise = (async () => {
    let trend = null;
    let floorHistoryUnavailable = false;

    try {
      trend = await loadOpenSeaFloorTrend(current, now);
    } catch (error) {
      floorHistoryUnavailable = true;
      console.warn(
        "[floor-trend] OpenSea history unavailable; using local fallback:",
        error.message
      );
    }

    if (!trend) {
      trend = getFloorTrend(current, now);

      // A fresh Render filesystem can make local history look like a brand-new
      // 4h baseline. Do not show a misleading countdown after a restart.
      if (floorHistoryUnavailable && trend?.status === "building") {
        trend = {
          ...getFloorTrend(null),
          source: "OpenSea floor history unavailable",
        };
      }
    }

    floorTrendCache = {
      floorPriceEth: current,
      fetchedAt: Date.now(),
      data: trend,
    };

    return trend;
  })();

  try {
    return await floorTrendPromise;
  } finally {
    floorTrendPromise = null;
  }
}

async function getOpenSeaCollectionStats() {
  if (
    openSeaStatsCache &&
    Date.now() - openSeaStatsCache.fetchedAt <
      OPENSEA_STATS_CACHE_TTL_MS
  ) {
    return {
      ...openSeaStatsCache.data,
      cacheAgeSeconds: Math.floor(
        (Date.now() - openSeaStatsCache.fetchedAt) /
        1000
      ),
    };
  }

  if (openSeaStatsPromise) {
    return openSeaStatsPromise;
  }

  openSeaStatsPromise = (async () => {
    try {
      const data = await loadOpenSeaCollectionStats();

      openSeaStatsCache = {
        fetchedAt: Date.now(),
        data,
      };

      return {
        ...data,
        cacheAgeSeconds: 0,
      };
    } finally {
      openSeaStatsPromise = null;
    }
  })();

  return openSeaStatsPromise;
}

app.get("/api/collection-stats", async (_req, res) => {
  try {
    const stats = await getOpenSeaCollectionStats();
    res.json(stats);
  } catch (error) {
    console.error("[collection-stats] failed:", error);

    if (openSeaStatsCache?.data) {
      res.json({
        ...openSeaStatsCache.data,
        stale: true,
        error:
          "OpenSea refresh failed; serving last successful data.",
      });
      return;
    }

    res.status(502).json({
      connected: false,
      requiresApiKey: !OPENSEA_API_KEY,
      floorPriceEth: null,
      floorPriceDisplay: "UNAVAILABLE",
      totalVolumeEth: null,
      totalVolumeDisplay: "UNAVAILABLE",
      volume24hEth: null,
      volume24hDisplay: "UNAVAILABLE",
      sales: null,
      owners: null,
      listed: null,
      source: "OpenSea",
      updatedAt: null,
      error:
        "Unable to load OpenSea collection statistics.",
    });
  }
});


app.get("/api/floor-trend", async (_req, res) => {
  try {
    const stats = await getOpenSeaCollectionStats();
    const trend = await getOpenSeaFloorTrend(stats?.floorPriceEth);
    res.json({
      connected: Boolean(stats?.connected),
      floorPriceEth: stats?.floorPriceEth ?? null,
      floorTrend: trend,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[floor-trend] failed:", error);
    res.status(502).json({
      connected: false,
      floorPriceEth: null,
      floorTrend: getFloorTrend(null),
      updatedAt: null,
      error: "Unable to load 4h floor-price trend.",
    });
  }
});



const OPENSEA_SALES_CACHE_TTL_MS = 15 * 1000;
const OPENSEA_SALES_POLL_MS = 15 * 1000;
const OPENSEA_SALES_LIMIT = 200;
const OPENSEA_COLLECTION_URL =
  config.links.openSea || `https://opensea.io/collection/${OPENSEA_COLLECTION_SLUG}/overview`;

let openSeaSalesCache = null;
let openSeaSalesPromise = null;

function normalizeOpenSeaAddress(value) {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.address || value.hash || null;
}

function normalizeOpenSeaTimestamp(value) {
  if (value == null) return null;
  const numeric = Number(value);
  const date = Number.isFinite(numeric)
    ? new Date(numeric > 1e12 ? numeric : numeric * 1000)
    : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeOpenSeaPayment(payment) {
  if (!payment) return { amount: null, symbol: null };

  const decimals = Number(payment.decimals ?? payment.token?.decimals ?? 18);
  const quantity = payment.quantity ?? payment.amount ?? payment.value ?? null;
  const symbol = String(
    payment.symbol ?? payment.token?.symbol ?? payment.payment_token?.symbol ?? ""
  ).trim() || null;

  let amount = null;
  if (quantity != null) {
    const raw = Number(quantity);
    if (Number.isFinite(raw)) {
      amount = raw / (10 ** (Number.isFinite(decimals) ? decimals : 18));
    }
  }

  if (amount == null) {
    amount = firstFiniteNumber(
      payment.eth_price,
      payment.native_price,
      payment.amount_decimal
    );
  }

  return { amount, symbol };
}

function buildOpenSeaItemUrl(event, tokenId) {
  const supplied =
    event?.nft?.opensea_url ??
    event?.nft?.permalink ??
    event?.asset?.permalink ??
    event?.permalink ??
    null;

  if (supplied) return String(supplied);

  const chain = String(event?.chain ?? event?.nft?.chain ?? "").trim();
  const contract = String(
    event?.nft?.contract ??
    event?.asset_contract?.address ??
    event?.contract_address ??
    NFT_CONTRACT
  ).trim();

  if (chain && contract && tokenId != null) {
    return `https://opensea.io/assets/${encodeURIComponent(chain)}/${encodeURIComponent(contract)}/${encodeURIComponent(tokenId)}`;
  }

  return OPENSEA_COLLECTION_URL;
}

function normalizeOpenSeaSale(event) {
  const tokenId =
    event?.nft?.identifier ??
    event?.asset?.token_id ??
    event?.token_id ??
    event?.identifier ??
    null;

  const payment = normalizeOpenSeaPayment(
    event?.payment ?? event?.payment_token ?? event?.sale_price
  );

  const txHash = String(
    event?.transaction ??
    event?.transaction_hash ??
    event?.transaction?.hash ??
    ""
  ).trim() || null;

  return {
    id: String(
      event?.event_id ??
      event?.id ??
      `${txHash || "sale"}:${tokenId || "unknown"}`
    ),
    tokenId: tokenId == null ? null : String(tokenId),
    price: payment.amount,
    priceDisplay:
      payment.amount == null
        ? "Price unavailable"
        : `${formatEthValue(payment.amount)} ${payment.symbol || "ETH"}`,
    paymentSymbol: payment.symbol || null,
    isLargeSale: false,
    premiumThresholdEth: null,
    percentAboveFloor: null,
    buyer: normalizeOpenSeaAddress(event?.buyer ?? event?.to_account),
    seller: normalizeOpenSeaAddress(event?.seller ?? event?.from_account),
    transactionHash: txHash,
    occurredAt: normalizeOpenSeaTimestamp(
      event?.event_timestamp ?? event?.created_date ?? event?.timestamp
    ),
    openSeaUrl: buildOpenSeaItemUrl(event, tokenId),
  };
}

async function loadOpenSeaSales() {
  if (!OPENSEA_API_KEY) {
    return {
      connected: false,
      requiresApiKey: true,
      sales: [],
      updatedAt: null,
      source: "OpenSea",
    };
  }

  const url = new URL(
    `https://api.opensea.io/api/v2/events/collection/${OPENSEA_COLLECTION_SLUG}`
  );
  url.searchParams.set("event_type", "sale");
  url.searchParams.set("limit", String(OPENSEA_SALES_LIMIT));

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "X-API-KEY": OPENSEA_API_KEY,
      "User-Agent": `${config.project.id}-nft-sales/${config.project.version}`,
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`OpenSea sales request failed: HTTP ${response.status}`);
  }

  const payload = await response.json();
  const events = Array.isArray(payload?.asset_events)
    ? payload.asset_events
    : Array.isArray(payload?.events)
      ? payload.events
      : [];

  const stats = await getOpenSeaCollectionStats();
  const currentFloorEth = Number(stats?.floorPriceEth);
  const premiumThresholdEth =
    Number.isFinite(currentFloorEth) && currentFloorEth > 0
      ? currentFloorEth * 1.25
      : null;

  const seen = new Set();
  const normalizedSales = events
    .filter((event) => String(event?.event_type ?? "sale").toLowerCase() === "sale")
    .map(normalizeOpenSeaSale)
    .filter((sale) => {
      if (seen.has(sale.id)) return false;
      seen.add(sale.id);
      return true;
    })
    .map((sale) => {
      const amount = Number(sale.price);
      const isEth = ["ETH", "WETH"].includes(
        String(sale.paymentSymbol || "ETH").toUpperCase()
      );
      const percentAboveFloor =
        premiumThresholdEth != null && Number.isFinite(amount)
          ? ((amount - currentFloorEth) / currentFloorEth) * 100
          : null;
      return {
        ...sale,
        isLargeSale:
          premiumThresholdEth != null && isEth && amount >= premiumThresholdEth,
        premiumThresholdEth,
        percentAboveFloor,
      };
    })
    .sort((a, b) => new Date(b.occurredAt || 0) - new Date(a.occurredAt || 0));

  const pricedEthSales = normalizedSales.filter((sale) => {
    const amount = Number(sale.price);
    const symbol = String(sale.paymentSymbol || "ETH").toUpperCase();
    return Number.isFinite(amount) && amount >= 0 && ["ETH", "WETH"].includes(symbol);
  });

  const lastSale = pricedEthSales[0] || null;
  const cutoff24h = Date.now() - (24 * 60 * 60 * 1000);
  const highest24hSale = pricedEthSales
    .filter((sale) => {
      const occurred = Date.parse(sale.occurredAt || "");
      return Number.isFinite(occurred) && occurred >= cutoff24h;
    })
    .reduce((highest, sale) => {
      if (!highest) return sale;
      return Number(sale.price) > Number(highest.price) ? sale : highest;
    }, null);

  const sales = normalizedSales.slice(0, 12);
  // Collection Pulse reuses the same OpenSea fetch without changing the existing
  // 12-card NFT Sales Tracker payload/DOM. Keep only the fields needed for a
  // local "since last visit" comparison.
  const pulseSales = normalizedSales.map((sale) => ({
    id: sale.id,
    price: sale.price,
    priceDisplay: sale.priceDisplay,
    paymentSymbol: sale.paymentSymbol,
    isLargeSale: sale.isLargeSale === true,
    buyer: sale.buyer,
    seller: sale.seller,
    occurredAt: sale.occurredAt,
  }));
  const pulseFeedCapped = events.length >= OPENSEA_SALES_LIMIT;

  return {
    connected: true,
    requiresApiKey: false,
    sales,
    pulseSales,
    pulseFeedCapped,
    pulseFeedLimit: OPENSEA_SALES_LIMIT,
    lastSalePriceDisplay: lastSale?.priceDisplay || null,
    highest24hSalePriceDisplay: highest24hSale?.priceDisplay || null,
    updatedAt: new Date().toISOString(),
    source: "OpenSea",
  };
}

async function getOpenSeaSales({ force = false } = {}) {
  if (
    !force &&
    openSeaSalesCache &&
    Date.now() - openSeaSalesCache.fetchedAt < OPENSEA_SALES_CACHE_TTL_MS
  ) {
    return {
      ...openSeaSalesCache.data,
      cacheAgeSeconds: Math.floor(
        (Date.now() - openSeaSalesCache.fetchedAt) / 1000
      ),
    };
  }

  if (openSeaSalesPromise) return openSeaSalesPromise;

  openSeaSalesPromise = (async () => {
    try {
      const data = await loadOpenSeaSales();
      openSeaSalesCache = { fetchedAt: Date.now(), data };
      return { ...data, cacheAgeSeconds: 0 };
    } finally {
      openSeaSalesPromise = null;
    }
  })();

  return openSeaSalesPromise;
}

app.get("/api/nft-sales", async (_req, res) => {
  try {
    res.json(await getOpenSeaSales());
  } catch (error) {
    console.error("[nft-sales] failed:", error);

    if (openSeaSalesCache?.data) {
      res.json({
        ...openSeaSalesCache.data,
        stale: true,
        error: "OpenSea refresh failed; serving the last successful sales feed.",
      });
      return;
    }

    res.status(502).json({
      connected: false,
      requiresApiKey: !OPENSEA_API_KEY,
      sales: [],
      updatedAt: null,
      source: "OpenSea",
      error: "Unable to load recent OpenSea sales.",
    });
  }
});

async function refreshOpenSeaSalesInBackground() {
  try {
    await getOpenSeaSales({ force: true });
  } catch (error) {
    console.error("[nft-sales] background refresh failed:", error);
  }
}

setTimeout(refreshOpenSeaSalesInBackground, 1500);
setInterval(refreshOpenSeaSalesInBackground, OPENSEA_SALES_POLL_MS);


const NFT_HOLDERS_CACHE_TTL_MS = 30 * 1000;

const NFT_WHALE_THRESHOLD = Number(config.nft.whaleThreshold || 10);
let nftHoldersCache = null;
let nftHoldersPromise = null;

async function fetchLegacyBlockscoutJson(params, attempt = 0) {
  const query = new URLSearchParams(params);
  const url =
    `${new URL(config.market.blockscoutApiBase).origin}/api?${query}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": `${config.project.id}-nft-terminal/${config.project.version}`,
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (response.status === 429 && attempt < 3) {
    const retryAfter =
      Number(response.headers.get("retry-after")) || 0;
    const waitMs = retryAfter > 0
      ? retryAfter * 1000
      : 1000 * (2 ** attempt);

    await new Promise((resolve) =>
      setTimeout(resolve, waitMs)
    );

    return fetchLegacyBlockscoutJson(
      params,
      attempt + 1
    );
  }

  if (!response.ok) {
    throw new Error(
      `Blockscout holders request failed: HTTP ${response.status}`
    );
  }

  const payload = await response.json();

  if (
    payload?.status !== "1" ||
    !Array.isArray(payload?.result)
  ) {
    throw new Error(
      payload?.message ||
      "Unexpected Blockscout holders response"
    );
  }

  return payload.result;
}

function normalizeHolder(item) {
  const address = String(
    item?.address?.hash ??
    item?.address ??
    item?.address_hash?.hash ??
    item?.address_hash ??
    ""
  ).toLowerCase();

  const rawValue =
    item?.value ??
    item?.balance ??
    1;

  const count = Math.max(
    0,
    Math.trunc(Number(rawValue))
  );

  return { address, count };
}

function distributionBucket(count) {
  if (count === 1) return "1";
  if (count === 2) return "2";
  if (count <= 5) return "3-5";
  if (count <= 9) return "6-9";
  return "10+";
}

async function fetchAllNftHoldersV2() {
  const aggregated = new Map();
  let nextPageParams = null;

  for (let page = 0; page < 100; page += 1) {
    const query = new URLSearchParams();

    if (nextPageParams) {
      for (const [key, value] of Object.entries(
        nextPageParams
      )) {
        if (
          value !== null &&
          value !== undefined
        ) {
          query.set(key, String(value));
        }
      }
    }

    const suffix = query.toString()
      ? `?${query.toString()}`
      : "";

    const payload = await fetchBlockscoutJson(
      `/tokens/${NFT_CONTRACT}/holders${suffix}`
    );

    const items = Array.isArray(payload?.items)
      ? payload.items
      : [];

    for (const item of items) {
      const holder = normalizeHolder(item);

      if (
        !/^0x[a-f0-9]{40}$/.test(holder.address) ||
        holder.count <= 0
      ) {
        continue;
      }

      aggregated.set(
        holder.address,
        (aggregated.get(holder.address) || 0) +
        holder.count
      );
    }

    nextPageParams =
      payload?.next_page_params ?? null;

    if (!nextPageParams || items.length === 0) {
      break;
    }

    await new Promise((resolve) =>
      setTimeout(resolve, 120)
    );
  }

  return Array.from(
    aggregated,
    ([address, count]) => ({
      address,
      count,
    })
  );
}

async function loadNftHolderAnalytics() {
  let rawHolders;
  try {
    rawHolders = await fetchAllNftHoldersV2();
  } catch (error) {
    if (blockscoutHttpStatus(error) === 404 && isScheduledPreMint()) {
      return pendingHolderAnalytics();
    }
    throw error;
  }
  const holders = rawHolders
    .filter(
      (holder) =>
        /^0x[a-f0-9]{40}$/.test(holder.address) &&
        holder.count > 0
    )
    .sort((a, b) => b.count - a.count);

  if (holders.length === 0) {
    if (isScheduledPreMint()) return pendingHolderAnalytics();
    throw new Error("Blockscout returned no NFT holders.");
  }

  const totalHeld = holders.reduce(
    (sum, holder) => sum + holder.count,
    0
  );

  const distribution = {
    "1": 0,
    "2": 0,
    "3-5": 0,
    "6-9": 0,
    "10+": 0,
  };

  for (const holder of holders) {
    distribution[distributionBucket(holder.count)] += 1;
  }

  const top10Held = holders
    .slice(0, 10)
    .reduce((sum, holder) => sum + holder.count, 0);
  const sortedCounts = holders.map((holder)=>holder.count).sort((a,b)=>a-b);
  const middle = Math.floor(sortedCounts.length / 2);
  const medianHeld = sortedCounts.length % 2
    ? sortedCounts[middle]
    : Number(((sortedCounts[middle - 1] + sortedCounts[middle]) / 2).toFixed(2));
  const top1HolderCount = Math.max(1, Math.ceil(holders.length * 0.01));
  const top1Held = holders.slice(0, top1HolderCount).reduce((sum, holder)=>sum + holder.count, 0);

  return {
    connected: true,
    totalHolders: holders.length,
    totalHeld,
    largestHolder: holders[0]?.count ?? 0,
    averageHeld:
      holders.length > 0
        ? Number((totalHeld / holders.length).toFixed(2))
        : 0,
    medianHeld,
    whaleThreshold: NFT_WHALE_THRESHOLD,
    whaleCount: holders.filter(
      (holder) =>
        holder.count >= NFT_WHALE_THRESHOLD
    ).length,
    top10ConcentrationPercent:
      totalHeld > 0
        ? Number(
            ((top10Held / totalHeld) * 100).toFixed(2)
          )
        : 0,
    top1ConcentrationPercent:
      totalHeld > 0 ? Number(((top1Held / totalHeld) * 100).toFixed(2)) : 0,
    top1HolderCount,
    distribution,
    holders,
    updatedAt: new Date().toISOString(),
  };
}

async function getNftHolderAnalytics() {
  if (
    nftHoldersCache &&
    Date.now() - nftHoldersCache.fetchedAt <
      NFT_HOLDERS_CACHE_TTL_MS
  ) {
    return nftHoldersCache.data;
  }

  if (nftHoldersPromise) return nftHoldersPromise;

  nftHoldersPromise = (async () => {
    try {
      const data = await loadNftHolderAnalytics();
      nftHoldersCache = {
        fetchedAt: Date.now(),
        data,
      };
      recordPostMintHolderObservation(data);
      return data;
    } finally {
      nftHoldersPromise = null;
    }
  })();

  return nftHoldersPromise;
}


app.get("/api/nft-whales", async (req, res) => {
  try {
    const analytics = await getNftHolderAnalytics();
    const requestedAddress = String(
      req.query.address || ""
    ).trim().toLowerCase();

    let wallet = null;

    if (/^0x[a-f0-9]{40}$/.test(requestedAddress)) {
      const index = analytics.holders.findIndex(
        (holder) =>
          holder.address === requestedAddress
      );

      wallet = index >= 0
        ? {
            found: true,
            address: requestedAddress,
            rank: index + 1,
            count: analytics.holders[index].count,
            isWhale:
              analytics.holders[index].count >=
              analytics.whaleThreshold,
          }
        : {
            found: false,
            address: requestedAddress,
            rank: null,
            count: 0,
            isWhale: false,
          };
    }

    const top25 = analytics.holders.slice(0, 25);

    res.json({
      connected: true,
      totalHolders: analytics.totalHolders,
      totalHeld: analytics.totalHeld,
      largestHolder: analytics.largestHolder,
      averageHeld: analytics.averageHeld,
      medianHeld: analytics.medianHeld,
      top1ConcentrationPercent: analytics.top1ConcentrationPercent,
      top1HolderCount: analytics.top1HolderCount,
      whaleThreshold: analytics.whaleThreshold,
      whaleCount: analytics.whaleCount,
      top10ConcentrationPercent:
        analytics.top10ConcentrationPercent,
      distribution: analytics.distribution,
      topHolders: top25.map((holder, index) => ({
        rank: index + 1,
        address: holder.address,
        count: holder.count,
        sharePercent:
          NFT_MAX_SUPPLY > 0
            ? Number(
                (
                  holder.count /
                  NFT_MAX_SUPPLY *
                  100
                ).toFixed(2)
              )
            : 0,
      })),
      wallet,
      updatedAt: analytics.updatedAt,
    });
  } catch (error) {
    console.error("[nft-whales] failed:", error);

    if (nftHoldersCache?.data) {
      res.json({
        connected: true,
        stale: true,
        error:
          "Refresh failed; serving last successful holder snapshot.",
        ...nftHoldersCache.data,
        holders: undefined,
        topHolders:
          nftHoldersCache.data.holders
            .slice(0, 25)
            .map((holder, index) => ({
              rank: index + 1,
              address: holder.address,
              count: holder.count,
              sharePercent:
                NFT_MAX_SUPPLY > 0
                  ? Number(
                      (
                        holder.count /
                        NFT_MAX_SUPPLY *
                        100
                      ).toFixed(2)
                    )
                  : 0,
            })),
      });
      return;
    }

    res.status(502).json({
      connected: false,
      error:
        "Unable to load NFT holder analytics.",
    });
  }
});

app.use((_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, "0.0.0.0", () => {
  startNftActivityBackgroundRefresh();
  console.log("");
  console.log(`[ OK ] ${config.project.name} NFT Terminal started.`);
  console.log(`[ READY ] Open: http://localhost:${port}`);
  console.log("");
});
