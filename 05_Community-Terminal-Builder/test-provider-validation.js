"use strict";
const {validateIntegrations}=require("./connected-deploy");
function response(status,data){return {ok:status>=200&&status<300,status,async text(){return JSON.stringify(data)}}}
const env={CONNECTED_DEPLOYMENTS_ENABLED:"true",RELEASE_ACTIONS_ENABLED:"true",GITHUB_TOKEN:"gh-good",GITHUB_OWNER:"tester",RENDER_API_KEY:"rnd-good",RENDER_OWNER_ID:"tea-test"};
async function goodFetch(url){
  if(url.endsWith("api.github.com/user"))return response(200,{login:"tester"});
  if(url.includes("api.render.com/v1/owners"))return response(200,[{owner:{id:"tea-test",name:"Test Workspace"}}]);
  throw new Error(`Unexpected ${url}`);
}
async function badGithub(url){
  if(url.endsWith("api.github.com/user"))return response(401,{message:"Bad credentials"});
  if(url.includes("api.render.com/v1/owners"))return response(200,[{owner:{id:"tea-test",name:"Test Workspace"}}]);
  throw new Error(`Unexpected ${url}`);
}
(async()=>{
  const good=await validateIntegrations({fetchImpl:goodFetch,env});
  if(!good.github.verified||!good.render.verified||good.secretsExposed)throw new Error("Valid provider credentials did not verify safely");
  const bad=await validateIntegrations({fetchImpl:badGithub,env});
  if(bad.github.verified||!/Bad credentials/i.test(bad.github.error)||!bad.render.verified)throw new Error("Invalid GitHub credential was not blocked during read-only validation");
  console.log("[ PASS ] Chapter 14C read-only GitHub credential validation");
  console.log("[ PASS ] Chapter 14C read-only Render workspace validation");
  console.log("[ PASS ] Chapter 14C invalid credentials blocked before release");
})().catch(e=>{console.error(`[ FAIL ] ${e.message}`);process.exit(1)});
