const CFG = window.PROJECT_CONFIG;
const MARKET_REFRESH_MS = 30_000;
const MINT_AT = new Date(CFG?.nft?.mintAt || "2026-08-15T23:08:00+03:00");
const PENDING_MINT_DATA = "Pending mint...";
const isPreMint = () => Date.now() < MINT_AT.getTime();

function setLiveValueState(nodes, isLive){
  for(const node of nodes){
    if(node) node.classList.toggle("live-data-value", Boolean(isLive));
  }
}


const elements = {
  boot: document.getElementById("boot"),  mintStatus: document.getElementById("mintStatus"),
  marketPriceStatus:
    document.getElementById("marketPriceStatus"),
  marketHoldersStatus:
    document.getElementById("marketHoldersStatus"),
  marketVolumeStatus:
    document.getElementById("marketVolumeStatus"),
  marketLastSaleStatus:
    document.getElementById("marketLastSaleStatus"),
  marketHighestSaleStatus:
    document.getElementById("marketHighestSaleStatus"),
  marketUpdatedStatus:
    document.getElementById("marketUpdatedStatus"),
  marketPrice:
    document.getElementById("marketPrice"),
  marketHolders:
    document.getElementById("marketHolders"),
  marketVolume:
    document.getElementById("marketVolume"),
  marketLastSale:
    document.getElementById("marketLastSale"),
  marketHighestSale:
    document.getElementById("marketHighestSale"),
  marketUpdated:
    document.getElementById("marketUpdated"),
  dataConnection:
    document.getElementById("dataConnection"),
  mintDashboard:
    document.getElementById("mintDashboard"),
  mintDashboardToggle:
    document.getElementById("mintDashboardToggle"),
  mintDashboardSummary:
    document.getElementById("mintDashboardSummary"),
  mintDashboardBody:
    document.getElementById("mintDashboardBody"),
  progressPercent:
    document.getElementById("progressPercent"),
  progressFill:
    document.getElementById("progressFill"),
  mintedCount:
    document.getElementById("mintedCount"),
  remainingCount:
    document.getElementById("remainingCount"),
  uniqueMinters:
    document.getElementById("uniqueMinters"),
  mintRate:
    document.getElementById("mintRate"),
  latestMint:
    document.getElementById("latestMint"),
  openSeaMarketPanel:
    document.getElementById("openSeaMarketPanel"),
  openSeaMarketToggle:
    document.getElementById("openSeaMarketToggle"),
  openSeaMarketSummary:
    document.getElementById("openSeaMarketSummary"),
  openSeaMarketBody:
    document.getElementById("openSeaMarketBody"),
  collectionDataStatus:
    document.getElementById("collectionDataStatus"),
  floorPrice:
    document.getElementById("floorPrice"),
  floorTrend:
    document.getElementById("floorTrend"),
  salesFloorPrice:
    document.getElementById("salesFloorPrice"),
  salesFloorTrend:
    document.getElementById("salesFloorTrend"),
  totalVolume:
    document.getElementById("totalVolume"),
  collectionOwners:
    document.getElementById("collectionOwners"),
  collectionSales:
    document.getElementById("collectionSales"),
  collectionListed:
    document.getElementById("collectionListed"),
  openSeaKeyNote:
    document.getElementById("openSeaKeyNote"),
  collectionUpdated:
    document.getElementById("collectionUpdated"),
  nftSalesStatus:
    document.getElementById("nftSalesStatus"),
  nftSalesUpdated:
    document.getElementById("nftSalesUpdated"),
  nftSalesRows:
    document.getElementById("nftSalesRows"),
  nftWhalesPanel:
    document.getElementById("nftWhalesPanel"),
  nftWhalesToggle:
    document.getElementById("nftWhalesToggle"),
  nftWhalesSummary:
    document.getElementById("nftWhalesSummary"),
  nftWhalesBody:
    document.getElementById("nftWhalesBody"),
  nftWhalesStatus:
    document.getElementById("nftWhalesStatus"),
  nftWhalesUpdated:
    document.getElementById("nftWhalesUpdated"),
  nftWhaleCount:
    document.getElementById("nftWhaleCount"),
  largestNftHolder:
    document.getElementById("largestNftHolder"),
  top10Concentration:
    document.getElementById("top10Concentration"),
  nftWhaleRows:
    document.getElementById("nftWhaleRows"),
  nftDistribution:
    document.getElementById("nftDistribution"),
  nftWalletForm:
    document.getElementById("nftWalletForm"),
  nftWalletInput:
    document.getElementById("nftWalletInput"),
  nftWalletResult:
    document.getElementById("nftWalletResult"),
  blockscoutWalletForm:
    document.getElementById("blockscoutWalletForm"),
  blockscoutWalletInput:
    document.getElementById("blockscoutWalletInput"),
  blockscoutWalletStatus:
    document.getElementById("blockscoutWalletStatus"),
  collectionPulsePanel:
    document.getElementById("collectionPulsePanel"),
  collectionPulseAge:
    document.getElementById("collectionPulseAge"),
  collectionPulseFirstVisit:
    document.getElementById("collectionPulseFirstVisit"),
  collectionPulseBody:
    document.getElementById("collectionPulseBody"),
  pulseSales:
    document.getElementById("pulseSales"),
  pulseBuyers:
    document.getElementById("pulseBuyers"),
  pulseSellers:
    document.getElementById("pulseSellers"),
  pulseFloor:
    document.getElementById("pulseFloor"),
  pulsePremium:
    document.getElementById("pulsePremium"),
  pulseTopSale:
    document.getElementById("pulseTopSale"),
  collectionPulseNote:
    document.getElementById("collectionPulseNote"),
};

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const COLLECTION_PULSE_STORAGE_KEY = `nft-terminal-pulse:${CFG?.project?.id || "collection"}`;
const collectionPulseVisitStartedAt = Date.now();
let collectionPulsePrevious = null;
let collectionPulseCurrentFloorEth = null;
let collectionPulseSalesData = null;

try {
  const storedPulse = JSON.parse(localStorage.getItem(COLLECTION_PULSE_STORAGE_KEY) || "null");
  if(storedPulse && Number.isFinite(Number(storedPulse.visitedAt))){
    collectionPulsePrevious = {
      visitedAt: Number(storedPulse.visitedAt),
      floorEth: Number.isFinite(Number(storedPulse.floorEth))
        ? Number(storedPulse.floorEth)
        : null,
    };
  }
} catch (_) {}

function collectionPulseAgeText(timestamp){
  const elapsed = Math.max(0, Date.now() - Number(timestamp || 0));
  const minutes = Math.floor(elapsed / 60000);
  if(minutes < 1) return "LESS THAN 1M";
  if(minutes < 60) return `${minutes}M AGO`;
  const hours = Math.floor(minutes / 60);
  if(hours < 24) return `${hours}H ${minutes % 60}M AGO`;
  const days = Math.floor(hours / 24);
  return `${days}D ${hours % 24}H AGO`;
}

