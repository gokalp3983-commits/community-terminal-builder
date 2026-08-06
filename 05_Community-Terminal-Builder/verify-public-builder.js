"use strict";
const baseRaw=process.argv[2]||process.env.CTB_PUBLIC_URL;
if(!baseRaw){console.error("Usage: npm run test:deployed -- https://YOUR-BUILDER.onrender.com");process.exit(2)}
const base=baseRaw.replace(/\/$/,"");
const timeoutMs=Number(process.env.ACCEPTANCE_TIMEOUT_MS||30000);
function pass(label){console.log(`[ PASS ] ${label}`)}
function check(ok,label){if(!ok)throw new Error(label);pass(label)}
async function request(path,options={}){
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{return await fetch(`${base}${path}`,{redirect:"follow",...options,signal:controller.signal})}
  finally{clearTimeout(timer)}
}
async function jsonRoute(path){const r=await request(path);check(r.status===200,`${path} returned HTTP 200`);const data=await r.json();check(data&&data.ok===true,`${path} returned ok:true`);return {r,data}}
(async()=>{
  console.log(`[ ACCEPTANCE ] Public builder: ${base}`);
  const home=await request("/");check(home.status===200,"Builder home returned HTTP 200");const html=await home.text();check(html.includes("COMMUNITY TERMINAL BUILDER"),"Builder identity found");check(Boolean(home.headers.get("content-security-policy")),"Content Security Policy present");check(home.headers.get("x-content-type-options")==="nosniff","nosniff header present");
 const favicon=await request("/favicon.png");check(favicon.status===200,"Builder favicon returned HTTP 200");check((favicon.headers.get("content-type")||"").includes("image/png"),"Builder favicon is PNG");
  const health=await jsonRoute("/health");check(health.data.status==="healthy","Builder health is healthy");
  const status=await jsonRoute("/status");check(status.data.product==="Community Terminal Builder","Builder status product is correct");check(status.data.storage==="browser-local","Storage model reports browser-local");
  await jsonRoute("/api/builder-status");
  const payload={projectName:"ACCEPTANCE",ticker:"ACC",tokenContract:"0x1111111111111111111111111111111111111111",features:{whaleTracker:true,memeIntel:true,nftTerminal:false,liveMarket:true}};
  const zip=await request("/api/generate",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});
  check(zip.status===200,"Hosted ZIP generation returned HTTP 200");check((zip.headers.get("content-type")||"").includes("application/zip"),"Hosted generation returned a ZIP");check((zip.headers.get("content-disposition")||"").includes("ACCEPTANCE_Community_Terminal.zip"),"Generated ZIP filename is correct");const bytes=new Uint8Array(await zip.arrayBuffer());check(bytes.length>4&&bytes[0]===0x50&&bytes[1]===0x4b,"Generated ZIP signature is valid");
  console.log("\n[ ACCEPTED ] Public builder deployment passed Chapter 11 checks.");
})().catch(error=>{console.error(`\n[ FAIL ] ${error.name==="AbortError"?`Timed out after ${timeoutMs}ms`:error.message}`);process.exit(1)});
