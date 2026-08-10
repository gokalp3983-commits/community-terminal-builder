"use strict";
const assert=require("assert");
const fs=require("fs");
const os=require("os");
const path=require("path");
const {execFileSync}=require("child_process");
const {generate}=require("./generator");

const input={
  projectName:"HOODRAT",
  ticker:"HOODRAT",
  tokenContract:"0x1111111111111111111111111111111111111111",
  nftContract:"0x2222222222222222222222222222222222222222",
  links:{
    website:"https://example.com",
    x:"https://x.com/example",
    telegram:"https://t.me/example",
    openSea:"https://opensea.io/collection/hoodrats-nft/overview"
  },
  features:{whaleTracker:true,memeIntel:true,communityPulse:true,timeline:true,nftTerminal:true,liveMarket:true},
  nft:{
    mode:"multiple",
    collectionName:"HOODRATS NFT",
    mintPhases:[
      {label:"ALLOWLIST",name:"One",startsAt:"2026-08-04T15:45:00Z",endsAt:"2026-08-04T15:50:00Z",timezone:"Europe/Istanbul",price:"FREE",limit:"222"},
      {label:"PUBLIC",name:"Two",startsAt:"2026-08-04T16:00:00Z",endsAt:"2026-08-04T18:00:00Z",timezone:"Europe/Istanbul",price:"FREE",limit:"2"}
    ]
  }
};
const out=generate(input);
const dir=fs.mkdtempSync(path.join(os.tmpdir(),"ctb18b-"));
const zip=path.join(dir,"out.zip");
fs.writeFileSync(zip,out.buffer);
execFileSync("unzip",["-q",zip,"-d",dir]);
const root=path.join(dir,"HOODRAT_Community_Terminal");
const text=(rel)=>fs.readFileSync(path.join(root,rel),"utf8");

for(const moduleName of ["01_Landing-Page","02_Whale-Activity-Tracker","04_Meme-Intel"]){
  const html=text(`${moduleName}/public/index.html`);
  const css=text(`${moduleName}/public/style.css`);
  assert(html.includes('<span class="link-copy-mobile">Visit Website</span>'),`${moduleName}: mobile Website copy`);
  assert(html.includes('<span class="link-copy-mobile">Open X</span>'),`${moduleName}: mobile X copy`);
  assert(html.includes('<span class="link-copy-mobile">Open Telegram</span>'),`${moduleName}: mobile Telegram copy`);
  assert(html.includes('<span class="link-copy-mobile">View Collection</span>'),`${moduleName}: mobile OpenSea copy`);
  assert(html.includes('Visit HOODRAT Official Website'),`${moduleName}: desktop Website copy preserved`);
  assert(css.includes('.link-copy-mobile{display:none}'),`${moduleName}: desktop/mobile copy CSS`);
  assert(css.includes('.link-copy-desktop{display:none!important}'),`${moduleName}: phone-only switch`);
}

const countdown=text("03_NFT-Collection-Terminal/public/index.html");
const countdownCss=text("03_NFT-Collection-Terminal/public/countdown.css");
assert(countdown.includes('<span class="link-copy-mobile">Visit NFT Terminal</span>'),"NFT countdown: compact NFT Terminal copy");
assert(countdown.includes('<span class="link-copy-mobile">Visit Website</span>'),"NFT countdown: compact Website copy");
assert(countdown.includes('<span class="link-copy-mobile">View Collection</span>'),"NFT countdown: compact OpenSea copy");
assert(countdown.includes('<span class="link-copy-mobile">Open X</span>'),"NFT countdown: compact X copy");
assert(countdown.includes('<span class="link-copy-mobile">Open Telegram</span>'),"NFT countdown: compact Telegram copy");
assert(countdownCss.includes('grid-template-columns:12ch 7ch 1ch minmax(0,1fr)!important'),"NFT countdown: phone-only link geometry");
assert(countdown.includes('Mint Fee</span><span class="phase-detail-colon" aria-hidden="true">:</span><span class="phase-detail-value">FREE</span>'),"NFT phase Mint Fee is explicitly labeled");
assert(countdown.includes('Mint per Wallet</span><span class="phase-detail-colon" aria-hidden="true">:</span><span class="phase-detail-value">2</span>'),"NFT phase wallet limit is explicitly labeled");

const nftTerminal=text("03_NFT-Collection-Terminal/public/terminal.html");
const nftCss=text("03_NFT-Collection-Terminal/public/style.css");
assert(nftTerminal.includes('<span class="link-copy-mobile">Visit Website</span>'),"NFT terminal: compact Website copy");
assert(nftTerminal.includes('<span class="link-copy-mobile">Open X</span>'),"NFT terminal: compact X copy");
assert(nftTerminal.includes('<span class="link-copy-mobile">Open Telegram</span>'),"NFT terminal: compact Telegram copy");
assert(nftTerminal.includes('<span class="link-copy-mobile">View Collection</span>'),"NFT terminal: compact canonical OpenSea copy");
assert(nftCss.includes('.link-copy-mobile{display:none}'),"NFT terminal: desktop/mobile copy CSS");

const homeConfirm='Return to the main Community Terminal landing page?';
const landingScript=text("01_Landing-Page/public/script.js");
assert(landingScript.includes('homeLink.href = "/"'),"Landing mascot: canonical main landing route");
assert(landingScript.includes(`window.confirm("${homeConfirm}")`),"Landing mascot: confirmation prompt");

for(const moduleName of ["02_Whale-Activity-Tracker","04_Meme-Intel","06_Community-Pulse","07_Timeline","03_NFT-Collection-Terminal"]){
  const runtime=text(`${moduleName}/public/project-runtime.js`);
  assert(runtime.includes('e.href = "/"'),`${moduleName}: mascot always targets main landing page`);
  assert(runtime.includes(`window.confirm("${homeConfirm}")`),`${moduleName}: mascot confirmation prompt`);
}
assert(countdown.includes('data-project-home href="/"'),"NFT countdown mascot uses the confirmed main-home behavior");
assert(nftTerminal.includes('data-project-home'),"NFT terminal mascot uses the confirmed main-home behavior");


const builderHtml=fs.readFileSync(path.join(__dirname,"public","index.html"),"utf8");
const builderJs=fs.readFileSync(path.join(__dirname,"public","app.js"),"utf8");
assert(!builderHtml.includes('type="color"'),"Builder: color inputs removed");
assert(!builderHtml.includes('CUSTOMIZE COLORS'),"Builder: color customization control removed");
assert(builderHtml.includes('canonical CTB visual system and layout'),"Builder: fixed visual-system guidance shown");
assert(!builderJs.includes('colors:{primary:'),"Builder payload: user color configuration removed");
const hostileTheme=generate({...input,colors:{primary:'#123456',accent:'#abcdef',background:'#ffffff',panel:'#eeeeee'}});
const hostileDir=fs.mkdtempSync(path.join(os.tmpdir(),"ctb18b-theme-"));
const hostileZip=path.join(hostileDir,"out.zip");fs.writeFileSync(hostileZip,hostileTheme.buffer);execFileSync("unzip",["-q",hostileZip,"-d",hostileDir]);
const hostileLanding=fs.readFileSync(path.join(hostileDir,"HOODRAT_Community_Terminal","01_Landing-Page","public","style.css"),"utf8");
assert(!hostileLanding.includes('#123456')&&!hostileLanding.includes('#abcdef'),"Generator: incoming theme overrides ignored");

console.log("Chapter 18B mobile polish + fixed CTB theme + wallet-limit output + mascot-home confirmation: PASS");
