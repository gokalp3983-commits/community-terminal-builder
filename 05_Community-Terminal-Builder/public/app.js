"use strict";
const form=document.querySelector("#builder");
const preview=document.querySelector("#preview");
const status=document.querySelector("#status");
const readiness=document.querySelector("#readiness");
const button=form.querySelector("button[type=submit]");
const savedProjectsSelect=document.querySelector("#saved-projects");
const currentProjectLabel=document.querySelector("#current-project");
const projectStateLabel=document.querySelector("#project-state");
const importProjectFile=document.querySelector("#import-project-file");
const STORAGE_KEY="ctb.projects.v2";
const SETTINGS_KEY="ctb.workspace.v1";
const SCHEMA_VERSION=1;
const DEPLOYMENT_KEY="ctb.deployments.v1";
const UX_MODE_KEY="ctb.ux-mode.v1";
const guidedModeButton=document.querySelector("#guided-mode");
const advancedModeButton=document.querySelector("#advanced-mode");
let activeProjectId="";
let persistedMascot=null;
let nftMintConfirmResolver=null;
let confirmedMintSignature="";
let pastScheduleWarningSignature="";
let nftExplicitlyDisabled=false;
let lastNftContractValue="";

function val(name){return form.elements[name]?.value?.trim()||""}
function checked(name){return Boolean(form.elements[name]?.checked)}
function shortAddress(value){return value&&value.length>20?`${value.slice(0,10)}...${value.slice(-8)}`:value||"NOT SET"}
function openSeaSlugFromUrl(value){
  const raw=String(value||"").trim();if(!raw)return "";
  try{
    const candidate=/^https?:\/\//i.test(raw)?raw:`https://${raw.replace(/^\/+/,"")}`;
    const url=new URL(candidate);
    if(!/(^|\.)opensea\.io$/i.test(url.hostname))return "";
    const parts=url.pathname.split("/").filter(Boolean);
    const index=parts.findIndex(part=>part.toLowerCase()==="collection");
    if(index<0||!parts[index+1])return "";
    return decodeURIComponent(parts[index+1]).trim();
  }catch{return ""}
}
function syncOpenSeaSlug(){const field=form.elements.openSeaSlug;if(!field)return "";const slug=openSeaSlugFromUrl(val("openSea"));field.value=slug;return slug}
function openSeaConfigurationValid(){return !val("openSea")||Boolean(syncOpenSeaSlug())}
function syncOpenSeaValidation(){const input=form.elements.openSea,err=document.querySelector("#open-sea-error");if(!input||!err)return true;const raw=val("openSea"),ok=!raw||Boolean(syncOpenSeaSlug());input.classList.toggle("field-invalid",!ok);err.hidden=ok;err.textContent=ok?"":"[ ERROR ] OpenSea URL must be a valid collection link: opensea.io/collection/<slug>";return ok}
function line(state,text){const tag=state==="ok"?" OK ":state==="skip"?"SKIP":state==="warn"?"WARN":"WAIT";return `[${tag}] ${text}`}
function slugify(value){return String(value||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
function terminalUserFromTicker(value){return String(value||"").toLowerCase().replace(/[^a-z0-9]+/g,"").slice(0,32)}
function terminalIdentityFromTicker(value){const user=terminalUserFromTicker(value);return user?`${user}@robinhood`:""}
function syncTerminalIdentity(){const user=form.elements.promptUser,host=form.elements.promptHost;if(user)user.value=terminalIdentityFromTicker(val("ticker"));if(host)host.value="robinhood"}
function normalizeXUrl(value){
  const raw=String(value||"").trim();if(!raw)return "";
  if(/^@?[A-Za-z0-9_]{1,15}$/.test(raw))return `https://x.com/${raw.replace(/^@/,"")}`;
  const candidate=/^https?:\/\//i.test(raw)?raw:`https://${raw.replace(/^\/+/,"")}`;
  try{const url=new URL(candidate);if(/(^|\.)twitter\.com$/i.test(url.hostname))url.hostname="x.com";return url.href.replace(/\/$/,"")}catch{return candidate}
}
function normalizeAdditionalLinkUrl(value){
  const raw=String(value||"").trim();if(!raw)return "";
  try{return new URL(/^https?:\/\//i.test(raw)?raw:`https://${raw.replace(/^\/+/,"")}`).href}catch{return raw}
}
function additionalLinksPayload(){
  return [...document.querySelectorAll("#additional-links-list .additional-link-row")].map(row=>({
    label:String(row.querySelector('[data-additional="label"]')?.value||"").trim().replace(/^\[|\]$/g,"").slice(0,24),
    text:String(row.querySelector('[data-additional="text"]')?.value||"").trim().slice(0,120),
    url:normalizeAdditionalLinkUrl(row.querySelector('[data-additional="url"]')?.value),
    highlight:Boolean(row.querySelector('[data-additional="highlight"]')?.checked),
  })).filter(item=>item.label&&item.url).slice(0,5);
}
function renderAdditionalLinks(items=[]){
  const host=document.querySelector("#additional-links-list");if(!host)return;host.innerHTML="";
  (Array.isArray(items)?items:[]).slice(0,5).forEach(addAdditionalLinkRow);
}
function addAdditionalLinkRow(item={}){
  const host=document.querySelector("#additional-links-list");if(!host||host.children.length>=5)return;
  const row=document.createElement("div");row.className="additional-link-row";
  row.innerHTML=`<label><span>Label</span><input data-additional="label" placeholder="BOT" maxlength="24"></label><label class="additional-link-text"><span>Link text</span><input data-additional="text" placeholder="Click to access Sniper Bot." maxlength="120"></label><label class="additional-link-url"><span>URL</span><input data-additional="url" placeholder="https://..."></label><label class="additional-link-highlight"><input data-additional="highlight" type="checkbox"><span>Highlight red</span></label><button class="additional-link-remove" type="button" aria-label="Remove additional link">REMOVE</button>`;
  row.querySelector('[data-additional="label"]').value=item.label||"";
  row.querySelector('[data-additional="text"]').value=item.text||"";
  row.querySelector('[data-additional="url"]').value=item.url||"";
  row.querySelector('[data-additional="highlight"]').checked=Boolean(item.highlight);
  row.querySelectorAll("input").forEach(input=>input.addEventListener("input",update));
  row.querySelector('[data-additional="highlight"]').addEventListener("change",update);
  row.querySelector(".additional-link-remove").addEventListener("click",()=>{row.remove();update()});
  host.appendChild(row);
}
document.querySelector("#add-additional-link")?.addEventListener("click",()=>{addAdditionalLinkRow();update()});
function nowIso(){return new Date().toISOString()}
function readProjects(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}")||{}}catch{return {}}}
function writeProjects(projects){localStorage.setItem(STORAGE_KEY,JSON.stringify(projects))}


function setBuilderExperience(mode,persist=true){
  const advanced=mode==="advanced";
  document.body.classList.toggle("guided-mode",!advanced);
  document.body.classList.toggle("advanced-mode",advanced);
  guidedModeButton?.classList.toggle("active",!advanced);advancedModeButton?.classList.toggle("active",advanced);
  guidedModeButton?.setAttribute("aria-pressed",String(!advanced));advancedModeButton?.setAttribute("aria-pressed",String(advanced));
  const title=document.querySelector("#builder-mode-title"),description=document.querySelector("#builder-mode-description");
  if(title)title.textContent=advanced?"BUILDER MODE":"GUIDED MODE";
  if(description)description.textContent=advanced?"Full developer/operator controls are visible. Generated output and release protections are unchanged.":"Shows the settings most people need. Your advanced Builder controls stay available and unchanged.";
  if(persist)localStorage.setItem(UX_MODE_KEY,advanced?"advanced":"guided");
}
function syncNftConfigVisibility(){
  const enabled=checked("nftTerminal");
  document.querySelectorAll(".nft-config").forEach(el=>{el.hidden=!enabled});
  const mintMode=document.querySelector("#nft-mint-mode");
  if(mintMode)mintMode.required=enabled;
}
function initializeBuilderExperience(){
  const saved=localStorage.getItem(UX_MODE_KEY);
  setBuilderExperience(saved==="advanced"?"advanced":"guided",false);
  guidedModeButton?.addEventListener("click",()=>setBuilderExperience("guided"));
  advancedModeButton?.addEventListener("click",()=>setBuilderExperience("advanced"));
}

function browserTimeZone(){try{return Intl.DateTimeFormat().resolvedOptions().timeZone||"UTC"}catch{return "UTC"}}
function validTimeZone(timeZone){try{new Intl.DateTimeFormat("en-US",{timeZone}).format(new Date());return true}catch{return false}}
function zonedParts(date,timeZone){const parts=new Intl.DateTimeFormat("en-US",{timeZone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).formatToParts(date);return Object.fromEntries(parts.filter(x=>x.type!=="literal").map(x=>[x.type,x.value]))}
function offsetMinutesAt(date,timeZone){const x=zonedParts(date,timeZone);const rendered=Date.UTC(Number(x.year),Number(x.month)-1,Number(x.day),Number(x.hour),Number(x.minute),Number(x.second));return Math.round((rendered-date.getTime())/60000)}
function formatOffset(minutes){const sign=minutes>=0?"+":"-",n=Math.abs(minutes);return `${sign}${String(Math.floor(n/60)).padStart(2,"0")}:${String(n%60).padStart(2,"0")}`}
function scheduleFromWallTime(date,time,timeZone,label="Mint"){
  const zone=timeZone||browserTimeZone();
  if(!date||!time)return {ok:false,error:`Enter ${label} date and time.`};
  if(!validTimeZone(zone))return {ok:false,error:`Enter a valid IANA timezone for ${label}, for example Europe/Bucharest.`};
  const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(date),t=/^(\d{2}):(\d{2})/.exec(time);if(!m||!t)return {ok:false,error:`Invalid ${label} date or time.`};
  const wallUtc=Date.UTC(+m[1],+m[2]-1,+m[3],+t[1],+t[2],0);let instant=new Date(wallUtc);
  for(let i=0;i<3;i++){const offset=offsetMinutesAt(instant,zone);instant=new Date(wallUtc-offset*60000)}
  const check=zonedParts(instant,zone);if(`${check.year}-${check.month}-${check.day}`!==date||`${check.hour}:${check.minute}`!==time.slice(0,5))return {ok:false,error:`That local time does not exist in ${zone}. Check daylight-saving time.`};
  const offset=offsetMinutesAt(instant,zone),iso=`${date}T${time.slice(0,5)}:00${formatOffset(offset)}`;
  return {ok:true,iso,instant:new Date(iso),timeZone:zone,date,time:time.slice(0,5)};
}
function nftMintMode(){const mode=val("nftMintMode");return mode==="single"||mode==="multiple"||mode==="terminal"?mode:""}
function clearPhaseValidationState(){document.querySelectorAll("#nft-phase-list .nft-phase-card").forEach(card=>{card.classList.remove("phase-invalid");card.querySelectorAll(".phase-invalid").forEach(input=>input.classList.remove("phase-invalid"))})}
function markPhaseInvalid(card,fields){if(!card)return;card.classList.add("phase-invalid");for(const field of fields){card.querySelector(`[data-phase-field="${field}"]`)?.classList.add("phase-invalid")}}
function nftMintSchedule(){
  clearPhaseValidationState();
  const mode=nftMintMode();
  if(!mode)return {ok:false,error:"Please select NFT mode."};
  if(mode==="terminal")return {ok:true,mode:"terminal",terminalOnly:true,iso:"",instant:null,timeZone:val("nftMintTimezone")||browserTimeZone(),phases:[]};
  if(mode==="single"){
    const price=val("nftMintPrice"),limit=val("nftMintLimit");
    if(!price){form.elements.nftMintPrice?.classList.add("field-invalid");return {ok:false,error:"Mint Price is required. Use 0 or FREE for a free mint."}}
    if(!limit){form.elements.nftMintLimit?.classList.add("field-invalid");return {ok:false,error:"Mint Per Wallet / Wallet Limit is required."}}
    form.elements.nftMintPrice?.classList.remove("field-invalid");form.elements.nftMintLimit?.classList.remove("field-invalid");
    const schedule=scheduleFromWallTime(val("nftMintDate"),val("nftMintTime"),val("nftMintTimezone")||browserTimeZone(),"NFT mint start");
    if(!schedule.ok)return schedule;
    const endSchedule=scheduleFromWallTime(val("nftMintEndDate"),val("nftMintEndTime"),schedule.timeZone,"NFT mint end");
    if(!endSchedule.ok)return endSchedule;
    if(endSchedule.instant<=schedule.instant)return {ok:false,error:"NFT mint end time must be after its start time."};
    return {...schedule,mode:"single",price,limit,phases:[],endInstant:endSchedule.instant,endIso:endSchedule.iso};
  }
  const cards=[...document.querySelectorAll("#nft-phase-list .nft-phase-card")];
  if(cards.length<2)return {ok:false,error:"Multiple-phase mint requires at least 2 phases."};
  const phases=[];
  for(let i=0;i<cards.length;i++){
    const card=cards[i],get=f=>card.querySelector(`[data-phase-field="${f}"]`)?.value?.trim()||"";
    const label=get("label")||`PHASE ${i+1}`,name=get("name")||label,zone=get("timezone")||browserTimeZone();
    if(!get("price")){markPhaseInvalid(card,["price"]);return {ok:false,error:`${label} Mint Price is required. Use 0 or FREE for a free mint.`}}
    if(!get("limit")){markPhaseInvalid(card,["limit"]);return {ok:false,error:`${label} Mint Per Wallet / Wallet Limit is required.`}}
    const start=scheduleFromWallTime(get("startDate"),get("startTime"),zone,`${label} start`);if(!start.ok)return start;
    const endSchedule=scheduleFromWallTime(get("endDate"),get("endTime"),zone,`${label} end`);if(!endSchedule.ok)return endSchedule;
    if(endSchedule.instant<=start.instant){markPhaseInvalid(card,["endDate","endTime"]);return {ok:false,error:`${label} end time must be after its start time.`}};
    // Internal phase ids must be unique and must not depend on a user-visible label.
    // Duplicate labels (for example two ALLOWLIST stages) are valid and previously
    // caused duplicate DOM ids, leaving the later phase countdown unbound.
    const id=`phase-${i+1}`;
    phases.push({id,label,name,startsAt:start.iso,endsAt:endSchedule.iso,price:get("price")||"—",limit:get("limit")||"—",timezone:zone,start,end:endSchedule});
  }
  for(let i=1;i<phases.length;i++)if(phases[i].start.instant<phases[i-1].end.instant){markPhaseInvalid(cards[i],["startDate","startTime"]);return {ok:false,error:`${phases[i].label} starts before ${phases[i-1].label} ends.`}};
  const first=phases[0],last=phases[phases.length-1];
  return {ok:true,mode:"multiple",iso:first.startsAt,instant:first.start.instant,timeZone:first.timezone,phases,endInstant:last.end.instant};
}
function syncNftMintModeUI(){
  const mode=nftMintMode(),multiple=mode==="multiple",single=mode==="single",terminal=mode==="terminal";
  const singlePanel=document.querySelector("#nft-single-phase-fields"),multiPanel=document.querySelector("#nft-multiple-phase-fields"),terminalPanel=document.querySelector("#nft-terminal-only-fields");
  if(singlePanel)singlePanel.hidden=!single;if(multiPanel)multiPanel.hidden=!multiple;if(terminalPanel)terminalPanel.hidden=!terminal;const confirmButton=document.querySelector("#confirm-nft-mint-details");if(confirmButton)confirmButton.hidden=terminal;
}
function phaseValuesFromIso(phase={},fallbackZone){
  const zone=validTimeZone(phase.timezone)?phase.timezone:(validTimeZone(fallbackZone)?fallbackZone:browserTimeZone());
  const split=iso=>{const d=new Date(iso||"");if(Number.isNaN(d.getTime()))return {date:"",time:""};const x=zonedParts(d,zone);return {date:`${x.year}-${x.month}-${x.day}`,time:`${x.hour}:${x.minute}`}};
  const a=split(phase.startsAt),b=split(phase.endsAt);
  return {label:phase.label||"",name:phase.name||"",startDate:a.date,startTime:a.time,endDate:b.date,endTime:b.time,timezone:zone,price:phase.price||"",limit:phase.limit||""};
}
function defaultPhase(index){return {label:index===0?"ALLOWLIST":index===1?"PUBLIC":`PHASE ${index+1}`,name:"",startDate:"",startTime:"",endDate:"",endTime:"",timezone:browserTimeZone(),price:"",limit:""}}
function renderNftPhaseEditor(phases){
  const list=document.querySelector("#nft-phase-list");if(!list)return;
  const values=(Array.isArray(phases)&&phases.length?phases:[defaultPhase(0),defaultPhase(1)]).slice(0,6);
  list.innerHTML="";
  values.forEach((phase,index)=>{
    const card=document.createElement("div");card.className="nft-phase-card";card.dataset.phaseIndex=String(index);
    const esc=v=>String(v??"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;");
    card.innerHTML=`<div class="nft-phase-card-head"><strong>PHASE ${index+1}</strong><div><button class="timezone-button phase-local-timezone" type="button">USE MY TIMEZONE</button> ${index>=2?'<button class="nft-phase-remove" type="button">REMOVE</button>':""}</div></div><div class="nft-phase-grid"><label><span>Phase label</span><input data-phase-field="label" value="${esc(phase.label)}" placeholder="e.g. PHASE 1"></label><label><span>Public phase name</span><input data-phase-field="name" value="${esc(phase.name)}" placeholder="Optional display name"></label><label><span>Start date</span><input data-phase-field="startDate" type="date" value="${esc(phase.startDate)}"></label><label><span>Start time</span><input data-phase-field="startTime" type="time" step="60" value="${esc(phase.startTime)}"></label><label><span>End date</span><input data-phase-field="endDate" data-date-autofill="${phase.endDate&&phase.endDate!==phase.startDate?"manual":"start"}" type="date" value="${esc(phase.endDate)}"></label><label><span>End time</span><input data-phase-field="endTime" type="time" step="60" value="${esc(phase.endTime)}"></label><label class="phase-timezone"><span>Timezone</span><input data-phase-field="timezone" list="nft-timezone-options" value="${esc(phase.timezone||browserTimeZone())}" placeholder="e.g. UTC or Europe/Bucharest"></label><label><span>Mint price</span><input data-phase-field="price" value="${esc(phase.price)}" placeholder="e.g. FREE or 0.05 ETH"></label><label><span>Wallet limit</span><input data-phase-field="limit" value="${esc(phase.limit)}" placeholder="e.g. 1 PER WALLET"></label></div>`;
    card.querySelector(".phase-local-timezone")?.addEventListener("click",()=>{card.querySelector('[data-phase-field="timezone"]').value=browserTimeZone();confirmedMintSignature="";syncNftMintSchedule();update()});
    card.querySelector(".nft-phase-remove")?.addEventListener("click",()=>{card.remove();renumberPhaseCards();confirmedMintSignature="";syncNftMintSchedule();update()});
    list.append(card);
  });
  renumberPhaseCards();
}
function renumberPhaseCards(){
  const cards=[...document.querySelectorAll("#nft-phase-list .nft-phase-card")];cards.forEach((card,i)=>{card.dataset.phaseIndex=String(i);const h=card.querySelector(".nft-phase-card-head strong");if(h)h.textContent=`PHASE ${i+1}`});
  const add=document.querySelector("#add-nft-phase");if(add)add.disabled=cards.length>=6;
}
function bindNftPhaseDateAutofill(){
  const list=document.querySelector("#nft-phase-list");if(!list||list.dataset.dateAutofillBound==="1")return;list.dataset.dateAutofillBound="1";
  const syncDate=event=>{
    const input=event.target;if(!(input instanceof HTMLInputElement))return;
    if(input.dataset.phaseField==="endDate"){input.dataset.dateAutofill="manual";confirmedMintSignature="";syncNftMintSchedule();return}
    if(input.dataset.phaseField!=="startDate")return;
    const card=input.closest(".nft-phase-card"),end=card?.querySelector('[data-phase-field="endDate"]');
    if(input.value&&end&&(!end.value||end.dataset.dateAutofill==="start")){end.value=input.value;end.dataset.dateAutofill="start"}
    confirmedMintSignature="";syncNftMintSchedule();
  };
  list.addEventListener("input",syncDate);list.addEventListener("change",syncDate);
}
function currentPhaseDrafts(){return [...document.querySelectorAll("#nft-phase-list .nft-phase-card")].map(card=>{const get=f=>card.querySelector(`[data-phase-field="${f}"]`)?.value||"";return {label:get("label"),name:get("name"),startDate:get("startDate"),startTime:get("startTime"),endDate:get("endDate"),endTime:get("endTime"),timezone:get("timezone"),price:get("price"),limit:get("limit")}})}
function syncNftMintSchedule(){
  const hidden=form.elements.nftMintAt,output=document.querySelector("#nft-mint-check");syncNftMintModeUI();
  if(!checked("nftTerminal")){if(hidden)hidden.value="";if(output){output.className="contract-check";output.textContent="[ SKIP ] NFT Terminal is disabled."}return {ok:true,disabled:true,iso:"",mode:nftMintMode(),phases:[]}}
  const schedule=nftMintSchedule();if(!schedule.ok){if(hidden)hidden.value="";if(output){output.className="contract-check fail";output.textContent=`[ WAIT ] ${schedule.error}`}return schedule}
  if(schedule.mode==="terminal"){if(hidden)hidden.value="";if(output){output.className="contract-check pass";output.textContent="[ OK ] Terminal Only selected · mint schedule/countdown not required."}return schedule}
  if(hidden)hidden.value=schedule.iso;const diff=schedule.instant.getTime()-Date.now();
  if(output){const detail=schedule.mode==="multiple"?`${schedule.phases.length} phases · first starts ${formatMintForReview(schedule)}`:formatMintForReview(schedule);if(diff<0){output.className="contract-check warn";output.textContent=`[ WARN ] Mint schedule has already started · ${detail}`}else if(diff<60*60*1000){output.className="contract-check warn";output.textContent=`[ CHECK ] Mint starts in less than 1 hour · ${detail}`}else{output.className="contract-check pass";output.textContent=`[ OK ] NFT ${schedule.mode==="multiple"?"multi-phase schedule":"mint"} is configured · ${detail}`}}
  return schedule;
}
function offsetLabelFromIso(iso){const m=String(iso||"").match(/([+-])(\d{2}):(\d{2})$/);if(!m)return "GMT";const h=Number(m[2]),min=Number(m[3]);return `GMT${m[1]}${h}${min?`:${String(min).padStart(2,"0")}`:""}`}
function humanDateTime(date,timeZone){const parts=new Intl.DateTimeFormat("en-GB",{timeZone,day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(date);const x=Object.fromEntries(parts.filter(p=>p.type!=="literal").map(p=>[p.type,p.value]));return `${x.day} ${x.month} ${x.year} · ${x.hour}:${x.minute}`}
function formatMintForReview(schedule){return `${humanDateTime(schedule.instant,schedule.timeZone)} · ${offsetLabelFromIso(schedule.iso)}`}
function formatComputerTime(){const zone=browserTimeZone(),now=new Date(),offset=offsetMinutesAt(now,zone);return `${humanDateTime(now,zone)} · ${offsetLabelFromIso(`2000-01-01T00:00:00${formatOffset(offset)}`)} · ${zone}`}
function relativeMintTime(schedule){let ms=schedule.instant.getTime()-Date.now(),past=ms<0;ms=Math.abs(ms);const days=Math.floor(ms/86400000);ms%=86400000;const hours=Math.floor(ms/3600000);ms%=3600000;const minutes=Math.floor(ms/60000);const parts=[];if(days)parts.push(`${days} day${days===1?"":"s"}`);if(hours)parts.push(`${hours} hour${hours===1?"":"s"}`);if(minutes||!parts.length)parts.push(`${minutes} minute${minutes===1?"":"s"}`);return past?`${parts.slice(0,2).join(" ")} ago`:parts.slice(0,2).join(" ")}
function setNftMintFieldsFromIso(iso,timeZone,endIso=""){
  const zone=validTimeZone(timeZone)?timeZone:browserTimeZone();setValue("nftMintTimezone",zone);
  const fill=(value,dateField,timeField)=>{if(!value){setValue(dateField,"");setValue(timeField,"");return}const d=new Date(value);if(Number.isNaN(d.getTime()))return;const x=zonedParts(d,zone);setValue(dateField,`${x.year}-${x.month}-${x.day}`);setValue(timeField,`${x.hour}:${x.minute}`)};
  fill(iso,"nftMintDate","nftMintTime");fill(endIso,"nftMintEndDate","nftMintEndTime");if(!iso)setValue("nftMintAt","");syncNftMintSchedule();
}
function setNftMintConfiguration(nft={}){
  const mode=nft.mode==="terminal"?"terminal":nft.mode==="multiple"||Array.isArray(nft.mintPhases)&&nft.mintPhases.length>1?"multiple":"single";setValue("nftMintMode",mode);
  if(mode==="multiple")renderNftPhaseEditor((nft.mintPhases||[]).map(x=>phaseValuesFromIso(x,nft.timezone)));else if(mode==="single")setNftMintFieldsFromIso(nft.mintAt,nft.timezone,nft.mintEndAt);
  syncNftMintModeUI();syncNftMintSchedule();
}
function populateTimeZones(){const list=document.querySelector("#nft-timezone-options");if(!list)return;let zones=[];try{zones=Intl.supportedValuesOf?Intl.supportedValuesOf("timeZone"):[]}catch{};list.innerHTML=zones.map(z=>`<option value="${z}"></option>`).join("")}
populateTimeZones();if(form.elements.nftMintTimezone&&!form.elements.nftMintTimezone.value)form.elements.nftMintTimezone.value=browserTimeZone();renderNftPhaseEditor();bindNftPhaseDateAutofill();syncNftMintModeUI();

async function fileDataUrl(file){return new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(String(r.result));r.onerror=no;r.readAsDataURL(file)})}
async function optimizeMascot(file){
  const original=await fileDataUrl(file);
  if(file.type==="image/svg+xml")return {dataBase64:original.split(",")[1],extension:"svg",name:file.name,optimized:false};
  try{
    const image=await new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=original});
    const max=384;const scale=Math.min(1,max/Math.max(image.naturalWidth||1,image.naturalHeight||1));
    const canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
    const ctx=canvas.getContext("2d",{alpha:true});ctx.drawImage(image,0,0,canvas.width,canvas.height);
    const optimized=canvas.toDataURL("image/webp",0.82);
    return {dataBase64:optimized.split(",")[1],extension:"webp",name:file.name,optimized:true,width:canvas.width,height:canvas.height};
  }catch{return {dataBase64:original.split(",")[1],extension:(file.name.split(".").pop()||"png").toLowerCase(),name:file.name,optimized:false}}
}
async function mascotPayload(){
  const f=document.querySelector("#mascot").files[0];
  if(!f)return persistedMascot;
  return optimizeMascot(f);
}

function mascotDataUriFromPayload(asset){
  if(!asset?.dataBase64)return "";const ext=String(asset.extension||"png").toLowerCase();const mime=ext==="svg"?"image/svg+xml":ext==="jpg"||ext==="jpeg"?"image/jpeg":ext==="webp"?"image/webp":"image/png";return `data:${mime};base64,${asset.dataBase64}`;
}
async function refreshBuilderMascotPreview(){
  const image=document.querySelector("#builder-mascot-preview");const box=document.querySelector("#builder-brand-preview");if(!image||!box)return;
  try{const file=document.querySelector("#mascot").files[0];let src="";if(file)src=await fileDataUrl(file);else src=mascotDataUriFromPayload(persistedMascot);image.src=src;box.hidden=!src;if(src)image.alt=`${val("projectName")||"Project"} logo preview`;}catch{image.removeAttribute("src");box.hidden=true;}
}

async function payload(){const mint=syncNftMintSchedule();return {
  projectName:val("projectName"),ticker:val("ticker"),version:val("version"),description:val("description"),promptUser:terminalUserFromTicker(val("ticker")),promptHost:"robinhood",ecosystem:val("ecosystem"),tokenContract:val("tokenContract"),nftContract:val("nftContract"),dexScreenerChainId:val("dexScreenerChainId"),blockscoutApiBase:val("blockscoutApiBase"),
  links:{home:val("home"),website:val("website"),x:normalizeXUrl(val("x")),telegram:val("telegram"),explorer:val("explorer"),dexScreener:val("dexScreener"),openSea:val("openSea"),additionalLinks:additionalLinksPayload()},
  nft:{openSeaSlug:syncOpenSeaSlug(),collectionName:val("nftCollectionName"),supply:val("nftSupply"),standard:val("nftStandard"),symbol:val("nftSymbol"),metadataUriMethod:val("nftMetadataUriMethod"),mode:mint.mode||nftMintMode(),mintAt:mint.ok&&!mint.disabled&&mint.mode!=="terminal"?mint.iso:"",mintEndAt:mint.ok&&!mint.disabled&&mint.mode==="single"?mint.endIso:"",mintPrice:mint.ok&&!mint.disabled&&mint.mode==="single"?mint.price:"",mintLimit:mint.ok&&!mint.disabled&&mint.mode==="single"?mint.limit:"",mintPhases:mint.ok&&!mint.disabled&&mint.mode==="multiple"?mint.phases.map(({id,label,name,startsAt,endsAt,price,limit,timezone})=>({id,label,name,startsAt,endsAt,price,limit,timezone})):[],timezone:mint.timeZone||val("nftMintTimezone")||browserTimeZone()},
  features:{whaleTracker:checked("whaleTracker"),memeIntel:checked("memeIntel"),communityPulse:checked("communityPulse"),timeline:checked("timeline"),nftTerminal:checked("nftTerminal"),liveMarket:checked("liveMarket")},
  mascot:await mascotPayload()
};}

function nftOnlyProfile(){return checked("nftTerminal")&&!checked("whaleTracker")&&!checked("memeIntel")&&!checked("communityPulse")&&!checked("timeline")&&!checked("liveMarket")}
function syncTokenRequirement(){const input=form.elements.tokenContract;if(!input)return;const required=!nftOnlyProfile();input.required=required;const address=val("tokenContract");if(!required&&!address)showContractCheck("pass","[ SKIP ] Token CA is not required for an NFT-only terminal.");else if(required&&!address)showContractCheck("","[ WAIT ] Enter a 42-character 0x contract address.")}
function configurationReady(){const mint=syncNftMintSchedule();const nftEnabled=checked("nftTerminal");const tokenRequired=!nftOnlyProfile();const tokenReady=!tokenRequired||isEvmAddress(val("tokenContract"));const openSeaOk=!nftEnabled||openSeaConfigurationValid();const mintConfirmed=!nftEnabled||(mint.ok&&!mint.disabled&&(mint.mode==="terminal"||confirmedMintSignature===mintSignature(mint)));return Boolean(val("projectName")&&val("ticker")&&tokenReady&&openSeaOk&&(!nftEnabled||(isEvmAddress(val("nftContract"))&&mint.ok&&!mint.disabled&&mintConfirmed)))}
function updateWorkspaceStatus(){
  const name=val("projectName");
  currentProjectLabel.textContent=activeProjectId?(name||activeProjectId).toUpperCase():(name?`${name.toUpperCase()} // UNSAVED`:"UNSAVED PROJECT");
  const ready=configurationReady();
  projectStateLabel.textContent=ready?"READY":"DRAFT";
  projectStateLabel.classList.toggle("ready",ready);
}

let nftDiscoveryTimer=null;
let nftDiscoverySequence=0;
let nftDiscoveryAddress="";
const nftAutoFields={collectionName:false,supply:false};
function showNftDiscovery(kind,message){const out=document.querySelector("#nft-discovery-check");if(!out)return;out.className=`contract-check ${kind||""}`.trim();out.textContent=message}
function clearNftDiscovery({keepUserValues=true}={}){
  nftDiscoveryAddress="";setValue("nftStandard","");setValue("nftSymbol","");setValue("nftMetadataUriMethod","");
  if(!keepUserValues){if(nftAutoFields.collectionName)setValue("nftCollectionName","");if(nftAutoFields.supply)setValue("nftSupply","")}
  nftAutoFields.collectionName=false;nftAutoFields.supply=false;
}
function applyDiscoveredField(name,value,flag){
  if(value===null||value===undefined||value==="")return false;
  const current=val(name);
  if(current&&!nftAutoFields[flag])return false;
  setValue(name,String(value));nftAutoFields[flag]=true;return true;
}
async function discoverNftContract(){
  const address=val("nftContract");const sequence=++nftDiscoverySequence;
  if(!address){clearNftDiscovery();showNftDiscovery("","[ DISCOVERY ] Waiting for NFT contract.");return}
  if(!isEvmAddress(address)){showNftDiscovery("","[ DISCOVERY ] Enter a valid NFT contract to inspect it.");return}
  showNftDiscovery("","[ DISCOVERING ] Inspecting Robinhood Chain contract + Blockscout index...");
  try{
    const response=await fetch(`/api/discover-nft?address=${encodeURIComponent(address)}`);const data=await response.json();
    if(sequence!==nftDiscoverySequence)return;if(!response.ok)throw new Error(data.error||"NFT discovery failed");
    nftDiscoveryAddress=address;setValue("nftStandard",data.nft?.standard||"");setValue("nftSymbol",data.nft?.symbol||"");setValue("nftMetadataUriMethod",data.nft?.metadataUriMethod||"");
    const nameFilled=applyDiscoveredField("nftCollectionName",data.nft?.collectionName,"collectionName");
    const supplyFilled=applyDiscoveredField("nftSupply",data.nft?.supply,"supply");
    const standard=data.nft?.standard||"standard unconfirmed",symbol=data.nft?.symbol?` · ${data.nft.symbol}`:"",holders=Number.isFinite(Number(data.nft?.holders))?` · ${Number(data.nft.holders).toLocaleString()} holders indexed`:"";
    const kind=data.nft?.detected?"pass":"warn";
    const prefix=data.nft?.detected?"[ DISCOVERED ]":"[ PARTIAL ]";
    showNftDiscovery(kind,`${prefix} ${standard}${symbol}${holders}${nameFilled||supplyFilled?" · fields auto-filled":""}`);
    if(data.nft?.detected&&form.elements.nftTerminal&&!form.elements.nftTerminal.checked){form.elements.nftTerminal.checked=true;nftExplicitlyDisabled=false}
    update();
  }catch(error){if(sequence===nftDiscoverySequence)showNftDiscovery("warn",`[ WARN ] NFT discovery unavailable: ${error.message}. Manual configuration remains available.`)}
}
function scheduleNftDiscovery(){clearTimeout(nftDiscoveryTimer);const address=val("nftContract");if(address!==nftDiscoveryAddress){if(nftDiscoveryAddress)clearNftDiscovery({keepUserValues:true});nftDiscoveryTimer=setTimeout(discoverNftContract,650)}}

function syncNftContractState({fromContractInput=false}={}){
  const raw=val("nftContract"),output=document.querySelector("#nft-contract-check"),toggle=form.elements.nftTerminal;
  if(!raw){if(output){output.className="contract-check";output.textContent="[ OPTIONAL ] No NFT contract entered."}lastNftContractValue="";return}
  if(!isEvmAddress(raw)){if(output){output.className="contract-check fail";output.textContent="[ WAIT ] Enter a valid 42-character 0x NFT contract address."}lastNftContractValue=raw;return}
  if(output){output.className="contract-check pass";output.textContent="[ OK ] Valid NFT contract detected."}
  const changed=raw!==lastNftContractValue;lastNftContractValue=raw;
  if(toggle&&!toggle.checked&&fromContractInput&&changed){toggle.checked=true;nftExplicitlyDisabled=false;confirmedMintSignature="";status.textContent="[ NFT ] NFT contract detected · NFT Terminal enabled automatically."}
}
function syncMintConfirmationState(){
  const out=document.querySelector("#nft-mint-confirmed-state");if(!out)return;
  if(!checked("nftTerminal")){out.className="contract-check";out.textContent="[ SKIP ] NFT Terminal is disabled.";return}
  if(!isEvmAddress(val("nftContract"))){out.className="contract-check fail";out.textContent="[ WAIT ] A valid NFT Contract Address is required before mint confirmation.";return}
  const schedule=nftMintSchedule();
  if(!schedule.ok){out.className="contract-check fail";out.textContent="[ WAIT ] Complete valid NFT mint details before confirmation.";return}
  if(schedule.mode==="terminal"){out.className="contract-check pass";out.textContent="[ SKIP ] Terminal Only · mint confirmation not required.";return}
  const confirmed=confirmedMintSignature&&confirmedMintSignature===mintSignature(schedule);
  out.className=`contract-check ${confirmed?"pass":"warn"}`;out.textContent=confirmed?"[ CONFIRMED ] NFT mint details confirmed.":"[ CONFIRM ] NFT mint details require confirmation before terminal creation.";
}

function update(){
  syncNftContractState();
  syncOpenSeaValidation();
  syncMascotWarning();
  syncNftConfigVisibility();
  syncTokenRequirement();
  const project=val("projectName"); const ticker=val("ticker"); const contract=val("tokenContract");
  const nftEnabled=checked("nftTerminal"); const nftContract=val("nftContract"); const openSeaSlug=syncOpenSeaSlug(); const requiredReady=configurationReady();
  const modules=[checked("whaleTracker")?"/whales":null,checked("memeIntel")?"/intel":null,nftEnabled?"/nft":null,checked("communityPulse")?"/pulse":null,checked("timeline")?"/timeline":null].filter(Boolean);
  const mascot=document.querySelector("#mascot").files[0];
  preview.textContent=[
    line(project?"ok":"wait",project?`Project identity: ${project.toUpperCase()} (${ticker||"ticker pending"})`:"Project identity required"),
    line(contract?"ok":"wait",`Token contract: ${shortAddress(contract)}`),
    line(checked("liveMarket")?"ok":"skip",checked("liveMarket")?`Landing market data: ${val("dexScreenerChainId")||"chain pending"}`:"Landing market data disabled"),
    line(checked("whaleTracker")?"ok":"skip",checked("whaleTracker")?"Whale Tracker mounted at /whales":"Whale Tracker excluded"),
    line(checked("memeIntel")?"ok":"skip",checked("memeIntel")?"Meme Intel mounted at /intel":"Meme Intel excluded"),
    line(checked("communityPulse")?"ok":"skip",checked("communityPulse")?"Community Pulse mounted at /pulse":"Community Pulse excluded"),
    line(checked("timeline")?"ok":"skip",checked("timeline")?"Timeline mounted at /timeline":"Timeline excluded"),
    line(nftEnabled?(nftContract?"ok":"warn"):"skip",nftEnabled?(nftContract?"NFT Terminal mounted at /nft":"NFT enabled — contract required"):"NFT Terminal excluded"),
    nftEnabled&&val("openSea")?line(openSeaSlug?"ok":"warn",openSeaSlug?`OpenSea collection detected: ${openSeaSlug}`:"OpenSea URL must be a collection link (opensea.io/collection/...)."):line("skip","OpenSea collection link not configured"),
    nftEnabled?(()=>{const m=syncNftMintSchedule();if(m.ok&&m.mode==="terminal")return line("ok","NFT mode: Terminal Only · /nft opens NFT Terminal directly");return m.ok&&!m.disabled?line(m.instant.getTime()>=Date.now()?"ok":"warn",m.mode==="multiple"?`NFT mint structure: ${m.phases.length} phases · starts ${m.iso}`:`NFT mint time: ${m.iso}`):line("warn",m.error||"NFT mint schedule required")})():line("skip","NFT mint schedule not required"),
    line(mascot||persistedMascot?"ok":"skip",mascot?`Brand asset: ${mascot.name}`:persistedMascot?`Brand asset: ${persistedMascot.name||"saved mascot"}`:"Using default terminal asset"),
    "",`PROFILE     ${project?slugify(project):"pending"}`,`VERSION     ${val("version")||"1.0.0"}`,`ECOSYSTEM   ${val("ecosystem")||"NOT SET"}`,`THEME       CANONICAL CTB`,`ROUTES      /${modules.length?`, ${modules.join(", ")}`:""}`,"",
    requiredReady?line("ok","Configuration valid — package ready to generate"):line("wait","Complete required configuration")
  ].join("\n");
  readiness.textContent=requiredReady?"READY":"WAITING"; readiness.classList.toggle("ready",requiredReady); updateWorkspaceStatus();syncMintConfirmationState();
}


const contractInput=form.elements.tokenContract;
const contractCheck=document.querySelector("#contract-check");
let contractCheckTimer=null;
let contractCheckSequence=0;
function isEvmAddress(value){return /^0x[a-fA-F0-9]{40}$/.test(String(value||"").trim())}
function looksLikeNonEvmAddress(value){return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(String(value||"").trim())&&!String(value||"").startsWith("0x")}
function showContractCheck(kind,message){contractCheck.className=`contract-check ${kind||""}`.trim();contractCheck.textContent=message}
async function validateContractField(){
  const address=val("tokenContract");
  const chain=val("dexScreenerChainId");
  const sequence=++contractCheckSequence;
  if(!address){if(nftOnlyProfile())return showContractCheck("pass","[ SKIP ] Token CA is not required for an NFT-only terminal.");return showContractCheck("","[ WAIT ] Enter a 42-character 0x contract address.");}
  if(looksLikeNonEvmAddress(address))return showContractCheck("fail","[ UNSUPPORTED ] This appears to be a non-EVM address. The current terminal engine supports 0x EVM contracts only.");
  if(!isEvmAddress(address))return showContractCheck("fail","[ FAIL ] Invalid EVM contract format. Expected 0x followed by exactly 40 hexadecimal characters.");
  showContractCheck("","[ CHECKING ] Valid EVM format. Looking for DexScreener markets...");
  try{
    const response=await fetch(`/api/validate-contract?address=${encodeURIComponent(address)}&chain=${encodeURIComponent(chain)}`);
    const data=await response.json();
    if(sequence!==contractCheckSequence)return;
    if(!response.ok)throw new Error(data.error||"Contract check failed");
    if(data.match){showContractCheck("pass",`[ PASS ] Valid EVM address · ${data.match.chainId} · ${data.match.baseSymbol}/${data.match.quoteSymbol} · liquidity ${data.match.liquidityDisplay}`)}
    else if(data.detectedChains?.length){showContractCheck("warn",`[ WARN ] Address has markets on ${data.detectedChains.join(", ")}, but none on selected chain “${chain}”. Check the ecosystem and DexScreener chain ID.`)}
    else{showContractCheck("warn","[ WARN ] Valid EVM format, but DexScreener returned no market. Confirm this is the token contract rather than a pool address.")}
  }catch(error){if(sequence===contractCheckSequence)showContractCheck("warn",`[ WARN ] Address format is valid, but live market validation is unavailable: ${error.message}`)}
}
function scheduleContractCheck(){clearTimeout(contractCheckTimer);contractCheckTimer=setTimeout(validateContractField,500)}
contractInput.addEventListener("input",scheduleContractCheck);
form.elements.dexScreenerChainId.addEventListener("input",scheduleContractCheck);
form.elements.openSea?.addEventListener("input",()=>{syncOpenSeaValidation();update()});
form.elements.openSea?.addEventListener("change",()=>{syncOpenSeaValidation();update()});

const mascotInput=document.querySelector("#mascot");
const mascotFileName=document.querySelector("#mascot-file-name");
function syncMascotFileName(){mascotFileName.textContent=mascotInput.files[0]?.name||persistedMascot?.name||"No file selected"}
function syncMascotWarning(){const warning=document.querySelector("#mascot-warning");if(warning)warning.hidden=Boolean(mascotInput.files[0]||persistedMascot)}
mascotInput.addEventListener("change",()=>{persistedMascot=null;syncMascotFileName();refreshBuilderMascotPreview();update()});

function setValue(name,value){const el=form.elements[name];if(!el)return;if(el.type==="checkbox")el.checked=Boolean(value);else el.value=value??""}
function applyPayload(p){
  confirmedMintSignature="";pastScheduleWarningSignature="";nftExplicitlyDisabled=Boolean(p.nftContract&&!p.features?.nftTerminal);lastNftContractValue=String(p.nftContract||"").trim();
  setValue("projectName",p.projectName);setValue("ticker",p.ticker);setValue("version",p.version||"1.0.0");setValue("description",p.description);setValue("promptUser",terminalIdentityFromTicker(p.ticker));setValue("promptHost","robinhood");setValue("ecosystem",p.ecosystem||"Robinhood Chain");setValue("tokenContract",p.tokenContract);setValue("nftContract",p.nftContract);setValue("dexScreenerChainId",p.dexScreenerChainId||"robinhood");setValue("blockscoutApiBase",p.blockscoutApiBase||"https://robinhoodchain.blockscout.com/api/v2");
  for(const k of ["home","website","x","telegram","explorer","dexScreener","openSea"])setValue(k,p.links?.[k]);renderAdditionalLinks(p.links?.additionalLinks||[]);
  setValue("openSeaSlug",p.nft?.openSeaSlug);setValue("nftCollectionName",p.nft?.collectionName);setValue("nftSupply",p.nft?.supply);setValue("nftStandard",p.nft?.standard||"");setValue("nftSymbol",p.nft?.symbol||"");setValue("nftMetadataUriMethod",p.nft?.metadataUriMethod||"");setValue("nftMintPrice",p.nft?.mintPrice||"");setValue("nftMintLimit",p.nft?.mintLimit||"");for(const k of ["whaleTracker","memeIntel","communityPulse","timeline","nftTerminal","liveMarket"])setValue(k,p.features?.[k] ?? (["communityPulse","timeline"].includes(k)?true:undefined));setNftMintConfiguration(p.nft||{});
  persistedMascot=p.mascot||null; mascotInput.value=""; syncMascotFileName(); refreshBuilderMascotPreview(); update();
}
function resetForm(){form.reset();renderAdditionalLinks([]);confirmedMintSignature="";pastScheduleWarningSignature="";nftExplicitlyDisabled=false;lastNftContractValue="";setValue("promptUser","");setValue("version","1.0.0");setValue("promptHost","robinhood");setValue("ecosystem","Robinhood Chain");setValue("dexScreenerChainId","robinhood");setValue("blockscoutApiBase","https://robinhoodchain.blockscout.com/api/v2");setValue("nftMintMode","");setValue("nftMintTimezone",browserTimeZone());renderNftPhaseEditor();syncNftMintModeUI();setValue("whaleTracker",true);setValue("memeIntel",true);setValue("communityPulse",true);setValue("timeline",true);setValue("liveMarket",true);activeProjectId="";persistedMascot=null;mascotInput.value="";syncMascotFileName();refreshBuilderMascotPreview();localStorage.removeItem(SETTINGS_KEY);update();status.textContent="[ NEW ] Blank project workspace ready.";loadDeployment()}
function refreshProjectList(){
  const projects=readProjects(); const current=savedProjectsSelect.value; savedProjectsSelect.innerHTML='<option value="">LOAD SAVED PROJECT...</option>';
  Object.values(projects).sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt))).forEach(item=>{const option=document.createElement("option");option.value=item.id;option.textContent=`${item.name} // ${item.state} // ${new Date(item.updatedAt).toLocaleDateString()}`;savedProjectsSelect.append(option)});
  savedProjectsSelect.value=projects[current]?current:"";
}
async function saveProject({duplicate=false}={}){
  const data=await payload(); if(!data.projectName)throw new Error("Project name is required before saving.");
  let id=slugify(data.projectName); const projects=readProjects();
  if(duplicate){let n=2;const base=id;while(projects[id])id=`${base}-copy-${n++}`;data.projectName=`${data.projectName} COPY`;data.tokenContract="";data.nftContract="";data.links={};data.nft={};data.features.nftTerminal=false;}
  const existing=projects[id];const timestamp=nowIso();projects[id]={id,name:data.projectName.toUpperCase(),ticker:data.ticker,state:configurationReady()?"READY":"DRAFT",createdAt:existing?.createdAt||timestamp,updatedAt:timestamp,lastGeneratedAt:existing?.lastGeneratedAt||null,generatedFingerprint:existing?.generatedFingerprint||"",schemaVersion:SCHEMA_VERSION,builderVersion:"1.3.2-b",data};writeProjects(projects);activeProjectId=id;applyPayload(data);refreshProjectList();savedProjectsSelect.value=id;status.textContent=`[ SAVED ] ${data.projectName.toUpperCase()} stored locally.`;
}
function loadProject(id){const item=readProjects()[id];if(!item)return;activeProjectId=id;applyPayload(item.data);savedProjectsSelect.value=id;localStorage.setItem(SETTINGS_KEY,JSON.stringify({activeProjectId:id}));status.textContent=`[ LOADED ] ${item.name}`;loadDeployment()}
function deleteProject(){if(!activeProjectId){status.textContent="[ WARN ] No saved project is active.";return}const projects=readProjects();const item=projects[activeProjectId];if(!item)return;const answer=prompt(`Type ${item.name} to delete this saved project:`);if(answer!==item.name){status.textContent="[ SKIP ] Project deletion cancelled.";return}delete projects[activeProjectId];writeProjects(projects);resetForm();refreshProjectList();status.textContent=`[ DELETED ] ${item.name} removed from this browser.`}
async function exportProject(){const data=await payload();const deployment=deploymentForm();const bundle={schemaVersion:SCHEMA_VERSION,builderVersion:"1.3.2-b",terminalEngineVersion:"1.0.0",exportedAt:nowIso(),project:data,deployment:{githubUrl:deployment.githubUrl||"",publicUrl:deployment.publicUrl||""}};const blob=new Blob([JSON.stringify(bundle,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`${slugify(data.projectName)||"community-terminal"}-config.json`;a.click();URL.revokeObjectURL(a.href);status.textContent="[ EXPORTED ] Project configuration downloaded."}
function importProject(bundle){if(!bundle||bundle.schemaVersion!==SCHEMA_VERSION||!bundle.project)throw new Error("Unsupported or invalid project configuration.");activeProjectId="";applyPayload(bundle.project);const imported=bundle.deployment||{};const id=slugify(bundle.project.projectName)||"unsaved";const all=readDeployments(),prior=all[id]||{};const githubUrl=String(imported.githubUrl||"").trim();const publicUrl=String(imported.publicUrl||"").trim();if(githubUrl||publicUrl){all[id]={...prior,...(githubUrl?{githubUrl}:{}),...(publicUrl?{publicUrl}:{}),updatedAt:nowIso()};localStorage.setItem(DEPLOYMENT_KEY,JSON.stringify(all));}renderDeploymentRecord(all[id]||prior);status.textContent="[ IMPORTED ] Configuration loaded. Press SAVE to keep it locally."}
function saveProjectSnapshot(project){
  const id=slugify(project.projectName);if(!id)throw new Error("Project name is required before generating.");
  const projects=readProjects(),existing=projects[id],timestamp=nowIso();
  projects[id]={id,name:String(project.projectName||id).toUpperCase(),ticker:project.ticker||"",state:configurationReady()?"READY":"DRAFT",createdAt:existing?.createdAt||timestamp,updatedAt:timestamp,lastGeneratedAt:existing?.lastGeneratedAt||null,generatedFingerprint:existing?.generatedFingerprint||"",schemaVersion:SCHEMA_VERSION,builderVersion:"1.3.2-b",data:project};
  writeProjects(projects);activeProjectId=id;localStorage.setItem(SETTINGS_KEY,JSON.stringify({activeProjectId:id}));refreshProjectList();savedProjectsSelect.value=id;updateWorkspaceStatus();return true;
}
function noteGenerated(project,fingerprint){
  const id=activeProjectId||slugify(project.projectName);if(!id)return false;
  const projects=readProjects(),existing=projects[id],timestamp=nowIso();
  projects[id]={id,name:String(project.projectName||id).toUpperCase(),ticker:project.ticker||"",state:configurationReady()?"READY":"DRAFT",createdAt:existing?.createdAt||timestamp,updatedAt:timestamp,lastGeneratedAt:timestamp,generatedFingerprint:String(fingerprint||""),schemaVersion:SCHEMA_VERSION,builderVersion:"1.3.2-b",data:project};
  writeProjects(projects);activeProjectId=id;localStorage.setItem(SETTINGS_KEY,JSON.stringify({activeProjectId:id}));refreshProjectList();savedProjectsSelect.value=id;updateWorkspaceStatus();return true;
}

form.elements.projectName?.addEventListener("input",()=>update());
form.elements.ticker?.addEventListener("input",()=>{syncTerminalIdentity();update()});
form.addEventListener("input",update);form.addEventListener("change",update);
form.elements.nftContract.addEventListener("input",()=>{confirmedMintSignature="";nftExplicitlyDisabled=false;syncNftContractState({fromContractInput:true});syncNftConfigVisibility();syncMintConfirmationState();scheduleNftDiscovery();update()});
form.elements.nftCollectionName?.addEventListener("input",()=>{nftAutoFields.collectionName=false});
form.elements.nftSupply?.addEventListener("input",()=>{nftAutoFields.supply=false});

function closeNftDisableDialog(disable){
  const dialog=document.querySelector("#nft-disable-warning");if(dialog?.open)dialog.close();
  if(disable){form.elements.nftTerminal.checked=false;nftExplicitlyDisabled=true;confirmedMintSignature="";status.textContent="[ NFT ] NFT Terminal disabled for this build · NFT configuration preserved."}
  else{form.elements.nftTerminal.checked=true;nftExplicitlyDisabled=false;status.textContent="[ NFT ] NFT Terminal remains enabled."}
  syncNftConfigVisibility();syncMintConfirmationState();update();
}
form.elements.nftTerminal.addEventListener("change",event=>{
  if(!event.currentTarget.checked&&val("nftContract")){event.currentTarget.checked=true;const dialog=document.querySelector("#nft-disable-warning");if(dialog&&!dialog.open)dialog.showModal();syncNftConfigVisibility();syncMintConfirmationState();update();return}
  confirmedMintSignature="";syncNftConfigVisibility();syncMintConfirmationState();update();
});
document.querySelector("#nft-disable-keep").addEventListener("click",()=>closeNftDisableDialog(false));
document.querySelector("#nft-disable-confirm").addEventListener("click",()=>closeNftDisableDialog(true));
document.querySelector("#nft-disable-close").addEventListener("click",()=>closeNftDisableDialog(false));
document.querySelector("#nft-disable-warning").addEventListener("cancel",event=>{event.preventDefault();closeNftDisableDialog(false)});
document.querySelector("#use-local-timezone").addEventListener("click",()=>{setValue("nftMintTimezone",browserTimeZone());syncNftMintSchedule();update();status.textContent=`[ TIMEZONE ] Using your computer timezone: ${browserTimeZone()}`});
document.querySelector("#nft-mint-mode").addEventListener("change",event=>{const mode=nftMintMode();confirmedMintSignature="";pastScheduleWarningSignature="";if(mode==="multiple"){const drafts=currentPhaseDrafts();const seed=defaultPhase(0);seed.label=drafts[0]?.label||"PHASE 1";seed.name=drafts[0]?.name||"";seed.startDate=val("nftMintDate");seed.startTime=val("nftMintTime");seed.endDate=val("nftMintEndDate");seed.endTime=val("nftMintEndTime");seed.timezone=val("nftMintTimezone")||browserTimeZone();seed.price=val("nftMintPrice");seed.limit=val("nftMintLimit");const second=drafts[1]||defaultPhase(1);renderNftPhaseEditor([seed,second,...drafts.slice(2)]);}else if(mode==="single"){const first=currentPhaseDrafts()[0];if(first){setValue("nftMintDate",first.startDate);setValue("nftMintTime",first.startTime);setValue("nftMintEndDate",first.endDate);setValue("nftMintEndTime",first.endTime);setValue("nftMintTimezone",first.timezone||browserTimeZone());setValue("nftMintPrice",first.price);setValue("nftMintLimit",first.limit);}}syncNftMintModeUI();syncNftMintSchedule();syncMintConfirmationState();setTimeout(warnIfPastSchedule,0);update();status.textContent=mode==="multiple"?"[ NFT ] Multiple-phase canonical mint base selected · Phase 1 values preserved.":mode==="single"?"[ NFT ] Single-phase canonical mint base selected · Phase 1 values preserved.":mode==="terminal"?"[ NFT ] Terminal Only selected · no countdown/mint schedule will be generated.":"[ NFT ] Please select NFT mode."});
document.querySelector("#add-nft-phase").addEventListener("click",()=>{const drafts=currentPhaseDrafts();if(drafts.length>=6)return;drafts.push(defaultPhase(drafts.length));renderNftPhaseEditor(drafts);confirmedMintSignature="";pastScheduleWarningSignature="";syncNftMintSchedule();syncMintConfirmationState();update()});
document.querySelector("#new-project").addEventListener("click",()=>{if(confirm("Start a new project? Unsaved form changes will be cleared."))resetForm()});
document.querySelector("#save-project").addEventListener("click",()=>saveProject().catch(err=>status.textContent=`[ ERROR ] ${err.message}`));
document.querySelector("#duplicate-project").addEventListener("click",()=>saveProject({duplicate:true}).catch(err=>status.textContent=`[ ERROR ] ${err.message}`));
document.querySelector("#export-project").addEventListener("click",()=>exportProject().catch(err=>status.textContent=`[ ERROR ] ${err.message}`));
document.querySelector("#import-project").addEventListener("click",()=>importProjectFile.click());
document.querySelector("#delete-project").addEventListener("click",deleteProject);
savedProjectsSelect.addEventListener("change",()=>{if(savedProjectsSelect.value)loadProject(savedProjectsSelect.value)});
importProjectFile.addEventListener("change",async()=>{try{const file=importProjectFile.files[0];if(!file)return;importProject(JSON.parse(await file.text()))}catch(err){status.textContent=`[ ERROR ] ${err.message}`}finally{importProjectFile.value=""}});


function readDeployments(){try{return JSON.parse(localStorage.getItem(DEPLOYMENT_KEY)||"{}")||{}}catch{return {}}}
function deploymentId(){return activeProjectId||slugify(val("projectName"))||"unsaved"}
function deploymentForm(){return {githubUrl:document.querySelector("#github-repository-url").value.trim(),publicUrl:document.querySelector("#public-terminal-url").value.trim()}}
function renderDeploymentRecord(record={}){
  document.querySelector("#github-repository-url").value=record.githubUrl||"";
  document.querySelector("#public-terminal-url").value=record.publicUrl||"";
  const label=document.querySelector("#deployment-state");
  const accepted=record.acceptance?.ok===true;label.textContent=accepted?"PUBLIC ACCEPTED":record.publicUrl?"URL SAVED":"NOT DEPLOYED";label.classList.toggle("live",accepted);
  const out=document.querySelector("#deployment-result");
  if(record.acceptance){out.textContent=record.acceptance.lines.join("\n");out.className=`deployment-result ${accepted?"pass":"fail"}`}
  else{out.textContent="[ WAIT ] Add the GitHub and Render URLs after deployment.";out.className="deployment-result"}
}
function loadDeployment(){renderDeploymentRecord(readDeployments()[deploymentId()]||{})}
function saveDeployment(){const all=readDeployments(),id=deploymentId(),prior=all[id]||{};all[id]={...prior,...deploymentForm(),updatedAt:nowIso()};localStorage.setItem(DEPLOYMENT_KEY,JSON.stringify(all));renderDeploymentRecord(all[id]);status.textContent="[ SAVED ] Deployment handoff stored in this browser."}
function openDeployment(kind){const record=deploymentForm();const url=kind==="github"?record.githubUrl:record.publicUrl;if(!url)return status.textContent=`[ WAIT ] Add the ${kind==="github"?"GitHub":"Render"} URL first.`;try{const parsed=new URL(url);if(parsed.protocol!=="https:")throw new Error();window.open(parsed.href,"_blank","noopener")}catch{status.textContent="[ ERROR ] Enter a valid HTTPS URL."}}
async function verifyPublicTerminal(){
  const record=deploymentForm();if(!record.publicUrl)return status.textContent="[ WAIT ] Add the public Render URL first.";
  const out=document.querySelector("#deployment-result"),btn=document.querySelector("#verify-public-terminal");btn.disabled=true;out.className="deployment-result";out.textContent="[ CHECKING ] Public landing, security, health, status and enabled routes...";
  try{const response=await fetch("/api/verify-terminal",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:record.publicUrl,expected:{whales:checked("whaleTracker"),intel:checked("memeIntel"),pulse:checked("communityPulse"),timeline:checked("timeline"),nft:checked("nftTerminal")&&Boolean(val("nftContract"))}})});const data=await response.json();if(!response.ok&& !data.checks)throw new Error(data.error||"Acceptance failed");const lines=[`[ ${data.ok?"ACCEPTED":"FAILED"} ] ${data.url||record.publicUrl}`,...(data.checks||[]).map(x=>`[ ${x.pass?"PASS":"FAIL"} ] ${x.name}`),`[ TIME ] ${data.checkedAt||nowIso()}`];const all=readDeployments(),id=deploymentId();all[id]={...(all[id]||{}),...record,acceptance:{ok:Boolean(data.ok),checkedAt:data.checkedAt||nowIso(),lines},updatedAt:nowIso()};localStorage.setItem(DEPLOYMENT_KEY,JSON.stringify(all));renderDeploymentRecord(all[id]);status.textContent=data.ok?"[ ACCEPTED ] Public terminal passed all public checks.":"[ FAIL ] Public terminal did not pass every check."}catch(error){out.className="deployment-result fail";out.textContent=`[ FAIL ] ${error.message}`;status.textContent=`[ ERROR ] ${error.message}`}finally{btn.disabled=false}}
