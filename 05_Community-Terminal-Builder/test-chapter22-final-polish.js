"use strict";
const fs=require("fs");
const path=require("path");
const {generate}=require("./generator");
function ok(v,m){if(!v)throw new Error(m);console.log("[ OK ]",m);}
const root=path.resolve(__dirname,"..");
for(const rel of [
  "03_NFT-Collection-Terminal/public/project-runtime.js",
  "03_NFT-Collection-Terminal-Multi-Phase/public/project-runtime.js"
]){
  const src=fs.readFileSync(path.join(root,rel),"utf8");
  ok(src.includes('const currentSrc = String(e.getAttribute("src") || "")'),`${rel}: preserves server-rendered mascot src`);
  ok(src.includes('if (!currentSrc)'),`${rel}: only hydrates mascot when src is absent`);
}
const input={
  projectName:"Polish Project",ticker:"$POLISH",version:"1.0.0",description:"Chapter 22 final polish",promptUser:"polish",promptHost:"terminal",ecosystem:"Robinhood Chain",
  tokenContract:"0x1111111111111111111111111111111111111111",nftContract:"0x2222222222222222222222222222222222222222",
  dexScreenerChainId:"robinhood",blockscoutApiBase:"https://robinhoodchain.blockscout.com/api/v2",
  links:{website:"https://example.com",x:"@polish",openSea:"https://opensea.io/collection/polish"},
  features:{landing:true,whaleTracker:true,memeIntel:true,communityPulse:true,timeline:true,nftTerminal:true,liveMarket:true},
  nft:{mode:"multiple",collectionName:"POLISH NFT",supply:1000,mintPhases:[
    {id:"phase-1",label:"ALLOWLIST",startsAt:"2026-08-14T10:00:00+03:00",endsAt:"2026-08-14T11:00:00+03:00",price:"FREE",limit:"1"},
    {id:"phase-2",label:"PUBLIC",startsAt:"2026-08-14T11:00:00+03:00",endsAt:"2026-08-14T12:00:00+03:00",price:"0.01 ETH",limit:"2"}
  ]}
};
const g=generate(input);
const footers=g.entries.filter(e=>e.name.endsWith('/public/canonical-footer.js')).map(e=>String(Buffer.isBuffer(e.data)?e.data.toString('utf8'):e.data));
ok(footers.length>=1,"generated canonical footers found");
for(const footer of footers){
  ok(footer.includes("POLISH PROJECT Community Terminal"),"footer title uses project name");
  ok(!footer.includes("POLISH Community Terminal"),"footer title does not substitute ticker for project name");
  ok(footer.includes("official POLISH PROJECT team."),"footer disclaimer uses project name");
  ok(!footer.includes("official POLISH team."),"footer disclaimer does not substitute ticker for project name");
  ok(!footer.includes("official $POLISH team."),"footer disclaimer never uses dollar-prefixed ticker");
}
for(const suffix of [
  '/03_NFT-Collection-Terminal/public/project-runtime.js'
]){
  const entry=g.entries.find(e=>e.name.endsWith(suffix));
  ok(entry,"generated NFT runtime found");
  const src=String(Buffer.isBuffer(entry.data)?entry.data.toString('utf8'):entry.data);
  ok(src.includes('const currentSrc = String(e.getAttribute("src") || "")'),"generated NFT runtime preserves SSR mascot src");
}
console.log("Chapter 22 final polish mascot + project-name footer regression: PASS");
