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
const DEPLOYMENT_KEY="ctb.deployments.v1";
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
function resetForm(){form.reset();setValue("version","1.0.0");setValue("promptHost","terminal");setValue("ecosystem","Robinhood Chain");setValue("dexScreenerChainId","robinhood");setValue("blockscoutApiBase","https://robinhoodchain.blockscout.com/api/v2");setValue("primary","#39ff14");setValue("accent","#ff6a00");setValue("background","#020806");setValue("panel","#03100b");setValue("whaleTracker",true);setValue("memeIntel",true);setValue("liveMarket",true);activeProjectId="";persistedMascot=null;mascotInput.value="";syncMascotFileName();localStorage.removeItem(SETTINGS_KEY);update();status.textContent="[ NEW ] Blank project workspace ready.";loadDeployment()}
function refreshProjectList(){
  const projects=readProjects(); const current=savedProjectsSelect.value; savedProjectsSelect.innerHTML='<option value="">LOAD SAVED PROJECT...</option>';
  Object.values(projects).sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt))).forEach(item=>{const option=document.createElement("option");option.value=item.id;option.textContent=`${item.name} // ${item.state} // ${new Date(item.updatedAt).toLocaleDateString()}`;savedProjectsSelect.append(option)});
  savedProjectsSelect.value=projects[current]?current:"";
}
async function saveProject({duplicate=false}={}){
  const data=await payload(); if(!data.projectName)throw new Error("Project name is required before saving.");
  let id=slugify(data.projectName); const projects=readProjects();
  if(duplicate){let n=2;const base=id;while(projects[id])id=`${base}-copy-${n++}`;data.projectName=`${data.projectName} COPY`;data.tokenContract="";data.nftContract="";data.links={};data.nft={};data.features.nftTerminal=false;}
  const existing=projects[id];const timestamp=nowIso();projects[id]={id,name:data.projectName.toUpperCase(),ticker:data.ticker,state:(data.projectName&&data.ticker&&data.tokenContract&&(!data.features.nftTerminal||data.nftContract))?"READY":"DRAFT",createdAt:existing?.createdAt||timestamp,updatedAt:timestamp,lastGeneratedAt:existing?.lastGeneratedAt||null,generatedFingerprint:existing?.generatedFingerprint||"",schemaVersion:SCHEMA_VERSION,builderVersion:"1.3.1-B",data};writeProjects(projects);activeProjectId=id;applyPayload(data);refreshProjectList();savedProjectsSelect.value=id;status.textContent=`[ SAVED ] ${data.projectName.toUpperCase()} stored locally.`;
}
function loadProject(id){const item=readProjects()[id];if(!item)return;activeProjectId=id;applyPayload(item.data);savedProjectsSelect.value=id;localStorage.setItem(SETTINGS_KEY,JSON.stringify({activeProjectId:id}));status.textContent=`[ LOADED ] ${item.name}`;loadDeployment()}
function deleteProject(){if(!activeProjectId){status.textContent="[ WARN ] No saved project is active.";return}const projects=readProjects();const item=projects[activeProjectId];if(!item)return;const answer=prompt(`Type ${item.name} to delete this saved project:`);if(answer!==item.name){status.textContent="[ SKIP ] Project deletion cancelled.";return}delete projects[activeProjectId];writeProjects(projects);resetForm();refreshProjectList();status.textContent=`[ DELETED ] ${item.name} removed from this browser.`}
async function exportProject(){const data=await payload();const bundle={schemaVersion:SCHEMA_VERSION,builderVersion:"1.3.1-B",terminalEngineVersion:"1.0.0",exportedAt:nowIso(),project:data};const blob=new Blob([JSON.stringify(bundle,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`${slugify(data.projectName)||"community-terminal"}-config.json`;a.click();URL.revokeObjectURL(a.href);status.textContent="[ EXPORTED ] Project configuration downloaded."}
function importProject(bundle){if(!bundle||bundle.schemaVersion!==SCHEMA_VERSION||!bundle.project)throw new Error("Unsupported or invalid project configuration.");activeProjectId="";applyPayload(bundle.project);status.textContent="[ IMPORTED ] Configuration loaded. Press SAVE to keep it locally."}
function noteGenerated(project,fingerprint){
  const id=activeProjectId||slugify(project.projectName);if(!id)return false;
  const projects=readProjects(),existing=projects[id],timestamp=nowIso();
  projects[id]={id,name:String(project.projectName||id).toUpperCase(),ticker:project.ticker||"",state:configurationReady()?"READY":"DRAFT",createdAt:existing?.createdAt||timestamp,updatedAt:timestamp,lastGeneratedAt:timestamp,generatedFingerprint:String(fingerprint||""),schemaVersion:SCHEMA_VERSION,builderVersion:"1.3.1-B",data:project};
  writeProjects(projects);activeProjectId=id;localStorage.setItem(SETTINGS_KEY,JSON.stringify({activeProjectId:id}));refreshProjectList();savedProjectsSelect.value=id;updateWorkspaceStatus();return true;
}

form.addEventListener("input",update);form.addEventListener("change",update);
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
  try{const response=await fetch("/api/verify-terminal",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:record.publicUrl,expected:{whales:checked("whaleTracker"),intel:checked("memeIntel"),nft:checked("nftTerminal")&&Boolean(val("nftContract"))}})});const data=await response.json();if(!response.ok&& !data.checks)throw new Error(data.error||"Acceptance failed");const lines=[`[ ${data.ok?"ACCEPTED":"FAILED"} ] ${data.url||record.publicUrl}`,...(data.checks||[]).map(x=>`[ ${x.pass?"PASS":"FAIL"} ] ${x.name}`),`[ TIME ] ${data.checkedAt||nowIso()}`];const all=readDeployments(),id=deploymentId();all[id]={...(all[id]||{}),...record,acceptance:{ok:Boolean(data.ok),checkedAt:data.checkedAt||nowIso(),lines},updatedAt:nowIso()};localStorage.setItem(DEPLOYMENT_KEY,JSON.stringify(all));renderDeploymentRecord(all[id]);status.textContent=data.ok?"[ ACCEPTED ] Public terminal passed all public checks.":"[ FAIL ] Public terminal did not pass every check."}catch(error){out.className="deployment-result fail";out.textContent=`[ FAIL ] ${error.message}`;status.textContent=`[ ERROR ] ${error.message}`}finally{btn.disabled=false}}