document.querySelector("#save-deployment").addEventListener("click",saveDeployment);
document.querySelector("#open-github").addEventListener("click",()=>openDeployment("github"));
document.querySelector("#open-render").addEventListener("click",()=>openDeployment("render"));
document.querySelector("#verify-public-terminal").addEventListener("click",verifyPublicTerminal);

syncMascotFileName();refreshBuilderMascotPreview();refreshProjectList();validateContractField();
initializeBuilderExperience();
// Public-builder startup rule: always open a clean NEW PROJECT workspace.
// Saved projects remain browser-local and can be loaded explicitly from PROJECT WORKSPACE.
resetForm();
refreshProjectList();

function escapeHtml(value){return String(value||"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]))}

async function mascotDataUrl(){
  const file=document.querySelector("#mascot").files[0];
  if(file)return await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=reject;reader.readAsDataURL(file)});
  return mascotDataUriFromPayload(persistedMascot);
}

async function openLandingPreview(){
  const project=(val("projectName")||"YOUR PROJECT").toUpperCase();
  const ecosystem=val("ecosystem")||"Robinhood Chain";
  const promptUser=terminalUserFromTicker(val("ticker"))||"token";
  const promptHost="robinhood";
  const primary="#39ff14";
  const accent="#ff8a00";
  const background="#020806";
  const panel="#03100b";
  const mascot=await mascotDataUrl();
  const modules=[];
  if(checked("whaleTracker"))modules.push(["whales","Whale Activity Tracker","Monitor whale activity, DEX transfers, and holder rankings."]);
  if(checked("memeIntel"))modules.push(["intel","Meme Intelligence Terminal","Read market pulse, buy pressure, holder behavior, and risk signals."]);
  if(checked("nftTerminal")&&val("nftContract"))modules.push(["nft",`${project} NFT Terminal`,`NFT analytics and collection statistics.`]);
  if(checked("communityPulse"))modules.push(["pulse","Community Pulse","Synthesized market, holder, whale, fresh-wallet and NFT signals."]);
  if(checked("timeline"))modules.push(["timeline","Community Timeline","Project, NFT and community milestones chronologically."]);
  const quickHtml=modules.length?modules.map(([cmd])=>`<a href="#">${escapeHtml(cmd.toUpperCase())}</a>`).join(""):"";
  const moduleHtml=modules.length?modules.map(([cmd,title,desc])=>`<div class="terminal-row"><b>&gt; ${escapeHtml(cmd.charAt(0).toUpperCase()+cmd.slice(1))}</b><strong>${escapeHtml(title)}</strong><span>${escapeHtml(desc)}</span></div>`).join(""):`<div class="terminal-row"><b>[ NO MODULES ENABLED ]</b></div>`;
  const mascotHtml=mascot?`<img src="${mascot}" alt="Project mascot">`:`<span>&gt;_</span>`;
  const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(project)} Landing Preview</title><style>
  :root{--p:${primary};--a:${accent};--bg:${background};--panel:${panel}}*{box-sizing:border-box}body{margin:0;min-height:100vh;background:var(--bg);color:#e8fff0;font-family:"IBM Plex Mono",Consolas,monospace;padding:18px}body:before{content:"101001 011010 110001 010101 001110 101010 011001 110100";position:fixed;inset:0;color:color-mix(in srgb,var(--p) 4%,transparent);font-size:4vw;letter-spacing:.35em;word-break:break-all;pointer-events:none}.wrap{position:relative;max-width:1040px;margin:auto;border:1px solid var(--a);background:color-mix(in srgb,var(--bg) 96%,black);padding:24px;box-shadow:0 0 60px color-mix(in srgb,var(--p) 10%,transparent)}.mode{color:var(--a);font-size:.72rem;letter-spacing:.12em}.mascot{width:min(220px,58vw);height:86px;min-height:0;margin:4px auto 10px;border:0;outline:0;box-shadow:none;display:grid;place-items:center;background:transparent;color:var(--p);font-weight:800;overflow:visible}.mascot img{display:block;width:100%;max-width:100%;height:100%;max-height:86px;object-fit:contain;border:0;outline:0;box-shadow:none;background:transparent}.title{text-align:center;color:var(--a);font-size:1.35rem;font-weight:800;letter-spacing:.07em;padding:12px;border-top:1px solid var(--a);border-bottom:1px solid var(--a)}.sub{text-align:center;color:#a8b9ae;margin:8px}.sub b{color:var(--p)}.market{display:grid;grid-template-columns:14ch 17ch 1ch minmax(0,1fr);gap:5px 8px;padding:14px 0;border-top:1px solid color-mix(in srgb,var(--a) 55%,transparent);border-bottom:1px solid color-mix(in srgb,var(--a) 55%,transparent);font-size:.88rem}.market{grid-template-columns:max-content minmax(0,1fr)!important;column-gap:12px!important}.market span{color:var(--a)}.market b{text-align:left}.market .preview-ca{color:var(--cyan);overflow-wrap:anywhere}.boot{padding:14px 0;font-size:.9rem;line-height:1.55}.boot b{color:var(--p)}.quick-label,.available-label{margin-top:14px;color:var(--p);font-weight:700}.quick{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin-top:8px}.quick a{border:1px solid #6fd3ff;color:#6fd3ff;text-align:center;padding:8px;text-decoration:none;font-size:.76rem}.terminal-list{margin-top:8px;border-bottom:1px solid rgba(25,75,45,.7);padding-bottom:8px}.terminal-row{display:grid;grid-template-columns:120px 230px 1fr;gap:14px;padding:5px 0;font-size:.78rem}.terminal-row b{color:#6fd3ff}.terminal-row strong{color:var(--a)}.terminal-row span{color:#83978a}.prompt{margin-top:16px;padding-top:11px;border-top:1px solid color-mix(in srgb,var(--a) 55%,transparent);color:var(--p)}.preview-footer{margin-top:10px;padding:0 8px 8px;border-top:1px solid rgba(25,75,45,.7);text-align:center}.preview-footer .footer-version{padding:10px 0 0;color:var(--a);font-size:.94em;font-weight:700;letter-spacing:.035em}.preview-footer .powered-by{margin-top:12px;color:#83978a;font-size:.78em;line-height:1.45}.preview-footer .powered-by .orange{color:var(--a)}.preview-footer .footer-copy{padding:7px 4px 0;color:#d8e0dc;font-size:.72em;line-height:1.45}.preview-footer a{color:var(--p);text-decoration:none}.preview-footer a:hover{text-decoration:underline}.cursor{display:inline-block;width:8px;height:1em;background:var(--p);vertical-align:-2px;animation:b 1s steps(1) infinite}@keyframes b{50%{opacity:0}}@media(max-width:700px){.quick{grid-template-columns:repeat(2,minmax(0,1fr))}.terminal-row{grid-template-columns:1fr;gap:2px}.wrap{padding:14px}}
  </style></head><body><main class="wrap"><div class="mode">[ PREVIEW MODE — SAMPLE DATA ]</div><div class="mascot">${mascotHtml}</div><div class="title">${escapeHtml(project)} COMMUNITY TERMINAL</div><div class="sub">Independent Community Tools • <b>${escapeHtml(ecosystem)}</b> Ecosystem</div><div class="market"><span>[ PREVIEW ] Price :</span><b>$0.000000</b><span>[ PREVIEW ] Market Cap :</span><b>$0.00</b><span>[ PREVIEW ] Holders :</span><b>0</b><span>[ PREVIEW ] 24h Volume :</span><b>$0.00</b><span>[ PREVIEW ] Updated :</span><b style="color:var(--p)">sample</b><span class="preview-ca">[ CA ] Contract :</span><b class="preview-ca">${escapeHtml(val("tokenContract"))} ⧉</b></div><div class="boot">Initializing <b>${escapeHtml(project)}</b> Community Terminal...<br>Loading ${escapeHtml(ecosystem)}...<br>Loading available project modules...</div><div class="quick-label">[ QUICK ACCESS TO TERMINALS ]</div><div class="quick">${quickHtml}</div><div class="available-label">[ AVAILABLE TERMINALS ]</div><div class="terminal-list">${moduleHtml}</div><div class="prompt">${escapeHtml(promptUser)}@${escapeHtml(promptHost)}:~$ <span class="cursor"></span></div><div class="preview-footer"><div class="footer-version">${escapeHtml(project)} Community Terminal</div><div class="powered-by"><span class="orange">[ INFO ]</span> Independent community tools for ${escapeHtml(ecosystem)}.</div><div class="footer-copy">Independently built by Gokalp <a href="https://x.com/Gokalp8339" target="_blank" rel="noopener noreferrer">𝕏 @Gokalp8339</a><br>Not affiliated with or endorsed by the official ${escapeHtml(project)} team.<br>Built for the ${escapeHtml(ecosystem)} community.</div></div></main></body></html>`;
  const previewWindow=window.open("","_blank");
  if(!previewWindow){status.textContent="[ ERROR ] Preview window was blocked by the browser.";return;}
  previewWindow.document.open();previewWindow.document.write(html);previewWindow.document.close();
}

document.querySelector("#open-preview").addEventListener("click",()=>{openLandingPreview().catch(err=>{status.textContent=`[ ERROR ] ${err.message}`})});


let autoSaveToastTimer=null;
function showAutoSaveToast(){
  const toast=document.querySelector("#auto-save-toast");
  if(!toast)return;
  toast.classList.add("show");
  clearTimeout(autoSaveToastTimer);
  autoSaveToastTimer=setTimeout(()=>toast.classList.remove("show"),3200);
}

let lastBuild={url:"",filename:"",project:null,fingerprint:""};
function downloadBuild(){if(!lastBuild.url)return;const a=document.createElement("a");a.href=lastBuild.url;a.download=lastBuild.filename;a.click()}
function projectNftOnlyProfile(project){const f=project?.features||{};return Boolean(f.nftTerminal&&project?.nftContract&&!f.whaleTracker&&!f.memeIntel&&!f.communityPulse&&!f.timeline&&!f.liveMarket)}
function enabledModuleNames(project){if(projectNftOnlyProfile(project))return ["NFT"];const names=["LANDING"];if(project.features?.whaleTracker)names.push("WHALES");if(project.features?.memeIntel)names.push("INTEL");if(project.features?.nftTerminal&&project.nftContract)names.push("NFT");if(project.features?.communityPulse)names.push("PULSE");if(project.features?.timeline)names.push("TIMELINE");return names}
function projectPublicEntryUrl(value,project=lastBuild.project){const url=String(value||"").trim();if(!url||!projectNftOnlyProfile(project))return url;try{const parsed=new URL(url);parsed.pathname=project?.nft?.mode==="terminal"?"/nft/terminal":"/nft";parsed.search="";parsed.hash="";return parsed.href.replace(/\/$/,"")}catch{return url}}
function deploymentCommands(kind){const p=lastBuild.project||{};const folder=(String(p.projectName||"PROJECT").toUpperCase().replace(/[^A-Z0-9]+/g,"_")+"_Community_Terminal");const repo=(String(p.projectName||"project").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")+"-community-terminal");if(kind==="local")return `cd ${folder}\nnpm install\nnpm test\nnpm start`;if(kind==="github")return `git init\ngit add .\ngit commit -m "Initial ${p.projectName||"Community"} Community Terminal"\ngit branch -M main\ngit remote add origin https://github.com/YOUR-USERNAME/${repo}.git\ngit push -u origin main`;return `1. Push the generated root folder to GitHub.\n2. In Render choose New → Blueprint.\n3. Select the repository and main branch.\n4. Keep Blueprint Path as render.yaml.\n5. Confirm the Free plan before deployment.\n6. After it is Live, run:\n\nnpm run test:deployed -- https://YOUR-TERMINAL.onrender.com`; }
async function copyDeployment(kind){const text=deploymentCommands(kind);document.querySelector("#deployment-command-preview").textContent=text;try{await navigator.clipboard.writeText(text);status.textContent="[ COPIED ] Deployment commands copied."}catch{status.textContent="[ READY ] Commands shown below; copy them manually."}}
function setBuiltLiveUrl(value){
  const url=projectPublicEntryUrl(value);
  const link=document.querySelector("#built-terminal-url");
  if(url){
    link.textContent=url;link.href=url;link.target="_blank";link.rel="noopener noreferrer";link.removeAttribute("aria-disabled");
  }else{
    link.textContent="Not deployed yet";link.removeAttribute("href");link.removeAttribute("target");link.setAttribute("aria-disabled","true");
  }
}
function resetQuickDeployUi(){
  const box=document.querySelector("#quick-deploy-confirmation"),input=document.querySelector("#quick-deploy-confirmation-text"),confirm=document.querySelector("#confirm-deploy-built-terminal"),deploy=document.querySelector("#deploy-built-terminal");
  box.hidden=true;input.value="";document.querySelector("#quick-deploy-phrase").textContent="";confirm.hidden=true;confirm.disabled=true;deploy.hidden=false;deploy.disabled=false;
}
function showBuildComplete(project){const prior=readDeployments()[deploymentId()]||{};const mode=document.querySelector("#connected-release-mode");mode.value=(prior.connected?.serviceId||prior.publicUrl)?"update":(mode.value==="update"?"update":"create");document.querySelector("#built-project").textContent=`${String(project.projectName||"COMMUNITY").toUpperCase()} COMMUNITY TERMINAL`;document.querySelector("#built-modules").innerHTML=enabledModuleNames(project).map(x=>`<span>${x}</span>`).join("");setBuiltLiveUrl(prior.publicUrl||"");resetQuickDeployUi();document.querySelector("#quick-deploy-state").textContent=integrationReady?`[ READY ] Generated package is ready. ${mode.value==="create"?"First deployment":"Existing deployment update"} path selected.`:"[ READY ] Generated package is ready. Connected deployment is unavailable; ZIP download remains available.";document.querySelector("#build-complete").showModal()}

function mintSignature(schedule){return schedule&&schedule.ok?`${val("nftContract")}|${val("nftCollectionName")}|${val("nftSupply")}|${schedule.mode||"single"}|${schedule.iso}|${schedule.endIso||""}|${schedule.timeZone}|${schedule.price||""}|${schedule.limit||""}|${JSON.stringify((schedule.phases||[]).map(x=>[x.label,x.name,x.startsAt,x.endsAt,x.price,x.limit,x.timezone]))}`:""}
function closeNftMintConfirmation(result){const dialog=document.querySelector("#nft-mint-confirm");if(dialog.open)dialog.close();const resolve=nftMintConfirmResolver;nftMintConfirmResolver=null;if(resolve)resolve(result)}
function confirmNftMintSchedule(schedule){
  const dialog=document.querySelector("#nft-mint-confirm"),state=document.querySelector("#nft-mint-confirm-state"),diff=schedule.instant.getTime()-Date.now();
  document.querySelector("#nft-mint-confirm-value").textContent=schedule.mode==="multiple"?`${schedule.phases.length} PHASES · ${formatMintForReview(schedule)} → ${humanDateTime(schedule.endInstant,schedule.phases.at(-1).timezone)}`:formatMintForReview(schedule);document.querySelector("#nft-local-time-value").textContent=formatComputerTime();document.querySelector("#nft-mint-countdown-value").textContent=diff<0?`Mint occurred ${relativeMintTime(schedule)}`:`Mint begins in ${relativeMintTime(schedule)}`;state.className="";
  if(diff<0){state.textContent=schedule.mode==="multiple"?"[ WARN ] This mint schedule has already started.":"[ WARN ] This mint time is already in the past.";state.classList.add("warn")}else if(diff<60*60*1000){state.textContent="[ CHECK ] Mint starts in less than 1 hour.";state.classList.add("warn")}else{state.textContent=schedule.mode==="multiple"?"[ OK ] Multi-phase mint schedule is configured in the future.":"[ OK ] Mint is scheduled in the future.";state.classList.add("pass")}
  dialog.showModal();return new Promise(resolve=>{nftMintConfirmResolver=resolve});
}
async function requestMintConfirmation(){
  if(!checked("nftTerminal"))return false;
  if(!isEvmAddress(val("nftContract"))){confirmedMintSignature="";status.textContent="[ WAIT ] NFT Contract Address is required before confirming NFT mint details.";syncMintConfirmationState();form.elements.nftContract?.focus();return false}
  const schedule=syncNftMintSchedule();if(schedule.ok&&schedule.mode==="terminal"){confirmedMintSignature="";status.textContent="[ READY ] Terminal Only selected · mint confirmation skipped.";syncMintConfirmationState();return true}if(!schedule.ok||schedule.disabled){status.textContent=`[ WAIT ] ${schedule.error||"Complete valid NFT mint details."}`;if(nftMintMode()==="single"){if(!val("nftMintPrice"))form.elements.nftMintPrice?.focus();else if(!val("nftMintLimit"))form.elements.nftMintLimit?.focus();}return false;}const sig=mintSignature(schedule);if(confirmedMintSignature===sig)return true;const confirmed=await confirmNftMintSchedule(schedule);if(confirmed){confirmedMintSignature=sig;status.textContent="[ CONFIRMED ] NFT mint details confirmed.";syncMintConfirmationState();return true}status.textContent="[ EDIT ] Review the NFT mint details.";setTimeout(()=>{if(nftMintMode()==="multiple")document.querySelector("#nft-phase-list input")?.focus();else form.elements.nftMintDate?.focus()},0);syncMintConfirmationState();return false}
function closePastScheduleWarning(edit){const dialog=document.querySelector("#nft-past-warning");if(dialog?.open)dialog.close();if(edit)setTimeout(()=>{if(nftMintMode()==="multiple")document.querySelector("#nft-phase-list [data-phase-field=startDate]")?.focus();else form.elements.nftMintDate?.focus()},0)}
function warnIfPastSchedule(){
  if(!checked("nftTerminal"))return;const schedule=nftMintSchedule();if(!schedule.ok||schedule.mode==="terminal"||!schedule.instant||schedule.instant.getTime()>=Date.now())return;
  const sig=mintSignature(schedule);if(!sig||pastScheduleWarningSignature===sig)return;pastScheduleWarningSignature=sig;
  document.querySelector("#nft-past-warning-mint").textContent=formatMintForReview(schedule);document.querySelector("#nft-past-warning-now").textContent=formatComputerTime();const dialog=document.querySelector("#nft-past-warning");if(dialog&&!dialog.open)dialog.showModal();
}
function invalidateMintConfirmation(){confirmedMintSignature="";syncNftMintSchedule();syncMintConfirmationState();setTimeout(warnIfPastSchedule,0)}
document.querySelector("#nft-mint-edit").addEventListener("click",()=>closeNftMintConfirmation(false));document.querySelector("#nft-mint-confirm-close").addEventListener("click",()=>closeNftMintConfirmation(false));document.querySelector("#nft-mint-proceed").addEventListener("click",()=>closeNftMintConfirmation(true));document.querySelector("#nft-mint-confirm").addEventListener("cancel",event=>{event.preventDefault();closeNftMintConfirmation(false)});
document.querySelector("#confirm-nft-mint-details").addEventListener("click",()=>requestMintConfirmation());
document.querySelector("#nft-past-warning-edit").addEventListener("click",()=>closePastScheduleWarning(true));document.querySelector("#nft-past-warning-close").addEventListener("click",()=>closePastScheduleWarning(true));document.querySelector("#nft-past-warning-keep").addEventListener("click",()=>closePastScheduleWarning(false));document.querySelector("#nft-past-warning").addEventListener("cancel",event=>{event.preventDefault();closePastScheduleWarning(true)});
const mintScheduleBlock=document.querySelector("#nft-mint-schedule");
mintScheduleBlock.addEventListener("input",invalidateMintConfirmation);
mintScheduleBlock.addEventListener("change",invalidateMintConfirmation);
for(const name of ["nftCollectionName","nftSupply"]){form.elements[name]?.addEventListener("input",()=>{confirmedMintSignature="";syncMintConfirmationState()});form.elements[name]?.addEventListener("change",()=>{confirmedMintSignature="";syncMintConfirmationState()})}

form.addEventListener("submit",async e=>{
  e.preventDefault();
  if(checked("nftTerminal")){
    if(!isEvmAddress(val("nftContract"))){confirmedMintSignature="";status.textContent="[ WAIT ] NFT Contract Address is required while NFT Terminal is enabled.";syncMintConfirmationState();form.elements.nftContract?.focus();return}
    const schedule=syncNftMintSchedule();if(!schedule.ok||schedule.disabled){status.textContent=`[ WAIT ] ${schedule.error||"Complete the NFT mint schedule."}`;return}
    if(schedule.mode!=="terminal"&&confirmedMintSignature!==mintSignature(schedule)){status.textContent="[ WAIT ] Confirm NFT Mint Details before creating the terminal.";syncMintConfirmationState();document.querySelector("#confirm-nft-mint-details")?.focus();return}
  }
  status.textContent="[ SAVE ] Saving latest configuration..."; button.disabled=true;
  try{
    const project=await payload();saveProjectSnapshot(project);status.textContent="[ BUILD ] Latest configuration saved · generating unified terminal package...";
    const response=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(project)});
    if(!response.ok){const x=await response.json();throw new Error(x.error||"Generation failed")}
    const blob=await response.blob(); const disposition=response.headers.get("content-disposition")||""; const filename=/filename="([^"]+)"/.exec(disposition)?.[1]||"Community_Terminal.zip"; const fingerprint=response.headers.get("x-ctb-build-fingerprint")||"";
    if(lastBuild.url)URL.revokeObjectURL(lastBuild.url);lastBuild={url:URL.createObjectURL(blob),filename,project,fingerprint};const autoSaved=noteGenerated(project,fingerprint);status.textContent=`[ DONE ] Community Terminal created${autoSaved?" · project auto-saved":""} · ready to deploy`;if(autoSaved)showAutoSaveToast();showBuildComplete(project);
  }catch(err){status.textContent=`[ ERROR ] ${err.message}`}finally{button.disabled=false}
});
document.querySelector("#close-build-complete").addEventListener("click",()=>document.querySelector("#build-complete").close());
document.querySelector("#close-build-complete-action").addEventListener("click",()=>document.querySelector("#build-complete").close());
document.querySelector("#download-built-terminal")?.addEventListener("click",()=>{downloadBuild();status.textContent="[ DOWNLOAD ] Generated terminal ZIP downloaded."});


