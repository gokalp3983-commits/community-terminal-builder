"use strict";
module.exports = {
  project: { id:"hoodrat", name:"HOODRAT", displayName:"HOODRAT", ticker:"$HOODRAT", version:"2.2.1", description:"Terminal-style tools for the HOODRAT community.", ecosystem:"Robinhood Chain", promptUser:"hoodrat", promptHost:"intel" },
  contracts: { token:"0x8e62F281f282686fCa6dCB39288069a93fC23F1c", nft:"" },
  market: { dexScreenerChainId:"robinhood", blockscoutApiBase:"https://robinhoodchain.blockscout.com/api/v2", refreshMs:30000, cacheTtlMs:30000 },
  branding: { mascot:"/assets/hoodrat-mascot.jpeg", mascotAlt:"HOODRAT mascot", themeColor:"#020704", colors:{ background:"#020806",panel:"#03100b",green:"#39ff14",yellow:"#ff6a00",cyan:"#65dfff",blue:"#68c8ff",orange:"#ff8a00",red:"#ff5a67",muted:"#708a7b",line:"#194b2d" } },
  links: { home:"https://hoodrat-landing-page.onrender.com/", modules:{ whales:"", intel:"", nft:"" }, website:"",x:"",telegram:"",explorer:"",dexScreener:"",openSea:"" },
  nft: { collectionName:"HOODRAT NFT", openSeaSlug:"", supply:null, whaleThreshold:10 },
  features: { landing:true, whaleTracker:true, nftTerminal:false, memeIntel:true, liveMarket:true },
  modules: {
    whales:{command:"whales",title:"Whale Activity Tracker",description:"Monitor Top-30 whales, DEX activity, and holder rankings.",status:"READY"},
    intel:{command:"intel",title:"Meme Intelligence Terminal",description:"Read market pulse, buy pressure, holder behavior, and transparent risk signals.",status:"READY"},
    nft:{command:"nft",title:"HOODRAT NFT Terminal",description:"NFT collection analytics when configured.",status:"DISABLED"}
  }
};
