"use strict";

const $ = (id) => document.getElementById(id);
const configuredPhases = Array.isArray(window.PROJECT_CONFIG?.nft?.mintPhases)
  ? window.PROJECT_CONFIG.nft.mintPhases
  : [];
const phases = configuredPhases.map((phase) => ({
  ...phase,
  startMs: new Date(phase.startsAt).getTime(),
  endMs: phase.endsAt ? new Date(phase.endsAt).getTime() : null,
}));
const MINT_AT = new Date(window.PROJECT_CONFIG?.nft?.mintAt || phases[0]?.startsAt || "1970-01-01T00:00:00Z");
let overallLiveSet = false;

function responsiveStatusCopy(desktopText, mobileText){
  return `<span class="log-copy-desktop">${desktopText}</span><span class="log-copy-mobile">${mobileText}</span>`;
}

function pad(v){ return String(Math.max(0,v)).padStart(2,"0"); }
function isMintLive(){ return phases.length > 0 && Date.now() >= MINT_AT.getTime(); }
function isMintComplete(now = Date.now()){
  const finalPhase = phases[phases.length - 1];
  return Boolean(finalPhase?.endMs && now >= finalPhase.endMs);
}
function phaseSessionKey(id){ return `__CTB_PROJECT_ID__-phase-live-seen:${id}`; }

function durationText(ms){
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return days > 0 ? `${pad(days)}D:${pad(hours)}:${pad(mins)}:${pad(secs)}` : `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
}

function shortDurationText(ms){
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return days > 0 ? `${pad(days)}D:${pad(hours)}:${pad(mins)}:${pad(secs)}` : `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
}


function escapeHtml(value){
  return String(value ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;");
}

function phaseTimeText(iso){
  const raw = String(iso || "");
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2})?(Z|[+-]\d{2}:\d{2})$/);
  if (!match) return "Not configured";
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const hour24 = Number(match[4]);
  const minute = match[5];
  const hour12 = hour24 % 12 || 12;
  const ampm = hour24 < 12 ? "AM" : "PM";
  const zone = match[6] === "Z" ? "UTC" : `GMT${match[6].replace(":00","").replace(/^\+0/,"+").replace(/^-0/,"-")}`;
  return `${months[Number(match[2]) - 1]} ${Number(match[3])} · ${hour12}:${minute} ${ampm} ${zone}`;
}

function phaseCardMarkup(phase, index){
  const label = phase.label || `PHASE-${index + 1}`;
  const name = phase.name || "Not configured";
  const price = phase.price || "—";
  const limit = phase.limit || "—";
  const schedule = phase.endsAt
    ? `Starts ${phaseTimeText(phase.startsAt)} <span aria-hidden="true">·</span> Ends ${phaseTimeText(phase.endsAt)}`
    : `Starts ${phaseTimeText(phase.startsAt)}`;
  return `<section id="phaseCard-${escapeHtml(phase.id)}" class="phase-countdown-card" data-phase="${escapeHtml(phase.id)}">
              <div class="phase-card-topline"><span class="phase-kind">[ ${escapeHtml(label)} ]</span><span id="phaseStatus-${escapeHtml(phase.id)}" class="phase-status">[ UPCOMING ]</span></div>
              <h2>“${escapeHtml(name)}”</h2>
              <div class="phase-details phase-details-kv">
                <div class="phase-detail-row"><span class="phase-detail-label">Mint Fee</span><span class="phase-detail-colon" aria-hidden="true">:</span><span class="phase-detail-value">${escapeHtml(price)}</span></div>
                <div class="phase-detail-row"><span class="phase-detail-label">Mint per Wallet</span><span class="phase-detail-colon" aria-hidden="true">:</span><span class="phase-detail-value">${escapeHtml(limit)}</span></div>
              </div>
              <div id="phaseCountdown-${escapeHtml(phase.id)}" class="phase-countdown-value">--D --H --M --S</div>
              <div class="phase-time">${schedule}</div>
            </section>`;
}

function phaseCommandMarkup(phase, index){
  return `<div id="phaseCommand-${escapeHtml(phase.id)}" class="market-line market-countdown-line phase-command-line"><span class="market-tag countdown-tag">[ MINT ]</span><span class="market-label">Phase-${index + 1}</span><span class="market-colon">:</span><strong id="phaseCommandValue-${escapeHtml(phase.id)}" class="market-value">--:--:--</strong></div>`;
}

