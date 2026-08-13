"use strict";
const assert=require("assert");
const fs=require("fs");
const os=require("os");
const path=require("path");
const {execFileSync}=require("child_process");
const {generate}=require("./generator");
const ROOT=path.resolve(__dirname,"..");
const read=rel=>fs.readFileSync(path.join(ROOT,rel),"utf8");

const builderHtml=read("05_Community-Terminal-Builder/public/index.html");
const builderApp=read("05_Community-Terminal-Builder/public/app.js");
const builderCss=read("05_Community-Terminal-Builder/public/style.css");
assert.doesNotMatch(builderHtml,/name="nftMintMode"[^>]*required/,"Mint Structure selector must not block token-only submission while NFT fields are hidden");
assert.match(builderApp,/mintMode\.required=enabled/,"Mint Structure selector must become required when NFT Terminal is enabled");
assert.match(builderHtml,/option value="" selected disabled>Please select mint structure<\/option>/,"Mint Structure placeholder missing");
assert.match(builderHtml,/Single Phase/,"Single Phase option missing");
assert.match(builderHtml,/Multiple Phases/,"Multiple Phases option missing");
assert.match(builderHtml,/id="nft-phase-list"/,"Repeatable phase editor missing");
assert.match(builderApp,/2–6 mint phases|at least 2 phases/,"Multiple-phase validation missing");
assert.match(builderApp,/mintPhases/,"Builder payload must persist phase array");
assert.match(builderCss,/#nft-mint-mode\{[^}]*background:#020806[^}]*color:#f4fff7/,"Mint Structure control must match the dark Builder theme");
assert.match(builderCss,/#nft-mint-mode option\{background:#020806!important;color:#f4fff7!important/,"Mint Structure dropdown options must be readable on dark theme");
assert.match(builderCss,/#nft-mint-mode:invalid\{[^}]*var\(--placeholder\)/,"Mint Structure placeholder state must be visibly muted");
assert.match(builderApp,/dateAutofillBound/,"Dynamic phase date autofill delegation missing");
assert.match(builderApp,/input\.dataset\.phaseField!=="startDate"/,"Phase start-date autofill handler missing");
assert.match(builderApp,/end\.dataset\.dateAutofill==="start"/,"Auto-linked End Date must keep following later Start Date changes");
assert.match(builderApp,/input\.dataset\.dateAutofill="manual"/,"Manual End Date override must break Start Date auto-linking");
assert.match(builderApp,/starts before .* ends/,"Sequential phase overlap validation missing");
assert.match(builderHtml,/id="builder-brand-preview"/,"Builder logo preview container missing");
assert.match(builderApp,/refreshBuilderMascotPreview/,"Builder logo preview runtime missing");

for(const rel of ["03_NFT-Collection-Terminal/public/terminal.html","03_NFT-Collection-Terminal/public/script.js"]){
  assert.match(read(rel),/Collection Pulse|collectionPulse/,`${rel}: canonical Collection Pulse missing`);
}
assert.ok(fs.existsSync(path.join(ROOT,"03_NFT-Collection-Terminal-Multi-Phase","public","countdown.js")),"Canonical multiple-phase NFT template missing");

const common={projectName:"DUALCAT",ticker:"DCAT",description:"Dual NFT generator test",tokenContract:"0x1111111111111111111111111111111111111111",nftContract:"0x2222222222222222222222222222222222222222",blockscoutApiBase:"https://eth.blockscout.com/api/v2",links:{openSea:"https://opensea.io/collection/dualcat",x:"https://x.com/dualcat"},features:{whaleTracker:false,memeIntel:false,nftTerminal:true,liveMarket:false}};

function unpack(result){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"ctb-dual-nft-"));
  const zip=path.join(dir,result.filename);fs.writeFileSync(zip,result.buffer);execFileSync("unzip",["-q",zip,"-d",dir]);
  return {dir,root:path.join(dir,"DUALCAT_Community_Terminal")};
}

const single=unpack(generate({...common,nft:{collectionName:"DUALCAT NFT",supply:420,mode:"single",mintAt:"2026-08-20T19:00:00+03:00",mintPrice:"FREE",mintLimit:"1",timezone:"Europe/Bucharest"}}));
try{
  const cfg=readFile(single.root,"config/projects/dualcat.js"), launch=readFile(single.root,"03_NFT-Collection-Terminal/public/index.html"), terminal=readFile(single.root,"03_NFT-Collection-Terminal/public/terminal.html");
  assert.match(cfg,/"mode": "single"/,"Single NFT profile mode missing");
  assert.doesNotMatch(launch,/phaseCard-/,"Single-phase output must not contain multiple-phase cards");
  assert.match(terminal,/Collection Pulse|collectionPulse/,"Single-phase generated terminal lost Collection Pulse");
  assert.match(launch,/href="\/nft\/terminal"/,"Single-phase mounted terminal route missing");
}finally{fs.rmSync(single.dir,{recursive:true,force:true})}

const phases=[
  {id:"og",label:"OG",name:"OG Access",startsAt:"2026-08-20T18:00:00+03:00",endsAt:"2026-08-20T19:00:00+03:00",timezone:"Europe/Bucharest",price:"FREE",limit:"1 PER WALLET"},
  {id:"public",label:"PUBLIC",name:"Public Mint",startsAt:"2026-08-20T19:00:00+03:00",endsAt:"2026-08-21T01:00:00+03:00",timezone:"Europe/Bucharest",price:"0.01 ETH",limit:"2 PER WALLET"}
];
const multi=unpack(generate({...common,nft:{collectionName:"DUALCAT NFT",supply:888,mode:"multiple",mintPhases:phases,timezone:"Europe/Bucharest"}}));
try{
  const cfg=readFile(multi.root,"config/projects/dualcat.js"), launch=readFile(multi.root,"03_NFT-Collection-Terminal/public/index.html"), terminal=readFile(multi.root,"03_NFT-Collection-Terminal/public/terminal.html"), countdown=readFile(multi.root,"03_NFT-Collection-Terminal/public/countdown.js"), runtime=readFile(multi.root,"03_NFT-Collection-Terminal/public/project-runtime.js"), server=readFile(multi.root,"03_NFT-Collection-Terminal/server.js"), css=readFile(multi.root,"03_NFT-Collection-Terminal/public/style.css");
  assert.match(cfg,/"mode": "multiple"/,"Multiple NFT profile mode missing");
  assert.match(cfg,/"mintPhases": \[/,"Multiple NFT phase array missing");
  assert.equal((launch.match(/phaseCard-/g)||[]).length,2,"Generated phase-card count must match Builder phase count");
  assert.match(launch,/OG Access/,"Phase display name missing");
  assert.match(launch,/0\.01 ETH/,"Phase price missing");
  assert.match(launch,/href="\/nft\/terminal"/,"Multiple-phase mounted terminal route missing");
  assert.match(launch,/src="\/nft\/project-runtime\.js/,"Multiple-phase countdown must load project runtime for mounted branding");
  assert.match(launch,/src="\/nft\/assets\/dualcat-mascot\./,"Multiple-phase countdown mascot must use mounted /nft asset path");
  assert.match(countdown,/"\/nft\/terminal"/,"Multiple-phase JavaScript terminal redirect lost namespace");
  assert.match(runtime,/e\.href = "\/"/,"NFT mascot must return to the unified main landing page");
  assert.match(runtime,/Return to the main Community Terminal landing page\?/,"NFT mascot return must require confirmation");
  assert.match(terminal,/Collection Pulse|collectionPulse/,"Multiple-phase generated terminal lost Collection Pulse");
  assert.match(server,/req\.originalUrl/,"Multiple-phase SSR lost mounted URL awareness");
  assert.match(css,/#terminal-frame\.shell\.terminal-frame\{border:1px solid var\(--ice-blue,#6FD3FF\)!important/,"Multiple-phase canonical ice-blue outer frame missing");
  assert.match(css,/\.nft-sales-window \.sales-floor-primary\{[\s\S]*?flex-wrap:wrap;/,"Sales floor summary must wrap safely inside the sidebar");
  assert.match(css,/\.nft-sales-window \.sales-floor-price\{[\s\S]*?overflow-wrap:anywhere;/,"Long floor values must not overflow the sales summary");
  assert.match(css,/generic brand parity: do not apply the reference-project-specific glow/,"Multiple-phase generic logo parity override missing");
  assert.match(css,/filter:none!important;animation:none!important/,"Generic multi-phase logo must not inherit square-revealing template glow");
  assert.match(runtime,/const assetRoot = \["\/", "\/nft\/assets\/"\]\.join\(""\)/,"Mounted NFT mascot path resolver missing");
  assert.doesNotMatch(launch,/888 SOCIETY|888 Society|605141138/,"888 project branding leaked into generic multiple-phase output");
  execFileSync(process.execPath,["--check",path.join(multi.root,"03_NFT-Collection-Terminal/server.js")]);
}finally{fs.rmSync(multi.dir,{recursive:true,force:true})}

assert.throws(()=>generate({...common,nft:{mode:"multiple",mintPhases:[phases[0]]}}),/at least 2 phases/,"Multiple-phase generation must reject one phase");
const overlapping=[phases[0],{...phases[1],startsAt:"2026-08-20T18:59:00+03:00"}];
assert.throws(()=>generate({...common,nft:{mode:"multiple",mintPhases:overlapping}}),/starts before the previous phase ends/,"Generator must reject overlapping mint phases");
console.log("Chapter 16 dual NFT mint structure + canonical parity: PASS");

function readFile(root,rel){return fs.readFileSync(path.join(root,rel),"utf8")}
