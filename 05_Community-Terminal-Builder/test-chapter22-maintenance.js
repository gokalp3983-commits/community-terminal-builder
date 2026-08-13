const fs=require("fs");
const path=require("path");
const ROOT=path.resolve(__dirname,"..");
function ok(value,message){if(!value){console.error(`[ FAIL ] ${message}`);process.exit(1);}console.log(`[ PASS ] ${message}`);}
for(const mod of ["03_NFT-Collection-Terminal","03_NFT-Collection-Terminal-Multi-Phase"]){
  const server=fs.readFileSync(path.join(ROOT,mod,"server.js"),"utf8");
  const script=fs.readFileSync(path.join(ROOT,mod,"public","script.js"),"utf8");
  const style=fs.readFileSync(path.join(ROOT,mod,"public","style.css"),"utf8");
  ok(style.includes('content:var(--nft-terminal-label, "MARKET UPDATE")'),`${mod}: MARKET UPDATE fallback preserved`);
  ok(script.includes('const NFT_SALES_REFRESH_MS = 15_000'),`${mod}: NFT sales refresh remains 15 seconds`);
  ok(script.includes('nftCommandBlock("NFT Pulse",rows'),`${mod}: NFT Pulse title simplified`);
  ok(!script.includes('CTB NFT PULSE'),`${mod}: old CTB NFT PULSE title removed`);
  ok(script.includes('async function nftCommandJsonWithWarmRetry'),`${mod}: activity warming retry helper present`);
  ok(script.includes('nftCommandJsonWithWarmRetry("/api/nft-activity")'),`${mod}: NFT activity command/pulse uses warming retry`);
  ok(server.includes('const holders=nftHoldersCache?.data||await getNftHolderAnalytics();'),`${mod}: post-mint commands wait for holder analytics snapshot`);
  ok(server.includes('NFT_ENTRANT_WINDOW_MS = 4 * 60 * 60 * 1000'),`${mod}: entrants window is 4h`);
  ok(server.includes('NFT_MOVER_WINDOW_MS = 4 * 60 * 60 * 1000'),`${mod}: movers window is 4h`);
  ok(server.includes('NFT_WHALE_WINDOW_MS = 12 * 60 * 60 * 1000'),`${mod}: whales window is 12h`);
  ok(server.includes('NFT_RETENTION_WINDOW_MS = 24 * 60 * 60 * 1000'),`${mod}: retention window is 24h`);
}
console.log("Chapter 22 maintenance regression: PASS");
