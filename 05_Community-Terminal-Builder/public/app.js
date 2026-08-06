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
const STORAGE_KEY="ctb.projects.v1";
const SETTINGS_KEY="ctb.workspace.v1";
const SCHEMA_VERSION=1;
let activeProjectId="";
let persistedMascot=null;

function val(name){return form.elements[name]?.value?.trim()||""}
function checked(name){return Boolean(form.elements[name]?.checked)}
function shortAddress(value){return value&&value.length>20?`${value.slice(0,10)}...${value.slice(-8)}`:value||"NOT SET"}
function line(state,text){const tag=state==="ok"?" OK ":state==="skip"?"SKIP":state==="warn"?"WARN":"WAIT";return `[${tag}] ${text}`}
function slugify(value){return String(value||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
function nowIso(){return new Date().toISOString()}
function readProjects(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}")||{}}catch{return {}}}
function writeProjects(projects){localStorage.setItem(STORAGE_KEY,JSON.stringify(projects))}

async function mascotPayload(){
  const f=document.querySelector("#mascot").files[0];
  if(!f)return persistedMascot;
  const data=await new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(String(r.result).split(",")[1]);r.onerror=no;r.readAsDataURL(f)});
  return {dataBase64:data,extension:(f.name.split(".").pop()||"png").toLowerCase(),name:f.name};
}

async function payload(){return {
  projectName:val("projectName"),ticker:val("ticker"),version:val("version"),description:val("description"),promptUser:val("promptUser"),promptHost:val("promptHost"),ecosystem:val("ecosystem"),tokenContract:val("tokenContract"),nftContract:val("nftContract"),dexScreenerChainId:val("dexScreenerChainId"),blockscoutApiBase:val("blockscoutApiBase"),
  colors:{primary:val("primary"),accent:val("accent"),background:val("background"),panel:val("panel")},
  links:{home:val("home"),website:val("website"),x:val("x"),telegram:val("telegram"),explorer:val("explorer"),dexScreener:val("dexScreener"),openSea:val("openSea")},
  nft:{openSeaSlug:val("openSeaSlug")},
  features:{whaleTracker:checked("whaleTracker"),memeIntel:checked("memeIntel"),nftTerminal:checked("nftTerminal"),liveMarket:checked("liveMarket")},
  mascot:await mascotPayload()
};}

