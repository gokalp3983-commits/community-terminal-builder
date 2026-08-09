"use strict";
const assert=require("assert");
const fs=require("fs");
const path=require("path");
const ROOT=path.resolve(__dirname,"..");
const read=rel=>fs.readFileSync(path.join(ROOT,rel),"utf8");
const html=read("05_Community-Terminal-Builder/public/index.html");
const app=read("05_Community-Terminal-Builder/public/app.js");
const css=read("05_Community-Terminal-Builder/public/style.css");
assert.match(html,/id="guided-mode"[^>]*aria-pressed="true"/,"Guided Mode default control missing");
assert.match(html,/id="advanced-mode"/,"Builder Mode control missing");
assert.match(html,/deployment-dashboard advanced-only/,"Manual deployment dashboard must be hidden only at presentation layer");
assert.match(html,/connected-dashboard advanced-only/,"Connected deployment dashboard must remain available in Builder Mode");
assert.match(html,/release-control advanced-only/,"Protected release control must remain available in Builder Mode");
assert.match(html,/class="advanced-field"[^>]*><span>Blockscout API base/,"Low-level provider field should be advanced");
assert.match(html,/class="span-2 nft-mint-schedule nft-config"/,"NFT schedule must be conditionally presented");
assert.match(app,/UX_MODE_KEY="ctb\.ux-mode\.v1"/,"UX mode persistence missing");
assert.match(app,/setBuilderExperience/,"Builder experience switch runtime missing");
assert.match(app,/syncNftConfigVisibility/,"NFT conditional visibility runtime missing");
assert.match(css,/body\.guided-mode \.advanced-only/,"Guided Mode advanced-panel hiding missing");
assert.match(css,/body\.guided-mode \.advanced-field/,"Guided Mode advanced-field hiding missing");

const { normalize } = require("./generator");
const guidedFresh = normalize({
  projectName:"TRIAL", ticker:"TRIAL",
  tokenContract:"0x1111111111111111111111111111111111111111",
  promptUser:"", promptHost:""
});
assert.equal(guidedFresh.promptUser,"trial","Fresh Guided project must derive terminal user from project id");
assert.equal(guidedFresh.promptHost,"terminal","Fresh Guided project must default terminal host");

assert.match(html,/class="guided-overview"/,"Guided five-step overview missing");
assert.match(css,/body\.guided-mode \.console-panel\{display:none\}/,"Guided Mode should hide developer console");
assert.match(css,/body\.guided-mode \.guided-step-note/,"Guided readability treatment missing");
assert.match(app,/markPhaseInvalid\(card,\["endDate","endTime"\]\)/,"Same-phase invalid end fields must be marked visually");
assert.match(app,/markPhaseInvalid\(cards\[i\],\["startDate","startTime"\]\)/,"Cross-phase invalid start fields must be marked visually");
assert.match(css,/input\.phase-invalid:focus/,"Invalid phase field focus must remain red");
console.log("Chapter 17B guided simplification + 17A visual hotfix contracts: PASS");

// Chapter 17B pre-break acceptance contracts.
assert.match(app,/mintScheduleBlock\.addEventListener\("input",\(\)=>\{confirmedMintSignature="";syncNftMintSchedule\(\)\}\)/,"Phase schedule must validate live on input");
assert.match(app,/mintScheduleBlock\.addEventListener\("change",\(\)=>\{confirmedMintSignature="";syncNftMintSchedule\(\)\}\)/,"Phase schedule must validate live on change");
assert.match(css,/body\.guided-mode #download-again\{display:none!important\}/,"Guided Mode must hide duplicate ZIP download action");
const landingCss=read("01_Landing-Page/public/style.css");
const nftSingleCss=read("03_NFT-Collection-Terminal/public/style.css");
const nftMultiCss=read("03_NFT-Collection-Terminal-Multi-Phase/public/style.css");
for(const [name,source] of [["landing",landingCss],["single NFT",nftSingleCss],["multiple NFT",nftMultiCss]]){
  assert.match(source,/width:min\(220px,58vw\)!important;height:86px!important;[^}]*object-fit:contain!important/,`${name} header logo must use enlarged aspect-safe display slot`);
}
