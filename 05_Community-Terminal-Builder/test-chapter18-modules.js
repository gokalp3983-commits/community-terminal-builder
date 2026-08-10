"use strict";
const assert=require("assert");
const fs=require("fs");
const os=require("os");
const path=require("path");
const {execFileSync}=require("child_process");
const {generate,normalize}=require("./generator");
function inspect(buffer){const dir=fs.mkdtempSync(path.join(os.tmpdir(),"ctb18-"));const zip=path.join(dir,"out.zip");fs.writeFileSync(zip,buffer);execFileSync("unzip",["-q",zip,"-d",dir]);return {dir,root:path.join(dir,"PULSETEST_Community_Terminal"),text(rel){return fs.readFileSync(path.join(this.root,rel),"utf8")},exists(rel){return fs.existsSync(path.join(this.root,rel))}}}
const base={projectName:"PULSETEST",ticker:"PULSE",tokenContract:"0x1111111111111111111111111111111111111111",features:{whaleTracker:true,memeIntel:true,communityPulse:true,timeline:true,nftTerminal:false,liveMarket:true}};
const n=normalize(base);assert.strictEqual(n.features.communityPulse,true);assert.strictEqual(n.features.timeline,true);assert.strictEqual(n.links.pulse,"/pulse");assert.strictEqual(n.links.timeline,"/timeline");
let x=inspect(generate(base).buffer);for(const name of ["06_Community-Pulse/server.js","06_Community-Pulse/public/index.html","06_Community-Pulse/public/pulse.js","07_Timeline/server.js","07_Timeline/public/index.html","07_Timeline/public/timeline.js"])assert(x.exists(name),`Generated ${name}`);
const server=x.text("server.js"),cfg=x.text("config/projects/pulsetest.js"),landing=x.text("01_Landing-Page/public/script.js"),release=x.text("terminal-release.json"),verify=x.text("verify-deployment.js");
assert(server.includes('app.use("/pulse",require("./06_Community-Pulse/server"))'));assert(server.includes('app.use("/timeline",require("./07_Timeline/server"))'));assert(server.includes('pulse:Boolean(config.features.communityPulse)'));assert(server.includes('timeline:Boolean(config.features.timeline)'));assert(cfg.includes('"pulse": "/pulse"')&&cfg.includes('"timeline": "/timeline"'));assert(cfg.includes('"communityPulse": true')&&cfg.includes('"timeline": true'));assert(landing.includes('pulse: "communityPulse"')&&landing.includes('timeline: "timeline"'));assert(release.includes('"pulse"')&&release.includes('"timeline"'));assert(verify.includes('s.modules.pulse===expected.pulse')&&verify.includes('s.modules.timeline===expected.timeline'));
x=inspect(generate({...base,features:{...base.features,communityPulse:false,timeline:false}}).buffer);const dcfg=x.text("config/projects/pulsetest.js");assert(dcfg.includes('"communityPulse": false')&&dcfg.includes('"timeline": false'));
const multi={...base,nftContract:"0x2222222222222222222222222222222222222222",features:{...base.features,nftTerminal:true},nft:{mode:"multiple",collectionName:"Pulse NFT",mintPhases:[{label:"PHASE 1",name:"Allowlist",startsAt:"2026-09-01T12:00:00Z",endsAt:"2026-09-01T13:00:00Z",timezone:"UTC",price:"0.1 ETH",limit:"2/wallet"},{label:"PHASE 2",name:"Public",startsAt:"2026-09-01T13:00:00Z",endsAt:"2026-09-01T16:00:00Z",timezone:"UTC",price:"0.2 ETH",limit:"4/wallet"}]}};
x=inspect(generate(multi).buffer);assert(x.text("07_Timeline/public/timeline.js").includes("mintPhases"));

