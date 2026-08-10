"use strict";
const assert = require("assert");
const { generate } = require("./generator");
const base = {
  projectName:"LINKTEST", ticker:"LINK", tokenContract:"0x7a3f4d8c2b1e6f9054a7c2d9e81b3f6a4c5d7e90",
  nftContract:"0xb6e91c4a7d2f8350e19a6c4f728d3b5e901a7c2d",
  features:{whaleTracker:true,memeIntel:true,nftTerminal:true,liveMarket:true},
  nft:{collectionName:"LINKTEST NFT",mode:"single",mintAt:"2026-08-10T15:00:00+03:00",mintPrice:"FREE",mintLimit:"1",mintEndAt:"2026-08-10T16:00:00+03:00",timezone:"Europe/Istanbul",supply:888}
};
function files(input){ return Object.fromEntries(generate(input).entries.map(e=>[e.name.replace(/^LINKTEST_Community_Terminal\//,""),e.data.toString()])); }
function count(haystack, needle){ return haystack.split(needle).length - 1; }

const configured=files({...base,links:{website:"https://example.test",x:"https://x.com/example",telegram:"https://t.me/example",openSea:"https://opensea.io/collection/example"}});
for(const path of ["01_Landing-Page/public/index.html","02_Whale-Activity-Tracker/public/index.html","04_Meme-Intel/public/index.html"]){
  assert(configured[path].includes("Visit LINKTEST Official Website"), `${path}: website row`);
  assert(configured[path].includes("Visit LINKTEST Official X Account"), `${path}: X row`);
  assert(configured[path].includes("Join LINKTEST Official Telegram"), `${path}: Telegram row`);
  assert(configured[path].includes("View LINKTEST NFT Collection on OpenSea"), `${path}: OpenSea row`);
}
const countdown=configured["03_NFT-Collection-Terminal/public/index.html"];
assert(countdown.includes("Visit LINKTEST Official Website"),"NFT countdown website row");
assert(countdown.includes("Visit LINKTEST Official X Account"),"NFT countdown X row");
assert(countdown.includes("Join LINKTEST Official Telegram"),"NFT countdown Telegram row");
assert(countdown.includes("View LINKTEST NFT Collection on OpenSea"),"NFT countdown OpenSea row");
assert(countdown.includes("[ OPENSEA ]"),"NFT countdown reuses OpenSea command tag");
assert(countdown.includes("[ SOCIALS ]"),"NFT countdown reuses Socials command tag");
assert.strictEqual(count(countdown,"View LINKTEST NFT Collection on OpenSea"),1,"NFT countdown does not duplicate OpenSea row");

const nftTerminal=configured["03_NFT-Collection-Terminal/public/terminal.html"];
assert(nftTerminal.includes("Visit LINKTEST Official Website"),"NFT terminal website row");
assert(nftTerminal.includes("Visit LINKTEST Official X Account"),"NFT terminal X row");
assert(nftTerminal.includes("Join LINKTEST Official Telegram"),"NFT terminal Telegram row");
assert(nftTerminal.includes("<span>OpenSea Collection</span>"),"NFT terminal keeps canonical OpenSea collection row");
assert(!nftTerminal.includes('project-info-link-row"><span>OpenSea</span>'),"NFT terminal does not duplicate canonical OpenSea row");

const blank=files({...base,links:{}});
for(const path of ["01_Landing-Page/public/index.html","02_Whale-Activity-Tracker/public/index.html","04_Meme-Intel/public/index.html","03_NFT-Collection-Terminal/public/index.html","03_NFT-Collection-Terminal/public/terminal.html"]){
  assert(!blank[path].includes("Visit LINKTEST Official Website"),`${path}: no blank website row`);
  assert(!blank[path].includes("Visit LINKTEST Official X Account"),`${path}: no blank X row`);
  assert(!blank[path].includes("Join LINKTEST Official Telegram"),`${path}: no blank Telegram row`);
}
assert(!blank["03_NFT-Collection-Terminal/public/index.html"].includes("View LINKTEST NFT Collection on OpenSea"),"NFT countdown omits blank OpenSea row");
assert(blank["03_NFT-Collection-Terminal/public/index.html"].includes("data-opensea-action"),"NFT countdown preserves OpenSea action when unconfigured");
assert(blank["03_NFT-Collection-Terminal/public/project-runtime.js"].includes("OpenSea link not configured for this collection"),"OpenSea action has in-page fallback error");
assert(blank["03_NFT-Collection-Terminal/public/project-runtime.js"].includes('if (infoRow) infoRow.hidden = !openSeaUrl'),"NFT terminal hides canonical OpenSea info row when unconfigured");

const multiBase={...base,nft:{collectionName:"LINKTEST NFT",mode:"multiple",timezone:"Europe/Istanbul",supply:888,mintPhases:[
  {label:"ALLOWLIST",name:"Allowlist",startsAt:"2026-08-10T15:00:00+03:00",endsAt:"2026-08-10T15:10:00+03:00",price:"0.01 ETH",limit:"1 per wallet"},
  {label:"PUBLIC",name:"Public",startsAt:"2026-08-10T15:10:00+03:00",endsAt:"2026-08-10T16:00:00+03:00",price:"0.02 ETH",limit:"2 per wallet"}
]}};
const multiConfigured=files({...multiBase,links:{website:"https://example.test",x:"https://x.com/example",telegram:"https://t.me/example",openSea:"https://opensea.io/collection/example"}});
const multiCountdown=multiConfigured["03_NFT-Collection-Terminal/public/index.html"];
assert.strictEqual(count(multiCountdown,"View LINKTEST NFT Collection on OpenSea"),1,"multi-phase countdown does not duplicate OpenSea row");
assert.strictEqual(count(multiCountdown,"Visit LINKTEST Official X Account"),1,"multi-phase countdown does not duplicate X row");
assert.strictEqual(count(multiCountdown,"Join LINKTEST Official Telegram"),1,"multi-phase countdown has one Telegram row");
const multiBlank=files({...multiBase,links:{}});
assert(!multiBlank["03_NFT-Collection-Terminal/public/index.html"].includes("Visit LINKTEST Official X Account"),"multi-phase countdown omits blank X row");
assert(!multiBlank["03_NFT-Collection-Terminal/public/index.html"].includes("View LINKTEST NFT Collection on OpenSea"),"multi-phase countdown omits blank OpenSea row");
assert(multiBlank["03_NFT-Collection-Terminal/public/index.html"].includes("data-opensea-action"),"multi-phase countdown preserves OpenSea action fallback");

for(const path of ["01_Landing-Page/public/style.css","02_Whale-Activity-Tracker/public/style.css","04_Meme-Intel/public/style.css","03_NFT-Collection-Terminal/public/style.css"]){
  assert(blank[path].includes("grid-template-columns:19ch 17ch 1ch"),`${path}: long status spacing`);
}

const bareUrls=files({...base,links:{website:"www.trial.xyz",x:"x.com/trial",telegram:"t.me/trial",openSea:"opensea.io/collection/trial"}});
for(const path of ["01_Landing-Page/public/index.html","02_Whale-Activity-Tracker/public/index.html","04_Meme-Intel/public/index.html","03_NFT-Collection-Terminal/public/index.html","03_NFT-Collection-Terminal/public/terminal.html"]){
  assert(!bareUrls[path].includes('href="www.trial.xyz"'),`${path}: website is not relative`);
  assert(bareUrls[path].includes('href="https://www.trial.xyz"'),`${path}: bare website normalized to HTTPS`);
}
assert(bareUrls["03_NFT-Collection-Terminal/public/index.html"].includes('href="https://x.com/trial"'),"NFT countdown normalizes bare X URL");
assert(bareUrls["03_NFT-Collection-Terminal/public/index.html"].includes('href="https://t.me/trial"'),"NFT countdown normalizes bare Telegram URL");
assert(bareUrls["03_NFT-Collection-Terminal/public/index.html"].includes('href="https://opensea.io/collection/trial"'),"NFT countdown normalizes bare OpenSea URL");
assert(bareUrls["03_NFT-Collection-Terminal/public/countdown.css"].includes("grid-template-columns:14ch 12ch minmax(0,1fr)"),"single-phase countdown generated link rows have aligned columns");
console.log("Chapter 17 final shared links + terminal row polish contract: PASS");
