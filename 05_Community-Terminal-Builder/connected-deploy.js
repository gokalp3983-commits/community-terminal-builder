"use strict";
const { generate } = require("./generator");

function slug(value){return String(value||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,80)}
function envConfig(env=process.env){return {
  enabled:String(env.CONNECTED_DEPLOYMENTS_ENABLED||"").toLowerCase()==="true",
  githubToken:String(env.GITHUB_TOKEN||""), githubOwner:String(env.GITHUB_OWNER||""),
  renderKey:String(env.RENDER_API_KEY||""), renderOwnerId:String(env.RENDER_OWNER_ID||""),
  renderRegion:String(env.RENDER_REGION||"oregon"),
}}
function publicStatus(env=process.env){const c=envConfig(env);return {
  enabled:c.enabled,
  github:{configured:Boolean(c.githubToken),ownerConfigured:Boolean(c.githubOwner)},
  render:{configured:Boolean(c.renderKey&&c.renderOwnerId),workspaceConfigured:Boolean(c.renderOwnerId)},
  mode:"server-side-credentials",
  secretsExposed:false,
}}
async function api(fetchImpl,url,{token,method="GET",body,headers={}}={}){
  const response=await fetchImpl(url,{method,headers:{accept:"application/json",authorization:`Bearer ${token}`,"content-type":"application/json",...headers},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(45000)});
  const text=await response.text();let data=null;try{data=text?JSON.parse(text):null}catch{data={message:text}}
  if(!response.ok){const error=new Error(data?.message||data?.error||`${method} ${url} returned HTTP ${response.status}`);error.status=response.status;error.data=data;throw error}
  return data;
}
async function githubIdentity(fetchImpl,c){if(c.githubOwner)return c.githubOwner;const user=await api(fetchImpl,"https://api.github.com/user",{token:c.githubToken,headers:{"x-github-api-version":"2022-11-28"}});return user.login}
async function githubRequest(fetchImpl,c,path,opts={}){return api(fetchImpl,`https://api.github.com${path}`,{...opts,token:c.githubToken,headers:{"x-github-api-version":"2022-11-28",...(opts.headers||{})}})}
async function ensureRepo(fetchImpl,c,owner,repoName,description,visibility,allowUpdate){
  try{return {repo:await githubRequest(fetchImpl,c,`/repos/${owner}/${repoName}`),created:false}}
  catch(error){if(error.status!==404)throw error}
  if(!allowUpdate){/* creation is still allowed; allowUpdate governs replacing an existing tree */}
  const repo=await githubRequest(fetchImpl,c,"/user/repos",{method:"POST",body:{name:repoName,description,private:visibility==="private",auto_init:false,has_issues:true,has_projects:false,has_wiki:false}});
  return {repo,created:true};
}
function relativeFiles(result){const prefix=`${result.root}/`;return result.entries.map(entry=>({path:entry.name.startsWith(prefix)?entry.name.slice(prefix.length):entry.name,data:Buffer.isBuffer(entry.data)?entry.data:Buffer.from(entry.data)})).filter(x=>x.path&&!x.path.endsWith("/"));}
async function publishGitHub(fetchImpl,c,result,{repoName,visibility="public",allowUpdate=true}){
  const owner=await githubIdentity(fetchImpl,c);const ensured=await ensureRepo(fetchImpl,c,owner,repoName,`Generated ${result.project.name} Community Terminal`,visibility,allowUpdate);
  let parentSha=null,baseTree=null;
  if(!ensured.created){
    if(!allowUpdate)throw new Error(`GitHub repository ${owner}/${repoName} already exists.`);
    try{const ref=await githubRequest(fetchImpl,c,`/repos/${owner}/${repoName}/git/ref/heads/main`);parentSha=ref.object.sha;const commit=await githubRequest(fetchImpl,c,`/repos/${owner}/${repoName}/git/commits/${parentSha}`);baseTree=commit.tree.sha}catch(error){if(error.status!==404)throw error}
  }
  const tree=[];
  for(const file of relativeFiles(result)){
    const blob=await githubRequest(fetchImpl,c,`/repos/${owner}/${repoName}/git/blobs`,{method:"POST",body:{content:file.data.toString("base64"),encoding:"base64"}});
    tree.push({path:file.path,mode:"100644",type:"blob",sha:blob.sha});
  }
  const createdTree=await githubRequest(fetchImpl,c,`/repos/${owner}/${repoName}/git/trees`,{method:"POST",body:{tree,...(baseTree?{base_tree:baseTree}:{})}});
  const commit=await githubRequest(fetchImpl,c,`/repos/${owner}/${repoName}/git/commits`,{method:"POST",body:{message:`Publish ${result.project.name} Community Terminal via CTB 1.3.1-B`,tree:createdTree.sha,parents:parentSha?[parentSha]:[]}});
  if(parentSha)await githubRequest(fetchImpl,c,`/repos/${owner}/${repoName}/git/refs/heads/main`,{method:"PATCH",body:{sha:commit.sha,force:false}});
  else await githubRequest(fetchImpl,c,`/repos/${owner}/${repoName}/git/refs`,{method:"POST",body:{ref:"refs/heads/main",sha:commit.sha}});
  if(ensured.repo.default_branch!=="main"){
    try{await githubRequest(fetchImpl,c,`/repos/${owner}/${repoName}`,{method:"PATCH",body:{default_branch:"main"}})}catch{}
  }
  return {owner,repoName,repoUrl:`https://github.com/${owner}/${repoName}`,commitSha:commit.sha,created:ensured.created,fileCount:tree.length};
}
async function renderRequest(fetchImpl,c,path,opts={}){return api(fetchImpl,`https://api.render.com/v1${path}`,{...opts,token:c.renderKey})}
function renderUrl(service){return service?.serviceDetails?.url||service?.url||service?.service?.serviceDetails?.url||""}
async function deployRender(fetchImpl,c,{repoUrl,serviceName}){
  let services=[];try{services=await renderRequest(fetchImpl,c,`/services?name=${encodeURIComponent(serviceName)}`)}catch{}
  const list=Array.isArray(services)?services.map(x=>x.service||x):[];let service=list.find(x=>x.name===serviceName);let created=false;
  if(!service){
    service=await renderRequest(fetchImpl,c,"/services",{method:"POST",body:{type:"web_service",name:serviceName,ownerId:c.renderOwnerId,repo:repoUrl,branch:"main",autoDeploy:"yes",serviceDetails:{runtime:"node",plan:"free",region:c.renderRegion,buildCommand:"npm install",startCommand:"npm start",healthCheckPath:"/healthz",envSpecificDetails:{buildCommand:"npm install",startCommand:"npm start"}}}});created=true;
  }else{
    await renderRequest(fetchImpl,c,`/services/${service.id}`,{method:"PATCH",body:{repo:repoUrl,branch:"main",autoDeploy:"yes"}});
    await renderRequest(fetchImpl,c,`/services/${service.id}/deploys`,{method:"POST",body:{clearCache:"do_not_clear"}});
  }
  return {serviceId:service.id||service.service?.id||null,serviceName,publicUrl:renderUrl(service),created,status:service.status||"deploying"};
}
async function connectedDeploy(input,{fetchImpl=fetch,env=process.env}={}){
  const c=envConfig(env);if(!c.enabled)throw new Error("Connected deployments are disabled on this builder.");
  if(!c.githubToken)throw new Error("GitHub integration is not configured on the builder server.");
  if(!c.renderKey||!c.renderOwnerId)throw new Error("Render integration is not configured on the builder server.");
  const project=input.project||{};const result=generate(project);const repoName=slug(input.repoName||`${result.project.id}-community-terminal`);const serviceName=slug(input.serviceName||`${result.project.id}-community-terminal`).slice(0,63);
  if(!repoName||!serviceName)throw new Error("Repository and service names are required.");
  const github=await publishGitHub(fetchImpl,c,result,{repoName,visibility:input.visibility==="private"?"private":"public",allowUpdate:input.allowUpdate!==false});
  const render=await deployRender(fetchImpl,c,{repoUrl:github.repoUrl,serviceName});
  return {ok:true,mode:"connected-prototype",project:result.project.name,github,render,generatedAt:new Date().toISOString(),warning:"Render may take several minutes to build and assign a public URL."};
}
module.exports={connectedDeploy,publicStatus,envConfig,relativeFiles,publishGitHub,deployRender};