async function syncBuilderRuntime(){
  try{
    const response=await fetch("/api/builder-status",{cache:"no-store"});
    if(!response.ok)return;
    const info=await response.json();
    const state=document.querySelector(".window-state");
    if(state)state.textContent=`${String(info.mode||"local").toUpperCase()} // READY`;
  }catch{}
}
syncBuilderRuntime();


// Chapter 13B + 14A/14B: server-side integrations, readiness, and protected one-time release authorization.
let integrationReady=false;
let releaseCanDeploy=false;
let releaseAuthorization=null;
function showReleaseAlert(message,kind="warn"){const alert=document.querySelector("#release-alert");alert.textContent=message;alert.className=`release-alert ${kind}`;alert.hidden=false;clearTimeout(showReleaseAlert.timer);showReleaseAlert.timer=setTimeout(()=>{alert.hidden=true},4500)}
function connectedNames(){const base=slugify(val("projectName"))||"community-terminal";return {repo:document.querySelector("#connected-repo-name").value.trim()||`${base}-community-terminal`,service:document.querySelector("#connected-service-name").value.trim()||`${base}-community-terminal`}}
function currentAcceptance(){return readDeployments()[deploymentId()]?.acceptance?.ok===true}
function currentBuildFingerprint(project){try{if(lastBuild.project&&lastBuild.fingerprint&&JSON.stringify(lastBuild.project)===JSON.stringify(project))return lastBuild.fingerprint}catch{}const stored=activeProjectId?readProjects()[activeProjectId]:null;return String(stored?.generatedFingerprint||"")}
function releaseMode(){return document.querySelector("#connected-release-mode").value==="create"?"create":"update"}
function clearReleaseAuthorization(message=""){
  releaseAuthorization=null;
  const box=document.querySelector("#release-confirmation"),input=document.querySelector("#release-confirmation-text"),phrase=document.querySelector("#release-confirmation-phrase"),deploy=document.querySelector("#connected-deploy");
  box.hidden=true;input.value="";phrase.textContent="";deploy.disabled=true;
  if(message)document.querySelector("#connected-result").textContent=message;
}
async function protectedReleaseInput(){const project=await payload(),names=connectedNames();return {project,repoName:names.repo,serviceName:names.service,visibility:document.querySelector("#connected-private").checked?"private":"public",releaseMode:releaseMode(),generatedFingerprint:currentBuildFingerprint(project),publicAcceptance:currentAcceptance()}}
function quickDeployInput(){const project=lastBuild.project||{};const base=slugify(project.projectName);if(!base)throw new Error("Generated project name is missing; generate the terminal again before deployment.");const target=`${base}-community-terminal`;const prior=readDeployments()[deploymentId()]||{};const mode=releaseMode();return {project,repoName:target,serviceName:target,visibility:document.querySelector("#connected-private").checked?"private":"public",releaseMode:mode,generatedFingerprint:String(lastBuild.fingerprint||""),publicAcceptance:prior.acceptance?.ok===true}}
function updateProtectedButtons(){
  const prepare=document.querySelector("#prepare-release"),deploy=document.querySelector("#connected-deploy"),typed=document.querySelector("#release-confirmation-text").value;
  prepare.disabled=!(integrationReady&&releaseCanDeploy);
  deploy.disabled=!(integrationReady&&releaseCanDeploy&&releaseAuthorization&&typed===releaseAuthorization.confirmation);
}
async function refreshIntegrations(manual=false){const label=document.querySelector("#integration-state"),out=document.querySelector("#connected-result"),checkButton=document.querySelector("#refresh-integrations");label.textContent="CHECKING";label.classList.remove("live");clearReleaseAuthorization();checkButton.disabled=true;checkButton.textContent="CHECKING...";if(manual)out.textContent="[ CHECKING ] Testing GitHub and Render server configuration...";try{const response=await fetch("/api/integrations",{cache:"no-store"});const data=await response.json();if(!response.ok||!data.ok)throw new Error(data.error||`Connection check returned HTTP ${response.status}`);integrationReady=Boolean(data.enabled&&data.github?.verified&&data.render?.verified);label.textContent=integrationReady?"CONNECTED":data.enabled?"INCOMPLETE":"DISABLED";label.classList.toggle("live",integrationReady);releaseCanDeploy=false;const checkedAt=new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit",second:"2-digit"});out.textContent=[`[ CHECKED ] Connection check completed at ${checkedAt}`,`[ ${data.enabled?"OK":"OFF"} ] Connected deployments ${data.enabled?"enabled":"disabled"}`,`[ ${data.releaseActionsEnabled?"PASS":"LOCKED"} ] Protected release policy`,`[ ${data.github?.verified?"PASS":data.github?.configured?"FAIL":"WAIT"} ] GitHub credential${data.github?.verified&&data.github?.login?` · ${data.github.login}`:""}${data.github?.error?` · ${data.github.error}`:""}`,`[ ${data.render?.verified?"PASS":data.render?.configured?"FAIL":"WAIT"} ] Render credential + workspace${data.render?.verified&&data.render?.workspaceName?` · ${data.render.workspaceName}`:""}${data.render?.error?` · ${data.render.error}`:""}`,`[ SAFE ] Secrets exposed to browser: ${data.secretsExposed?"YES":"NO"}`].join("\n");updateProtectedButtons();}catch(error){integrationReady=false;label.textContent="UNAVAILABLE";clearReleaseAuthorization();out.textContent=`[ FAIL ] ${error.message}`}finally{checkButton.disabled=false;checkButton.textContent="CHECK CONNECTIONS"}return integrationReady}
function renderReleaseReadiness(data){
  const state=document.querySelector("#release-state"),out=document.querySelector("#release-result"),checks=document.querySelector("#release-checks");
  clearReleaseAuthorization();
  state.textContent=data.state||"NOT READY";state.classList.toggle("live",Boolean(data.ready&&data.canRelease));state.classList.toggle("locked",Boolean(data.ready&&!data.canRelease));
  checks.innerHTML=(data.checks||[]).map(item=>`<div title="${String(item.detail||"").replace(/"/g,"&quot;")}"><span>${item.label}</span><b class="${item.ready?"pass":"fail"}">${item.ready?"READY":"BLOCKED"}</b></div>`).join("");
  releaseCanDeploy=Boolean(data.canRelease);updateProtectedButtons();
  const lines=[`[ ${data.ready?"READY":"BLOCKED"} ] Release prerequisites ${data.ready?"passed":"incomplete"}.`,`[ ${data.releaseControlEnabled?"ENABLED":"LOCKED"} ] Release action policy`,`[ ${data.connectedDeploymentsEnabled?"ON":"OFF"} ] Connected deployment service`,`[ SAFE ] Secrets exposed to browser: ${data.secretsExposed?"YES":"NO"}`,`[ TIME ] ${data.checkedAt||nowIso()}`];
  out.textContent=lines.join("\n");out.className=`deployment-result ${data.ready?"pass":"fail"}`;
}
async function checkReleaseReadiness(){
  const btn=document.querySelector("#check-release-readiness"),out=document.querySelector("#release-result"),state=document.querySelector("#release-state");
  btn.disabled=true;state.textContent="CHECKING";state.classList.remove("live","locked");releaseCanDeploy=false;clearReleaseAuthorization();out.className="deployment-result";out.textContent="[ CHECKING ] Evaluating release prerequisites on the builder server...";
  try{const input=await protectedReleaseInput();const response=await fetch("/api/release-readiness",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(input)});const data=await response.json();if(!response.ok||!data.ok)throw new Error(data.error||"Release readiness check failed");renderReleaseReadiness(data);status.textContent=data.canRelease?"[ READY ] Release is eligible for protected authorization.":data.ready?"[ LOCKED ] Prerequisites passed; server release policy remains locked.":"[ BLOCKED ] Complete the release prerequisites shown above."}catch(error){state.textContent="UNAVAILABLE";out.className="deployment-result fail";out.textContent=`[ FAIL ] ${error.message}`;status.textContent=`[ ERROR ] ${error.message}`}finally{btn.disabled=false}}
async function prepareProtectedRelease(){
  const button=document.querySelector("#prepare-release"),out=document.querySelector("#connected-result");
  if(!integrationReady||!releaseCanDeploy)return;
  button.disabled=true;clearReleaseAuthorization();out.textContent="[ PREPARE ] Requesting one-time server authorization for this exact release target...";
  try{const input=await protectedReleaseInput();const response=await fetch("/api/release-prepare",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(input)});const data=await response.json();if(!response.ok||!data.ok)throw new Error(data.error||"Release authorization failed");releaseAuthorization=data;document.querySelector("#release-confirmation").hidden=false;document.querySelector("#release-confirmation-phrase").textContent=data.confirmation;out.textContent=["[ ARMED ] Protected release authorization prepared.",`[ ACTION ] ${String(data.releaseMode||"").toUpperCase()}`,`[ TARGET ] ${data.target.repoName} / ${data.target.serviceName}`,`[ EXPIRES ] ${data.expiresAt}`,"[ ONE-TIME ] YES",`[ ATTEMPTS ] ${data.maxConfirmationAttempts||3} confirmation attempts`,`[ SAFE ] Credentials remain server-side.`].join("\n");status.textContent="[ ARMED ] Type the exact confirmation phrase to enable publish & deploy.";updateProtectedButtons();}catch(error){clearReleaseAuthorization();out.textContent=`[ BLOCKED ] ${error.message}`;status.textContent=`[ ERROR ] ${error.message}`}finally{updateProtectedButtons()}}
