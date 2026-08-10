"use strict";

module.exports = {
  project: {
    id: "stonkbrokers",
    name: "STONKBROKERS",
    displayName: "STONKBROKERS",
    ticker: "$STONKBROKERS",
    version: "1.4.3",
    description: "Terminal-style tools for the STONKBROKERS community.",
    ecosystem: "Robinhood Chain",
    promptUser: "stonkbrokers",
    promptHost: "robinhood",
  },

  contracts: {
    token: "0xe934e36A439C94017B64a3FecE66AF12099aBF50",
    nft: "0x539cdd042c2f3d93ebc5be7dfff0c79f3b4fabf0",
  },

  market: {
    dexScreenerChainId: "robinhood",
    blockscoutApiBase: "https://robinhoodchain.blockscout.com/api/v2",
    refreshMs: 30000,
    cacheTtlMs: 30000,
  },

  branding: {
    mascot: "/assets/stonkbrokers-mascot.jpg",
    mascotAlt: "STONKBROKERS mascot",
    themeColor: "#020704",
    colors: {
      background: "#020806",
      panel: "#03100b",
      green: "#39ff14",
      yellow: "#ff6a00",
      cyan: "#65dfff",
      blue: "#68c8ff",
      orange: "#ff8a00",
      red: "#ff5a67",
      muted: "#708a7b",
      line: "#194b2d",
    },
  },

  links: {
    home: "https://stonkbrokers-community-terminal.onrender.com/",
    moduleOrder: ["whales", "intel", "nft", "pulse", "timeline"],
  modules: {
      whales: "https://stonkbrokers-community-terminal-1.onrender.com/",
      intel: "https://stonkbrokers-04-meme-intel.onrender.com/",
      nft: "https://stonkbrokers-community-terminal-1-ioe9.onrender.com/",
    },
    website: "",
    x: "",
    telegram: "",
    explorer: "",
    dexScreener: "",
    openSea: "https://opensea.io/collection/stonkbrokers-434284142/overview",
  },

  nft: {
    collectionName: "STONKBROKERS NFT",
    openSeaSlug: "stonkbrokers-434284142",
    supply: 4444,
    whaleThreshold: 10,
  },

  features: {
    landing: true,
    whaleTracker: true,
    nftTerminal: true,
    memeIntel: true,
    liveMarket: true,
  },

  modules: {
    whales: {
      command: "whales",
      title: "Whale Activity Tracker",
      description: "Monitor Top-30 whales, DEX activity, and holder rankings.",
      status: "READY",
    },
    intel: {
      command: "intel",
      title: "Meme Intelligence Terminal",
      description: "Read market pulse, buy pressure, fresh-wallet activity, holder behavior, and transparent risk signals.",
      status: "READY",
    },
    nft: {
      command: "nft",
      title: "STONKBROKERS NFT Terminal",
      description: "Completed mint record, NFT whale analytics, and collection statistics.",
      status: "COMPLETE",
    },
  },
};
