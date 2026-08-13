"use strict";
const fs=require("fs");
const path=require("path");
const {generate}=require("./generator");
const ROOT=path.resolve(__dirname,"..");
function text(rel){return fs.readFileSync(path.join(ROOT,rel),"utf8")}
function ok(cond,label){if(!cond)throw new Error(`[ FAIL ] ${label}`);console.log(`[ PASS ] ${label}`)}
const mods=["03_NFT-Collection-Terminal","03_NFT-Collection-Terminal-Multi-Phase"];
for(const mod of mods){
  const html=text(`${mod}/public/terminal.html`);
  const js=text(`${mod}/public/script.js`);
  const css=text(`${mod}/public/style.css`);
  for(const command of ["whales","movers","activity","sales","pulse"]){
    ok(html.includes(`data-nft-quick-command="${command}"`),`${mod}: ${command.toUpperCase()} primary button present`);
  }
  for(const command of ["whales","entrants","movers","retention","activity","sales","pulse","wallet ","clear"]){
    ok(html.includes(`data-nft-guide-command="${command}"`),`${mod}: ${command} guide command present`);
  }
  ok(!html.includes('data-nft-guide-command="help"')&&!html.includes('data-nft-quick-command="help"'),`${mod}: no help command in UI`);
  ok(!js.includes('lower==="help"')&&!js.includes('nftCmdHelp'),`${mod}: no help command in dispatcher`);
  ok(html.includes('id="nftCommandInput"')&&html.includes('data-project-prompt'),`${mod}: project-derived command prompt present`);
  ok(js.includes('async function nftExecuteCommand')&&js.includes('async function nftCmdWallet')&&js.includes('async function nftCmdMovers')&&js.includes('async function nftCmdRetention'),`${mod}: post-mint command dispatcher and intelligence commands present`);
  ok(!html.includes('data-nft-guide-command="mint"')&&!html.includes('data-nft-guide-command="minters"')&&!html.includes('data-nft-guide-command="velocity"'),`${mod}: mint-related commands removed from post-mint command surface`);
  ok(!html.includes('data-nft-guide-command="floor"')&&!html.includes('data-nft-guide-command="collection"')&&!html.includes('data-nft-guide-command="contract"')&&!html.includes('data-nft-guide-command="refresh"'),`${mod}: redundant page-data/refresh commands removed`);
  ok(js.includes('data-copy-wallet')&&js.includes('↗'),`${mod}: whale wallet copy + Blockscout actions present`);
  ok(js.includes('data-nft-back')&&js.includes('Back to commands'),`${mod}: back-to-commands control present`);
  ok(css.includes('CTB Chapter 21A — NFT Terminal command interface'),`${mod}: NFT command styles present`);
}
const common={projectName:"CH21TEST",ticker:"CH21",version:"1.0.0",description:"Chapter 21 test",promptUser:"ch21",promptHost:"robinhood",ecosystem:"Robinhood Chain",tokenContract:"0x7A3F9C2B1D6E4F8A5C0B7D9E2F1A6C3B8D4E5F90",nftContract:"0xB4E8D1C7A9F3056E2C8B7A4D1F9E6C3A5B0D2F71",dexScreenerChainId:"robinhood",blockscoutApiBase:"https://robinhoodchain.blockscout.com/api/v2",links:{website:"https://example.com",x:"@ch21",telegram:"https://t.me/ch21",openSea:"https://opensea.io/collection/ch21"},features:{whaleTracker:true,memeIntel:true,communityPulse:true,timeline:true,nftTerminal:true,liveMarket:true}};
const single=generate({...common,nft:{collectionName:"CH21 NFT",supply:5000,mode:"single",mintAt:"2026-08-20T20:00:00+03:00",mintEndAt:"2026-08-20T22:00:00+03:00",mintPrice:"0.05 ETH",mintLimit:"2",timezone:"Europe/Bucharest"}});
const multi=generate({...common,nft:{collectionName:"CH21 NFT",supply:5000,mode:"multiple",timezone:"Europe/Bucharest",mintPhases:[{label:"PHASE 1",name:"First",startsAt:"2026-08-20T20:00:00+03:00",endsAt:"2026-08-20T21:00:00+03:00",price:"FREE",limit:"1",timezone:"Europe/Bucharest"},{label:"PHASE 2",name:"Second",startsAt:"2026-08-20T21:00:00+03:00",endsAt:"2026-08-20T23:00:00+03:00",price:"0.05 ETH",limit:"2",timezone:"Europe/Bucharest"}]}});
function entry(gen,suffix){const e=gen.entries.find(x=>x.name.endsWith(suffix));if(!e)throw new Error(`missing ${suffix}`);return Buffer.isBuffer(e.data)?e.data.toString("utf8"):String(e.data)}
for(const [label,gen] of [["single",single],["multi",multi]]){
  const html=entry(gen,"/03_NFT-Collection-Terminal/public/terminal.html");
  const js=entry(gen,"/03_NFT-Collection-Terminal/public/script.js");
  ok(html.includes('data-nft-quick-command="whales"')&&html.includes('data-nft-quick-command="movers"')&&html.includes('data-nft-quick-command="activity"')&&html.includes('data-nft-quick-command="sales"')&&html.includes('data-nft-quick-command="pulse"')&&!html.includes('data-nft-quick-command="wallet "'),`${label}: generated NFT terminal keeps exact five post-mint quick commands`);
  ok(js.includes('async function nftExecuteCommand'),`${label}: generated NFT terminal keeps command engine`);
  ok(!html.includes('data-nft-guide-command="help"')&&!js.includes('lower==="help"'),`${label}: generated NFT terminal remains help-free`);
}
console.log("Chapter 21A NFT Terminal command regression: PASS");