function configurationReady(){return Boolean(val("projectName")&&val("ticker")&&isEvmAddress(val("tokenContract"))&&(!checked("nftTerminal")||isEvmAddress(val("nftContract"))))}
function syncColorLabels(){document.querySelectorAll('.color-field input[type="color"]').forEach(input=>{const code=input.parentElement.querySelector("code");if(code)code.textContent=input.value.toLowerCase()})}
function updateWorkspaceStatus(){
  const name=val("projectName");
  currentProjectLabel.textContent=activeProjectId?(name||activeProjectId).toUpperCase():(name?`${name.toUpperCase()} // UNSAVED`:"UNSAVED PROJECT");
  const ready=configurationReady();
  projectStateLabel.textContent=ready?"READY":"DRAFT";
  projectStateLabel.classList.toggle("ready",ready);
}
function update(){
  syncColorLabels();
  const project=val("projectName"); const ticker=val("ticker"); const contract=val("tokenContract");
  const nftEnabled=checked("nftTerminal"); const nftContract=val("nftContract"); const requiredReady=configurationReady();
  const modules=[checked("whaleTracker")?"/whales":null,checked("memeIntel")?"/intel":null,nftEnabled?"/nft":null].filter(Boolean);
  const mascot=document.querySelector("#mascot").files[0];
  preview.textContent=[
    line(project?"ok":"wait",project?`Project identity: ${project.toUpperCase()} (${ticker||"ticker pending"})`:"Project identity required"),
    line(contract?"ok":"wait",`Token contract: ${shortAddress(contract)}`),
    line(checked("liveMarket")?"ok":"skip",checked("liveMarket")?`Landing market data: ${val("dexScreenerChainId")||"chain pending"}`:"Landing market data disabled"),
    line(checked("whaleTracker")?"ok":"skip",checked("whaleTracker")?"Whale Tracker mounted at /whales":"Whale Tracker excluded"),
    line(checked("memeIntel")?"ok":"skip",checked("memeIntel")?"Meme Intel mounted at /intel":"Meme Intel excluded"),
    line(nftEnabled?(nftContract?"ok":"warn"):"skip",nftEnabled?(nftContract?"NFT Terminal mounted at /nft":"NFT enabled — contract required"):"NFT Terminal excluded"),
    line(mascot||persistedMascot?"ok":"skip",mascot?`Brand asset: ${mascot.name}`:persistedMascot?`Brand asset: ${persistedMascot.name||"saved mascot"}`:"Using default terminal asset"),
    "",`PROFILE     ${project?slugify(project):"pending"}`,`VERSION     ${val("version")||"1.0.0"}`,`ECOSYSTEM   ${val("ecosystem")||"NOT SET"}`,`THEME       ${val("primary")} / ${val("accent")}`,`ROUTES      /${modules.length?`, ${modules.join(", ")}`:""}`,"",
    requiredReady?line("ok","Configuration valid — package ready to generate"):line("wait","Complete required configuration")
  ].join("\n");
  readiness.textContent=requiredReady?"READY":"WAITING"; readiness.classList.toggle("ready",requiredReady); updateWorkspaceStatus();
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
  if(!address)return showContractCheck("","[ WAIT ] Enter a 42-character 0x contract address.");
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

const mascotInput=document.querySelector("#mascot");
const mascotFileName=document.querySelector("#mascot-file-name");
function syncMascotFileName(){mascotFileName.textContent=mascotInput.files[0]?.name||persistedMascot?.name||"No file selected"}
mascotInput.addEventListener("change",()=>{persistedMascot=null;syncMascotFileName();update()});

function setValue(name,value){const el=form.elements[name];if(!el)return;if(el.type==="checkbox")el.checked=Boolean(value);else el.value=value??""}
function applyPayload(p){
  setValue("projectName",p.projectName);setValue("ticker",p.ticker);setValue("version",p.version||"1.0.0");setValue("description",p.description);setValue("promptUser",p.promptUser);setValue("promptHost",p.promptHost||"terminal");setValue("ecosystem",p.ecosystem||"Robinhood Chain");setValue("tokenContract",p.tokenContract);setValue("nftContract",p.nftContract);setValue("dexScreenerChainId",p.dexScreenerChainId||"robinhood");setValue("blockscoutApiBase",p.blockscoutApiBase||"https://robinhoodchain.blockscout.com/api/v2");
  for(const k of ["primary","accent","background","panel"])setValue(k,p.colors?.[k]);
  for(const k of ["home","website","x","telegram","explorer","dexScreener","openSea"])setValue(k,p.links?.[k]);
  setValue("openSeaSlug",p.nft?.openSeaSlug);for(const k of ["whaleTracker","memeIntel","nftTerminal","liveMarket"])setValue(k,p.features?.[k]);
  persistedMascot=p.mascot||null; mascotInput.value=""; syncMascotFileName(); update();
}
function resetForm(){form.reset();setValue("version","1.0.0");setValue("promptHost","terminal");setValue("ecosystem","Robinhood Chain");setValue("dexScreenerChainId","robinhood");setValue("blockscoutApiBase","https://robinhoodchain.blockscout.com/api/v2");setValue("primary","#39ff14");setValue("accent","#ff6a00");setValue("background","#020806");setValue("panel","#03100b");setValue("whaleTracker",true);setValue("memeIntel",true);setValue("liveMarket",true);activeProjectId="";persistedMascot=null;mascotInput.value="";syncMascotFileName();localStorage.removeItem(SETTINGS_KEY);update();status.textContent="[ NEW ] Blank project workspace ready."}
function refreshProjectList(){
  const projects=readProjects(); const current=savedProjectsSelect.value; savedProjectsSelect.innerHTML='<option value="">LOAD SAVED PROJECT...</option>';
  Object.values(projects).sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt))).forEach(item=>{const option=document.createElement("option");option.value=item.id;option.textContent=`${item.name} // ${item.state} // ${new Date(item.updatedAt).toLocaleDateString()}`;savedProjectsSelect.append(option)});
  savedProjectsSelect.value=projects[current]?current:"";
}
async function saveProject({duplicate=false}={}){
  const data=await payload(); if(!data.projectName)throw new Error("Project name is required before saving.");
  let id=slugify(data.projectName); const projects=readProjects();
  if(duplicate){let n=2;const base=id;while(projects[id])id=`${base}-copy-${n++}`;data.projectName=`${data.projectName} COPY`;data.tokenContract="";data.nftContract="";data.links={};data.nft={};data.features.nftTerminal=false;}
  const existing=projects[id];const timestamp=nowIso();projects[id]={id,name:data.projectName.toUpperCase(),ticker:data.ticker,state:(data.projectName&&data.ticker&&data.tokenContract&&(!data.features.nftTerminal||data.nftContract))?"READY":"DRAFT",createdAt:existing?.createdAt||timestamp,updatedAt:timestamp,lastGeneratedAt:existing?.lastGeneratedAt||null,schemaVersion:SCHEMA_VERSION,builderVersion:"1.0.0",data};writeProjects(projects);activeProjectId=id;applyPayload(data);refreshProjectList();savedProjectsSelect.value=id;status.textContent=`[ SAVED ] ${data.projectName.toUpperCase()} stored locally.`;
}
function loadProject(id){const item=readProjects()[id];if(!item)return;activeProjectId=id;applyPayload(item.data);savedProjectsSelect.value=id;localStorage.setItem(SETTINGS_KEY,JSON.stringify({activeProjectId:id}));status.textContent=`[ LOADED ] ${item.name}`}
function deleteProject(){if(!activeProjectId){status.textContent="[ WARN ] No saved project is active.";return}const projects=readProjects();const item=projects[activeProjectId];if(!item)return;const answer=prompt(`Type ${item.name} to delete this saved project:`);if(answer!==item.name){status.textContent="[ SKIP ] Project deletion cancelled.";return}delete projects[activeProjectId];writeProjects(projects);resetForm();refreshProjectList();status.textContent=`[ DELETED ] ${item.name} removed from this browser.`}
async function exportProject(){const data=await payload();const bundle={schemaVersion:SCHEMA_VERSION,builderVersion:"1.0.0",exportedAt:nowIso(),project:data};const blob=new Blob([JSON.stringify(bundle,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`${slugify(data.projectName)||"community-terminal"}-config.json`;a.click();URL.revokeObjectURL(a.href);status.textContent="[ EXPORTED ] Project configuration downloaded."}
function importProject(bundle){if(!bundle||bundle.schemaVersion!==SCHEMA_VERSION||!bundle.project)throw new Error("Unsupported or invalid project configuration.");activeProjectId="";applyPayload(bundle.project);status.textContent="[ IMPORTED ] Configuration loaded. Press SAVE to keep it locally."}
function noteGenerated(){if(!activeProjectId)return;const projects=readProjects();if(projects[activeProjectId]){projects[activeProjectId].lastGeneratedAt=nowIso();projects[activeProjectId].updatedAt=nowIso();writeProjects(projects);refreshProjectList();savedProjectsSelect.value=activeProjectId}}

form.addEventListener("input",update);form.addEventListener("change",update);
document.querySelector("#new-project").addEventListener("click",()=>{if(confirm("Start a new project? Unsaved form changes will be cleared."))resetForm()});
document.querySelector("#save-project").addEventListener("click",()=>saveProject().catch(err=>status.textContent=`[ ERROR ] ${err.message}`));
document.querySelector("#duplicate-project").addEventListener("click",()=>saveProject({duplicate:true}).catch(err=>status.textContent=`[ ERROR ] ${err.message}`));
document.querySelector("#export-project").addEventListener("click",()=>exportProject().catch(err=>status.textContent=`[ ERROR ] ${err.message}`));
document.querySelector("#import-project").addEventListener("click",()=>importProjectFile.click());
document.querySelector("#delete-project").addEventListener("click",deleteProject);
savedProjectsSelect.addEventListener("change",()=>{if(savedProjectsSelect.value)loadProject(savedProjectsSelect.value)});
importProjectFile.addEventListener("change",async()=>{try{const file=importProjectFile.files[0];if(!file)return;importProject(JSON.parse(await file.text()))}catch(err){status.textContent=`[ ERROR ] ${err.message}`}finally{importProjectFile.value=""}});

syncMascotFileName();refreshProjectList();validateContractField();
try{const state=JSON.parse(localStorage.getItem(SETTINGS_KEY)||"{}");if(state.activeProjectId&&readProjects()[state.activeProjectId])loadProject(state.activeProjectId);else update()}catch{update()}

function escapeHtml(value){return String(value||"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]))}

async function mascotDataUrl(){
  const file=document.querySelector("#mascot").files[0];
  if(!file)return "";
  return await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=reject;reader.readAsDataURL(file)});
}

async function openLandingPreview(){
  const project=(val("projectName")||"YOUR PROJECT").toUpperCase();
  const ecosystem=val("ecosystem")||"Robinhood Chain";
  const promptUser=(val("promptUser")||project.toLowerCase().replace(/[^a-z0-9]+/g,"" )||"project");
  const promptHost=val("promptHost")||"terminal";
  const primary=val("primary")||"#39ff14";
  const accent=val("accent")||"#ff6a00";
  const background=val("background")||"#020806";
  const panel=val("panel")||"#03100b";
  const mascot=await mascotDataUrl();
  const modules=[];
  if(checked("whaleTracker"))modules.push(["whales","Whale Activity Tracker","Monitor whale activity, DEX transfers, and holder rankings."]);
  if(checked("memeIntel"))modules.push(["intel","Meme Intelligence Terminal","Read market pulse, buy pressure, holder behavior, and risk signals."]);
  if(checked("nftTerminal")&&val("nftContract"))modules.push(["nft",`${project} NFT Terminal`,`Explore collection analytics, ownership, rarity, and marketplace activity.`]);
  const moduleHtml=modules.length?modules.map(([cmd,title,desc])=>`<div class="module"><div>&gt; ${escapeHtml(cmd)}</div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(desc)}</p><em>[ READY ]</em></div>`).join(""):`<div class="module empty">[ NO MODULES ENABLED ]</div>`;
  const mascotHtml=mascot?`<img src="${mascot}" alt="Project mascot">`:`<span>&gt;_</span>`;
  const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(project)} Landing Preview</title><style>
  :root{--p:${primary};--a:${accent};--bg:${background};--panel:${panel}}*{box-sizing:border-box}body{margin:0;min-height:100vh;background:var(--bg);color:#e8fff0;font-family:"IBM Plex Mono",Consolas,monospace;padding:18px}body:before{content:"101001 011010 110001 010101 001110 101010 011001 110100";position:fixed;inset:0;color:color-mix(in srgb,var(--p) 4%,transparent);font-size:4vw;letter-spacing:.35em;word-break:break-all;pointer-events:none}.wrap{position:relative;max-width:1040px;margin:auto;border:1px solid color-mix(in srgb,var(--p) 35%,transparent);background:color-mix(in srgb,var(--bg) 96%,black);padding:24px;box-shadow:0 0 60px color-mix(in srgb,var(--p) 10%,transparent)}.mode{color:var(--a);font-size:.72rem;letter-spacing:.12em}.mascot{width:62px;height:62px;margin:4px auto 14px;border:0;outline:0;box-shadow:none;display:grid;place-items:center;background:transparent;color:var(--p);font-weight:800;overflow:hidden}.mascot img{width:100%;height:100%;object-fit:contain;border:0;outline:0;box-shadow:none;background:transparent}.title{text-align:center;color:var(--a);font-size:1.35rem;font-weight:800;letter-spacing:.07em;padding:12px;border-top:1px solid var(--a);border-bottom:1px solid var(--a)}.sub{text-align:center;color:#a8b9ae;margin:8px}.sub b{color:var(--p)}.market{display:grid;grid-template-columns:1fr auto;gap:5px 20px;padding:14px 0;border-top:1px solid color-mix(in srgb,var(--a) 55%,transparent);border-bottom:1px solid color-mix(in srgb,var(--a) 55%,transparent);font-size:.88rem}.market span{color:var(--a)}.boot{padding:14px 0;font-size:.9rem;line-height:1.55}.boot b{color:var(--p)}.modules{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.module{border:1px solid color-mix(in srgb,var(--p) 42%,transparent);background:var(--panel);padding:14px;min-height:120px}.module>div{color:var(--p)}.module strong{display:block;text-align:center;color:var(--a);margin:14px 0 8px}.module p{color:#83978a;font-size:.8rem}.module em{color:var(--p);font-style:normal;font-size:.75rem}.prompt{margin-top:16px;padding-top:11px;border-top:1px solid color-mix(in srgb,var(--a) 55%,transparent);color:var(--p)}.cursor{display:inline-block;width:8px;height:1em;background:var(--p);vertical-align:-2px;animation:b 1s steps(1) infinite}@keyframes b{50%{opacity:0}}@media(max-width:700px){.modules{grid-template-columns:1fr}.wrap{padding:14px}}
  </style></head><body><main class="wrap"><div class="mode">[ PREVIEW MODE — SAMPLE DATA ]</div><div class="mascot">${mascotHtml}</div><div class="title">${escapeHtml(project)} COMMUNITY TERMINAL</div><div class="sub">Independent Community Tools • <b>${escapeHtml(ecosystem)}</b> Ecosystem</div><div class="market"><span>[ PREVIEW ] Price</span><b>$0.000000</b><span>[ PREVIEW ] Market Cap</span><b>$0.00</b><span>[ PREVIEW ] Holders</span><b>0</b><span>[ PREVIEW ] 24h Volume</span><b>$0.00</b></div><div class="boot">Initializing <b>${escapeHtml(project)}</b> Community Terminal...<br>Loading ${escapeHtml(ecosystem)}...<br>Loading available project modules...</div><div class="modules">${moduleHtml}</div><div class="prompt">${escapeHtml(promptUser)}@${escapeHtml(promptHost)}:~$ <span class="cursor"></span></div></main></body></html>`;
  const previewWindow=window.open("","_blank");
  if(!previewWindow){status.textContent="[ ERROR ] Preview window was blocked by the browser.";return;}
  previewWindow.document.open();previewWindow.document.write(html);previewWindow.document.close();
}

document.querySelector("#open-preview").addEventListener("click",()=>{openLandingPreview().catch(err=>{status.textContent=`[ ERROR ] ${err.message}`})});


form.addEventListener("submit",async e=>{
  e.preventDefault(); status.textContent="[ BUILD ] Generating unified terminal package..."; button.disabled=true;
  try{
    const response=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(await payload())});
    if(!response.ok){const x=await response.json();throw new Error(x.error||"Generation failed")}
    const blob=await response.blob(); const disposition=response.headers.get("content-disposition")||""; const filename=/filename="([^"]+)"/.exec(disposition)?.[1]||"Community_Terminal.zip";
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=filename;a.click();URL.revokeObjectURL(a.href);noteGenerated();status.textContent=`[ DONE ] Generated ${filename}`;
  }catch(err){status.textContent=`[ ERROR ] ${err.message}`}finally{button.disabled=false}
});

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
