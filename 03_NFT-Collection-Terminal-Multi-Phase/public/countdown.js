"use strict";

const $ = (id) => document.getElementById(id);
const configuredPhases = window.PROJECT_CONFIG?.nft?.mintPhases || [];
const fallbackPhases = [
  { id: "allowlist1", label: "ALLOWLIST 1", name: "I know a guy", startsAt: "2026-08-15T23:08:00+03:00", endsAt: "2026-08-16T00:03:00+03:00", price: "FREE", limit: "1 PER WALLET" },
  { id: "allowlist2", label: "ALLOWLIST 2", name: "don't embarrASS us.", startsAt: "2026-08-16T00:03:00+03:00", endsAt: "2026-08-16T03:36:00+03:00", price: "FREE", limit: "1 PER WALLET" },
  { id: "public", label: "PUBLIC", name: "the public humiliation", startsAt: "2026-08-16T03:36:00+03:00", endsAt: "2026-08-16T09:36:00+03:00", price: "$5.13", limit: "1 PER WALLET" },
];
const phases = (configuredPhases.length ? configuredPhases : fallbackPhases).map((phase) => ({
  ...phase,
  startMs: new Date(phase.startsAt).getTime(),
  endMs: phase.endsAt ? new Date(phase.endsAt).getTime() : null,
}));
const MINT_AT = new Date(window.PROJECT_CONFIG?.nft?.mintAt || phases[0]?.startsAt || "2026-08-15T23:08:00+03:00");
let overallLiveSet = false;

function pad(v){ return String(Math.max(0,v)).padStart(2,"0"); }
function isMintLive(){ return Date.now() >= MINT_AT.getTime(); }
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
    '<span class="green">[ COMPLETE ]</span> __CTB_PROJECT_NAME_UPPER__ mint schedule has concluded.';
  $("mintReady").innerHTML =
    '<span class="green">[ READY ]</span> NFT Terminal is tracking collection activity.';
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
  $("mintCommand").innerHTML = '<span class="green">[ LIVE ]</span> __CTB_PROJECT_NAME_UPPER__ mint schedule is underway.';
  $("mintReady").innerHTML = '<span class="green">[ READY ]</span> NFT Terminal is the live collection dashboard.';
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
      value.textContent = "MINT IS LIVE";
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

tick();
setInterval(tick,1000);
