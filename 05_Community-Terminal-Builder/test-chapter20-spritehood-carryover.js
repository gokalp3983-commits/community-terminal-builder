"use strict";
const fs=require("fs");
const path=require("path");
const root=path.resolve(__dirname,"..");
const mods=["03_NFT-Collection-Terminal","03_NFT-Collection-Terminal-Multi-Phase"];
function read(m,f){return fs.readFileSync(path.join(root,m,"public",f),"utf8");}
function ok(cond,msg){if(!cond){throw new Error(msg)} console.log(`[ PASS ] ${msg}`)}
for(const m of mods){
  const script=read(m,"script.js"), style=read(m,"style.css"), countdown=read(m,"countdown.css"), index=read(m,"index.html");
  ok(script.includes('const PENDING_MINT_DATA = "Pending mint...";'),`${m}: compact pending data wording`);
  ok(script.includes('elements.marketUpdated.textContent = formatMarketTime(new Date());'),`${m}: pre-mint Updated uses actual time`);
  ok(script.includes('elements.marketLastSaleStatus')&&script.includes('elements.marketHighestSaleStatus'),`${m}: all market status tags included`);
  ok(script.includes('function responsiveBoot('),`${m}: responsive terminal boot copy`);
  ok(style.includes('grid-template-columns:11.5ch 12ch 1ch minmax(0,1fr)!important'),`${m}: mobile market row alignment`);
  ok(countdown.includes('.mobile-launch-tag{display:none}')&&countdown.includes('var(--cyan,#6FD3FF)'),`${m}: compact mobile tags + CTB ice-blue actions`);
  ok(index.includes('log-copy-mobile'),`${m}: mobile countdown boot copy`);
  ok(!script.includes('NFT Contract pending.')&&!script.includes('Mint time TBA.'),`${m}: no Spritehood TBA contract/schedule states`);
  ok(!style.includes('#FEDE17')&&!style.includes('#C77DFF'),`${m}: no Spritehood palette carry-over`);
}
const generator=fs.readFileSync(path.join(__dirname,'generator.js'),'utf8');
ok(generator.includes('mobileTag')&&generator.includes('[${mobileTag}]'),'generator emits compact mobile project-link tags');
console.log('Chapter 20 Spritehood QA carry-over regression: PASS');