function formatPulseFloorChange(current, previous){
  const now = Number(current);
  const before = Number(previous);
  if(!Number.isFinite(now) || !Number.isFinite(before) || before <= 0) return "—";
  const change = ((now - before) / before) * 100;
  const sign = change > 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}%`;
}

function saveCollectionPulseVisit(){
  try {
    localStorage.setItem(COLLECTION_PULSE_STORAGE_KEY, JSON.stringify({
      visitedAt: collectionPulseVisitStartedAt,
      floorEth: Number.isFinite(collectionPulseCurrentFloorEth)
        ? collectionPulseCurrentFloorEth
        : null,
    }));
  } catch (_) {}
}

function renderCollectionPulse(){
  if(!elements.collectionPulsePanel) return;

  if(!collectionPulsePrevious){
    elements.collectionPulseFirstVisit.hidden = false;
    elements.collectionPulseBody.hidden = true;
    elements.collectionPulseAge.textContent = "BASELINE";
    saveCollectionPulseVisit();
    return;
  }

  elements.collectionPulseFirstVisit.hidden = true;
  elements.collectionPulseBody.hidden = false;
  elements.collectionPulseAge.textContent =
    `LAST CHECK · ${collectionPulseAgeText(collectionPulsePrevious.visitedAt)}`;

  const sales = Array.isArray(collectionPulseSalesData?.sales)
    ? collectionPulseSalesData.sales
    : [];
  const sinceSales = sales.filter((sale) => {
    const occurred = Date.parse(sale?.occurredAt || "");
    return Number.isFinite(occurred) && occurred > collectionPulsePrevious.visitedAt;
  });

  const buyers = new Set(
    sinceSales.map((sale) => String(sale?.buyer || "").toLowerCase()).filter(Boolean)
  );
  const sellers = new Set(
    sinceSales.map((sale) => String(sale?.seller || "").toLowerCase()).filter(Boolean)
  );
  const premiumSales = sinceSales.filter((sale) => sale?.isLargeSale === true);
  const pricedSales = sinceSales.filter((sale) => Number.isFinite(Number(sale?.price)));
  const topSale = pricedSales.reduce((top, sale) =>
    !top || Number(sale.price) > Number(top.price) ? sale : top
  , null);

  const capped = sales.length >= 12 && sinceSales.length === sales.length;
  elements.pulseSales.textContent = capped ? `${sinceSales.length}+` : String(sinceSales.length);
  elements.pulseBuyers.textContent = String(buyers.size);
  elements.pulseSellers.textContent = String(sellers.size);
  elements.pulsePremium.textContent = String(premiumSales.length);
  elements.pulseTopSale.textContent = topSale?.priceDisplay || "NO SALES";
  elements.pulseFloor.textContent = formatPulseFloorChange(
    collectionPulseCurrentFloorEth,
    collectionPulsePrevious.floorEth
  );

  if(capped){
    elements.collectionPulseNote.textContent =
      "At least 12 sales were captured since your last visit; the recent-sales feed is capped.";
  }else if(!collectionPulseSalesData?.connected){
    elements.collectionPulseNote.textContent =
      "Sales comparison is waiting for OpenSea data.";
  }else{
    elements.collectionPulseNote.textContent =
      "Compared with your previous visit on this browser.";
  }

  saveCollectionPulseVisit();
}

function writeBoot(html) {
  const line = document.createElement("div");
  line.className = "line";
  line.innerHTML = html || "&nbsp;";
  elements.boot.appendChild(line);
}

function renderBoot(lines) {
  elements.boot.innerHTML = "";
  for (const line of lines) {
    writeBoot(line);
  }
}

function responsiveBoot(statusHtml, desktopText, mobileText) {
  return `${statusHtml}<span class="log-copy-desktop">${desktopText}</span><span class="log-copy-mobile">${mobileText}</span>`;
}


async function boot() {
  // Paint the status area immediately so the reserved boot space is never blank
  // while the first live mint-status request is in flight.
  renderBoot([
    '[ <span class="orange">CONNECTING</span> ] ' +
      `Initializing ${CFG.project.name} NFT Terminal...`,
    '[ <span class="orange">CONNECTING</span> ] NFT terminal module loading...',
    '[ <span class="orange">CONNECTING</span> ] NFT contract reference loading...',
    '[ <span class="orange">CONNECTING</span> ] Checking on-chain mint status...',
    '',
    '[ <span class="orange">CONNECTING</span> ] Preparing live collection tracking...',
  ]);

  let mintState = isPreMint() ? "WAITING" : "LIVE";

  if (!isPreMint()) {
    try {
      const response = await fetch("/api/mint-stats", {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (response.ok) {
        const stats = await response.json();
        if (stats?.status === "COMPLETE") {
          mintState = "COMPLETE";
        } else if (stats?.status === "LIVE" || Number(stats?.minted) > 0) {
          mintState = "LIVE";
        }
      }
    } catch (_) {
      // Fall back to the configured mint time when the live endpoint is temporarily unavailable.
    }
  }

  const liveMint = mintState === "LIVE" || mintState === "COMPLETE";

  renderBoot([
    '[ <span class="green">OK</span> ] ' +
      `${CFG.project.name} NFT Terminal initialized.`,
    '[ <span class="green">OK</span> ] NFT terminal module loaded.',
    '[ <span class="green">OK</span> ] NFT contract reference loaded.',
    mintState === "COMPLETE"
      ? '[ <span class="green">COMPLETE</span> ] Mint is complete. Final on-chain mint record loaded.'
      : liveMint
        ? '[ <span class="green">LIVE</span> ] Mint is active · on-chain mint tracking enabled.'
        : '[ <span class="orange">WAITING</span> ] Mint has not started yet.',
    '',
    mintState === "COMPLETE"
      ? '[ <span class="green">READY</span> ] Collection tracking active after mint completion.'
      : liveMint
        ? '[ <span class="green">READY</span> ] Live NFT mint and collection data active.'
        : `[ <span class="orange">UPCOMING</span> ] Mint begins at ${new Date(CFG?.nft?.mintAt || "2026-08-15T23:08:00+03:00").toLocaleString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/Istanbul" })} GMT+3.`,
  ]);
}

let hasMarketData = false;

function setMarketStatus(text, state = "") {
  for (const element of [
    elements.marketPriceStatus,
    elements.marketHoldersStatus,
    elements.marketVolumeStatus,
    elements.marketLastSaleStatus,
    elements.marketHighestSaleStatus,
    elements.marketUpdatedStatus,
  ]) {
    element.textContent = `[ ${text} ]`;
    element.classList.toggle(
      "error",
      state === "error"
    );
  }
}

function formatMarketTime(date) {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}


let latestMarketCollection = null;
let latestFloorTrend = null;

function normalizedTrendChange(value){
  const change = Number(value);
  if(!Number.isFinite(change)) return null;
  return Math.abs(change) < 0.05 ? 0 : change;
}

function compactFloorTrendText(trend){
  if(!trend || trend.status !== "ready") return "";
  const change = normalizedTrendChange(trend.percentChange);
  if(change == null) return "";
  const arrow = change > 0 ? "▲" : change < 0 ? "▼" : "→";
  const sign = change > 0 ? "+" : "";
  return `${arrow} 4h ${sign}${change.toFixed(1)}%`;
}

function renderMarketFloorPrice(collection){
  if(!elements.marketPrice) return;
  latestMarketCollection = collection || latestMarketCollection;
  if(collection?.floorTrend?.status === "ready") latestFloorTrend = collection.floorTrend;

  const activeCollection = latestMarketCollection;
  elements.marketPrice.textContent = activeCollection?.floorPriceDisplay || "UNAVAILABLE";

  const text = compactFloorTrendText(latestFloorTrend);
  if(!text) return;

  const trend = document.createElement("span");
  const change = normalizedTrendChange(latestFloorTrend.percentChange);
  trend.className = `market-floor-trend ${change > 0 ? "up" : change < 0 ? "down" : "flat"}`;
  trend.textContent = text;
  elements.marketPrice.append(" ", trend);
}

function setMarketLineStatus(element, text, state = ""){
  if(!element) return;
  element.textContent = `[ ${text} ]`;
  element.classList.toggle("error", state === "error");
}

function setPendingMarketPanel() {
  setLiveValueState([elements.marketPrice, elements.marketHolders, elements.marketVolume, elements.marketLastSale, elements.marketHighestSale, elements.marketUpdated], false);
  setMarketStatus("PENDING");
  elements.marketPrice.textContent = PENDING_MINT_DATA;
  elements.marketHolders.textContent = PENDING_MINT_DATA;
  elements.marketVolume.textContent = PENDING_MINT_DATA;
  elements.marketLastSale.textContent = PENDING_MINT_DATA;
  elements.marketHighestSale.textContent = PENDING_MINT_DATA;
  elements.marketUpdated.textContent = formatMarketTime(new Date());
}

async function refreshMarketPanel() {
  if (isPreMint()) {
    setPendingMarketPanel();
    return;
  }

  const loadingText = hasMarketData ? "REFRESHING" : "CONNECTING";
  setMarketStatus(loadingText);

  const collectionTask = (async () => {
    try {
      const response = await fetch("/api/collection-stats", {
        headers: { Accept: "application/json" },
      });
      if(!response.ok) throw new Error(`HTTP ${response.status}`);

      const collection = await response.json();
      renderMarketFloorPrice(collection);
      elements.marketVolume.textContent = collection.volume24hDisplay || "UNAVAILABLE";
      elements.marketUpdated.textContent = formatMarketTime(new Date());

      setLiveValueState(
        [elements.marketPrice, elements.marketVolume, elements.marketUpdated],
        true
      );
      setMarketLineStatus(elements.marketPriceStatus, "LIVE");
      setMarketLineStatus(elements.marketVolumeStatus, "LIVE");
      setMarketLineStatus(elements.marketUpdatedStatus, "LIVE");
      hasMarketData = true;
    } catch (_) {
      setMarketLineStatus(elements.marketPriceStatus, "UNAVAILABLE", "error");
      setMarketLineStatus(elements.marketVolumeStatus, "UNAVAILABLE", "error");
      setMarketLineStatus(elements.marketUpdatedStatus, "UNAVAILABLE", "error");
      if(!hasMarketData){
        elements.marketPrice.textContent = "UNAVAILABLE";
        elements.marketVolume.textContent = "UNAVAILABLE";
        elements.marketUpdated.textContent = "—";
      }
    }
  })();

  const holdersTask = (async () => {
    try {
      const response = await fetch("/api/mint-stats", {
        headers: { Accept: "application/json" },
      });
      if(!response.ok) throw new Error(`HTTP ${response.status}`);

      const mint = await response.json();
      elements.marketHolders.textContent =
        Number.isFinite(Number(mint.uniqueHolders))
          ? Number(mint.uniqueHolders).toLocaleString("en-US")
          : "UNAVAILABLE";
      setLiveValueState([elements.marketHolders], true);
      setMarketLineStatus(elements.marketHoldersStatus, "LIVE");
      hasMarketData = true;
    } catch (_) {
      setMarketLineStatus(elements.marketHoldersStatus, "UNAVAILABLE", "error");
      if(!hasMarketData) elements.marketHolders.textContent = "UNAVAILABLE";
    }
  })();

  await Promise.allSettled([collectionTask, holdersTask]);
}

const postMintPanelState = {
  complete: false,
  uniqueHolders: null,
  largestHolder: null,
  mint: { userChoice: null },
  holders: { userChoice: null },
  market: { userChoice: null },
};

