"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { generate } = require("./generator");

const masterRoot = path.resolve(__dirname, "..");
const nftTemplates = ["03_NFT-Collection-Terminal", "03_NFT-Collection-Terminal-Multi-Phase"];
const historicalIdentity = [
  "HOODRAT", "STONKBROKERS", "GangsterRobins", "GANGSTERROBINS", "888 Society", "888 SOCIETY",
  "gangsterrobins", "888-society", "888s_Society", "10014",
  "0xe934e36A439C94017B64a3FecE66AF12099aBF50",
  "0x8e62F281f282686fCa6dCB39288069a93fC23F1c",
  "0x539cdd042c2f3d93ebc5be7dfff0c79f3b4fabf0",
];
const forbiddenGenerated = [...historicalIdentity, "deployment-guide.txt", "__CTB_"];

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".git"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

for (const template of nftTemplates) {
  for (const file of walk(path.join(masterRoot, template))) {
    if (!/\.(?:js|html|css|json)$/i.test(file)) continue;
    const text = fs.readFileSync(file, "utf8");
    for (const forbidden of historicalIdentity) {
      assert(!text.includes(forbidden), `${template}/${path.relative(path.join(masterRoot, template), file)} contains legacy identity: ${forbidden}`);
    }
  }
}

const base = {
  projectName: "NEUTRAL TEST",
  ticker: "NTRL",
  tokenContract: "0x1111111111111111111111111111111111111111",
  nftContract: "0x2222222222222222222222222222222222222222",
  links: {
    website: "https://example.org",
    x: "https://x.com/neutral_test",
    telegram: "https://t.me/neutral_test",
    openSea: "https://opensea.io/collection/neutral-test/overview",
  },
  features: { whaleTracker:true, memeIntel:true, communityPulse:true, timeline:true, nftTerminal:true, liveMarket:true },
  nft: { collectionName:"Neutral Test NFT", supply:1234, mintAt:"2026-09-01T12:00:00Z", mintPrice:"FREE", mintLimit:"1", timezone:"UTC" },
};

function assertNeutralOutput(label, input) {
  const out = generate(input);
  for (const entry of out.entries) {
    for (const forbidden of forbiddenGenerated) {
      assert(!entry.name.includes(forbidden), `${label}: generated filename contains forbidden value ${forbidden}: ${entry.name}`);
    }
    if (!Buffer.isBuffer(entry.data) && typeof entry.data !== "string") continue;
    if (/\.(?:png|jpe?g|gif|webp|ico|zip)$/i.test(entry.name)) continue;
    const text = Buffer.isBuffer(entry.data) ? entry.data.toString("utf8") : entry.data;
    for (const forbidden of forbiddenGenerated) {
      assert(!text.includes(forbidden), `${label}: ${entry.name} contains forbidden value ${forbidden}`);
    }
  }
  const readme = out.entries.find(entry => /\/README\.md$/.test(entry.name));
  assert(readme, `${label}: generated README exists`);
  assert(!String(readme.data).includes("deployment-guide.txt"), `${label}: generated README references only shipped files`);
}

assertNeutralOutput("single-phase", { ...base, nft: { ...base.nft, mode:"single" } });
assertNeutralOutput("multi-phase", {
  ...base,
  nft: {
    ...base.nft,
    mode:"multiple",
    mintPhases:[
      { label:"ALLOWLIST", name:"One", startsAt:"2026-09-01T12:00:00Z", endsAt:"2026-09-01T13:00:00Z", timezone:"UTC", price:"FREE", limit:"2" },
      { label:"PUBLIC", name:"Two", startsAt:"2026-09-01T13:00:00Z", endsAt:"2026-09-01T14:00:00Z", timezone:"UTC", price:"0.01 ETH", limit:"3" },
    ],
  },
});
assertNeutralOutput("token-only", {
  ...base,
  nftContract:"",
  links:{ ...base.links, openSea:"" },
  features:{ ...base.features, nftTerminal:false },
});

console.log("Chapter 19 canonical template neutralization + generated-package neutrality gate: PASS");