// Chapter 18A live HOODRAT acceptance fixes.
const liveFixInput={...multi,links:{openSea:"https://opensea.io/collection/hoodrats-nft/overview"},nft:{...multi.nft,openSeaSlug:""}};
const liveNormalized=normalize(liveFixInput);
assert.strictEqual(liveNormalized.nftSettings.openSeaSlug,"hoodrats-nft","OpenSea slug must be derived from the collection URL");
assert.throws(()=>normalize({...liveFixInput,links:{openSea:"https://opensea.io/assets/ethereum/0x123/1"}}),/OpenSea URL must be a valid collection link/);
const builderHtml=fs.readFileSync(path.join(__dirname,"public/index.html"),"utf8");
const builderJs=fs.readFileSync(path.join(__dirname,"public/app.js"),"utf8");
assert(builderHtml.includes('type="hidden" name="openSeaSlug"'),"OpenSea slug should be internal, not user-entered");
assert(builderJs.includes("function openSeaSlugFromUrl"),"Builder must derive OpenSea slug from URL");
assert(builderJs.includes('data-date-autofill="${phase.endDate&&phase.endDate!==phase.startDate?"manual":"start"}"'),"Loaded mint phases must retain date auto-sync state");
assert(builderJs.includes("overflow:visible}.mascot img{display:block"),"Landing preview mascot must not crop the uploaded logo");
const pulseHtml=x.text("06_Community-Pulse/public/index.html"), timelineHtml=x.text("07_Timeline/public/index.html");
const pulseStyle=x.text("06_Community-Pulse/public/style.css"), timelineStyle=x.text("07_Timeline/public/style.css");
const pulseModuleCss=x.text("06_Community-Pulse/public/pulse.css"), timelineModuleCss=x.text("07_Timeline/public/timeline.css");
assert(pulseHtml.includes('id="terminal-footer" class="terminal-area terminal-footer"'),"Pulse must use canonical subcommand footer wrapper");
assert(timelineHtml.includes('id="terminal-footer" class="terminal-area terminal-footer"'),"Timeline must use canonical subcommand footer wrapper");
assert(pulseModuleCss.includes('.module-title{color:var(--green)!important}'),"Pulse subpage title must use terminal green");
assert(timelineModuleCss.includes('.module-title{color:var(--green)!important}'),"Timeline subpage title must use terminal green");

// Chapter 18 landing Quick Access + compact explanations + NFT logo parity.
const landingHtml=x.text("01_Landing-Page/public/index.html");
const landingStyle=x.text("01_Landing-Page/public/style.css");
const landingScript=x.text("01_Landing-Page/public/script.js");
const nftStyle=x.text("03_NFT-Collection-Terminal/public/style.css");
assert(landingHtml.includes('id="quickAccessTabs" class="quick-access-tabs"'),"Landing must include Quick Access tabs");
assert(landingHtml.includes('id="availableTerminalsTitle"'),"Landing must include compact Available Terminals explanation area");
assert(landingScript.includes('window.open(module.url, "_blank", "noopener")'),"Quick Access tabs must open selected terminals directly");
assert(landingScript.includes('row.className = "module-explanation"'),"Landing module descriptions must render as static explanation rows");
assert(landingStyle.includes('border:1px solid #6FD3FF'),"Quick Access tabs must use ice-blue borders");
assert(landingStyle.includes('color:#6FD3FF'),"Quick Access tabs must use ice-blue text");
assert(nftStyle.includes('Chapter 18 — NFT header logo parity'),"NFT page must inherit header-logo parity fix");
assert(nftStyle.includes('box-shadow:none!important'),"NFT header logo must not glow or render a hover rectangle");

// Chapter 18 live visual parity: non-NFT titles, Timeline frame, Pulse-only white internal borders.
const whaleCss=x.text("02_Whale-Activity-Tracker/public/whale.css");
const intelCss=x.text("04_Meme-Intel/public/intel.css");
const pulseCss=x.text("06_Community-Pulse/public/pulse.css");
const timelineCss=x.text("07_Timeline/public/timeline.css");
for (const [name,css] of [["Whales",whaleCss],["Intel",intelCss],["Pulse",pulseCss],["Timeline",timelineCss]]) {
  assert(css.includes('.module-title{color:var(--green)!important}'),`${name} sub-terminal title must be terminal green`);
}
assert(timelineCss.includes('border:1px solid var(--green)!important'),"Timeline must carry bright-green outer-frame parity");
assert(pulseCss.includes('flat terminal report separators instead of boxed cards'),"Pulse must use the accepted line-based internal treatment");
assert(pulseCss.includes('border-bottom:1px solid rgba(255,255,255,.72)!important'),"Pulse sections must use simple bright separators");

