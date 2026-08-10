"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { generate } = require("./generator");

const ADDRESS = {
  token: "0x1111111111111111111111111111111111111111",
  nft: "0x2222222222222222222222222222222222222222",
};
const scenarios = [
  { name:"TOKENONLY", ticker:"TOK", features:{whaleTracker:true,memeIntel:true,nftTerminal:false,liveMarket:true} },
  { name:"NFTFULL", ticker:"NFT", nftContract:ADDRESS.nft, features:{whaleTracker:true,memeIntel:true,nftTerminal:true,liveMarket:true}, nft:{collectionName:"NFTFULL Collection",openSeaSlug:"nftfull",supply:1000,whaleThreshold:10,mode:"single",mintAt:"2026-08-20T19:00:00+03:00",mintPrice:"FREE",mintLimit:"1",timezone:"Europe/Bucharest"} },
  { name:"MINIMAL", ticker:"MIN", features:{whaleTracker:false,memeIntel:false,nftTerminal:false,liveMarket:false} },
  { name:"CUSTOMNEON", ticker:"NEON", ecosystem:"Custom Chain", promptUser:"root", promptHost:"neon", dexScreenerChainId:"custom", blockscoutApiBase:"https://explorer.example/api/v2", colors:{primary:"#00ffff",accent:"#ff00ff",background:"#010102",panel:"#080812"}, links:{website:"https://example.com",x:"https://x.com/example",telegram:"https://t.me/example",explorer:"https://explorer.example"}, features:{whaleTracker:true,memeIntel:false,nftTerminal:false,liveMarket:true} },
];
let generated = 0;
let routeChecks = 0;
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "ctb-ch9-"));
function pass(label){ console.log(`[ PASS ] ${label}`); }
function check(ok,label){ if(!ok) throw new Error(`[ FAIL ] ${label}`); pass(label); }
try {
  for (const item of scenarios) {
    const result = generate({ projectName:item.name,ticker:item.ticker,tokenContract:ADDRESS.token,nftContract:item.nftContract||"",ecosystem:item.ecosystem,promptUser:item.promptUser,promptHost:item.promptHost,dexScreenerChainId:item.dexScreenerChainId,blockscoutApiBase:item.blockscoutApiBase,colors:item.colors,links:item.links,nft:item.nft,features:item.features });
    check(result.buffer.readUInt32LE(0)===0x04034b50,`${item.name}: valid ZIP`);
    const zipPath=path.join(temp,result.filename); fs.writeFileSync(zipPath,result.buffer); execFileSync("unzip",["-q",zipPath,"-d",temp]);
    const dir=path.join(temp,`${item.name}_Community_Terminal`);
    const cfg=JSON.parse(execFileSync(process.execPath,["-e","const c=require('./config');process.stdout.write(JSON.stringify(c))"],{cwd:dir}).toString());
    check(cfg.project.name===item.name,`${item.name}: active generated profile`);
    check(cfg.features.nftTerminal===Boolean(item.nftContract&&item.features.nftTerminal),`${item.name}: NFT feature state`);
    const release=JSON.parse(fs.readFileSync(path.join(dir,"terminal-release.json"),"utf8"));
    check(release.builder.version==="1.3.2-b"&&release.releaseStatus==="deployment-ready",`${item.name}: release provenance metadata`);
    check(Array.isArray(release.enabledModules)&&release.enabledModules.includes("landing"),`${item.name}: release module manifest`);
    for(const file of ["package.json","server.js","render.yaml",".env.example","README.md","validate-generated.js","verify-deployment.js","terminal-release.json","01_Landing-Page/public/favicon.png"]) check(fs.existsSync(path.join(dir,file)),`${item.name}: ${file}`);
    const server=fs.readFileSync(path.join(dir,"server.js"),"utf8");
    for(const route of ["/health","/healthz","/status"]){check(server.includes(`app.get(\"${route}\"`),`${item.name}: ${route} diagnostic route`);routeChecks++;}
    check(server.includes('if(config.features.whaleTracker)'),`${item.name}: feature-aware whale mount`);
    check(server.includes('if(config.features.memeIntel)'),`${item.name}: feature-aware intel mount`);
    check(server.includes('if(config.features.nftTerminal)'),`${item.name}: feature-aware NFT mount`);
    execFileSync(process.execPath,["validate-generated.js","verify-deployment.js"],{cwd:dir,stdio:"pipe"});
    const landingServer=fs.readFileSync(path.join(dir,"01_Landing-Page/server.js"),"utf8");
    check(landingServer.includes("contracts: config.contracts")&&landingServer.includes("dexScreenerChainId: config.market.dexScreenerChainId"),`${item.name}: landing receives contract and chain config`);
    check(!landingServer.includes('["WETH", "ETH"].includes(quoteSymbol)')&&landingServer.includes("quoteSymbol"),`${item.name}: landing market selector accepts dynamic quote assets`);
    const landing=fs.readFileSync(path.join(dir,"01_Landing-Page/public/script.js"),"utf8");
    const landingHtml=fs.readFileSync(path.join(dir,"01_Landing-Page/public/index.html"),"utf8");
    check(landingHtml.includes('rel="icon"'),`${item.name}: generated favicon link`);
    check(landingHtml.includes('data-token-contract')&&landingHtml.includes('data-copy-token-contract'),`${item.name}: full contract identity row and copy control`);
    check(landing.includes('PAIR NOT FOUND') || landing.includes('reason'),`${item.name}: explicit market error states`);
    check(landing.includes('market.quoteSymbol'),`${item.name}: landing displays dynamic quote symbol`);
    const render=fs.readFileSync(path.join(dir,"render.yaml"),"utf8");
    check(render.includes("healthCheckPath: /healthz"),`${item.name}: Render uses healthz`);
    const verifier=fs.readFileSync(path.join(dir,"verify-deployment.js"),"utf8");
    check(verifier.includes('get("/healthz")')&&verifier.includes("[ RETRY ]"),`${item.name}: public verifier uses healthz with retries`);
    if (item.features.whaleTracker) {
      const whaleServer = fs.readFileSync(path.join(dir,"02_Whale-Activity-Tracker/server.js"),"utf8");
      check(!whaleServer.includes('["WETH", "ETH"].includes(quote)'),`${item.name}: whale market selector accepts non-WETH quotes`);
      check(whaleServer.includes('pairQuoteSymbol'),`${item.name}: whale market reports dynamic quote symbol`);
    }
    if (item.features.memeIntel) {
      const intelServer = fs.readFileSync(path.join(dir,"04_Meme-Intel/server.js"),"utf8");
      check(!intelServer.includes('["WETH", "ETH"].includes(quote)'),`${item.name}: intel market selector accepts non-WETH quotes`);
      check(intelServer.includes('pairQuoteSymbol'),`${item.name}: intel market reports dynamic quote symbol`);
    }
    const textFiles=[];
    function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const f=path.join(d,e.name);if(e.isDirectory()){if(!["assets","node_modules"].includes(e.name))walk(f)}else if(/\.(js|html|css|json|yaml|md|example)$/.test(e.name))textFiles.push(f)}}
    walk(dir);
    const combined=textFiles.filter(f=>!f.includes(`${path.sep}README.md`)).map(f=>fs.readFileSync(f,"utf8")).join("\n");
    check(!combined.includes("0xe934e36A439C94017B64a3FecE66AF12099aBF50")&&!combined.includes("0x8e62F281f282686fCa6dCB39288069a93fC23F1c"),`${item.name}: no legacy token contract leakage`);
    generated++;
  }
  console.log(`\n[ RELEASE ] RC1`);
  console.log(`[ PASS ] Test profiles: ${scenarios.length}`);
  console.log(`[ PASS ] Generated ZIPs verified: ${generated}`);
  console.log(`[ PASS ] Diagnostic routes checked: ${routeChecks}`);
  console.log(`[ PASS ] Critical known issues: 0 in offline release suite`);
} finally { fs.rmSync(temp,{recursive:true,force:true}); }