async function verifyConfirmationAttempt(){
  if(!releaseAuthorization)return;
  const input=document.querySelector("#release-confirmation-text"),typed=input.value;
  if(typed===releaseAuthorization.confirmation){showReleaseAlert("Confirmation phrase matched. Publish & deploy is enabled.","pass");updateProtectedButtons();return;}
  try{
    const response=await fetch("/api/release-confirmation-attempt",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({releaseAuthorization:releaseAuthorization.authorizationId,confirmation:typed})});
    const data=await response.json();if(!response.ok||!data.ok)throw new Error(data.error||"Confirmation validation failed");
    if(data.locked){showReleaseAlert("Confirmation failed 3 times. Release authorization was locked. Prepare the release again.","fail");clearReleaseAuthorization("[ LOCKED ] Three incorrect confirmation attempts. Prepare the release again.");updateProtectedButtons();return;}
    showReleaseAlert(`Confirmation phrase incorrect. ${data.attemptsRemaining} attempt${data.attemptsRemaining===1?"":"s"} remaining.`,"fail");
  }catch(error){showReleaseAlert(error.message,"fail");}
  updateProtectedButtons();
}
async function connectedDeployProject(){
  if(!integrationReady||!releaseCanDeploy||!releaseAuthorization)return;
  const button=document.querySelector("#connected-deploy"),out=document.querySelector("#connected-result"),confirmation=document.querySelector("#release-confirmation-text").value;
  button.disabled=true;out.classList.remove("release-progress");out.textContent="[ RELEASE ] Consuming one-time authorization, publishing GitHub tree, and starting Render deployment...";
  try{
    const input=await protectedReleaseInput();
    const response=await fetch("/api/deploy-connected",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...input,releaseAuthorization:releaseAuthorization.authorizationId,confirmation})});
    const data=await response.json();if(!response.ok)throw new Error(data.error||"Protected release failed");
    renderProtectedRelease(out,data,"Deploying the website...");
    showDeploymentToast("Your website is being deployed. Please wait until the deployment completes successfully before making further release changes.",{duration:5000});
    const all=readDeployments(),id=deploymentId(),prior=all[id]||{};all[id]={...prior,githubUrl:data.github.repoUrl,publicUrl:data.render.publicUrl||prior.publicUrl||"",connected:{serviceId:data.render.serviceId,deployId:data.render.deployId||null,commitSha:data.github.commitSha,startedAt:data.generatedAt,releaseMode:data.releaseMode},updatedAt:nowIso()};localStorage.setItem(DEPLOYMENT_KEY,JSON.stringify(all));renderDeploymentRecord(all[id]);
    status.textContent="[ DEPLOYING ] Deployment started. Waiting for Render to report the final state.";
    pollRenderDeployment(data,out);
  }catch(error){out.classList.remove("release-progress");out.textContent=`[ FAIL ] ${error.message}`;status.textContent=`[ ERROR ] ${error.message}`}finally{clearReleaseAuthorization();updateProtectedButtons()}
}