// Chapter 18 landing hub finalization + Pulse/Timeline footer parity.
assert(landingHtml.includes('[ QUICK ACCESS TO TERMINALS ]'),"Landing Quick Access heading must explicitly target terminals");
assert(!landingHtml.includes('id="terminal-prompt"'),"Landing must not expose a keyboard command prompt");
assert(!landingHtml.includes('id="commandInput"'),"Landing must not expose command input");
assert(!landingScript.includes('Type <span class="red">help</span> for available modules.'),"Landing boot must not advertise removed keyboard help");
assert(landingScript.includes('module.command.charAt(0).toUpperCase() + module.command.slice(1)'),"Available Terminals command labels must start with a capital letter");
assert(!pulseHtml.includes('data-project-footer-title')&&!pulseHtml.includes('data-project-footer-info'),"Pulse footer must use clean credits-only parity");
assert(!timelineHtml.includes('data-project-footer-title')&&!timelineHtml.includes('data-project-footer-info'),"Timeline footer must use clean credits-only parity");

// Chapter 18A final accepted HOODRAT baseline.
x=inspect(generate(multi).buffer);
const finalLanding=x.text("01_Landing-Page/public/script.js");
const finalLandingCss=x.text("01_Landing-Page/public/style.css");
const finalWhaleHtml=x.text("02_Whale-Activity-Tracker/public/index.html");
const finalWhaleJs=x.text("02_Whale-Activity-Tracker/public/whale.js");
const finalIntelHtml=x.text("04_Meme-Intel/public/index.html");
const finalIntelJs=x.text("04_Meme-Intel/public/intel.js");
const finalPulseCss=x.text("06_Community-Pulse/public/pulse.css");
const finalTimelineCss=x.text("07_Timeline/public/timeline.css");
assert(finalLanding.includes('FALLBACK_MODULE_ORDER = ["whales", "intel", "nft", "pulse", "timeline"]')&&finalLanding.includes('CONFIG?.moduleOrder'),"Landing terminal order must be driven by the canonical Whales, Intel, NFT, Pulse, Timeline order");
assert(finalLandingCss.includes('[data-module="nft"]{\n  order:3;')&&finalLandingCss.includes('[data-module="pulse"]{\n  order:4;')&&finalLandingCss.includes('[data-module="timeline"]{\n  order:5;'),"Landing CSS order override must match Whales, Intel, NFT, Pulse, Timeline");
assert(finalWhaleHtml.includes('[ AVAILABLE COMMANDS ]')&&finalWhaleHtml.includes('data-guide-command="clear"'),"Whales must expose inline available commands including clear");
assert(finalWhaleJs.includes('Back to commands'),"Whales must provide a return-to-commands link after output");
assert(finalIntelHtml.includes('data-quick-command="status"')&&finalIntelHtml.includes('data-quick-command="live"'),"Intel accepted Quick Commands must include STATUS through LIVE");
assert(finalIntelJs.includes('Back to commands'),"Intel must provide a return-to-commands link after output");
assert(finalPulseCss.includes('flat terminal report separators instead of boxed cards'),"Pulse must use line separators instead of boxed cards");
assert(finalPulseCss.includes('keep Pulse dividers open, not box/grid connected'),"Pulse vertical dividers must remain visually detached from horizontal separators");
assert(finalTimelineCss.includes('flat chronological separators instead of boxed events'),"Timeline must use line separators instead of boxed events");
assert(finalTimelineCss.includes('stronger event tag + dim orange chronology separators'),"Timeline final event-tag and separator polish must be present");
assert(!x.exists("deployment-guide.txt"),"Generated terminal must not include deployment/GitHub helper file");

console.log("Chapter 18A Community Pulse + Timeline + live acceptance fixes: PASS");
