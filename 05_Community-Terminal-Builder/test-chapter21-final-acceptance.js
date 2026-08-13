const fs=require("fs");
const path=require("path");
const assert=require("assert");
const root=path.resolve(__dirname,"..");
const read=(p)=>fs.readFileSync(path.join(root,p),"utf8");
for(const base of ["03_NFT-Collection-Terminal","03_NFT-Collection-Terminal-Multi-Phase"]){
  const html=read(`${base}/public/terminal.html`);
  const js=read(`${base}/public/script.js`);
  const css=read(`${base}/public/style.css`);
  assert(html.includes('id="nftCommandSuite"'),`${base}: command suite wrapper missing`);
  assert(js.includes('setupMobileNftCommandPlacement'),`${base}: mobile command placement missing`);
  assert(js.includes('salesWindow.appendChild(suite)'),`${base}: commands do not follow sales on mobile`);
  assert(js.includes('NFT Terminal ready.'),`${base}: mobile NFT copy missing`);
  assert(js.includes('Collection tracking active.'),`${base}: mobile NFT ready copy missing`);
  assert(css.includes('mobile NFT commands follow Buy/Sell'),`${base}: mobile command CSS missing`);
}
const whale=read("02_Whale-Activity-Tracker/public/whale.js");
assert(whale.includes('Whale Terminal ready.'));
assert(whale.includes('Whale tracking active.'));
const intel=read("04_Meme-Intel/public/intel.js");
assert(intel.includes('Intel Terminal ready.'));
assert(intel.includes('Intel synchronized.'));
const nftServer=read("03_NFT-Collection-Terminal/server.js");
assert(nftServer.includes('refreshNftActivityCache') && nftServer.includes('/api/nft-activity'),"activity cache missing");
console.log("Chapter 21 Final Acceptance regression: PASS");
