const fs=require('fs');const path=require('path');
const ROOT=path.resolve(__dirname,'..');
function ok(v,m){if(!v){console.error(`[ FAIL ] ${m}`);process.exit(1)}console.log(`[ PASS ] ${m}`)}
for(const mod of ['03_NFT-Collection-Terminal','03_NFT-Collection-Terminal-Multi-Phase']){
 const s=fs.readFileSync(path.join(ROOT,mod,'server.js'),'utf8');
 ok(s.includes('startNftActivityBackgroundRefresh()'),`${mod}: activity cache warms in background`);
 ok(s.includes('NFT_ACTIVITY_REFRESH_MS = 180_000'),`${mod}: activity cache refresh interval bounded`);
 ok(s.includes('NFT_ACTIVITY_PAGE_TIMEOUT_MS = 4_000'),`${mod}: activity page timeout bounded`);
 ok(s.includes('getCachedNftActivity()'),`${mod}: activity endpoint serves cache immediately`);
 ok(s.includes('NFT activity cache is warming. Retry shortly.'),`${mod}: cold-cache state is explicit`);
 ok(!s.includes('for(let page=0;page<6;page+=1){let payload;try{payload=await fetchBlockscoutJson(buildTransfersPath(nextPageParams));}'),`${mod}: interactive activity path no longer runs old six-page scan`);
}
console.log('Chapter 21 activity-cache regression: PASS');
