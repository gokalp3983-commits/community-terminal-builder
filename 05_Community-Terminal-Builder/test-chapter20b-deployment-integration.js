"use strict";
const assert=require("assert");
const fs=require("fs");
const path=require("path");
const ROOT=__dirname;
const html=fs.readFileSync(path.join(ROOT,"public/index.html"),"utf8");
assert(!html.includes("jacket-community-terminal"),"Chapter 20B must not expose historical project names in deployment inputs");
assert(html.includes('placeholder="auto-derived from project name"'),"Connected deployment inputs should use neutral auto-derived placeholders");
const app=fs.readFileSync(path.join(ROOT,"public/app.js"),"utf8");
const placeholderText=[...html.matchAll(/placeholder="([^"]*)"/g),...app.matchAll(/placeholder="([^"]*)"/g)].map(m=>m[1]).join("\n");
for(const stale of ["CATCOIN","catcoin","jacket-community-terminal","SPRITEHOOD","HOODBIRDS","HOODMANCERS","HOODRAT"]){
  assert(!placeholderText.toLowerCase().includes(stale.toLowerCase()),`Fresh-state placeholder leaks historical/sample project data: ${stale}`);
}
assert(!/<select name="nftMintMode" id="nft-mint-mode"[^>]*\srequired(?:\s|>)/.test(html),"Hidden NFT mint mode must not be statically required for token-only projects");
assert.match(app,/if\(mintMode\)mintMode\.required=enabled;/,"NFT mint mode required state must follow the NFT Terminal toggle");
const {releaseReadiness}=require("./release-readiness");
const {buildFingerprint}=require("./build-fingerprint");

assert.match(html,/id="deploy-built-terminal"[^>]*>DEPLOY TERMINAL</,"20B primary deploy action missing");
assert(!html.includes('id="download-built-terminal"'),"Post-creation popup must not expose Download ZIP in final end-user flow");
assert.match(html,/id="export-project"[^>]*>EXPORT</,"Advanced project export fallback remains available");
assert.match(html,/id="quick-deploy-confirmation"/,"20B protected confirmation UI missing");
assert(!/downloadBuild\(\);const autoSaved=noteGenerated/.test(app),"20B generation must not auto-download ZIP");
assert.match(app,/ready to deploy/,"20B post-generation deployment state missing");
assert.match(app,/\/api\/release-readiness/,"20B integrated readiness call missing");
assert.match(app,/\/api\/release-prepare/,"20B integrated release preparation call missing");
assert.match(app,/\/api\/deploy-connected/,"20B integrated connected deployment call missing");
assert.match(app,/pollRenderDeployment\(data,out,\{onLive:/,"20B live deployment polling integration missing");
assert(!app.includes("https://www.terminal.xyz/"),"20B must not expose a mock live URL");
assert.match(app,/function quickDeployInput\(\).*lastBuild\.project/s,"Quick deploy must target the generated build snapshot, not manual handoff URL fields");
assert.match(app,/const target=`\$\{base\}-community-terminal`/ ,"Quick deploy must auto-derive one canonical deployment target from the current generated project");
assert.match(app,/repoName:target,serviceName:target/ ,"Quick deploy must pass the same derived target to GitHub and Render");
assert.match(app,/terminalUserFromTicker/ ,"Terminal User ticker auto-derivation helper missing");
assert.match(app,/ticker.*syncTerminalIdentity/s,"Ticker changes must auto-fill canonical terminal identity");
const serverSource=fs.readFileSync(path.join(ROOT,"server.js"),"utf8");
assert.match(serverSource,/Cache-Control":"no-store, max-age=0"/,"Builder static assets must not be cached across extracted test candidates");
assert(!serverSource.includes('public, max-age=3600'),"Builder JS/CSS caching can execute stale candidate code and must remain disabled");


const project={projectName:"FIRSTDEPLOY",ticker:"FST",tokenContract:"0x1111111111111111111111111111111111111111",features:{}};
const fp=buildFingerprint(project);
const env={CONNECTED_DEPLOYMENTS_ENABLED:"true",RELEASE_ACTIONS_ENABLED:"true",GITHUB_TOKEN:"x",RENDER_API_KEY:"y",RENDER_OWNER_ID:"tea-123"};
const providers={enabled:true,releaseActionsEnabled:true,secretsExposed:false,github:{verified:true,configured:true,login:"tester"},render:{verified:true,configured:true,workspaceName:"Test"}};
const create=releaseReadiness({project,repoName:"firstdeploy-community-terminal",serviceName:"firstdeploy-community-terminal",releaseMode:"create",generatedFingerprint:fp,publicAcceptance:false},{env,providerStatus:providers});
assert.equal(create.ready,true,"First CREATE deployment must not require a pre-existing public acceptance result");
assert.equal(create.canRelease,true,"First CREATE deployment should be releasable when all other safeguards pass");
assert.equal(create.checks.find(x=>x.id==="acceptance").ready,true,"CREATE acceptance check should be satisfied by first-deploy exemption");
const update=releaseReadiness({project,repoName:"firstdeploy-community-terminal",serviceName:"firstdeploy-community-terminal",releaseMode:"update",generatedFingerprint:fp,publicAcceptance:false},{env,providerStatus:providers});
assert.equal(update.ready,false,"UPDATE deployment must still require public acceptance");
assert.equal(update.checks.find(x=>x.id==="acceptance").ready,false,"UPDATE acceptance safeguard must remain enforced");

console.log("Chapter 20B integrated deployment workflow: PASS");
