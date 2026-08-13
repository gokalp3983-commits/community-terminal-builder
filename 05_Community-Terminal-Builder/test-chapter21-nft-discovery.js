"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { discoverNftContract } = require("./nft/contract-discovery");
const { decodeAbiString } = require("./nft/chain-data-provider");

function abiString(value) {
  const bytes = Buffer.from(value, "utf8").toString("hex");
  const len = Buffer.byteLength(value, "utf8").toString(16).padStart(64, "0");
  return `0x${"20".padStart(64,"0")}${len}${bytes.padEnd(Math.ceil(bytes.length/64)*64,"0")}`;
}

(async()=>{
  assert.strictEqual(decodeAbiString(abiString("TEST NFT")), "TEST NFT");
  const provider = {
    rpcUrl:"https://rpc.example", blockscoutApiBase:"https://explorer.example/api/v2",
    getCode:async()=>"0x60016000",
    getTokenInfo:async()=>({type:"ERC-721",name:"DISCOVERED COLLECTION",symbol:"DISC",total_supply:"4444",holders_count:"123"}),
    supportsInterface:async(_a,id)=>id==="0x80ac58cd",
    readString:async(_a,selector)=>selector==="0x06fdde03"?"RPC COLLECTION":selector==="0x95d89b41"?"RPC":"",
    readUint:async()=>4444,
    explorerUrl:a=>`https://explorer.example/token/${a}`,
  };
  const result=await discoverNftContract("0x1111111111111111111111111111111111111111",{provider});
  assert.strictEqual(result.nft.detected,true);
  assert.strictEqual(result.nft.standard,"ERC-721");
  assert.strictEqual(result.nft.collectionName,"DISCOVERED COLLECTION");
  assert.strictEqual(result.nft.symbol,"DISC");
  assert.strictEqual(result.nft.supply,4444);
  assert.strictEqual(result.nft.holders,123);
  assert.strictEqual(result.nft.metadataUriMethod,"tokenURI(uint256)");

  const server=fs.readFileSync(path.join(__dirname,"server.js"),"utf8");
  const app=fs.readFileSync(path.join(__dirname,"public","app.js"),"utf8");
  const html=fs.readFileSync(path.join(__dirname,"public","index.html"),"utf8");
  assert(server.includes('/api/discover-nft'));
  assert(app.includes('scheduleNftDiscovery'));
  assert(app.includes('fields auto-filled'));
  assert(html.includes('id="nft-discovery-check"'));
  for(const template of ["03_NFT-Collection-Terminal","03_NFT-Collection-Terminal-Multi-Phase"]){
    const source=fs.readFileSync(path.join(__dirname,"..",template,"server.js"),"utf8");
    assert(source.includes('/api/contract-discovery'));
    assert(fs.existsSync(path.join(__dirname,"..",template,"lib","nft","chain-data-provider.js")));
  }

  const { normalize, generate } = require("./generator");
  const input={
    projectName:"DISCOVERY TEST",ticker:"DISC",tokenContract:"0x2222222222222222222222222222222222222222",nftContract:"0x1111111111111111111111111111111111111111",
    nft:{collectionName:"DISCOVERED COLLECTION",supply:"4444",standard:"ERC-721",symbol:"DISC",metadataUriMethod:"tokenURI(uint256)",mode:"single",mintAt:"2026-09-01T12:00:00+00:00",mintEndAt:"2026-09-02T12:00:00+00:00",mintPrice:"FREE",mintLimit:"2",timezone:"UTC"},
    features:{nftTerminal:true,whaleTracker:true,memeIntel:true,communityPulse:true,timeline:true,liveMarket:true},links:{}
  };
  const normalized=normalize(input);
  assert.strictEqual(normalized.nftSettings.standard,"ERC-721");
  assert.strictEqual(normalized.nftSettings.symbol,"DISC");
  assert.strictEqual(normalized.nftSettings.metadataUriMethod,"tokenURI(uint256)");
  const generated=generate(input);
  const profile=generated.entries.find(entry=>/\/config\/projects\/discovery-test\.js$/.test(entry.name));
  assert(profile && String(profile.data).includes('"standard": "ERC-721"'));
  const generatedNftServer=generated.entries.find(entry=>/\/03_NFT-Collection-Terminal\/server\.js$/.test(entry.name));
  assert(generatedNftServer && String(generatedNftServer.data).includes('/api/contract-discovery'));
  const generatedProvider=generated.entries.find(entry=>/\/03_NFT-Collection-Terminal\/lib\/nft\/chain-data-provider\.js$/.test(entry.name));
  assert(generatedProvider, "generated NFT package must include ChainDataProvider");

  console.log("[ PASS ] Chapter 21 NFT contract auto-discovery architecture");
})().catch(error=>{console.error(error);process.exit(1)});
