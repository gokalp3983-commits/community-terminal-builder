"use strict";
const assert=require("assert"),fs=require("fs"),path=require("path"),{normalize}=require("./generator");
const addr="0x1111111111111111111111111111111111111111";
const base={projectName:"NFTONLY",ticker:"NFT",nftContract:addr,features:{whaleTracker:false,memeIntel:false,communityPulse:false,timeline:false,nftTerminal:true,liveMarket:false},nft:{mode:"multiple",mintPhases:[{id:"p1",label:"PHASE 1",startsAt:"2026-08-14T10:00:00+03:00",endsAt:"2026-08-14T11:00:00+03:00",price:"FREE",limit:"1"},{id:"p2",label:"PHASE 2",startsAt:"2026-08-14T11:00:00+03:00",endsAt:"2026-08-14T12:00:00+03:00",price:"0.01 ETH",limit:"2"}]}};
const p=normalize(base);assert.equal(p.token,"");assert.equal(p.features.landing,false);assert.equal(p.features.nftTerminal,true);
const app=fs.readFileSync(path.join(__dirname,"public","app.js"),"utf8");assert(app.includes('function nftOnlyProfile()'));
assert(app.includes('function projectNftOnlyProfile(project)'),"Build/deploy UI must recognize a true NFT-only project");
assert(app.includes('if(projectNftOnlyProfile(project))return ["NFT"]'),"NFT-only build modal must not advertise LANDING");
assert(app.includes('project?.nft?.mode==="terminal"?"/nft/terminal":"/nft"'),"NFT-only public link must point to the actual NFT entry route");
assert(app.includes('const url=projectPublicEntryUrl(value);'),"Terminal Ready live link must use the NFT-only entry route");
assert(app.includes('const url=projectPublicEntryUrl(publicUrl);'),"Deployment success link must use the NFT-only entry route");

const html=fs.readFileSync(path.join(__dirname,"public","index.html"),"utf8");
assert(!/name="tokenContract"[^>]*\srequired(?:\s|>)/.test(html),"Token CA must not be hard-coded required in HTML; NFT-only projects must reach CTB conditional validation");
assert(app.includes('function syncTokenRequirement()'),"Builder must dynamically require Token CA only for token-based profiles");
assert(app.includes('input.required=required'),"Token CA native browser requirement must follow the selected profile");
const css=fs.readFileSync(path.join(__dirname,"public","style.css"),"utf8");assert(css.includes('::-webkit-calendar-picker-indicator'));
const cd=fs.readFileSync(path.join(__dirname,"..","03_NFT-Collection-Terminal-Multi-Phase","public","countdown.js"),"utf8");assert(cd.includes('shortDurationText(phase.endMs - now)} LEFT'));
console.log("[ PASS ] Chapter 22 NFT-only generation regression");