function setPostMintPanelCollapsed(kind, collapsed, manual = false){
  const panelMap = {
    mint: elements.mintDashboard,
    holders: elements.nftWhalesPanel,
    market: elements.openSeaMarketPanel,
  };
  const toggleMap = {
    mint: elements.mintDashboardToggle,
    holders: elements.nftWhalesToggle,
    market: elements.openSeaMarketToggle,
  };
  const summaryMap = {
    mint: elements.mintDashboardSummary,
    holders: elements.nftWhalesSummary,
    market: elements.openSeaMarketSummary,
  };
  const bodyMap = {
    mint: elements.mintDashboardBody,
    holders: elements.nftWhalesBody,
    market: elements.openSeaMarketBody,
  };

  const panel = panelMap[kind];
  const toggle = toggleMap[kind];
  const summary = summaryMap[kind];
  const body = bodyMap[kind];

  if(!panel || !toggle || !summary || !body) return;

  if(manual){
    postMintPanelState[kind].userChoice = Boolean(collapsed);
  }

  panel.classList.toggle("is-collapsed", Boolean(collapsed));
  body.hidden = Boolean(collapsed);
  summary.hidden = !collapsed;
  toggle.textContent = collapsed ? "[ EXPAND ]" : "[ COLLAPSE ]";
  toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
}

function updatePostMintHolderSummary(){
  if(!elements.nftWhalesSummary) return;

  const hasUnique = postMintPanelState.uniqueHolders != null;
  const hasLargest = postMintPanelState.largestHolder != null;
  const unique = hasUnique ? Number(postMintPanelState.uniqueHolders) : NaN;
  const largest = hasLargest ? Number(postMintPanelState.largestHolder) : NaN;

  const uniqueText = Number.isFinite(unique)
    ? unique.toLocaleString("en-US")
    : "—";
  const largestText = Number.isFinite(largest)
    ? `${largest.toLocaleString("en-US")} NFTs`
    : "loading";

  elements.nftWhalesSummary.innerHTML =
    `<span class="green">[ HOLDERS ]</span> ${uniqueText} unique holders · Largest holder: ${largestText}`;
}

function updatePostMintMarketSummary(){
  if(!elements.openSeaMarketSummary) return;

  const floor = elements.floorPrice?.textContent?.trim() || "—";
  const volume = elements.totalVolume?.textContent?.trim() || "—";

  elements.openSeaMarketSummary.innerHTML =
    `<span class="green">[ OPENSEA MARKET STATS ]</span> Floor ${floor} · 24h Volume ${volume}`;
}

function applyPostMintCompactMode(stats){
  // First mint-state result has arrived: from this point on the normal
  // expanded/collapsed rules own panel visibility.
  document.body.classList.remove("postmint-resolving");

  const progress = Number(stats?.progressPercent);
  const minted = Number(stats?.minted);
  const total = Number(stats?.totalSupply);
  const complete = stats?.status === "COMPLETE" ||
    progress >= 100 ||
    (Number.isFinite(minted) && Number.isFinite(total) && total > 0 && minted >= total);

  postMintPanelState.complete = complete;

  const holders = stats?.uniqueHolders != null
    ? Number(stats.uniqueHolders)
    : NaN;
  if(Number.isFinite(holders)){
    postMintPanelState.uniqueHolders = holders;
  }

  if(elements.mintDashboardToggle){
    elements.mintDashboardToggle.hidden = !complete;
  }
  if(elements.nftWhalesToggle){
    elements.nftWhalesToggle.hidden = !complete;
  }
  if(elements.openSeaMarketToggle){
    elements.openSeaMarketToggle.hidden = !complete;
  }

  if(!complete){
    setPostMintPanelCollapsed("mint", false);
    setPostMintPanelCollapsed("holders", false);
    setPostMintPanelCollapsed("market", false);
    return;
  }

  const derivedProgress = Number.isFinite(progress)
    ? progress
    : (Number.isFinite(minted) && Number.isFinite(total) && total > 0
        ? minted / total * 100
        : (complete ? 100 : 0));
  const safeProgress = Math.max(0, Math.min(100, derivedProgress));
  const mintedText = Number.isFinite(minted)
    ? minted.toLocaleString("en-US")
    : "—";
  const totalText = Number.isFinite(total)
    ? total.toLocaleString("en-US")
    : "—";

  if(elements.mintDashboardSummary){
    elements.mintDashboardSummary.innerHTML =
      `<span class="green">[ COMPLETE ]</span> ${mintedText} / ${totalText} minted · ${safeProgress.toFixed(0)}%`;
  }

  updatePostMintHolderSummary();
  updatePostMintMarketSummary();

  const mintCollapsed = postMintPanelState.mint.userChoice ?? true;
  const holdersCollapsed = postMintPanelState.holders.userChoice ?? true;
  const marketCollapsed = postMintPanelState.market.userChoice ?? true;
  setPostMintPanelCollapsed("mint", mintCollapsed);
  setPostMintPanelCollapsed("holders", holdersCollapsed);
  setPostMintPanelCollapsed("market", marketCollapsed);
}

if(elements.mintDashboardToggle){
  elements.mintDashboardToggle.addEventListener("click", () => {
    const collapsed = elements.mintDashboard.classList.contains("is-collapsed");
    setPostMintPanelCollapsed("mint", !collapsed, true);
  });
}

if(elements.nftWhalesToggle){
  elements.nftWhalesToggle.addEventListener("click", () => {
    const collapsed = elements.nftWhalesPanel.classList.contains("is-collapsed");
    setPostMintPanelCollapsed("holders", !collapsed, true);
  });
}

if(elements.openSeaMarketToggle){
  elements.openSeaMarketToggle.addEventListener("click", () => {
    const collapsed = elements.openSeaMarketPanel.classList.contains("is-collapsed");
    setPostMintPanelCollapsed("market", !collapsed, true);
  });
}

const MINT_STATS_REFRESH_MS = 5_000;

function setDisconnectedMintStats(){
  setLiveValueState([elements.progressPercent, elements.mintedCount, elements.remainingCount, elements.uniqueMinters, elements.mintRate, elements.latestMint], false);
  elements.dataConnection.textContent = "WAITING FOR DATA";
  elements.dataConnection.classList.remove("live");

  elements.progressPercent.textContent = "—";
  elements.progressFill.style.width = "0%";

  elements.mintedCount.textContent = "— / __CTB_NFT_SUPPLY__";
  elements.remainingCount.textContent = "—";
  elements.uniqueMinters.textContent = "—";
  elements.mintRate.textContent = "— NFT/min";
  elements.latestMint.textContent = "—";
}

function renderMintStats(stats){
  if(!stats?.connected){
    setDisconnectedMintStats();
    return;
  }

  const progress = Number(stats.progressPercent ?? 0);
  const safeProgress = Math.max(0, Math.min(100, progress));

  elements.dataConnection.textContent =
    stats.status === "COMPLETE" ? "COMPLETE" : "LIVE";
  elements.dataConnection.classList.add("live");
  setLiveValueState([elements.progressPercent, elements.mintedCount, elements.remainingCount, elements.uniqueMinters, elements.mintRate, elements.latestMint], true);

  elements.progressPercent.textContent =
    `${safeProgress.toFixed(2)}%`;

  elements.progressFill.style.width =
    `${safeProgress}%`;

  elements.mintedCount.textContent =
    `${stats.minted ?? "—"} / ${stats.totalSupply ?? Number("__CTB_NFT_SUPPLY__")}`;

  elements.remainingCount.textContent =
    stats.remaining ?? "—";

  elements.uniqueMinters.textContent =
    stats.uniqueHolders ?? "—";

  elements.mintRate.textContent =
    `${stats.mintRatePerMinute ?? "—"} NFT/min`;

  if(stats.latestMint){
    const nftIdLabel =
      stats.latestMint.tokenId
        ? `#${stats.latestMint.tokenId}`
        : "NFT";

    const owner =
      stats.latestMint.toDisplay || "unknown";

    elements.latestMint.textContent =
      `${nftIdLabel} → ${owner}`;
  }else{
    elements.latestMint.textContent = "—";
  }

  if(stats.status){
    elements.mintStatus.textContent = stats.status;

    elements.mintStatus.classList.remove(
      "status-waiting",
      "status-live"
    );

    if(
      stats.status === "LIVE" ||
      stats.status === "COMPLETE"
    ){
      elements.mintStatus.classList.add(
        "status-live"
      );
    }else{
      elements.mintStatus.classList.add(
        "status-waiting"
      );
    }
  }

  applyPostMintCompactMode(stats);
}

async function refreshMintStats(){
  if(isPreMint()){
    setLiveValueState([elements.progressPercent, elements.mintedCount, elements.remainingCount, elements.uniqueMinters, elements.mintRate, elements.latestMint], false);
    elements.dataConnection.textContent = "PENDING MINT";
    elements.dataConnection.classList.remove("live");
    elements.progressPercent.textContent = "0.00%";
    elements.progressFill.style.width = "0%";
    elements.mintedCount.textContent = "0 / __CTB_NFT_SUPPLY__";
    elements.remainingCount.textContent = "__CTB_NFT_SUPPLY__";
    elements.uniqueMinters.textContent = PENDING_MINT_DATA;
    elements.mintRate.textContent = PENDING_MINT_DATA;
    elements.latestMint.textContent = PENDING_MINT_DATA;
    if(elements.mintStatus){
      elements.mintStatus.textContent = "UPCOMING";
      elements.mintStatus.classList.remove("status-live");
      elements.mintStatus.classList.add("status-waiting");
    }
    applyPostMintCompactMode({
      status: "UPCOMING",
      minted: 0,
      totalSupply: Number(CFG?.nft?.supply) || Number("__CTB_NFT_SUPPLY__"),
      progressPercent: 0,
    });
    return;
  }
  try{
    const response = await fetch("/api/mint-stats", {
      headers: {
        Accept: "application/json",
      },
    });

    if(!response.ok){
      throw new Error(`HTTP ${response.status}`);
    }

    const stats = await response.json();
    renderMintStats(stats);
  }catch(error){
    setDisconnectedMintStats();
    applyPostMintCompactMode(null);
  }
}

