"use strict";
const assert=require("assert"),fs=require("fs"),path=require("path"),{normalize}=require("./generator");
const addr="0x1111111111111111111111111111111111111111";
const base={projectName:"NFTONLY",ticker:"NFT",nftContract:addr,features:{whaleTracker:false,memeIntel:false,communityPulse:false,timeline:false,nftTerminal:true,liveMarket:false},nft:{mode:"multiple",mintPhases:[{id:"p1",label:"PHASE 1",startsAt:"2026-08-14T10:00:00+03:00",endsAt:"2026-08-14T11:00:00+03:00",price:"FREE",limit:"1"},{id:"p2",label:"PHASE 2",startsAt:"2026-08-14T11:00:00+03:00",endsAt:"2026-08-14T12:00:00+03:00",price:"0.01 ETH",limit:"2"}]}};
const p=normalize(base);assert.equal(p.token,"");assert.equal(p.features.landing,false);assert.equal(p.features.nftTerminal,true);
const app=fs.readFileSync(path.join(__dirname,"public","app.js"),"utf8");assert(app.includes('function nftOnlyProfile()'));
const css=fs.readFileSync(path.join(__dirname,"public","style.css"),"utf8");assert(css.includes('::-webkit-calendar-picker-indicator'));
const cd=fs.readFileSync(path.join(__dirname,"..","03_NFT-Collection-Terminal-Multi-Phase","public","countdown.js"),"utf8");assert(cd.includes('shortDurationText(phase.endMs - now)} LEFT'));
console.log("[ PASS ] Chapter 22 NFT-only generation regression");
