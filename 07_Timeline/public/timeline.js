"use strict";
const CFG=window.PROJECT_CONFIG,list=document.getElementById("timelineList");
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function add(events,date,title,detail,type="MILESTONE",url=""){const ts=Date.parse(date||"");events.push({date:date||"",ts:Number.isFinite(ts)?ts:null,title,detail,type,url})}
function build(){const events=[];for(const e of CFG.timeline?.events||[])add(events,e.date,e.title,e.detail,e.type||"COMMUNITY",e.url||"");
  const nft=CFG.nft||{};if(CFG.features?.nftTerminal&&CFG.contracts?.nft){if(nft.mode==="multiple"&&Array.isArray(nft.mintPhases)){for(const p of nft.mintPhases){add(events,p.startsAt,`${p.name||p.label} mint opens`,`${p.label||"NFT phase"} begins${p.price&&p.price!=="—"?` · ${p.price}`:""}${p.limit&&p.limit!=="—"?` · ${p.limit}`:""}.`,"NFT");add(events,p.endsAt,`${p.name||p.label} mint closes`,`${p.label||"NFT phase"} scheduled end.`,"NFT")}}else if(nft.mintAt){add(events,nft.mintAt,`${nft.collectionName||CFG.project.name+" NFT"} mint`,"Configured NFT mint launch time.","NFT")}}
  events.sort((a,b)=>a.ts==null?1:b.ts==null?-1:a.ts-b.ts);
  if(!events.length){list.innerHTML=`<div class="timeline-empty"><span>[ READY ]</span><strong>No historical milestones configured yet.</strong><small>The Timeline module is active and ready for project/community milestones.</small></div>`;return}
  list.innerHTML=events.map(e=>`<article class="timeline-event"><div class="timeline-marker" aria-hidden="true">●</div><div class="timeline-event-body"><div class="timeline-meta"><span>[ ${esc(e.type)} ]</span><time>${esc(e.ts!=null?new Date(e.ts).toLocaleString():e.date||"DATE TBD")}</time></div><h2>${esc(e.title)}</h2><p>${esc(e.detail||"")}</p>${e.url?`<a href="${esc(e.url)}" target="_blank" rel="noopener noreferrer">Open source / announcement ↗</a>`:""}</div></article>`).join("")}
build();