const COLLECTION_STATS_REFRESH_MS = 60_000;

function formatCount(value){
  const amount = Number(value);

  if(!Number.isFinite(amount)){
    return "—";
  }

  return Math.trunc(amount).toLocaleString();
}

function setCollectionUnavailable(requiresApiKey = false){
  setLiveValueState([elements.floorPrice, elements.totalVolume, elements.collectionOwners, elements.collectionSales, elements.collectionListed], false);
  elements.collectionDataStatus.textContent =
    requiresApiKey ? "CONNECTING" : "UNAVAILABLE";

  elements.collectionDataStatus.classList.remove("live");

  elements.floorPrice.textContent = "—";
  if(elements.salesFloorPrice) elements.salesFloorPrice.textContent = "—";
  renderFloorTrend(null);
  elements.totalVolume.textContent = "—";
  elements.collectionOwners.textContent = "—";
  elements.collectionSales.textContent = "—";
  elements.collectionListed.textContent = "—";
  elements.collectionUpdated.textContent = "Updated —";
  elements.openSeaKeyNote.hidden = false;
  elements.openSeaKeyNote.textContent =
    requiresApiKey
      ? "Waiting for OpenSea marketplace data."
      : "OpenSea marketplace data is temporarily unavailable.";
  updatePostMintMarketSummary();
  renderCollectionPulse();
}

function renderFloorTrendElement(element, trend){
  if(!element) return;

  const sidePanel = element.id === "salesFloorTrend";
  element.className = sidePanel
    ? "sales-floor-trend"
    : "floor-trend";

  if(!trend || trend.status === "unavailable"){
    element.classList.add("floor-trend-unavailable");
    element.textContent = sidePanel ? "● UNAVAILABLE" : "● 4H TREND UNAVAILABLE";
    return;
  }

  if(trend.status === "building"){
    element.classList.add("floor-trend-building");
    const remaining = Number(trend.hoursRemaining);
    element.textContent = Number.isFinite(remaining) && remaining > 0
      ? (sidePanel ? `● BUILDING BASELINE · ~${remaining}H LEFT` : `● BUILDING 4H BASELINE · ~${remaining}H LEFT`)
      : (sidePanel ? "● BUILDING BASELINE" : "● BUILDING 4H BASELINE");
    return;
  }

  const change = normalizedTrendChange(trend.percentChange);
  if(change == null){
    element.classList.add("floor-trend-unavailable");
    element.textContent = sidePanel ? "● UNAVAILABLE" : "● 4H TREND UNAVAILABLE";
    return;
  }

  const sign = change > 0 ? "+" : "";
  const arrow = change > 0 ? "▲" : change < 0 ? "▼" : "→";

  element.classList.add(
    change > 0 ? "floor-trend-up" : change < 0 ? "floor-trend-down" : "floor-trend-flat"
  );

  if(sidePanel){
    element.textContent = `${arrow} ${sign}${change.toFixed(1)}%`;
    return;
  }

  if(trend.signal === "surge"){
    element.classList.remove("floor-trend-up");
    element.classList.add("floor-trend-surge");
    element.textContent = `${arrow} FLOOR SURGE · ${sign}${change.toFixed(1)}% / 4H`;
    return;
  }

  if(trend.signal === "drop"){
    element.classList.remove("floor-trend-down");
    element.classList.add("floor-trend-drop");
    element.textContent = `${arrow} FLOOR DROP · ${sign}${change.toFixed(1)}% / 4H`;
    return;
  }

  element.textContent = `${arrow} ${sign}${change.toFixed(1)}% / 4H`;
}

function renderFloorTrend(trend){
  renderFloorTrendElement(elements.floorTrend, trend);
  renderFloorTrendElement(elements.salesFloorTrend, trend);
}

async function refreshFloorTrend(){
  if(isPreMint()) return;

  try{
    const response = await fetch("/api/floor-trend", {
      headers: { Accept: "application/json" },
    });
    const data = await response.json();
    if(!response.ok) throw new Error(`HTTP ${response.status}`);

    latestFloorTrend = data?.floorTrend || null;
    renderFloorTrend(latestFloorTrend);
    if(latestMarketCollection) renderMarketFloorPrice(latestMarketCollection);
  }catch(_){
    if(!latestFloorTrend) renderFloorTrend(null);
  }
}

function renderCollectionStats(stats){
  if(!stats?.connected){
    setCollectionUnavailable(
      Boolean(stats?.requiresApiKey)
    );
    return;
  }

  elements.collectionDataStatus.textContent = "LIVE";
  elements.collectionDataStatus.classList.add("live");
  setLiveValueState([elements.floorPrice, elements.totalVolume, elements.collectionOwners, elements.collectionSales, elements.collectionListed], true);
  elements.openSeaKeyNote.hidden = true;

  const floorDisplay = stats.floorPriceDisplay || "UNAVAILABLE";
  collectionPulseCurrentFloorEth = Number.isFinite(Number(stats.floorPriceEth))
    ? Number(stats.floorPriceEth)
    : collectionPulseCurrentFloorEth;
  elements.floorPrice.textContent = floorDisplay;
  if(elements.salesFloorPrice) elements.salesFloorPrice.textContent = floorDisplay;
  if(stats.floorTrend) {
    latestFloorTrend = stats.floorTrend;
    renderFloorTrend(stats.floorTrend);
    if(latestMarketCollection) renderMarketFloorPrice(latestMarketCollection);
  }

  elements.totalVolume.textContent =
    stats.totalVolumeDisplay || "UNAVAILABLE";

  elements.collectionOwners.textContent =
    formatCount(stats.owners);

  elements.collectionSales.textContent =
    formatCount(stats.sales);

  elements.collectionListed.textContent =
    formatCount(stats.listed);

  const updatedAt =
    stats.updatedAt
      ? new Date(stats.updatedAt)
      : new Date();

  elements.collectionUpdated.textContent =
    `Updated ${updatedAt.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })}`;
  updatePostMintMarketSummary();
}

function setCollectionPending(){
  setLiveValueState([elements.floorPrice, elements.totalVolume, elements.collectionOwners, elements.collectionSales, elements.collectionListed], false);
  elements.collectionDataStatus.textContent = "PENDING MINT";
  elements.collectionDataStatus.classList.remove("live");
  elements.floorPrice.textContent = PENDING_MINT_DATA;
  if(elements.salesFloorPrice) elements.salesFloorPrice.textContent = PENDING_MINT_DATA;
  if(elements.floorTrend) elements.floorTrend.textContent = "● Pending mint...";
  if(elements.salesFloorTrend) elements.salesFloorTrend.textContent = "● Pending mint...";
  elements.totalVolume.textContent = PENDING_MINT_DATA;
  elements.collectionOwners.textContent = PENDING_MINT_DATA;
  elements.collectionSales.textContent = PENDING_MINT_DATA;
  elements.collectionListed.textContent = PENDING_MINT_DATA;
  elements.collectionUpdated.textContent = "Updated —";
  elements.openSeaKeyNote.hidden = false;
  elements.openSeaKeyNote.textContent = "Marketplace data will populate after the mint begins.";
  updatePostMintMarketSummary();
}

