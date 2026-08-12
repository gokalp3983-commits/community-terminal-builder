"use strict";
const assert=require("assert");
const {publishGitHub}=require("./connected-deploy");
const calls=[];let blob=0,bootstrapAttempts=0;
function response(status,data){return {ok:status>=200&&status<300,status,async text(){return data===null?"":JSON.stringify(data)}}}
async function fakeFetch(url,opts={}){
  const method=opts.method||"GET";const body=opts.body?JSON.parse(opts.body):null;calls.push({url,method,body});
  if(url.endsWith("/user"))return response(200,{login:"tester"});
  if(url.endsWith("/repos/tester/fix6-community-terminal")&&method==="GET")return response(404,{message:"Not Found"});
  if(url.endsWith("/user/repos"))return response(201,{name:"fix6-community-terminal",default_branch:null});
  if(url.includes("/contents/")&&method==="PUT"){
    bootstrapAttempts++;
    if(bootstrapAttempts===1)return response(409,{message:"Git Repository is empty."});
    return response(201,{content:{path:"package.json"},commit:{sha:"seed-commit"}});
  }
  if(url.endsWith("/git/commits/seed-commit"))return response(200,{sha:"seed-commit",tree:{sha:"seed-tree"}});
  if(url.endsWith("/git/blobs"))return response(201,{sha:`blob-${++blob}`});
  if(url.endsWith("/git/trees")){
    assert.equal(body.base_tree,"seed-tree","Full publish must build on initialized repository tree");
    return response(201,{sha:"full-tree"});
  }
  if(url.endsWith("/git/commits")){
    assert.deepEqual(body.parents,["seed-commit"],"Full publish must parent the initialization commit");
    return response(201,{sha:"full-commit"});
  }
  if(url.endsWith("/git/refs/heads/main")&&method==="PATCH")return response(200,{ref:"refs/heads/main",object:{sha:"full-commit"}});
  if(url.endsWith("/repos/tester/fix6-community-terminal")&&method==="PATCH")return response(200,{default_branch:"main"});
  throw new Error(`Unexpected fake request ${method} ${url}`);
}
(async()=>{
  const c={githubToken:"gh-test",githubOwner:"tester"};
  const result={project:{name:"FIX6"},root:"FIX6_Community_Terminal",entries:[
    {name:"FIX6_Community_Terminal/package.json",data:Buffer.from('{"name":"fix6"}')},
    {name:"FIX6_Community_Terminal/server.js",data:Buffer.from('console.log("ok")')}
  ]};
  const out=await publishGitHub(fakeFetch,c,result,{repoName:"fix6-community-terminal",visibility:"public",releaseMode:"create"});
  assert.equal(out.commitSha,"full-commit");
  assert.equal(out.created,true);
  assert.equal(bootstrapAttempts,2,"409 empty-repository initialization should be retried");
  assert(calls.some(x=>x.url.includes("/contents/")&&x.method==="PUT"),"Empty repo must be initialized through repository contents API");
  assert(!calls.some(x=>x.url.endsWith("/git/refs")&&x.method==="POST"),"Empty repo flow must not attempt to create a ref before repository initialization");
  console.log("[ PASS ] Chapter 20B FIX6 empty GitHub repository initialization");
  console.log("[ PASS ] Chapter 20B FIX6 retries GitHub 409 during repository initialization");
})().catch(e=>{console.error(`[ FAIL ] ${e.stack||e.message}`);process.exit(1)});
