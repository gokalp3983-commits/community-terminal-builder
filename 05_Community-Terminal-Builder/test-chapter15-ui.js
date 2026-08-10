"use strict";
const assert=require("assert");
const fs=require("fs");
const path=require("path");
const ROOT=path.resolve(__dirname,"..");
function read(rel){return fs.readFileSync(path.join(ROOT,rel),"utf8")}
for(const rel of ["01_Landing-Page/public/index.html","02_Whale-Activity-Tracker/public/index.html","04_Meme-Intel/public/index.html"]){
  const html=read(rel);
  assert.match(html,/data-copy-token-contract/,`${rel}: copy control missing`);
  assert.doesNotMatch(html,/network-strip/,`${rel}: legacy header CA/network strip must not be injected`);
}
for(const rel of ["01_Landing-Page/public/style.css","02_Whale-Activity-Tracker/public/whale.css","04_Meme-Intel/public/intel.css"]){
  const css=read(rel);
  assert.match(css,/\.terminal\{border:1px solid var\(--green\)!important/,`${rel}: main outer border must be bright green`);
  assert.match(css,/\.copy-contract\{border:0!important/,`${rel}: CA copy icon must be borderless`);
  assert.match(css,/#terminal-footer \.footer-version[^{]*\{[^}]*color:var\(--orange\)/s,`${rel}: footer title must use canonical orange styling`);
}
const builderApp=read("05_Community-Terminal-Builder/public/app.js");
assert.match(builderApp,/\[ PREVIEW \] Price :/,"Builder preview metric colon separator missing");
assert.match(builderApp,/\[ CA \] Contract :/,"Builder preview CA colon separator missing");
assert.match(builderApp,/class="preview-footer"/,"Builder preview footer missing");
const nftRuntime=read("03_NFT-Collection-Terminal/public/project-runtime.js");
assert.doesNotMatch(nftRuntime,/line:\s*"--line"/,"NFT runtime must preserve canonical muted-green --line");
const nftCss=read("03_NFT-Collection-Terminal/public/style.css");
assert.match(nftCss,/#terminal-frame\.shell\.terminal-frame\{border:1px solid var\(--green\)!important/,"NFT main frame must be bright green");
const gen=read("05_Community-Terminal-Builder/generator.js");
assert.match(gen,/VISIT NFT TERMINAL/,"NFT launch wording fix missing");
assert.match(gen,/mintDisplayFromIso/,"NFT configured mint display fix missing");
assert.match(gen,/COMMUNITY TERMINAL/,"Unified NFT Community Terminal title normalization missing");
console.log("Chapter 15A acceptance polish contract: PASS");