function showDeploymentToast(message,{state="pending",duration=5200}={}){
  const toast=document.querySelector("#deployment-toast");if(!toast)return;
  toast.className=`deployment-toast ${state==="success"?"success":state==="fail"?"fail":""}`.trim();
  const strong=toast.querySelector("strong"),span=toast.querySelector("span");
  strong.textContent=state==="success"?"[ DEPLOYMENT SUCCESSFUL ]":state==="fail"?"[ DEPLOYMENT FAILED ]":"[ DEPLOYMENT STARTED ]";
  span.textContent=message;toast.hidden=false;
  clearTimeout(showDeploymentToast.timer);showDeploymentToast.timer=setTimeout(()=>{toast.hidden=true},duration);
}

function showDeploymentSuccessDialog(publicUrl){
  const dialog=document.querySelector("#deployment-success-dialog");if(!dialog)return;
  const link=document.querySelector("#deployment-success-url"),openLink=document.querySelector("#deployment-success-open");
  const url=projectPublicEntryUrl(publicUrl);
  link.textContent=url||"Public URL unavailable";
  if(url){
    link.href=url;link.target="_blank";link.rel="noopener noreferrer";link.removeAttribute("aria-disabled");
    openLink.href=url;openLink.target="_blank";openLink.rel="noopener noreferrer";openLink.removeAttribute("aria-disabled");
  }else{
    link.removeAttribute("href");link.removeAttribute("target");link.setAttribute("aria-disabled","true");
    openLink.removeAttribute("href");openLink.removeAttribute("target");openLink.setAttribute("aria-disabled","true");
  }
  if(!dialog.open)dialog.showModal();
}