document.querySelector("#save-deployment").addEventListener("click",saveDeployment);
document.querySelector("#open-github").addEventListener("click",()=>openDeployment("github"));
document.querySelector("#open-render").addEventListener("click",()=>openDeployment("render"));
document.querySelector("#verify-public-terminal").addEventListener("click",verifyPublicTerminal);

syncMascotFileName();refreshProjectList();validateContractField();loadDeployment();
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
function enabledModuleNames(project){const names=["LANDING"];if(project.features?.whaleTracker)names.push("WHALES");if(project.features?.memeIntel)names.push("INTEL");if(project.features?.nftTerminal&&project.nftContract)names.push("NFT");return names}
function deploymentCommands(kind){const p=lastBuild.project||{};const folder=(String(p.projectName||"PROJECT").toUpperCase().replace(/[^A-Z0-9]+/g,"_")+"_Community_Terminal");const repo=(String(p.projectName||"project").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")+"-community-terminal");if(kind==="local")return `cd ${folder}\nnpm install\nnpm test\nnpm start`;if(kind==="github")return `git init\ngit add .\ngit commit -m "Initial ${p.projectName||"Community"} Community Terminal"\ngit branch -M main\ngit remote add origin https://github.com/YOUR-USERNAME/${repo}.git\ngit push -u origin main`;return `1. Push the generated root folder to GitHub.\n2. In Render choose New → Blueprint.\n3. Select the repository and main branch.\n4. Keep Blueprint Path as render.yaml.\n5. Confirm the Free plan before deployment.\n6. After it is Live, run:\n\nnpm run test:deployed -- https://YOUR-TERMINAL.onrender.com`; }
async function copyDeployment(kind){const text=deploymentCommands(kind);document.querySelector("#deployment-command-preview").textContent=text;try{await navigator.clipboard.writeText(text);status.textContent="[ COPIED ] Deployment commands copied."}catch{status.textContent="[ READY ] Commands shown below; copy them manually."}}
function showBuildComplete(project,filename){document.querySelector("#built-project").textContent=`${String(project.projectName||"COMMUNITY").toUpperCase()} COMMUNITY TERMINAL`;document.querySelector("#built-package").textContent=`${filename} · deployment-ready`;document.querySelector("#built-modules").innerHTML=enabledModuleNames(project).map(x=>`<span>${x}</span>`).join("");document.querySelector("#deployment-command-preview").textContent="Select an action to copy deployment commands.";document.querySelector("#build-complete").showModal()}
form.addEventListener("submit",async e=>{
  e.preventDefault(); status.textContent="[ BUILD ] Generating unified terminal package..."; button.disabled=true;
  try{
    const project=await payload();const response=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(project)});
    if(!response.ok){const x=await response.json();throw new Error(x.error||"Generation failed")}
    const blob=await response.blob(); const disposition=response.headers.get("content-disposition")||""; const filename=/filename="([^"]+)"/.exec(disposition)?.[1]||"Community_Terminal.zip"; const fingerprint=response.headers.get("x-ctb-build-fingerprint")||"";
    if(lastBuild.url)URL.revokeObjectURL(lastBuild.url);lastBuild={url:URL.createObjectURL(blob),filename,project,fingerprint};downloadBuild();const autoSaved=noteGenerated(project,fingerprint);status.textContent=`[ DONE ] Generated ${filename}${autoSaved?" · project auto-saved":""}`;if(autoSaved)showAutoSaveToast();showBuildComplete(project,filename);
  }catch(err){status.textContent=`[ ERROR ] ${err.message}`}finally{button.disabled=false}
});
document.querySelector("#close-build-complete").addEventListener("click",()=>document.querySelector("#build-complete").close());
document.querySelector("#download-again").addEventListener("click",downloadBuild);
document.querySelector("#copy-local-commands").addEventListener("click",()=>copyDeployment("local"));
document.querySelector("#copy-github-commands").addEventListener("click",()=>copyDeployment("github"));
document.querySelector("#copy-render-guide").addEventListener("click",()=>copyDeployment("render"));

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
function updateProtectedButtons(){
  const prepare=document.querySelector("#prepare-release"),deploy=document.querySelector("#connected-deploy"),typed=document.querySelector("#release-confirmation-text").value;
  prepare.disabled=!(integrationReady&&releaseCanDeploy);
  deploy.disabled=!(integrationReady&&releaseCanDeploy&&releaseAuthorization&&typed===releaseAuthorization.confirmation);
}
async function refreshIntegrations(manual=false){const label=document.querySelector("#integration-state"),out=document.querySelector("#connected-result"),checkButton=document.querySelector("#refresh-integrations");label.textContent="CHECKING";label.classList.remove("live");clearReleaseAuthorization();checkButton.disabled=true;checkButton.textContent="CHECKING...";if(manual)out.textContent="[ CHECKING ] Testing GitHub and Render server configuration...";try{const response=await fetch("/api/integrations",{cache:"no-store"});const data=await response.json();if(!response.ok||!data.ok)throw new Error(data.error||`Connection check returned HTTP ${response.status}`);integrationReady=Boolean(data.enabled&&data.github?.verified&&data.render?.verified);label.textContent=integrationReady?"CONNECTED":data.enabled?"INCOMPLETE":"DISABLED";label.classList.toggle("live",integrationReady);releaseCanDeploy=false;const checkedAt=new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit",second:"2-digit"});out.textContent=[`[ CHECKED ] Connection check completed at ${checkedAt}`,`[ ${data.enabled?"OK":"OFF"} ] Connected deployments ${data.enabled?"enabled":"disabled"}`,`[ ${data.releaseActionsEnabled?"PASS":"LOCKED"} ] Protected release policy`,`[ ${data.github?.verified?"PASS":data.github?.configured?"FAIL":"WAIT"} ] GitHub credential${data.github?.verified&&data.github?.login?` · ${data.github.login}`:""}${data.github?.error?` · ${data.github.error}`:""}`,`[ ${data.render?.verified?"PASS":data.render?.configured?"FAIL":"WAIT"} ] Render credential + workspace${data.render?.verified&&data.render?.workspaceName?` · ${data.render.workspaceName}`:""}${data.render?.error?` · ${data.render.error}`:""}`,`[ SAFE ] Secrets exposed to browser: ${data.secretsExposed?"YES":"NO"}`].join("\n");updateProtectedButtons();}catch(error){integrationReady=false;label.textContent="UNAVAILABLE";clearReleaseAuthorization();out.textContent=`[ FAIL ] ${error.message}`}finally{checkButton.disabled=false;checkButton.textContent="CHECK CONNECTIONS"}}
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
  const link=document.querySelector("#deployment-success-url"),openButton=document.querySelector("#deployment-success-open");
  const url=String(publicUrl||"").trim();
  link.textContent=url||"Public URL unavailable";
  if(url){link.href=url;link.removeAttribute("aria-disabled");openButton.disabled=false;openButton.dataset.url=url}
  else{link.removeAttribute("href");link.setAttribute("aria-disabled","true");openButton.disabled=true;delete openButton.dataset.url}
  if(!dialog.open)dialog.showModal();
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
async function pollRenderDeployment(data,out){
  const serviceId=data.render.serviceId;if(!serviceId)return;
  const started=Date.now(),timeoutMs=10*60*1000,intervalMs=5000;
  while(Date.now()-started<timeoutMs){
    await new Promise(resolve=>setTimeout(resolve,intervalMs));
    try{
      const response=await fetch(`/api/render-deploy-status?serviceId=${encodeURIComponent(serviceId)}`,{cache:"no-store"});
      const state=await response.json();if(!response.ok||!state.ok)throw new Error(state.error||"Render deployment status unavailable");
      if(state.success){renderProtectedRelease(out,data,"live");status.textContent="[ LIVE ] Deployment successful. Run Public Acceptance to verify the public terminal.";showDeploymentSuccessDialog(data.render.publicUrl||"");return}
      if(state.failed){renderProtectedRelease(out,data,state.status||"failed");status.textContent="[ FAIL ] Render deployment failed. Review the Render deployment logs before trying again.";showDeploymentToast("The deployment did not complete successfully. Review the Render logs before trying again.",{state:"fail",duration:8000});return}
      renderProtectedRelease(out,data,"Deploying the website...");
    }catch(error){console.warn("Render deployment status check failed:",error.message)}
  }
  renderProtectedRelease(out,data,"status unknown");status.textContent="[ WAIT ] Deployment status could not be confirmed automatically. Check Render before making another release.";showDeploymentToast("Deployment status could not be confirmed automatically. Check Render before making another release.",{state:"fail",duration:8000});
}

function invalidateProtectedRelease(){if(releaseAuthorization)clearReleaseAuthorization("[ LOCKED ] Release target changed. Run CHECK RELEASE READINESS and PREPARE RELEASE again.");releaseCanDeploy=false;updateProtectedButtons()}
document.querySelector("#refresh-integrations").addEventListener("click",()=>refreshIntegrations(true));
document.querySelector("#check-release-readiness").addEventListener("click",checkReleaseReadiness);
document.querySelector("#prepare-release").addEventListener("click",prepareProtectedRelease);
document.querySelector("#connected-deploy").addEventListener("click",connectedDeployProject);
document.querySelector("#release-confirmation-text").addEventListener("input",updateProtectedButtons);
document.querySelector("#release-confirmation-text").addEventListener("keydown",event=>{if(event.key==="Enter"){event.preventDefault();event.stopPropagation();verifyConfirmationAttempt();}});
for(const id of ["connected-repo-name","connected-service-name","connected-release-mode","connected-private"]){document.querySelector(`#${id}`).addEventListener("change",invalidateProtectedRelease)}
document.querySelector("#connected-repo-name").addEventListener("focus",()=>{const n=connectedNames();if(!document.querySelector("#connected-repo-name").value)document.querySelector("#connected-repo-name").value=n.repo});
document.querySelector("#connected-service-name").addEventListener("focus",()=>{const n=connectedNames();if(!document.querySelector("#connected-service-name").value)document.querySelector("#connected-service-name").value=n.service});

document.querySelector("#deployment-success-close").addEventListener("click",()=>document.querySelector("#deployment-success-dialog").close());
document.querySelector("#deployment-success-open").addEventListener("click",event=>{
  const url=event.currentTarget.dataset.url;if(url)window.open(url,"_blank","noopener,noreferrer");
});

refreshIntegrations(false);
