"use strict";
const fs=require("fs");
const path=require("path");
const os=require("os");
const assert=require("assert");
const {generate}=require("./generator");

const root=path.join(__dirname,"..");
const multiJs=fs.readFileSync(path.join(root,"03_NFT-Collection-Terminal-Multi-Phase","public","countdown.js"),"utf8");
const multiHtml=fs.readFileSync(path.join(root,"03_NFT-Collection-Terminal-Multi-Phase","public","index.html"),"utf8");

for(const legacy of ["I know a guy","don't embarrASS us.","the public humiliation","$5.13","2026-08-15T23:08:00+03:00","2026-08-16T03:36:00+03:00"]){
  assert(!multiJs.includes(legacy),`Canonical multi-phase runtime leaks historical sample data: ${legacy}`);
  assert(!multiHtml.includes(legacy),`Canonical multi-phase HTML leaks historical sample data: ${legacy}`);
}
assert(multiJs.includes("const phases = configuredPhases.map"),"Multi-phase runtime must derive phases only from PROJECT_CONFIG");
assert(multiJs.includes("hydrateConfiguredPhases();"),"Multi-phase runtime must hydrate visible phase content from configuration");
assert(multiHtml.includes("Mint phase not configured"),"Canonical raw template must use neutral not-configured placeholders");

const result=generate({
  projectName:"CONFIGDRIVEN",
  ticker:"CFG",
  tokenContract:"0x1111111111111111111111111111111111111111",
  nftContract:"0x2222222222222222222222222222222222222222",
  features:{nftTerminal:true},
  nft:{
    mode:"multiple",
    collectionName:"CONFIGDRIVEN NFT",
    supply:4500,
    mintPhases:[
      {id:"alpha",label:"PHASE-1",name:"Alpha Gate",startsAt:"2026-08-13T20:00:00+03:00",endsAt:"2026-08-13T20:30:00+03:00",price:"FREE",limit:"1",timezone:"GMT+3"},
      {id:"beta",label:"PHASE-2",name:"Beta Gate",startsAt:"2026-08-13T20:30:00+03:00",endsAt:"2026-08-13T22:30:00+03:00",price:"0.25",limit:"2",timezone:"GMT+3"},
      {id:"public",label:"PHASE-3",name:"Public Launch",startsAt:"2026-08-13T22:30:00+03:00",endsAt:"2026-08-16T00:30:00+03:00",price:"1.90",limit:"3",timezone:"GMT+3"}
    ]
  }
});
const extract=fs.mkdtempSync(path.join(os.tmpdir(),"ctb20-config-driven-"));
const zipPath=path.join(extract,result.filename);
fs.writeFileSync(zipPath,result.buffer);
require("child_process").execFileSync("unzip",["-q",zipPath,"-d",extract]);
const generatedRoot=path.join(extract,"CONFIGDRIVEN_Community_Terminal");
const page=fs.readFileSync(path.join(generatedRoot,"03_NFT-Collection-Terminal","public","index.html"),"utf8");
const cfg=fs.readFileSync(path.join(generatedRoot,"config","projects","configdriven.js"),"utf8");
for(const expected of ["Alpha Gate","Beta Gate","Public Launch","PHASE-1","PHASE-2","PHASE-3","FREE","0.25","1.90"]){
  assert(page.includes(expected)||cfg.includes(expected),`Generated multi-phase project missing configured value: ${expected}`);
}
for(const legacy of ["I know a guy","don't embarrASS us.","the public humiliation","$5.13"]){
  assert(!page.includes(legacy) && !cfg.includes(legacy),`Generated project leaked historical sample data: ${legacy}`);
}
console.log("[PASS] Chapter 20 config-driven multi-phase NFT generation");
