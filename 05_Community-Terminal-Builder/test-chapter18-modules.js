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
console.log("Chapter 18A Community Pulse + Timeline + live acceptance fixes: PASS");
