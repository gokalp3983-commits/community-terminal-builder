"use strict";
const assert=require("assert");
const fs=require("fs");
const path=require("path");
const ROOT=path.resolve(__dirname,"..");
const read=rel=>fs.readFileSync(path.join(ROOT,rel),"utf8");
const html=read("05_Community-Terminal-Builder/public/index.html");
const app=read("05_Community-Terminal-Builder/public/app.js");
const generator=read("05_Community-Terminal-Builder/generator.js");
const builderCss=read("05_Community-Terminal-Builder/public/style.css");
const single=read("03_NFT-Collection-Terminal/public/countdown.js");
const multi=read("03_NFT-Collection-Terminal-Multi-Phase/public/countdown.js");

assert.match(html,/NFT Contract Address \(optional\)/,"NFT CA must be visible as an optional top-level contract field");
assert.match(app,/NFT contract detected · NFT Terminal enabled automatically/,"Valid NFT CA must auto-enable NFT Terminal");
assert.match(html,/id="nft-disable-warning"/,"Manual NFT disable with configured data must use an explicit warning dialog");
assert.match(app,/NFT Terminal disabled for this build · NFT configuration preserved/,"Disabling NFT must preserve entered NFT configuration");
assert.match(html,/id="guided-nft-mint"/,"Dedicated NFT Mint Details section missing");
assert.match(html,/CONFIRM NFT MINT DETAILS/,"Explicit NFT mint confirmation button missing");
assert(!app.includes('mintScheduleBlock.addEventListener("focusout"'),"Mint confirmation must not trigger on focusout");
assert.match(app,/Confirm NFT Mint Details before creating the terminal/,"Generation must block on unconfirmed NFT mint details");
assert.match(app,/MINT START TIME IS IN THE PAST|nft-past-warning/,"Past mint warning flow missing");
assert.match(generator,/function normalizeXUrl/,"Central X URL normalization missing");
const {normalize,generate}=require("./generator");
const project=normalize({projectName:"HANDLETEST",ticker:"HND",tokenContract:"0x1111111111111111111111111111111111111111",links:{x:"@CHAPTER19TEST"}});
assert.equal(project.links.x,"https://x.com/CHAPTER19TEST","X handle normalization is incorrect");
assert.throws(()=>normalize({projectName:"NFTNOCONTRACT",ticker:"NOC",tokenContract:"0x1111111111111111111111111111111111111111",nftContract:"",features:{nftTerminal:true}}),/NFT contract is required when NFT Terminal is enabled/,"Generator must refuse NFT-enabled output without an NFT contract");
assert.match(single,/days > 0 \? `\$\{pad\(days\)\}D:\$\{clock\}` : clock/,"Single-phase countdown must use DD:HH:MM:SS above 24h");
assert.match(multi,/days > 0 \? `\$\{pad\(days\)\}D:\$\{pad\(hours\)\}:\$\{pad\(mins\)\}:\$\{pad\(secs\)\}`/,"Multi-phase countdown must use DD:HH:MM:SS above 24h");
assert.match(app,/modules\.push\(\["nft"[\s\S]*modules\.push\(\["pulse"[\s\S]*modules\.push\(\["timeline"/,"Landing Preview module order must be Whales → Intel → NFT → Pulse → Timeline");
assert.match(app,/\[ QUICK ACCESS TO TERMINALS \]/,"Landing Preview must use current Quick Access area");
assert.match(app,/\[ AVAILABLE TERMINALS \]/,"Landing Preview must use current Available Terminals area");
assert.match(html,/\[ TERMINAL READY \]/,"Final-product terminal-ready popup missing");
assert.match(html,/id="built-terminal-url"/,"Terminal-ready popup must expose the generated website link");
assert(!app.includes("https://www.terminal.xyz/"),"Legacy mock terminal URL must not be presented as a live deployment URL");
assert.match(app,/resetForm\(\);\nrefreshProjectList\(\);/,"Builder must start with a clean project-neutral workspace");
assert.match(app,/NFT Contract Address is required before confirming NFT mint details/,"NFT mint confirmation must require a valid NFT contract first");
assert.match(app,/NFT Contract Address is required while NFT Terminal is enabled/,"Generation must validate NFT CA before mint confirmation state");
assert.match(html,/The terminal is being created with the modules listed below\./,"Final terminal-ready wording must describe the listed modules");
assert.match(generator,/Mint begins on \$\{mintDisplay/,"Generated upcoming mint status must include the full scheduled date");
assert.match(html,/id="nft-past-warning-edit"[\s\S]*GO BACK AND EDIT/,"Past-schedule warning must offer an edit action");
assert.match(html,/id="nft-past-warning-keep"[\s\S]*KEEP THIS SCHEDULE/,"Past-schedule warning must offer an explicit keep action");


const whaleCss=read("02_Whale-Activity-Tracker/public/whale.css");
const intelCss=read("04_Meme-Intel/public/intel.css");
assert.match(whaleCss,/@media\(max-width:720px\)\{[\s\S]*\.whale-command-output\{[\s\S]*overflow-x:auto/,'Whales wide command results must scroll internally on mobile');
assert.match(whaleCss,/\.whale-command-output table\{\s*min-width:720px/,'Whales mobile tables must preserve readable width inside the scroll container');
assert.match(intelCss,/@media\(max-width:720px\)\{[\s\S]*\.intel-command-output\{[\s\S]*overflow-x:auto/,'Intel wide command results must scroll internally on mobile');
assert.match(intelCss,/\.intel-command-output table\{\s*min-width:720px/,'Intel mobile tables must preserve readable width inside the scroll container');

console.log("Chapter 19 consolidated acceptance UX contracts: PASS");

// Final hands-on acceptance fixes: NFT state preservation, inline validation, branding warning, and unified NFT headers.
assert.match(html,/id="mascot-warning"[^>]*class="inline-warning"/,'Missing-logo inline warning must exist in branding area');
assert.match(builderCss,/\.inline-warning\{[^}]*color:var\(--danger\)/s,'Missing-logo warning must use visible red/danger text');
assert.match(html,/id="open-sea-error"[^>]*class="field-error"/,'OpenSea inline field error must exist');
assert.match(builderCss,/\.field-invalid\{[^}]*border-color:var\(--danger\)/s,'Invalid field state must render red');
assert.match(html,/name="nftMintPrice"/,'Single-phase Mint Price field missing');
assert.match(html,/name="nftMintLimit"/,'Single-phase Mint Per Wallet field missing');
assert.match(app,/Mint Price is required/,'Mint Price required validation missing');
assert.match(app,/Mint Per Wallet \/ Wallet Limit is required/,'Wallet-limit required validation missing');
assert.match(app,/Phase 1 values preserved/,'Single/multiple phase data-preservation flow missing');
assert.match(app,/fromContractInput/,'NFT CA auto-enable must be scoped to NFT-CA entry rather than generic form updates');
assert.match(app,/NFT Terminal disabled for this build · NFT configuration preserved/,'Explicit NFT disable preservation state missing');
assert.match(app,/function mintSignature\(schedule\).*nftContract/s,'NFT confirmation signature must include NFT contract/configuration state');
const nftLaunchTemplate=read("03_NFT-Collection-Terminal/public/index.html");
const nftTerminalTemplate=read("03_NFT-Collection-Terminal/public/terminal.html");
const nftMultiLaunchTemplate=read("03_NFT-Collection-Terminal-Multi-Phase/public/index.html");
const nftMultiTerminalTemplate=read("03_NFT-Collection-Terminal-Multi-Phase/public/terminal.html");
for(const [label,source] of [["single launch",nftLaunchTemplate],["single terminal",nftTerminalTemplate],["multi launch",nftMultiLaunchTemplate],["multi terminal",nftMultiTerminalTemplate]]){
  assert.match(source,/COMMUNITY TERMINAL/ ,`${label}: unified Community Terminal main header missing`);
  assert.match(source,/Independent Community Tools[\s\S]*Ecosystem/,`${label}: standard Community Terminal subtitle missing`);
  assert.match(source,/class="module-title">\s*NFT Collection Terminal\s*<\/div>/s,`${label}: green NFT Collection Terminal module title missing`);
}
const nftSingleCss=read("03_NFT-Collection-Terminal/public/style.css");
const nftMultiCss=read("03_NFT-Collection-Terminal-Multi-Phase/public/style.css");
assert.match(nftSingleCss,/Chapter 19 final NFT header parity:[\s\S]*\.community-subtitle\{display:block!important\}/,'Single-phase NFT subtitle must remain visible');
assert.match(nftMultiCss,/Chapter 19 final NFT header parity:[\s\S]*\.community-subtitle\{display:block!important\}/,'Multi-phase NFT subtitle must remain visible');
assert.throws(()=>generate({projectName:"REQ",ticker:"REQ",tokenContract:"0x1111111111111111111111111111111111111111",nftContract:"0x2222222222222222222222222222222222222222",features:{nftTerminal:true},nft:{mode:"single",mintAt:"2026-09-01T12:00:00Z",mintLimit:"1"}}),/Mint Price is required/,'Generator must reject blank single-phase Mint Price');
assert.throws(()=>generate({projectName:"REQ",ticker:"REQ",tokenContract:"0x1111111111111111111111111111111111111111",nftContract:"0x2222222222222222222222222222222222222222",features:{nftTerminal:true},nft:{mode:"single",mintAt:"2026-09-01T12:00:00Z",mintPrice:"FREE"}}),/Mint Per Wallet \/ Wallet Limit is required/,'Generator must reject blank single-phase wallet limit');
console.log("Chapter 19 final hands-on NFT state + inline validation contracts: PASS");

// Chapter 19 FINAL: phase cards use explicit aligned Mint Fee / Mint per Wallet rows.
{
  const result=generate({projectName:"PHASELABEL",ticker:"P19",tokenContract:"0x1111111111111111111111111111111111111111",nftContract:"0x2222222222222222222222222222222222222222",features:{nftTerminal:true},nft:{mode:"multiple",collectionName:"Phase Label NFT",mintPhases:[{label:"PHASE 1",name:"First",startsAt:"2026-09-01T12:00:00Z",endsAt:"2026-09-01T13:00:00Z",timezone:"UTC",price:"0",limit:"2"},{label:"PHASE 2",name:"Second",startsAt:"2026-09-01T13:00:00Z",endsAt:"2026-09-01T14:00:00Z",timezone:"UTC",price:"0.5",limit:"4"}]}});
  const page=result.entries.find(x=>x.name.endsWith("/03_NFT-Collection-Terminal/public/index.html")).data.toString("utf8");
  assert(page.includes('class="phase-details phase-details-kv"'),"Multi-phase cards use aligned phase detail rows");
  assert(page.includes('Mint Fee</span><span class="phase-detail-colon" aria-hidden="true">:</span><span class="phase-detail-value">FREE</span>'),"Free phase renders Mint Fee: FREE");
  assert(page.includes('Mint per Wallet</span><span class="phase-detail-colon" aria-hidden="true">:</span><span class="phase-detail-value">4</span>'),"Wallet limit renders as explicit Mint per Wallet value");
}
{
  const result=generate({projectName:"SINGLELABEL",ticker:"S19",tokenContract:"0x1111111111111111111111111111111111111111",nftContract:"0x2222222222222222222222222222222222222222",features:{nftTerminal:true},nft:{mode:"single",collectionName:"Single Label NFT",mintAt:"2026-09-01T12:00:00Z",mintPrice:"0.25",mintLimit:"3"}});
  const page=result.entries.find(x=>x.name.endsWith("/03_NFT-Collection-Terminal/public/index.html")).data.toString("utf8");
  assert(page.includes('Mint Fee</span><span class="phase-detail-colon" aria-hidden="true">:</span><span class="phase-detail-value">0.25</span>'),"Single-phase countdown renders explicit Mint Fee value");
  assert(page.includes('Mint per Wallet</span><span class="phase-detail-colon" aria-hidden="true">:</span><span class="phase-detail-value">3</span>'),"Single-phase countdown renders explicit Mint per Wallet value");
}