function hydrateConfiguredPhases(){
  const grid = document.querySelector(".phase-countdown-grid");
  const marketPanel = document.querySelector("#launchLivePanel .market-panel");
  if (grid) {
    if (phases.length) {
      grid.innerHTML = phases.map(phaseCardMarkup).join("");
      grid.setAttribute("aria-label", `${window.PROJECT_CONFIG?.project?.name || "NFT"} mint phase schedule`);
      grid.style.gridTemplateColumns = `repeat(${Math.min(3, Math.max(1, phases.length))},minmax(0,1fr))`;
    } else {
      grid.innerHTML = `<section class="phase-countdown-card is-not-configured">
        <div class="phase-card-topline"><span class="phase-kind">[ PHASES ]</span><span class="phase-status">[ NOT CONFIGURED ]</span></div>
        <h2>“Mint phases not configured”</h2>
        <div class="phase-details phase-details-kv">
          <div class="phase-detail-row"><span class="phase-detail-label">Mint Fee</span><span class="phase-detail-colon" aria-hidden="true">:</span><span class="phase-detail-value">—</span></div>
          <div class="phase-detail-row"><span class="phase-detail-label">Mint per Wallet</span><span class="phase-detail-colon" aria-hidden="true">:</span><span class="phase-detail-value">—</span></div>
        </div>
        <div class="phase-countdown-value">NOT CONFIGURED</div>
        <div class="phase-time">Schedule not configured.</div>
      </section>`;
    }
  }

  if (marketPanel) {
    marketPanel.querySelectorAll(".phase-command-line").forEach((row) => row.remove());
    if (phases.length) {
      marketPanel.insertAdjacentHTML("beforeend", phases.map(phaseCommandMarkup).join(""));
    }
  }
}

function showPhaseModal(phase){
  try {
    if (sessionStorage.getItem(phaseSessionKey(phase.id)) === "1") return;
    sessionStorage.setItem(phaseSessionKey(phase.id), "1");
  } catch (_) {}

  const modal = $("phaseLiveModal");
  if (!modal) return;
  $("phaseLiveTag").textContent = `[ ${phase.label} LIVE ]`;
  $("phaseLiveTitle").textContent = `“${phase.name}” IS NOW LIVE`;
  $("phaseLiveText").textContent = `${phase.label} has started. Visit the NFT Terminal for live activity, or stay here to follow the remaining mint schedule.`;
  modal.hidden = false;
}

function setOverallComplete(){
  overallLiveSet = true;

  const livePanel = $("launchLivePanel");
  if (livePanel) {
    livePanel.hidden = false;
    livePanel.innerHTML = `
      <div class="countdown-box post-mint-live-box post-mint-complete-box">
        <div class="countdown-label">[ MINT COMPLETE ]</div>
        <div class="countdown-value">MINT COMPLETE</div>
        <div class="countdown-prompt"><span class="green">&gt;</span> mint schedule complete · collection activity continues in the NFT Terminal <span class="cursor">█</span></div>
      </div>`;
  }

  const terminalLine = $("postMintTerminalLine");
  if (terminalLine) terminalLine.hidden = false;

  $("mintCommand").innerHTML =
    `<span class="green">[ COMPLETE ]</span> ${responsiveStatusCopy("__CTB_PROJECT_NAME_UPPER__ mint schedule has concluded.", "Mint complete.")}`;
  $("mintReady").innerHTML =
    `<span class="green">[ READY ]</span> ${responsiveStatusCopy("NFT Terminal is tracking collection activity.", "Tracking active.")}`;
}

function setOverallLive(){
  if (overallLiveSet) return;
  overallLiveSet = true;

  const livePanel = $("launchLivePanel");
  if (livePanel) {
    livePanel.hidden = false;
    livePanel.innerHTML = `
      <div class="countdown-box post-mint-live-box">
        <div class="countdown-label">[ MINT LIVE ]</div>
        <div class="countdown-value">MINT IS LIVE</div>
        <div class="countdown-prompt"><span class="green">&gt;</span> one or more mint phases are active or underway <span class="cursor">█</span></div>
      </div>`;
  }

  const terminalLine = $("postMintTerminalLine");
  if (terminalLine) terminalLine.hidden = false;
  $("mintCommand").innerHTML = `<span class="green">[ LIVE ]</span> ${responsiveStatusCopy("__CTB_PROJECT_NAME_UPPER__ mint schedule is underway.", "Mint active.")}`;
  $("mintReady").innerHTML = `<span class="green">[ READY ]</span> ${responsiveStatusCopy("NFT Terminal is the live collection dashboard.", "Live dashboard ready.")}`;
}

