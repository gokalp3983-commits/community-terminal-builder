"use strict";
const fs=require("fs");
const path=require("path");
const {generate}=require("./generator");
const ROOT=path.resolve(__dirname,"..");
function text(rel){return fs.readFileSync(path.join(ROOT,rel),"utf8")}
function ok(cond,label){if(!cond)throw new Error(`[ FAIL ] ${label}`);console.log(`[ PASS ] ${label}`)}
const singleIndex=text("03_NFT-Collection-Terminal/public/index.html");
const singleTerminal=text("03_NFT-Collection-Terminal/public/terminal.html");
const singleCss=text("03_NFT-Collection-Terminal/public/countdown.css");
const multiIndex=text("03_NFT-Collection-Terminal-Multi-Phase/public/index.html");
const multiCss=text("03_NFT-Collection-Terminal-Multi-Phase/public/countdown.css");
const app=text("05_Community-Terminal-Builder/public/app.js");
const builderHtml=text("05_Community-Terminal-Builder/public/index.html");
ok(builderHtml.includes('name="nftMintEndDate"')&&builderHtml.includes('name="nftMintEndTime"'),"single-phase builder exposes end date/time");
ok(app.includes('seed.endDate=val("nftMintEndDate")')&&app.includes('seed.endTime=val("nftMintEndTime")'),"single -> multi transfers full end schedule");
ok(app.includes('setValue("nftMintEndDate",first.endDate)')&&app.includes('setValue("nftMintEndTime",first.endTime)'),"multi -> single restores full end schedule");
ok(app.includes('height:86px')&&app.includes('max-height:86px'),"Builder Preview mascot uses generated-header scale slot");
ok(singleIndex.indexOf('id="countdownValue"')<singleIndex.indexOf('single-phase-details'),"single-phase mint details appear below primary countdown");
ok(singleCss.includes('grid-template-columns:13ch minmax(0,1fr)!important'),"single countdown prompt uses fixed status/message columns");
ok(multiCss.includes('.phase-details{border-top:0!important}'),"multi phase removes blue detail divider");
ok(multiCss.includes('margin-left:0!important')&&multiCss.includes('width:100%!important'),"multi phase mint details align with countdown column");
ok(singleIndex.includes('data-project-mascot')&&singleTerminal.includes('src="__CTB_MASCOT_PATH__"'),"single NFT pages render mascot explicitly");
ok(multiIndex.includes('data-project-mascot'),"multi countdown renders mascot explicitly");
for(const [name,src] of [["single countdown",singleIndex],["single terminal",singleTerminal],["multi countdown",multiIndex]]){
  ok(!src.includes("View listings and collection activity through the official OpenSea link."),`${name}: obsolete OpenSea footer sentence removed`);
  ok(src.includes("Collection statistics powered by OpenSea API."),`${name}: OpenSea API note retained`);
  ok(src.includes("Built by Gokalp"),`${name}: canonical footer credit`);
}
const common={projectName:"TEST20",ticker:"TEST20",version:"1.0.0",description:"Acceptance test",promptUser:"test20",promptHost:"terminal",ecosystem:"Robinhood Chain",tokenContract:"0x7A3F9C2B1D6E4F8A5C0B7D9E2F1A6C3B8D4E5F90",nftContract:"0xB4E8D1C7A9F3056E2C8B7A4D1F9E6C3A5B0D2F71",dexScreenerChainId:"robinhood",blockscoutApiBase:"https://robinhoodchain.blockscout.com/api/v2",links:{website:"https://example.com",x:"@test20",telegram:"https://t.me/test20",openSea:"https://opensea.io/collection/test20"},features:{whaleTracker:true,memeIntel:true,communityPulse:true,timeline:true,nftTerminal:true,liveMarket:true},mascot:{dataBase64:"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z3i8AAAAASUVORK5CYII=",extension:"png",name:"logo.png"}};
const single=generate({...common,nft:{collectionName:"TEST20 NFT",supply:8888,mode:"single",mintAt:"2026-08-15T20:00:00+03:00",mintEndAt:"2026-08-15T22:00:00+03:00",mintPrice:"0.05 ETH",mintLimit:"2",timezone:"Europe/Bucharest"}});
const multi=generate({...common,nft:{collectionName:"TEST20 NFT",supply:8888,mode:"multiple",timezone:"Europe/Bucharest",mintPhases:[{label:"PHASE 1",name:"Allowlist",startsAt:"2026-08-15T20:00:00+03:00",endsAt:"2026-08-15T21:00:00+03:00",price:"FREE",limit:"1",timezone:"Europe/Bucharest"},{label:"PHASE 2",name:"Public",startsAt:"2026-08-15T21:00:00+03:00",endsAt:"2026-08-15T23:00:00+03:00",price:"0.05 ETH",limit:"2",timezone:"Europe/Bucharest"}]}});
function entry(gen,suffix){const e=gen.entries.find(x=>x.name.endsWith(suffix));if(!e)throw new Error(`missing generated ${suffix}`);return Buffer.isBuffer(e.data)?e.data.toString("utf8"):String(e.data)}
for(const [label,gen] of [["single",single],["multi",multi]]){
  const countdown=entry(gen,"/03_NFT-Collection-Terminal/public/index.html");
  const terminal=entry(gen,"/03_NFT-Collection-Terminal/public/terminal.html");
  ok(countdown.includes('/nft/assets/test20-mascot.png'),`${label}: generated countdown mascot uses mounted NFT asset path`);
  ok(terminal.includes('/nft/assets/test20-mascot.png'),`${label}: generated terminal mascot has mounted NFT asset path`);
  ok(countdown.includes('official TEST20 team')&&terminal.includes('official TEST20 team'),`${label}: ticker-derived project disclaimer retained`);
  ok(countdown.includes('TEST20 Community Terminal'),`${label}: canonical Community Terminal footer title`);
}
ok(single.project.nftSettings.mintEndAt==="2026-08-15T22:00:00+03:00","single generation preserves mint end timestamp");
console.log("Chapter 20 Acceptance regression: PASS");