async function waitForPublicTerminalReady(publicUrl,{timeoutMs=90000,intervalMs=3000}={}){
  const url=String(publicUrl||"").trim();if(!url)return false;
  const expected={whales:Boolean(form.elements.whaleTracker.checked),intel:Boolean(form.elements.memeIntel.checked),nft:Boolean(form.elements.nftTerminal.checked),pulse:Boolean(form.elements.communityPulse.checked),timeline:Boolean(form.elements.timeline.checked)};
  const started=Date.now();
  while(Date.now()-started<timeoutMs){
    try{
      const response=await fetch("/api/verify-terminal",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url,expected})});
      const data=await response.json().catch(()=>({}));
      if(response.ok&&data.ok)return true;
    }catch{}
    await new Promise(resolve=>setTimeout(resolve,intervalMs));
  }
  return false;
}
function releaseStatusClass(value){const s=String(value||"").toLowerCase();if(["live","successful","success"].includes(s))return "status-success";if(s.includes("fail")||s.includes("cancel"))return "status-fail";return "status-pending"}
function renderProtectedRelease(out,data,statusText){
  const rows=[
    {start:"[ PROTECTED RELEASE STARTED ]"},
    {key:"ACTION",value:String(data.releaseMode||"").toUpperCase(),cls:"action"},
    {key:"GITHUB",value:data.github.repoUrl,cls:"url"},
    {key:"COMMIT",value:data.github.commitSha,cls:"commit"},
    {key:"FILES",value:String(data.github.fileCount)},
    {key:"RENDER",value:data.render.serviceName},
    {key:"SERVICE ID",value:data.render.serviceId||"pending"},
    {key:"PUBLIC URL",value:data.render.publicUrl||"Render is assigning the URL",cls:"url"},
    {key:"STATUS",value:statusText||data.render.status||"deploying",cls:releaseStatusClass(statusText||data.render.status||"deploying")}
  ];
  out.textContent="";out.classList.add("release-progress");
  for(const row of rows){const line=document.createElement("span");line.className=`release-line${row.start?" release-start":""}`;if(row.start){line.textContent=row.start}else{const key=document.createElement("span"),value=document.createElement("span");key.className="release-key";key.textContent=`[ ${row.key} ] `;value.className=`release-value ${row.cls||""}`.trim();value.textContent=row.value;line.append(key,value)}out.append(line)}
}
async function pollRenderDeployment(data,out,{onLive}={}){
  const serviceId=data.render.serviceId;if(!serviceId)return;
  const started=Date.now(),timeoutMs=10*60*1000,intervalMs=5000;
  while(Date.now()-started<timeoutMs){
    await new Promise(resolve=>setTimeout(resolve,intervalMs));
    try{
      const response=await fetch(`/api/render-deploy-status?serviceId=${encodeURIComponent(serviceId)}`,{cache:"no-store"});
      const state=await response.json();if(!response.ok||!state.ok)throw new Error(state.error||"Render deployment status unavailable");
      if(state.success){const liveUrl=state.publicUrl||data.render.publicUrl||"";if(liveUrl)data.render.publicUrl=liveUrl;renderProtectedRelease(out,data,"finalizing");status.textContent="[ FINALIZING ] Render deployment completed. Waiting for the public terminal to become reachable...";const ready=await waitForPublicTerminalReady(liveUrl);if(!ready){renderProtectedRelease(out,data,"readiness pending");status.textContent="[ WAIT ] Render finished, but the public terminal is not fully reachable yet. CTB will not mark the release complete prematurely.";continue;}renderProtectedRelease(out,data,"live");status.textContent="[ LIVE ] Deployment successful. Run Public Acceptance to verify the public terminal.";if(onLive)onLive(liveUrl);showDeploymentSuccessDialog(liveUrl);return {success:true,publicUrl:liveUrl}}
      if(state.failed){renderProtectedRelease(out,data,state.status||"failed");status.textContent="[ FAIL ] Render deployment failed. Review the Render deployment logs before trying again.";showDeploymentToast("The deployment did not complete successfully. Review the Render logs before trying again.",{state:"fail",duration:8000});return {success:false,failed:true}}
      renderProtectedRelease(out,data,"Deploying the website...");
    }catch(error){console.warn("Render deployment status check failed:",error.message)}
  }
  renderProtectedRelease(out,data,"status unknown");status.textContent="[ WAIT ] Deployment status could not be confirmed automatically. Check Render before making another release.";showDeploymentToast("Deployment status could not be confirmed automatically. Check Render before making another release.",{state:"fail",duration:8000});return {success:false,unknown:true};
}