async function refreshCollectionStats(){
  if(isPreMint()){
    setCollectionPending();
    return;
  }
  try{
    const response = await fetch(
      "/api/collection-stats",
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    const stats = await response.json();

    if(!response.ok && !stats){
      throw new Error(`HTTP ${response.status}`);
    }

    renderCollectionStats(stats);
  }catch(error){
    setCollectionUnavailable(false);
  }
}


const NFT_SALES_REFRESH_MS = 15_000;
let hasNftSalesData = false;

function shortSaleAddress(address){
  const value = String(address || "");
  if(!/^0x[a-fA-F0-9]{40}$/.test(value)) return "UNAVAILABLE";
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function relativeSaleTime(value){
  const timestamp = new Date(value).getTime();
  if(!Number.isFinite(timestamp)) return "time unavailable";

  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if(seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if(minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if(hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function setNftSalesStatus(text, state = ""){
  elements.nftSalesStatus.textContent = text;
  elements.nftSalesStatus.classList.toggle("live", state === "live");
  elements.nftSalesStatus.classList.toggle("stale", state === "stale");
  elements.nftSalesStatus.classList.toggle("error", state === "error");
}

function createSaleText(label, value, className = ""){
  const row = document.createElement("div");
  row.className = "nft-sale-detail";
  const key = document.createElement("span");
  key.textContent = label;
  const data = document.createElement("strong");
  data.textContent = value;
  if(className) data.className = className;
  row.append(key, data);
  return row;
}

function renderNftSales(data){
  collectionPulseSalesData = data || null;
  const sales = Array.isArray(data?.sales) ? data.sales : [];
  elements.nftSalesRows.replaceChildren();

  if(!data?.connected){
    const note = document.createElement("div");
    note.className = "nft-sale-placeholder";
    note.textContent = data?.requiresApiKey
      ? "Waiting for the OpenSea API connection."
      : "Recent OpenSea sales are temporarily unavailable.";
    elements.nftSalesRows.appendChild(note);
    setNftSalesStatus("UNAVAILABLE", "error");
    setMarketLineStatus(elements.marketLastSaleStatus, "UNAVAILABLE", "error");
    setMarketLineStatus(elements.marketHighestSaleStatus, "UNAVAILABLE", "error");
    if(elements.marketLastSale) elements.marketLastSale.textContent = "UNAVAILABLE";
    if(elements.marketHighestSale) elements.marketHighestSale.textContent = "UNAVAILABLE";
    return;
  }

  const lastSaleDisplay = data?.lastSalePriceDisplay || "NO SALES";
  const highest24hDisplay = data?.highest24hSalePriceDisplay || "NO SALES";
  if(elements.marketLastSale){
    elements.marketLastSale.textContent = lastSaleDisplay;
    setLiveValueState([elements.marketLastSale], true);
    setMarketLineStatus(elements.marketLastSaleStatus, "LIVE");
  }
  if(elements.marketHighestSale){
    elements.marketHighestSale.textContent = highest24hDisplay;
    setLiveValueState([elements.marketHighestSale], true);
    setMarketLineStatus(elements.marketHighestSaleStatus, "LIVE");
  }

  if(!sales.length){
    const note = document.createElement("div");
    note.className = "nft-sale-placeholder";
    note.textContent = "No recent OpenSea sales were returned for this collection.";
    elements.nftSalesRows.appendChild(note);
  }else{
    for(const sale of sales){
      const article = document.createElement("article");
      article.className = "nft-sale-row";

      const isLargeSale = sale.isLargeSale === true;
      const premiumPercent = Number(sale.percentAboveFloor);
      const isDoublePremium =
        isLargeSale && Number.isFinite(premiumPercent) && premiumPercent >= 100;

      if(isLargeSale){
        article.classList.add("nft-sale-row--large");
        article.setAttribute("aria-label", "Premium NFT sale at least 25 percent above floor");
      }

      if(isDoublePremium){
        article.classList.add("nft-sale-row--double");
        article.setAttribute("aria-label", "Premium NFT sale at least two times the current floor price");
      }

      const header = document.createElement("div");
      header.className = "nft-sale-header";

      const nftLabel = document.createElement("strong");
      nftLabel.className = "nft-sale-id";
      nftLabel.textContent = sale.tokenId ? `${CFG.project.name} #${sale.tokenId}` : `${CFG.project.name} NFT`;

      const price = document.createElement("strong");
      price.className = "nft-sale-price";
      price.textContent = sale.priceDisplay || "Price unavailable";

      const time = document.createElement("span");
      time.className = "nft-sale-time";
      time.textContent = relativeSaleTime(sale.occurredAt);

      header.append(nftLabel, price, time);
      article.appendChild(header);

      if(isLargeSale){
        const badge = document.createElement("div");
        badge.className = "nft-sale-large-badge";
        if(isDoublePremium){
          badge.classList.add("nft-sale-large-badge--double");
          badge.innerHTML = '<span class="nft-sale-double-star" aria-hidden="true">★</span><span>PREMIUM SALE · 2X OR ABOVE FLOOR PRICE</span>';
        }else{
          badge.textContent = Number.isFinite(premiumPercent)
            ? `◆ PREMIUM SALE · ${Math.round(premiumPercent)}% ABOVE FLOOR`
            : "◆ PREMIUM SALE · 25%+ ABOVE FLOOR";
        }
        article.appendChild(badge);
      }
      article.appendChild(createSaleText("Buyer", shortSaleAddress(sale.buyer)));
      article.appendChild(createSaleText("Seller", shortSaleAddress(sale.seller)));

      const link = document.createElement("a");
      link.className = "nft-sale-link";
      link.href = sale.openSeaUrl || CFG.links.openSea || "#";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Check Sale";
      article.appendChild(link);

      elements.nftSalesRows.appendChild(article);
    }
  }

  elements.nftSalesUpdated.textContent = data.updatedAt
    ? `Updated ${formatMarketTime(new Date(data.updatedAt))}`
    : "Updated —";

  setNftSalesStatus(data.stale ? "STALE" : "LIVE", data.stale ? "stale" : "live");
  hasNftSalesData = true;
  renderCollectionPulse();
}

async function refreshNftSales(){
  if(isPreMint()){
    setNftSalesStatus("PENDING MINT");
    elements.nftSalesUpdated.textContent = "Updated —";
    elements.nftSalesRows.innerHTML = '<div class="nft-sale-placeholder pending-data-value">Pending mint...</div>';
    if(elements.salesFloorPrice) elements.salesFloorPrice.textContent = PENDING_MINT_DATA;
    if(elements.marketLastSale) elements.marketLastSale.textContent = PENDING_MINT_DATA;
    if(elements.marketHighestSale) elements.marketHighestSale.textContent = PENDING_MINT_DATA;
    setMarketLineStatus(elements.marketLastSaleStatus, "PENDING");
    setMarketLineStatus(elements.marketHighestSaleStatus, "PENDING");
    return;
  }
  setNftSalesStatus(hasNftSalesData ? "UPDATING" : "CONNECTING");
  setMarketLineStatus(elements.marketLastSaleStatus, hasNftSalesData ? "REFRESHING" : "CONNECTING");
  setMarketLineStatus(elements.marketHighestSaleStatus, hasNftSalesData ? "REFRESHING" : "CONNECTING");

  try{
    const response = await fetch("/api/nft-sales", {
      headers: { Accept: "application/json" },
    });
    const data = await response.json();

    if(!response.ok && !data?.sales?.length){
      throw new Error(data?.error || `HTTP ${response.status}`);
    }

    renderNftSales(data);
  }catch(error){
    if(!hasNftSalesData){
      elements.nftSalesRows.innerHTML =
        '<div class="nft-sale-placeholder">Unable to load recent OpenSea sales.</div>';
    }
    setNftSalesStatus(hasNftSalesData ? "STALE" : "ERROR", hasNftSalesData ? "stale" : "error");
    setMarketLineStatus(elements.marketLastSaleStatus, hasNftSalesData ? "STALE" : "UNAVAILABLE", hasNftSalesData ? "" : "error");
    setMarketLineStatus(elements.marketHighestSaleStatus, hasNftSalesData ? "STALE" : "UNAVAILABLE", hasNftSalesData ? "" : "error");
    if(!hasNftSalesData){
      if(elements.marketLastSale) elements.marketLastSale.textContent = "UNAVAILABLE";
      if(elements.marketHighestSale) elements.marketHighestSale.textContent = "UNAVAILABLE";
    }
  }
}

const NFT_WHALES_REFRESH_MS = 30_000;
let nftWhaleSnapshot = null;

function shortWallet(address){
  const value = String(address || "");
  return value.length >= 12
    ? `${value.slice(0, 6)}...${value.slice(-4)}`
    : value || "—";
}

async function copyTextToClipboard(text){
  if(
    navigator.clipboard &&
    window.isSecureContext
  ){
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();

  const copied = document.execCommand("copy");
  textarea.remove();

  if(!copied){
    throw new Error("Clipboard copy failed");
  }
}

function showCopyFeedback(button, success){
  const icon = button.querySelector("span");
  const original = "⧉";

  button.classList.toggle(
    "copied",
    success
  );

  button.classList.toggle(
    "copy-error",
    !success
  );

  icon.textContent = success ? "✓" : "!";

  button.title = success
    ? "Copied"
    : "Copy failed";

  window.setTimeout(() => {
    icon.textContent = original;
    button.classList.remove(
      "copied",
      "copy-error"
    );
    button.title = "Copy wallet address";
  }, 1400);
}

function renderNftDistribution(distribution){
  const labels = [
    ["1", "1 NFT"],
    ["2", "2 NFTs"],
    ["3-5", "3–5 NFTs"],
    ["6-9", "6–9 NFTs"],
    ["10+", "10+ NFTs"],
  ];

  const totalWallets = labels.reduce(
    (sum, [key]) =>
      sum + Number(distribution?.[key] || 0),
    0
  );

  elements.nftDistribution.innerHTML = "";

  for(const [key, label] of labels){
    const count = Number(distribution?.[key] || 0);
    const percent = totalWallets > 0
      ? count / totalWallets * 100
      : 0;

    const row = document.createElement("div");
    row.className = "distribution-row";
    row.innerHTML = `
      <div class="distribution-label">
        <span>${label}</span>
        <strong>${count.toLocaleString()} wallets</strong>
      </div>
      <div class="distribution-track">
        <div
          class="distribution-fill"
          style="width:${percent.toFixed(2)}%"
        ></div>
      </div>
    `;
    elements.nftDistribution.appendChild(row);
  }
}

function renderNftWhales(data){
  nftWhaleSnapshot = data;
  setLiveValueState([elements.nftWhaleCount, elements.largestNftHolder, elements.top10Concentration], true);
  elements.nftWhalesStatus.textContent = data.stale ? "STALE" : "LIVE";

  elements.nftWhalesStatus.classList.add("live");

  elements.nftWhalesUpdated.textContent =
    `Updated ${new Date(
      data.updatedAt || Date.now()
    ).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })}`;

  elements.nftWhaleCount.textContent =
    Number(data.whaleCount || 0).toLocaleString();

  elements.largestNftHolder.textContent =
    `${Number(data.largestHolder || 0)} NFTs`;

  postMintPanelState.largestHolder = Number(data.largestHolder || 0);
  updatePostMintHolderSummary();

  elements.top10Concentration.textContent =
    `${Number(
      data.top10ConcentrationPercent || 0
    ).toFixed(2)}%`;

  const holders = Array.isArray(data.topHolders)
    ? data.topHolders
    : [];

  elements.nftWhaleRows.innerHTML = holders.length
    ? holders.map((holder) => `
        <tr>
          <td>#${holder.rank}</td>
          <td>
            <span class="wallet-address-cell">
              <span
                class="wallet-address"
                title="${holder.address}"
              >
                ${shortWallet(holder.address)}
              </span>
              <button
                type="button"
                class="copy-wallet-button"
                data-copy-address="${holder.address}"
                aria-label="Copy wallet address ${holder.address}"
                title="Copy wallet address"
              >
                <span aria-hidden="true">⧉</span>
              </button>
            </span>
          </td>
          <td class="numeric-cell">${holder.count}</td>
          <td class="numeric-cell">${Number(
            holder.sharePercent || 0
          ).toFixed(2)}%</td>
        </tr>
      `).join("")
    : '<tr><td colspan="4">No holder data available.</td></tr>';

  renderNftDistribution(data.distribution);
}

async function fetchNftWhales(address = ""){
  const query = address
    ? `?address=${encodeURIComponent(address)}`
    : "";

  const response = await fetch(
    `/api/nft-whales${query}`,
    { headers: { Accept: "application/json" } }
  );

  const data = await response.json();

  if(!response.ok || !data.connected){
    throw new Error(
      data.error || `HTTP ${response.status}`
    );
  }

  return data;
}

async function refreshNftWhales(){
  if(isPreMint()){
    setLiveValueState([elements.nftWhaleCount, elements.largestNftHolder, elements.top10Concentration], false);
    elements.nftWhalesStatus.textContent = "PENDING MINT";
    elements.nftWhalesStatus.classList.remove("live");
    elements.nftWhalesUpdated.textContent = "Updated —";
    elements.nftWhaleCount.textContent = PENDING_MINT_DATA;
    elements.largestNftHolder.textContent = PENDING_MINT_DATA;
    elements.top10Concentration.textContent = PENDING_MINT_DATA;
    elements.nftWhaleRows.innerHTML = '<tr><td colspan="4" class="pending-data-value">Pending mint...</td></tr>';
    if(elements.nftDistribution) elements.nftDistribution.innerHTML = '<div class="nft-sale-placeholder pending-data-value">Pending mint...</div>';
    return;
  }
  try{
    const data = await fetchNftWhales();
    renderNftWhales(data);

  }catch(error){
    setLiveValueState([elements.nftWhaleCount, elements.largestNftHolder, elements.top10Concentration], false);
    elements.nftWhalesStatus.textContent =
      "UNAVAILABLE";
    elements.nftWhalesStatus.classList.remove("live");
    elements.nftWhaleRows.innerHTML =
      '<tr><td colspan="4">Unable to load NFT holder rankings.</td></tr>';
  }
}

elements.nftWhaleRows.addEventListener(
  "click",
  async (event) => {
    const button = event.target.closest(
      ".copy-wallet-button"
    );

    if(!button) return;

    const address =
      button.dataset.copyAddress || "";

    try{
      await copyTextToClipboard(address);
      showCopyFeedback(button, true);
    }catch(error){
      showCopyFeedback(button, false);
    }
  }
);

if(elements.blockscoutWalletForm){
  const isValidWalletAddress = (value) => /^0x[a-fA-F0-9]{40}$/.test(value);

  const setBlockscoutWalletStatus = (message, state = "") => {
    elements.blockscoutWalletStatus.textContent = message;
    elements.blockscoutWalletStatus.classList.toggle("is-error", state === "error");
    elements.blockscoutWalletStatus.classList.toggle("is-valid", state === "valid");
  };

  elements.blockscoutWalletForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const address = elements.blockscoutWalletInput.value.trim();
    if(!isValidWalletAddress(address)){
      setBlockscoutWalletStatus(
        "[ ERROR ] Invalid wallet address format. Use 0x followed by 40 hexadecimal characters.",
        "error"
      );
      elements.blockscoutWalletInput.focus();
      return;
    }

    const nftContract = CFG?.contracts?.nft;
    if(!isValidWalletAddress(nftContract || "")){
      setBlockscoutWalletStatus("[ ERROR ] NFT contract is not configured.", "error");
      return;
    }

    const explorerBase = CFG?.market?.walletExplorerBase || "https://etherscan.io";
    const etherscanUrl = `${explorerBase}/token/${nftContract}?a=${address}#transactions`;

    setBlockscoutWalletStatus("[ OK ] Wallet format valid. Opening Etherscan in a new tab...", "valid");
    window.open(etherscanUrl, "_blank", "noopener,noreferrer");
  });

  elements.blockscoutWalletInput.addEventListener("input", () => {
    if(elements.blockscoutWalletStatus.textContent){
      setBlockscoutWalletStatus("");
    }
  });
}

elements.nftWalletForm.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    const address =
      elements.nftWalletInput.value.trim();

    if(!/^0x[a-fA-F0-9]{40}$/.test(address)){
      elements.nftWalletResult.textContent =
        "Enter a valid 0x wallet address.";
      return;
    }

    elements.nftWalletResult.textContent =
      "Checking wallet...";

    try{
      const data = await fetchNftWhales(address);
      const wallet = data.wallet;

      if(!wallet?.found){
        elements.nftWalletResult.textContent =
          `No ${CFG.project.name} NFTs currently held by this wallet.`;
        return;
      }

      elements.nftWalletResult.innerHTML = `
        <strong>${shortWallet(wallet.address)}</strong><br>
        Rank: #${wallet.rank}<br>
        NFTs owned: ${wallet.count}<br>
        Status: ${wallet.isWhale
          ? '<span class="green">NFT WHALE</span>'
          : 'NFT COLLECTOR'}
      `;
    }catch(error){
      elements.nftWalletResult.textContent =
        "Unable to check this wallet right now.";
    }
  }
);

refreshMarketPanel();
setInterval(
  refreshMarketPanel,
  MARKET_REFRESH_MS
);

refreshMintStats();
setInterval(
  refreshMintStats,
  MINT_STATS_REFRESH_MS
);

refreshNftSales();
setInterval(
  refreshNftSales,
  NFT_SALES_REFRESH_MS
);

refreshNftWhales();
setInterval(
  refreshNftWhales,
  NFT_WHALES_REFRESH_MS
);

refreshCollectionStats();
setInterval(
  refreshCollectionStats,
  COLLECTION_STATS_REFRESH_MS
);

refreshFloorTrend();
setInterval(
  refreshFloorTrend,
  COLLECTION_STATS_REFRESH_MS
);

boot();

// Initialize the local Collection Pulse baseline immediately.
renderCollectionPulse();


// CTB Chapter 21A — interactive NFT Terminal commands.
const nftCommandInput = document.getElementById("nftCommandInput");
const nftCommandHistory = document.getElementById("nftCommandHistory");
const NFT_COMMAND_TIMEOUT_MS = 18_000;
let nftActiveCommandController = null;
let nftActiveCommandTimedOut = false;

function nftEsc(value){
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function nftCommandBlock(title, rows = [], note = ""){
  if(!nftCommandHistory) return;
  const block = document.createElement("div");
  block.className = "nft-command-block";
  const body = rows.map(([label, value]) => `
    <div class="nft-command-kv"><span>${nftEsc(label)}</span><span>${value}</span></div>`).join("");
  block.innerHTML = `<div class="nft-command-title">${nftEsc(title)}</div>${body}${note ? `<div class="nft-command-muted">${nftEsc(note)}</div>` : ""}<div class="nft-command-back-row"><button type="button" class="nft-command-back" data-nft-back>← Back to commands</button></div>`;
  nftCommandHistory.append(block);
}

function nftCommandError(message){
  if(!nftCommandHistory) return;
  const block = document.createElement("div");
  block.className = "nft-command-block nft-command-error";
  block.textContent = message;
  nftCommandHistory.append(block);
}

async function nftCommandJson(url, allowHttpError = false){
  const response = await fetch(url, {headers:{Accept:"application/json"},signal:nftActiveCommandController?.signal});
  const data = await response.json().catch(()=>({}));
  if(!response.ok && !allowHttpError) throw new Error(data.error || `HTTP ${response.status}`);
  return data;
}

function nftSetCommandControlsDisabled(disabled){
  document.querySelectorAll("[data-nft-quick-command], [data-nft-guide-command]").forEach((button)=>{button.disabled=disabled;});
}

function nftHighlightCommand(command){
  const root = String(command||"").trim().split(/\s+/)[0].toLowerCase();
  document.querySelectorAll("[data-nft-quick-command]").forEach((button)=>{
    const buttonRoot = String(button.dataset.nftQuickCommand||"").trim().split(/\s+/)[0].toLowerCase();
    button.classList.toggle("active", Boolean(root) && buttonRoot===root);
  });
}

function nftFormatNumber(value){
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString() : "UNAVAILABLE";
}

function nftFormatFloorTrend(trend){
  if(!trend || trend.available === false) return "BUILDING BASELINE";
  const change = Number(trend.changePercent);
  if(!Number.isFinite(change)) return nftEsc(trend.status || "UNAVAILABLE");
  return `${change > 0 ? "+" : ""}${change.toFixed(2)}% (${nftEsc(trend.status || "4h")})`;
}

function nftExplorerWalletUrl(address){
  try{const base=CFG?.market?.blockscoutExplorerBase||new URL(CFG.market.blockscoutApiBase).origin;return `${String(base).replace(/\/$/,"")}/address/${address}`;}catch{return "";}
}
function nftWalletActions(address){
  if(!/^0x[a-fA-F0-9]{40}$/.test(address||"")) return "";
  const href=nftExplorerWalletUrl(address);
  return `<span class="nft-wallet-actions"><button type="button" class="nft-wallet-action" data-copy-wallet="${nftEsc(address)}" title="Copy wallet address" aria-label="Copy wallet address">⧉</button>${href?`<a class="nft-wallet-action" href="${nftEsc(href)}" target="_blank" rel="noopener noreferrer" title="Open wallet on Blockscout" aria-label="Open wallet on Blockscout">↗</a>`:""}</span>`;
}

async function nftCmdMint(){
  const [d,intel]=await Promise.all([nftCommandJson("/api/mint-stats"),nftCommandJson("/api/mint-intelligence",true).catch(()=>({connected:false}))]);
  nftCommandBlock("MINT STATUS", [
    ["Status", nftEsc(d.status || "UNAVAILABLE")],
    ["Minted", `${nftFormatNumber(d.minted)} / ${nftFormatNumber(d.totalSupply)}`],
    ["Remaining", nftFormatNumber(d.remaining)],
    ["Progress", Number.isFinite(Number(d.progressPercent)) ? `${Number(d.progressPercent).toFixed(2)}%` : "UNAVAILABLE"],
    ["Unique Minters", intel.connected ? nftFormatNumber(intel.uniqueMinters) : "UNAVAILABLE"],
    ["Repeat Minters", intel.connected ? nftFormatNumber(intel.repeatMinters) : "UNAVAILABLE"],
    ["Largest Mint", intel.connected ? `${nftFormatNumber(intel.largestMint)} NFTs` : "UNAVAILABLE"],
    ["Avg NFTs / Minter", intel.connected ? nftFormatNumber(intel.averageNftsPerMinter) : "UNAVAILABLE"],
    ["Mint Duration", intel.connected && Number.isFinite(Number(intel.mintDurationMinutes)) ? `${Number(intel.mintDurationMinutes).toLocaleString()} min` : "UNAVAILABLE"],
    ["Final Mint", intel.connected && intel.lastMintAt ? nftEsc(new Date(intel.lastMintAt).toLocaleString()) : (d.latestMint?.timestamp ? nftEsc(new Date(d.latestMint.timestamp).toLocaleString()) : "UNAVAILABLE")]
  ], `Source: ${d.source || "Robinhood Chain"}`);
}

async function nftCmdWhales(){
  const [holders,postmint]=await Promise.all([
    nftCommandJson("/api/nft-whales"),
    nftCommandJson("/api/nft-postmint",true).catch(()=>({connected:false}))
  ]);
  const threshold=Number(holders.whaleThreshold||10);
  if(!postmint.connected){nftCommandBlock("WHALE MOVEMENT — 24H",[["Status","Recent whale-movement analytics unavailable"]],`Current whale threshold: ${nftFormatNumber(threshold)} NFTs`);return;}
  const relevant=(postmint.movers||[]).filter(x=>Number(x.current)>=threshold||Number(x.previous)>=threshold).slice(0,10);
  const rows=relevant.map((x,i)=>[`#${i+1}`,`<span class="nft-command-wallet">${nftEsc(shortWallet(x.address))}</span> ${Number(x.delta)>0?"+":""}${nftFormatNumber(x.delta)} → ${nftFormatNumber(x.current)} NFTs ${nftWalletActions(x.address)}`]);
  const entered=(postmint.movers||[]).filter(x=>Number(x.previous)<threshold&&Number(x.current)>=threshold).length;
  const left=(postmint.movers||[]).filter(x=>Number(x.previous)>=threshold&&Number(x.current)<threshold).length;
  rows.push(["Whale Entrants",nftFormatNumber(entered)]);
  rows.push(["Below Threshold",nftFormatNumber(left)]);
  nftCommandBlock("WHALE MOVEMENT — 24H",rows.length?rows:[["Status","No whale position changes detected in the observed window."]],`Threshold: ${nftFormatNumber(threshold)} NFTs${postmint.partial?" · partial transfer window":""}`);
}

async function nftCmdMinters(){
  const d=await nftCommandJson("/api/mint-intelligence",true);
  if(!d.connected){nftCommandBlock("MINTER INTELLIGENCE",[["Status","Mint history analytics unavailable"]]);return;}
  nftCommandBlock("MINTER INTELLIGENCE",[
    ["Unique Minters",nftFormatNumber(d.uniqueMinters)],
    ["Repeat Minters",nftFormatNumber(d.repeatMinters)],
    ["Mint Events",nftFormatNumber(d.totalMintEvents)],
    ["Largest Mint",`${nftFormatNumber(d.largestMint)} NFTs`],
    ["Avg NFTs / Minter",nftFormatNumber(d.averageNftsPerMinter)],
    ["First Mint",d.firstMintAt?nftEsc(new Date(d.firstMintAt).toLocaleString()):"UNAVAILABLE"],
    ["Last Mint",d.lastMintAt?nftEsc(new Date(d.lastMintAt).toLocaleString()):"UNAVAILABLE"]
  ]);
}

async function nftCmdActivity(){
  const d=await nftCommandJson("/api/nft-activity",true);if(!d.connected){nftCommandBlock("NFT ACTIVITY",[["Status","On-chain activity unavailable"]]);return;}
  nftCommandBlock("NFT ACTIVITY",[["Transfers 1h",nftFormatNumber(d.transfers1h)],["Transfers 24h",nftFormatNumber(d.transfers24h)],["Mints 1h",nftFormatNumber(d.mints1h)],["Mints 24h",nftFormatNumber(d.mints24h)],["Active Wallets 24h",nftFormatNumber(d.uniqueWallets24h)]],"Source: Robinhood Chain Blockscout");
}

async function nftCmdWallet(address){
  if(!/^0x[a-fA-F0-9]{40}$/.test(address||"")) throw new Error("Wallet command requires a valid 0x wallet address.");
  const d=await nftCommandJson(`/api/nft-whales?address=${encodeURIComponent(address)}`);const wallet=d.wallet;
  if(!wallet?.found){nftCommandBlock("WALLET VS COLLECTION",[["Address",`<span class="nft-command-wallet">${nftEsc(address)}</span> ${nftWalletActions(address)}`],["NFTs Owned","0"],["Collection Position","Not currently ranked"]]);return;}
  const percentile=Number(d.totalHolders)>0?(wallet.rank/Number(d.totalHolders))*100:null;
  nftCommandBlock("WALLET VS COLLECTION",[["Address",`<span class="nft-command-wallet">${nftEsc(wallet.address)}</span> ${nftWalletActions(wallet.address)}`],["NFTs Owned",nftFormatNumber(wallet.count)],["Collection Rank",`#${nftFormatNumber(wallet.rank)}`],["Position Percentile",Number.isFinite(percentile)?`Top ${percentile.toFixed(2)}%`:"UNAVAILABLE"],["Status",wallet.isWhale?"NFT WHALE":"NFT COLLECTOR"]]);
}

async function nftCmdEntrants(){
  const d=await nftCommandJson("/api/nft-postmint",true);if(!d.connected){nftCommandBlock("NEW ENTRANTS",[["Status","Post-mint analytics unavailable"]]);return;}
  const rows=(d.entrants||[]).slice(0,10).map((x,i)=>[`#${i+1}`,`<span class="nft-command-wallet">${nftEsc(shortWallet(x.address))}</span> +${nftFormatNumber(x.delta)} NFTs ${nftWalletActions(x.address)}`]);
  nftCommandBlock("NEW ENTRANTS — 24H",rows.length?rows:[["Status","No new holder entrants detected in the observed 24h window."]],`Transfers scanned: ${nftFormatNumber(d.transfersScanned)}`);
}
async function nftCmdMovers(){
  const d=await nftCommandJson("/api/nft-postmint",true);if(!d.connected){nftCommandBlock("NFT MOVERS",[["Status","Post-mint analytics unavailable"]]);return;}
  const rows=(d.movers||[]).slice(0,10).map((x,i)=>[`#${i+1}`,`<span class="nft-command-wallet">${nftEsc(shortWallet(x.address))}</span> ${x.delta>0?"+":""}${nftFormatNumber(x.delta)} → ${nftFormatNumber(x.current)} NFTs ${nftWalletActions(x.address)}`]);
  nftCommandBlock("NFT MOVERS — 24H",rows.length?rows:[["Status","No holder position changes detected in the observed 24h window."]]);
}
async function nftCmdRetention(){
  const d=await nftCommandJson("/api/nft-postmint",true);
  if(!d.connected){nftCommandBlock("HOLDER RETENTION",[["Status","Post-mint analytics unavailable"]]);return;}
  const r=d.retention||{};
  if(!r.available){
    nftCommandBlock("HOLDER RETENTION",[["Status",r.baselineEstablished?"Baseline established":"Baseline pending"],["Baseline Holders",nftFormatNumber(r.baselineHolders)]],r.baselineAt?`Baseline set ${new Date(r.baselineAt).toLocaleString()} · run retention again after holder activity is observed.`:"Retention analytics will begin after a baseline is established.");
    return;
  }
  nftCommandBlock("HOLDER RETENTION",[["Baseline Holders",nftFormatNumber(r.baselineHolders)],["Still Holding",nftFormatNumber(r.stillHolding)],["Exited",nftFormatNumber(r.exited)],["New Since Baseline",nftFormatNumber(r.newSinceBaseline)],["Retention",`${Number(r.retentionPercent).toFixed(2)}%`]],`Baseline: ${r.baselineAt?new Date(r.baselineAt).toLocaleString():"current runtime"}.`);
}

async function nftCmdSales(){
  const d=await nftCommandJson("/api/nft-sales",true);if(!d.connected){nftCommandBlock("SALES ANALYTICS",[["Status",d.requiresApiKey?"OpenSea API key required":"UNAVAILABLE"]]);return;}
  const sales=Array.isArray(d.sales)?d.sales:[];
  const prices=sales.map(s=>Number(s.priceEth ?? s.price ?? s.priceValue)).filter(Number.isFinite).filter(x=>x>0).sort((a,b)=>a-b);
  const buyers=new Set(sales.map(s=>String(s.buyer||"").toLowerCase()).filter(x=>/^0x[a-f0-9]{40}$/.test(x)));
  const sellers=new Set(sales.map(s=>String(s.seller||"").toLowerCase()).filter(x=>/^0x[a-f0-9]{40}$/.test(x)));
  const volume=prices.reduce((sum,x)=>sum+x,0);
  const avg=prices.length?volume/prices.length:null;
  const median=prices.length?(prices.length%2?prices[(prices.length-1)/2]:(prices[prices.length/2-1]+prices[prices.length/2])/2):null;
  const high=prices.length?prices[prices.length-1]:null;
  nftCommandBlock("SALES ANALYTICS",[
    ["Recent Sales",nftFormatNumber(sales.length)],
    ["Unique Buyers",nftFormatNumber(buyers.size)],
    ["Unique Sellers",nftFormatNumber(sellers.size)],
    ["Observed Volume",Number.isFinite(volume)&&volume>0?`${volume.toFixed(4)} ETH`:"UNAVAILABLE"],
    ["Average Sale",Number.isFinite(avg)?`${avg.toFixed(4)} ETH`:"UNAVAILABLE"],
    ["Median Sale",Number.isFinite(median)?`${median.toFixed(4)} ETH`:"UNAVAILABLE"],
    ["Highest Sale",Number.isFinite(high)?`${high.toFixed(4)} ETH`:"UNAVAILABLE"]
  ],"Source: OpenSea recent-sales window; observed feed only.");
}

async function nftCmdPulse(){
  const [activity,whales,sales,postmint]=await Promise.all([
    nftCommandJson("/api/nft-activity",true).catch(()=>({connected:false})),
    nftCommandJson("/api/nft-whales",true).catch(()=>({})),
    nftCommandJson("/api/nft-sales",true).catch(()=>({connected:false})),
    nftCommandJson("/api/nft-postmint",true).catch(()=>({connected:false}))
  ]);
  const rows=[
    ["On-chain Activity 24h",activity.connected?`${nftFormatNumber(activity.transfers24h)} transfers`:`UNAVAILABLE`],
    ["Active Wallets 24h",activity.connected?nftFormatNumber(activity.uniqueWallets24h):"UNAVAILABLE"],
    ["Whale Wallets",Number.isFinite(Number(whales.whaleCount))?nftFormatNumber(whales.whaleCount):"UNAVAILABLE"],
    ["New Entrants 24h",postmint.connected?nftFormatNumber((postmint.entrants||[]).length):"UNAVAILABLE"],
    ["Holder Movers 24h",postmint.connected?nftFormatNumber((postmint.movers||[]).length):"UNAVAILABLE"],
    ["Marketplace Sales",sales.connected&&Array.isArray(sales.sales)?`${nftFormatNumber(sales.sales.length)} recent`:(sales.requiresApiKey?"OpenSea API key required":"UNAVAILABLE")]
  ];
  nftCommandBlock("CTB NFT PULSE",rows,"Observable activity snapshot only — not a BUY/SELL recommendation or price prediction.");
}

async function nftCmdRefresh(){await Promise.allSettled([refreshMarketPanel(),refreshMintStats(),refreshNftSales(),refreshNftWhales(),refreshCollectionStats(),refreshFloorTrend()]);nftCommandBlock("REFRESH",[["Status","NFT terminal data refresh completed"]]);}

async function nftExecuteCommand(command){
  const text=String(command||"").trim();const lower=text.toLowerCase();
  if(lower==="clear"){nftCommandHistory.innerHTML="";return;}
  if(lower==="whales")return nftCmdWhales();if(lower==="entrants")return nftCmdEntrants();if(lower==="movers")return nftCmdMovers();if(lower==="retention")return nftCmdRetention();if(lower==="activity")return nftCmdActivity();if(lower==="sales")return nftCmdSales();if(lower==="pulse")return nftCmdPulse();if(lower==="refresh")return nftCmdRefresh();if(lower.startsWith("wallet "))return nftCmdWallet(text.slice(7).trim());if(/^0x[a-fA-F0-9]{40}$/.test(text))return nftCmdWallet(text);throw new Error("Unknown command. Use the clickable commands above.");
}

function nftCommandEcho(command){
  if(!nftCommandHistory) return null;
  const block=document.createElement("div");
  block.className="nft-command-echo";
  const prompt=(document.querySelector("[data-project-prompt]")?.textContent||"nft@robinhood:~$").trim();
  block.innerHTML=`<div class="nft-command-echo-line"><span class="nft-command-echo-prompt">${nftEsc(prompt)}</span> <strong>${nftEsc(command)}</strong></div><div class="nft-command-loading">[ CONNECTING ] Loading command data... <button type="button" class="nft-command-cancel" data-nft-cancel-command>CANCEL</button></div>`;
  nftCommandHistory.append(block);
  return block;
}

async function nftRunCommand(command){
  const text=String(command||"").trim();
  if(!text||!nftCommandInput||!nftCommandHistory)return;
  if(text.toLowerCase()==="clear"){nftActiveCommandController?.abort();nftActiveCommandController=null;nftCommandHistory.innerHTML="";nftCommandInput.value="";nftCommandInput.focus();return;}
  if(nftActiveCommandController)nftActiveCommandController.abort();
  const controller=new AbortController();
  nftActiveCommandController=controller;nftActiveCommandTimedOut=false;
  const timeout=setTimeout(()=>{if(nftActiveCommandController===controller){nftActiveCommandTimedOut=true;controller.abort();}},NFT_COMMAND_TIMEOUT_MS);
  nftCommandInput.value="";nftHighlightCommand(text);
  const echo=nftCommandEcho(text);
  try{
    await nftExecuteCommand(text);
    echo?.querySelector(".nft-command-loading")?.remove();
  }catch(error){
    echo?.querySelector(".nft-command-loading")?.remove();
    if(error?.name==="AbortError")nftCommandError(nftActiveCommandTimedOut?"Command timed out after 18 seconds.":"Command cancelled.");
    else nftCommandError(error.message||"Command failed.");
  }finally{
    clearTimeout(timeout);
    if(nftActiveCommandController===controller)nftActiveCommandController=null;
    nftCommandInput.disabled=false;nftSetCommandControlsDisabled(false);nftCommandInput.focus();
  }
}

if(nftCommandInput && nftCommandHistory){
  nftCommandInput.addEventListener("keydown", async (event)=>{
    if(event.key!=="Enter") return;
    event.preventDefault();
    await nftRunCommand(nftCommandInput.value);
  });

  document.addEventListener("click", async (event)=>{
    const cancelButton=event.target.closest("[data-nft-cancel-command]");if(cancelButton){event.preventDefault();nftActiveCommandTimedOut=false;nftActiveCommandController?.abort();return;}
    const copyButton=event.target.closest("[data-copy-wallet]");if(copyButton){event.preventDefault();try{await navigator.clipboard.writeText(copyButton.dataset.copyWallet);copyButton.textContent="✓";setTimeout(()=>{copyButton.textContent="⧉"},900);}catch{}return;}
    const backButton=event.target.closest("[data-nft-back]");if(backButton){event.preventDefault();document.getElementById("nftCommands")?.scrollIntoView({behavior:"smooth",block:"start"});nftCommandInput.focus();return;}
    const button = event.target.closest("[data-nft-quick-command], [data-nft-guide-command]");
    if(!button || button.disabled) return;
    event.preventDefault();
    const command = button.dataset.nftQuickCommand || button.dataset.nftGuideCommand || "";
    if(button.dataset.commandPrefill==="true"){
      nftCommandInput.value=command;
      nftCommandInput.focus();
      nftCommandInput.setSelectionRange(nftCommandInput.value.length,nftCommandInput.value.length);
      return;
    }
    await nftRunCommand(command);
  });
}
