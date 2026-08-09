"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { DEFAULT_TERMINAL_THEME, THEME_ROLES } = require("./theme-contract");

const MASTER_ROOT = path.resolve(__dirname, "..");
const moduleCss = [
  "01_Landing-Page/public/style.css",
  "02_Whale-Activity-Tracker/public/style.css",
  "04_Meme-Intel/public/style.css",
];

assert.strictEqual(DEFAULT_TERMINAL_THEME.background, "#020806");
assert.strictEqual(DEFAULT_TERMINAL_THEME.orange, "#ff8a00");
assert.strictEqual(DEFAULT_TERMINAL_THEME.green, "#39ff14");
assert.strictEqual(DEFAULT_TERMINAL_THEME.cyan, "#65dfff");
assert.strictEqual(DEFAULT_TERMINAL_THEME.red, "#ff5a67");
assert.strictEqual(DEFAULT_TERMINAL_THEME.line, "#ff8a00");
assert.match(THEME_ROLES.primaryText, /bright white/i);

for (const relative of moduleCss) {
  const css = fs.readFileSync(path.join(MASTER_ROOT, relative), "utf8");
  assert.match(css, /--bg:#020806;/, `${relative} must preserve black terminal background token`);
  assert.match(css, /--green:#39ff14;/, `${relative} must preserve positive green token`);
  assert.match(css, /--cyan:#65dfff;/, `${relative} must preserve cyan highlight token`);
  assert.match(css, /--orange:#ff8a00;/, `${relative} must preserve structural orange token`);
  assert.match(css, /--red:#ff5a67;/, `${relative} must preserve negative red token`);
  assert.match(css, /font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas/, `${relative} must preserve terminal typography`);
  assert.match(css, /CHAPTER 15A — SHARED NON-NFT TERMINAL POLISH/, `${relative} must include Chapter 15A shared non-NFT polish`);
}

const nftHtml = fs.readFileSync(path.join(MASTER_ROOT, "03_NFT-Collection-Terminal/public/terminal.html"), "utf8");
const nftCountdown = fs.readFileSync(path.join(MASTER_ROOT, "03_NFT-Collection-Terminal/public/countdown.js"), "utf8");
assert.match(nftHtml, /Floor Price/, "NFT module must use FINAL NFT-ONLY collection metrics");
assert.match(nftHtml, /Top Sale 24h/, "NFT module must preserve FINAL NFT-ONLY premium sale metric");
assert.doesNotMatch(nftHtml, /data-token-contract/, "shared token CA row must not be injected into NFT terminal");
assert.match(nftCountdown, /const MINT_AT = new Date/, "NFT module must preserve FINAL NFT-ONLY countdown architecture");

console.log("Default terminal theme contract: PASS");