async function prepareQuickDeploy(){
  const state=document.querySelector("#quick-deploy-state"),deploy=document.querySelector("#deploy-built-terminal");
  if(!lastBuild.project||!lastBuild.fingerprint){state.textContent="[ BLOCKED ] Generate the current terminal before deployment.";return}
  deploy.disabled=true;state.textContent="[ CHECKING ] Verifying GitHub, Render, build fingerprint, and release policy...";
  try{
    if(!integrationReady)await refreshIntegrations(false);
    if(!integrationReady)throw new Error("Connected deployment is not configured on this builder. Download the ZIP or configure GitHub + Render server credentials.");
    const input=quickDeployInput();
    const response=await fetch("/api/release-readiness",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(input)});
    const readiness=await response.json();if(!response.ok||!readiness.ok)throw new Error(readiness.error||"Release readiness check failed");renderReleaseReadiness(readiness);
    if(!readiness.canRelease){const blocked=(readiness.checks||[]).filter(x=>!x.ready).map(x=>x.label).join(", ");throw new Error(`Release is blocked${blocked?`: ${blocked}`:""}.`)}
    const prepared=await fetch("/api/release-prepare",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(input)});
    const data=await prepared.json();if(!prepared.ok||!data.ok)throw new Error(data.error||"Release authorization failed");
    releaseAuthorization=data;document.querySelector("#quick-deploy-phrase").textContent=data.confirmation;document.querySelector("#quick-deploy-confirmation").hidden=false;document.querySelector("#confirm-deploy-built-terminal").hidden=false;deploy.hidden=true;state.textContent=`[ ARMED ] ${String(data.releaseMode||"").toUpperCase()} release prepared. Type the confirmation phrase to deploy.`;document.querySelector("#quick-deploy-confirmation-text").focus();
  }catch(error){state.textContent=`[ BLOCKED ] ${error.message}`;deploy.disabled=false}
}
async function confirmQuickDeploy(){
  const state=document.querySelector("#quick-deploy-state"),confirm=document.querySelector("#confirm-deploy-built-terminal"),out=document.querySelector("#connected-result"),typed=document.querySelector("#quick-deploy-confirmation-text").value;
  if(!releaseAuthorization||typed!==releaseAuthorization.confirmation)return;
  confirm.disabled=true;state.textContent="[ DEPLOYING ] Publishing GitHub tree and starting Render deployment...";
  try{
    const input=quickDeployInput();
    const response=await fetch("/api/deploy-connected",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...input,releaseAuthorization:releaseAuthorization.authorizationId,confirmation:typed})});
    const data=await response.json();if(!response.ok)throw new Error(data.error||"Protected release failed");
    renderProtectedRelease(out,data,"Deploying the website...");showDeploymentToast("Your terminal is being deployed. CTB will return the live URL when Render reports it live.",{duration:5000});
    const all=readDeployments(),id=deploymentId(),prior=all[id]||{};all[id]={...prior,githubUrl:data.github.repoUrl,publicUrl:data.render.publicUrl||prior.publicUrl||"",connected:{serviceId:data.render.serviceId,deployId:data.render.deployId||null,commitSha:data.github.commitSha,startedAt:data.generatedAt,releaseMode:data.releaseMode},updatedAt:nowIso()};localStorage.setItem(DEPLOYMENT_KEY,JSON.stringify(all));renderDeploymentRecord(all[id]);
    if(data.render.publicUrl)setBuiltLiveUrl(data.render.publicUrl);state.textContent=`[ DEPLOYING ] ${data.render.publicUrl||"Render is assigning the public URL"}`;
    const finalState=await pollRenderDeployment(data,out,{onLive:url=>{setBuiltLiveUrl(url);state.textContent=`[ LIVE ] ${url}`;const saved=readDeployments();const rec=saved[id]||{};saved[id]={...rec,publicUrl:url,updatedAt:nowIso()};localStorage.setItem(DEPLOYMENT_KEY,JSON.stringify(saved));renderDeploymentRecord(saved[id])}});
    if(finalState?.success)state.textContent=`[ LIVE ] ${finalState.publicUrl||data.render.publicUrl||"Deployment successful"}`;
  }catch(error){state.textContent=`[ FAIL ] ${error.message}`;showDeploymentToast(error.message,{state:"fail",duration:8000})}finally{clearReleaseAuthorization();document.querySelector("#quick-deploy-confirmation").hidden=true;confirm.hidden=true;document.querySelector("#deploy-built-terminal").hidden=false;document.querySelector("#deploy-built-terminal").disabled=false}
}
function updateQuickDeployConfirmation(){const input=document.querySelector("#quick-deploy-confirmation-text"),confirm=document.querySelector("#confirm-deploy-built-terminal");confirm.disabled=!(releaseAuthorization&&input.value===releaseAuthorization.confirmation)}

