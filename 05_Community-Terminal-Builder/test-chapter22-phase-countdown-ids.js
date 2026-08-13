"use strict";
const fs=require("fs"),path=require("path"),os=require("os"),assert=require("assert"),cp=require("child_process");
const {generate,normalize}=require("./generator");
const addr="0x2222222222222222222222222222222222222222";
const input={projectName:"PHASEID",ticker:"NFT",nftContract:addr,features:{whaleTracker:false,memeIntel:false,communityPulse:false,timeline:false,nftTerminal:true,liveMarket:false},nft:{mode:"multiple",collectionName:"Phase ID NFT",timezone:"Europe/Istanbul",mintPhases:[
{label:"ALLOWLIST",name:"First",startsAt:"2026-08-14T18:00:00+03:00",endsAt:"2026-08-14T18:30:00+03:00",price:"FREE",limit:"1",timezone:"Europe/Istanbul"},
{label:"ALLOWLIST",name:"Second",startsAt:"2026-08-14T18:30:00+03:00",endsAt:"2026-08-14T20:30:00+03:00",price:"FREE",limit:"1",timezone:"Europe/Istanbul"},
{label:"PUBLIC",name:"Third",startsAt:"2026-08-14T20:30:00+03:00",endsAt:"2026-08-16T12:30:00+03:00",price:"0.01 ETH",limit:"1",timezone:"Europe/Istanbul"}
]}};
const normalized=normalize(input),ids=normalized.nftSettings.mintPhases.map(p=>p.id);
assert.strictEqual(ids.length,3);assert.strictEqual(new Set(ids).size,3,"duplicate phase labels must not create duplicate internal IDs");
const result=generate(input),tmp=fs.mkdtempSync(path.join(os.tmpdir(),"ctb22-phaseid-")),zip=path.join(tmp,result.filename);fs.writeFileSync(zip,result.buffer);cp.execFileSync("unzip",["-q",zip,"-d",tmp]);
const root=path.join(tmp,"PHASEID_Community_Terminal"),html=fs.readFileSync(path.join(root,"03_NFT-Collection-Terminal","public","index.html"),"utf8");
for(const id of ids){assert(html.includes(`phaseCard-${id}`),`missing card ${id}`);assert(html.includes(`phaseCountdown-${id}`),`missing countdown ${id}`)}
const app=fs.readFileSync(path.join(__dirname,"public","app.js"),"utf8");assert(app.includes('const id=`phase-${i+1}`'),"Builder phase IDs must be position-based and label-independent");
console.log("[ PASS ] Chapter 22 duplicate phase-label countdown regression");
