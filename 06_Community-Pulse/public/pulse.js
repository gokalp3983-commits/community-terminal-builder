"use strict";
const CFG=window.PROJECT_CONFIG;
const byId=id=>document.getElementById(id);
const n=v=>{const x=Number(String(v??"").replace(/[^0-9+-.]/g,""));return Number.isFinite(x)?x:0};
const fmt=v=>Number(v||0).toLocaleString(undefined,{maximumFractionDigits:2});
async function api(path){const r=await fetch(path,{headers:{accept:"application/json"}});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||`HTTP ${r.status}`);return data}
function setSignal(prefix,state,evidence,tone=""){
  const s=byId(`${prefix}State`),e=byId(`${prefix}Evidence`);s.textContent=state;s.className=tone;e.textContent=evidence;
}
function marketSignal(m){const ch=n(m.priceChange24h);if(ch>5)return ["RISING",`24h price change ${fmt(ch)}%.`,"positive"];if(ch<-5)return ["FALLING",`24h price change ${fmt(ch)}%.`,"negative"];return ["STABLE / MIXED",`24h price change ${fmt(ch)}%.`,""]}
function holderSignal(s){const top=n(s.stats?.top10Percentage);if(!top)return ["AVAILABLE",`${s.metadata?.holdersCount??s.metadata?.totalHolders??"Current"} holders observed.`,""];if(top>40)return ["CONCENTRATED",`Top-10 holders control ${fmt(top)}% of tracked supply.`,"negative"];if(top<20)return ["DISTRIBUTED",`Top-10 holders control ${fmt(top)}% of tracked supply.`,"positive"];return ["MODERATE",`Top-10 holders control ${fmt(top)}% of tracked supply.`,""]}
function whaleSignal(a){const net=n(a.top30Summary?.netFlow),acc=n(a.top30Summary?.accumulating),dist=n(a.top30Summary?.distributing);if(net>0)return ["ACCUMULATING",`Top-30 net flow +${fmt(net)}; ${acc} accumulating vs ${dist} distributing.`,"positive"];if(net<0)return ["DISTRIBUTING",`Top-30 net flow ${fmt(net)}; ${acc} accumulating vs ${dist} distributing.`,"negative"];return ["NEUTRAL",`${acc} accumulating vs ${dist} distributing; net flow is flat.`,""]}
function freshSignal(a){const rows=(a.topBuyers||[]).filter(r=>r.holderRank==null||r.classification==="unranked_holder");const flow=rows.reduce((x,r)=>x+n(r.bought),0);if(rows.length>=5)return ["ACTIVE",`${rows.length} unranked buyer wallets observed; ${fmt(flow)} tokens of classified inflow.`,"positive"];if(rows.length)return ["LIGHT",`${rows.length} unranked buyer wallet${rows.length===1?"":"s"} observed.`,""];return ["QUIET","No unranked buyer flow is visible in the current activity cache.",""]}
function overall(signals){let score=0,used=0;for(const [, ,tone] of signals){if(tone==="positive")score++,used++;else if(tone==="negative")score--,used++;else used++;}if(!used)return ["INSUFFICIENT DATA","No reliable signals are available yet.",""];if(score>=2)return ["CONSTRUCTIVE",`${used} live signal groups available; positive evidence currently outweighs negative evidence.`,"positive"];if(score<=-2)return ["CAUTIOUS",`${used} live signal groups available; negative evidence currently outweighs positive evidence.`,"negative"];return ["MIXED / NEUTRAL",`${used} live signal groups available; evidence is currently mixed.`,""]}
async function start(){
  const status=byId("pulseStatus");
  const nftOn=Boolean(CFG.features?.nftTerminal&&CFG.contracts?.nft);
  setSignal("nft",nftOn?"CONFIGURED":"NOT ENABLED",nftOn?`${CFG.nft?.collectionName||CFG.project.name+" NFT"} is connected to this Community Terminal.`:"NFT Terminal is not enabled for this project.",nftOn?"positive":"");
  const signals=[];
  try{const m=await api("/api/market");const s=marketSignal(m);setSignal("market",...s);signals.push(s)}catch(e){setSignal("market","UNAVAILABLE",e.message,"negative")}
  try{const sdata=await api("/api/stats");const s=holderSignal(sdata);setSignal("holder",...s);signals.push(s)}catch(e){setSignal("holder","UNAVAILABLE",e.message,"negative")}
  try{const a=await api("/api/activity?hours=24");const w=whaleSignal(a),f=freshSignal(a);setSignal("whale",...w);setSignal("fresh",...f);signals.push(w,f)}catch(e){setSignal("whale","BUILDING","Recent classified whale activity is still building.","");setSignal("fresh","BUILDING","Fresh-wallet activity is still building.","")}
  const o=overall(signals);setSignal("overall",...o);status.textContent=`[ READY ] ${CFG.project.name} Community Pulse updated ${new Date().toLocaleTimeString()}.`;
}
start();setInterval(start,60000);