function invalidateProtectedRelease(){if(releaseAuthorization)clearReleaseAuthorization("[ LOCKED ] Release target changed. Run CHECK RELEASE READINESS and PREPARE RELEASE again.");releaseCanDeploy=false;updateProtectedButtons()}
document.querySelector("#refresh-integrations").addEventListener("click",()=>refreshIntegrations(true));
document.querySelector("#check-release-readiness").addEventListener("click",checkReleaseReadiness);
document.querySelector("#prepare-release").addEventListener("click",prepareProtectedRelease);
document.querySelector("#connected-deploy").addEventListener("click",connectedDeployProject);
document.querySelector("#deploy-built-terminal").addEventListener("click",prepareQuickDeploy);
document.querySelector("#confirm-deploy-built-terminal").addEventListener("click",confirmQuickDeploy);
document.querySelector("#quick-deploy-confirmation-text").addEventListener("input",updateQuickDeployConfirmation);
document.querySelector("#release-confirmation-text").addEventListener("input",updateProtectedButtons);
document.querySelector("#release-confirmation-text").addEventListener("keydown",event=>{if(event.key==="Enter"){event.preventDefault();event.stopPropagation();verifyConfirmationAttempt();}});
for(const id of ["connected-repo-name","connected-service-name","connected-release-mode","connected-private"]){document.querySelector(`#${id}`).addEventListener("change",invalidateProtectedRelease)}
document.querySelector("#connected-repo-name").addEventListener("focus",()=>{const n=connectedNames();if(!document.querySelector("#connected-repo-name").value)document.querySelector("#connected-repo-name").value=n.repo});
document.querySelector("#connected-service-name").addEventListener("focus",()=>{const n=connectedNames();if(!document.querySelector("#connected-service-name").value)document.querySelector("#connected-service-name").value=n.service});


refreshIntegrations(false);
