"use strict";
const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { generate } = require("./generator");

const MASTER_ROOT = path.resolve(__dirname, "..");
const read = (rel) => fs.readFileSync(path.join(MASTER_ROOT, rel), "utf8");

const nftServer = read("03_NFT-Collection-Terminal/server.js");
assert.match(nftServer, /function renderProjectPage\(/, "NFT SSR renderer missing");
assert.match(nftServer, /req\.originalUrl/, "NFT SSR must respect CTB mounted request path");
assert.match(nftServer, /\{\{PROJECT_DESCRIPTION\}\}/, "NFT SSR description replacement missing");
assert.match(nftServer, /\{\{PAGE_URL\}\}/, "NFT SSR URL replacement missing");
assert.match(nftServer, /\{\{SOCIAL_IMAGE_URL\}\}/, "NFT SSR image replacement missing");
assert.match(nftServer, /new URL\(mountedMascotPath, `\$\{origin\}\/`\)/, "NFT social image must be absolute and mounted-path aware");
assert.match(nftServer, /app\.get\("\/", \(req, res\)/, "NFT launch route must be server-rendered");
assert.match(nftServer, /app\.get\(\["\/terminal", "\/terminal\/"\]/, "NFT terminal route must be server-rendered");

for (const rel of ["03_NFT-Collection-Terminal/public/index.html", "03_NFT-Collection-Terminal/public/terminal.html"]) {
  const html = read(rel);
  assert.match(html, /<meta name="viewport" content="width=device-width,initial-scale=1">/, `${rel}: accessible viewport missing`);
  assert.doesNotMatch(html, /user-scalable\s*=\s*no/i, `${rel}: browser zoom must not be disabled`);
  assert.match(html, /id="critical-first-paint"/, `${rel}: critical first-paint CSS missing`);
  assert.match(html, /\.nft-terminal-workspace[\s\S]*min-width:0;[\s\S]*max-width:100%/, `${rel}: width guard missing`);
  assert.match(html, /\.community-divider[\s\S]*overflow:hidden;[\s\S]*white-space:nowrap/, `${rel}: long divider guard missing`);
  for (const token of ["og:title", "og:description", "og:url", "og:image", "og:site_name", "twitter:card", "twitter:title", "twitter:description", "twitter:image"]) {
    assert.ok(html.includes(token), `${rel}: ${token} metadata missing`);
  }
}

const nftCss = read("03_NFT-Collection-Terminal/public/style.css");
assert.match(nftCss, /Chapter 16 \/ FINAL NFT base first-paint/, "Durable Chapter 16 mobile CSS missing");
assert.match(nftCss, /#terminal-frame\.shell\.terminal-frame\{border:1px solid var\(--green\)!important/, "Chapter 15A bright-green outer frame must remain");

const result = generate({
  projectName: "PREVIEWCAT",
  ticker: "PCAT",
  description: "PREVIEWCAT community terminal preview description.",
  tokenContract: "0x1111111111111111111111111111111111111111",
  nftContract: "0x2222222222222222222222222222222222222222",
  features: { whaleTracker: true, memeIntel: true, nftTerminal: true, liveMarket: true },
  nft: { collectionName: "PREVIEWCAT NFT", supply: 420, mintAt: "2026-08-09T12:00:00+03:00", mintPrice:"FREE", mintLimit:"1" },
});
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "ctb-ch16-"));
try {
  const zipPath = path.join(temp, result.filename);
  fs.writeFileSync(zipPath, result.buffer);
  execFileSync("unzip", ["-q", zipPath, "-d", temp]);
  const generatedRoot = path.join(temp, "PREVIEWCAT_Community_Terminal");
  const generatedServer = fs.readFileSync(path.join(generatedRoot, "03_NFT-Collection-Terminal/server.js"), "utf8");
  const generatedLaunch = fs.readFileSync(path.join(generatedRoot, "03_NFT-Collection-Terminal/public/index.html"), "utf8");
  const generatedTerminal = fs.readFileSync(path.join(generatedRoot, "03_NFT-Collection-Terminal/public/terminal.html"), "utf8");

  assert.match(generatedServer, /req\.originalUrl/, "Generated NFT server lost mounted URL awareness");
  assert.match(generatedServer, /module\.exports = app;/, "Generated NFT server must remain mountable");
  assert.match(generatedLaunch, /href="\/nft\/terminal"/, "Generated NFT launch terminal link lost namespace");
  assert.match(generatedLaunch, /href="\/nft\/style\.css"/, "Generated NFT launch stylesheet lost namespace");
  assert.match(generatedTerminal, /href="\/nft\/style\.css"/, "Generated NFT terminal stylesheet lost namespace");
  assert.match(generatedLaunch, /\{\{PAGE_URL\}\}/, "Generated launch must retain server metadata token until request time");
  assert.match(generatedTerminal, /\{\{PAGE_URL\}\}/, "Generated terminal must retain server metadata token until request time");
  assert.match(generatedLaunch, /id="critical-first-paint"/, "Generated launch lost first-paint CSS");
  assert.match(generatedTerminal, /id="critical-first-paint"/, "Generated terminal lost first-paint CSS");
  execFileSync(process.execPath, ["--check", path.join(generatedRoot, "03_NFT-Collection-Terminal/server.js")]);
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}

console.log("Chapter 16 NFT SSR metadata + first-paint carry-over: PASS");