function renderPhase(phase, now){
  const card = $(`phaseCard-${phase.id}`);
  const status = $(`phaseStatus-${phase.id}`);
  const countdown = $(`phaseCountdown-${phase.id}`);
  if (!card || !status || !countdown) return;

  card.classList.remove("is-upcoming","is-live","is-complete");

  if (now < phase.startMs){
    card.classList.add("is-upcoming");
    status.textContent = "[ UPCOMING ]";
    countdown.textContent = durationText(phase.startMs - now);
    return;
  }

  if (!phase.endMs || now < phase.endMs){
    card.classList.add("is-live");
    status.textContent = "[ LIVE ]";
    countdown.textContent = phase.endMs ? `LIVE · ${shortDurationText(phase.endMs - now)} LEFT` : "MINT IS LIVE";
    showPhaseModal(phase);
    return;
  }

  card.classList.add("is-complete");
  status.textContent = "[ COMPLETE ]";
  countdown.textContent = "PHASE COMPLETE";
}

function updatePhaseCommandLines(now){
  phases.forEach((phase, index) => {
    const row = $(`phaseCommand-${phase.id}`);
    const tag = row?.querySelector(".market-tag");
    const label = row?.querySelector(".market-label");
    const value = $(`phaseCommandValue-${phase.id}`);
    if (!row || !tag || !label || !value) return;

    const phaseNumber = index + 1;
    label.textContent = `Phase-${phaseNumber}`;
    row.classList.remove("is-live","is-complete");

    if (now < phase.startMs){
      tag.textContent = "[ MINT ]";
      tag.className = "market-tag countdown-tag";
      value.textContent = shortDurationText(phase.startMs - now);
      return;
    }

    if (!phase.endMs || now < phase.endMs){
      row.classList.add("is-live");
      tag.textContent = "[ ✓ ]";
      tag.className = "market-tag phase-command-live-tag";
      value.textContent = phase.endMs ? `${shortDurationText(phase.endMs - now)} LEFT` : "MINT IS LIVE";
      return;
    }

    row.classList.add("is-complete");
    tag.textContent = "[ ✓ ]";
    tag.className = "market-tag phase-command-complete-tag";
    value.textContent = "COMPLETE";
  });
}

function tick(){
  const now = Date.now();
  phases.forEach((phase) => renderPhase(phase, now));
  updatePhaseCommandLines(now);

  // Final phase completion supersedes the generic live state.
  if (isMintComplete(now)){
    setOverallComplete();
  }else if (isMintLive()){
    setOverallLive();
  }
}

function getActivePhase(now = Date.now()){
  return phases.find((phase) =>
    now >= phase.startMs &&
    (!phase.endMs || now < phase.endMs)
  ) || null;
}

function showPreMintModal(){
  const modal = $("preMintModal");
  if (modal) modal.hidden = false;
}

function showCurrentPhaseModal(phase){
  const modal = $("phaseLiveModal");
  if (!modal || !phase) return;

  $("phaseLiveTag").textContent = `[ ${phase.label} LIVE ]`;
  $("phaseLiveTitle").textContent = `“${phase.name}” IS NOW LIVE`;
  $("phaseLiveText").textContent =
    `${phase.label} has started. Visit the NFT Terminal for live activity, or stay here to follow the remaining mint schedule.`;
  modal.hidden = false;
}

function handleTerminalEntry(event){
  event.preventDefault();

  const now = Date.now();
  const firstPhase = phases[0];
  const finalPhase = phases[phases.length - 1];

  // Before Phase 1: both entry points show the same pre-mint notice.
  if (firstPhase && now < firstPhase.startMs){
    showPreMintModal();
    return;
  }

  // During any active phase: both entry points show the correct live-phase modal.
  const activePhase = getActivePhase(now);
  if (activePhase){
    showCurrentPhaseModal(activePhase);
    return;
  }

  // After the complete mint schedule: terminal entry is direct.
  if (finalPhase?.endMs && now >= finalPhase.endMs){
    window.location.href = "/terminal";
    return;
  }

  // Safe fallback for any unexpected schedule gap.
  window.location.href = "/terminal";
}

for (const control of [$("terminalLink"), $("terminalCommandLink")]){
  if (control) control.addEventListener("click", handleTerminalEntry);
}

$("preMintCancel").addEventListener("click",()=>{ $("preMintModal").hidden = true; });
$("phaseLiveStay").addEventListener("click",()=>{ $("phaseLiveModal").hidden = true; });

hydrateConfiguredPhases();
tick();
setInterval(tick,1000);
