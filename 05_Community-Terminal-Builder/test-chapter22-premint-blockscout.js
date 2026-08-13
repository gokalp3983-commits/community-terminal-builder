"use strict";
const fs=require("fs");
const path=require("path");
function ok(v,m){if(!v)throw new Error(m);console.log("[ OK ]",m);}
const root=path.resolve(__dirname,"..");
for(const dir of ["03_NFT-Collection-Terminal","03_NFT-Collection-Terminal-Multi-Phase"]){
  const server=fs.readFileSync(path.join(root,dir,"server.js"),"utf8");
  const script=fs.readFileSync(path.join(root,dir,"public","script.js"),"utf8");
  ok(server.includes("function isScheduledPreMint()"),`${dir}: scheduled pre-mint detector exists`);
  ok(server.includes("function pendingMintStats()"),`${dir}: pending mint payload exists`);
  ok(server.includes("function pendingHolderAnalytics()"),`${dir}: pending holder payload exists`);
  ok(server.includes("function pendingNftActivityData()"),`${dir}: pending activity payload exists`);
  ok(server.includes("blockscoutHttpStatus(error) === 404 && isScheduledPreMint()"),`${dir}: Blockscout 404 is softened only during scheduled pre-mint`);
  ok(server.includes("Mint has not started; no NFT holders indexed yet."),`${dir}: no-holder pre-mint state is explicit`);
  ok(server.includes("Mint has not started; awaiting on-chain NFT activity."),`${dir}: activity pre-mint state is explicit`);
  ok(script.includes('activity.pending?"AWAITING ACTIVITY"'),`${dir}: NFT Pulse shows awaiting activity`);
  ok(script.includes('whales.pending?"NO HOLDERS YET"'),`${dir}: NFT Pulse shows no holders yet`);
}
console.log("Chapter 22 pre-mint Blockscout graceful-state regression: PASS");
