"use strict";
const { generate } = require("./generator");
const { consumeReleaseAuthorization } = require("./release-authorization");

function slug(value){return String(value||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,80)}
function envConfig(env=process.env){return {
  enabled:String(env.CONNECTED_DEPLOYMENTS_ENABLED||"").toLowerCase()==="true",
  releaseActionsEnabled:String(env.RELEASE_ACTIONS_ENABLED||"").toLowerCase()==="true",
  githubToken:String(env.GITHUB_TOKEN||""), githubOwner:String(env.GITHUB_OWNER||""),
  renderKey:String(env.RENDER_API_KEY||""), renderOwnerId:String(env.RENDER_OWNER_ID||""),
  renderRegion:String(env.RENDER_REGION||"oregon"),
  openSeaApiKey:String(env.OPENSEA_API_KEY||""),
}}
function publicStatus(env=process.env){const c=envConfig(env);return {
  enabled:c.enabled,
  releaseActionsEnabled:c.releaseActionsEnabled,
  github:{configured:Boolean(c.githubToken),ownerConfigured:Boolean(c.githubOwner),verified:false},
  render:{configured:Boolean(c.renderKey&&c.renderOwnerId),workspaceConfigured:Boolean(c.renderOwnerId),verified:false},
  marketplace:{openSeaConfigured:Boolean(c.openSeaApiKey)},
  mode:"server-side-credentials",
  secretsExposed:false,
}}
async function api(fetchImpl,url,{token,method="GET",body,headers={}}={}){
  const response=await fetchImpl(url,{method,headers:{accept:"application/json",authorization:`Bearer ${token}`,"content-type":"application/json",...headers},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(45000)});
  const text=await response.text();let data=null;try{data=text?JSON.parse(text):null}catch{data={message:text}}
  if(!response.ok){const error=new Error(data?.message||data?.error||`${method} ${url} returned HTTP ${response.status}`);error.status=response.status;error.data=data;throw error}
  return data;
}

async function validateIntegrations({fetchImpl=fetch,env=process.env}={}){
  const c=envConfig(env);
  const base=publicStatus(env);
  const result={...base,github:{...base.github},render:{...base.render},checkedAt:new Date().toISOString()};
  if(!c.enabled)return result;
  if(c.githubToken){
    try{
      const user=await githubRequest(fetchImpl,c,"/user");
      const login=String(user?.login||"");
      result.github={...result.github,verified:Boolean(login),login,error:""};
    }catch(error){result.github={...result.github,verified:false,error:error.message||"GitHub credential validation failed."};}
  }
  if(c.renderKey&&c.renderOwnerId){
    try{
      const owners=await renderRequest(fetchImpl,c,"/owners?limit=100");
      const list=Array.isArray(owners)?owners:Array.isArray(owners?.items)?owners.items:[];
      const found=list.map(x=>x.owner||x).find(x=>String(x?.id||"")===c.renderOwnerId);
      result.render={...result.render,verified:Boolean(found),workspaceName:String(found?.name||""),error:found?"":"Configured Render workspace is not accessible with this API key."};
    }catch(error){result.render={...result.render,verified:false,error:error.message||"Render credential validation failed."};}
  }
  return result;
}
async function githubIdentity(fetchImpl,c){if(c.githubOwner)return c.githubOwner;const user=await api(fetchImpl,"https://api.github.com/user",{token:c.githubToken,headers:{"x-github-api-version":"2022-11-28"}});return user.login}
async function githubRequest(fetchImpl,c,path,opts={}){return api(fetchImpl,`https://api.github.com${path}`,{...opts,token:c.githubToken,headers:{"x-github-api-version":"2022-11-28",...(opts.headers||{})}})}
async function ensureRepo(fetchImpl,c,owner,repoName,description,visibility,releaseMode){
  let existing=null;
  try{existing=await githubRequest(fetchImpl,c,`/repos/${owner}/${repoName}`)}catch(error){if(error.status!==404)throw error}
  if(releaseMode==="create"){
    if(existing)throw new Error(`GitHub repository ${owner}/${repoName} already exists. Choose UPDATE EXISTING RELEASE instead.`);
    const repo=await githubRequest(fetchImpl,c,"/user/repos",{method:"POST",body:{name:repoName,description,private:visibility==="private",auto_init:false,has_issues:true,has_projects:false,has_wiki:false}});
    return {repo,created:true};
  }
  if(!existing)throw new Error(`GitHub repository ${owner}/${repoName} does not exist. Choose CREATE NEW RELEASE instead.`);
  return {repo:existing,created:false};
}
function relativeFiles(result){const prefix=`${result.root}/`;return result.entries.map(entry=>({path:entry.name.startsWith(prefix)?entry.name.slice(prefix.length):entry.name,data:Buffer.isBuffer(entry.data)?entry.data:Buffer.from(entry.data)})).filter(x=>x.path&&!x.path.endsWith("/"));}
async function initializeEmptyRepo(fetchImpl,c,owner,repoName,files){
  const seed=files[0];
  if(!seed)throw new Error("Generated terminal contains no publishable files.");
  let created=null,lastError=null;
  for(let attempt=0;attempt<10;attempt++){
    try{
      created=await githubRequest(fetchImpl,c,`/repos/${owner}/${repoName}/contents/${seed.path.split("/").map(encodeURIComponent).join("/")}`,{method:"PUT",body:{message:"Initialize repository for CTB deployment",content:seed.data.toString("base64"),branch:"main"}});
      break;
    }catch(error){
      lastError=error;
      if(error.status!==409)throw error;
      await new Promise(resolve=>setTimeout(resolve,500*(attempt+1)));
    }
  }
  if(!created)throw lastError||new Error("GitHub repository could not be initialized.");
  const parentSha=String(created?.commit?.sha||"");
  if(!parentSha)throw new Error("GitHub repository initialization did not return a commit SHA.");
  const commit=await githubRequest(fetchImpl,c,`/repos/${owner}/${repoName}/git/commits/${parentSha}`);
  return {parentSha,baseTree:String(commit?.tree?.sha||"")};
}
async function publishGitHub(fetchImpl,c,result,{repoName,visibility="public",releaseMode="update"}){
  const owner=await githubIdentity(fetchImpl,c);const ensured=await ensureRepo(fetchImpl,c,owner,repoName,`Generated ${result.project.name} Community Terminal`,visibility,releaseMode);
  const files=relativeFiles(result);
  let parentSha=null,baseTree=null;
  if(ensured.created){
    ({parentSha,baseTree}=await initializeEmptyRepo(fetchImpl,c,owner,repoName,files));
  }else{
    try{const ref=await githubRequest(fetchImpl,c,`/repos/${owner}/${repoName}/git/ref/heads/main`);parentSha=ref.object.sha;const commit=await githubRequest(fetchImpl,c,`/repos/${owner}/${repoName}/git/commits/${parentSha}`);baseTree=commit.tree.sha}catch(error){if(error.status!==404&&error.status!==409)throw error}
    if(!parentSha)({parentSha,baseTree}=await initializeEmptyRepo(fetchImpl,c,owner,repoName,files));
  }
  const tree=[];
  for(const file of files){
    const blob=await githubRequest(fetchImpl,c,`/repos/${owner}/${repoName}/git/blobs`,{method:"POST",body:{content:file.data.toString("base64"),encoding:"base64"}});
    tree.push({path:file.path,mode:"100644",type:"blob",sha:blob.sha});
  }
  const createdTree=await githubRequest(fetchImpl,c,`/repos/${owner}/${repoName}/git/trees`,{method:"POST",body:{tree,...(baseTree?{base_tree:baseTree}:{})}});
  const commit=await githubRequest(fetchImpl,c,`/repos/${owner}/${repoName}/git/commits`,{method:"POST",body:{message:`Publish ${result.project.name} Community Terminal via CTB 1.3.2-b`,tree:createdTree.sha,parents:parentSha?[parentSha]:[]}});
  if(parentSha)await githubRequest(fetchImpl,c,`/repos/${owner}/${repoName}/git/refs/heads/main`,{method:"PATCH",body:{sha:commit.sha,force:false}});
  else await githubRequest(fetchImpl,c,`/repos/${owner}/${repoName}/git/refs`,{method:"POST",body:{ref:"refs/heads/main",sha:commit.sha}});
  if(ensured.repo.default_branch!=="main"){
    try{await githubRequest(fetchImpl,c,`/repos/${owner}/${repoName}`,{method:"PATCH",body:{default_branch:"main"}})}catch{}
  }
  return {owner,repoName,repoUrl:`https://github.com/${owner}/${repoName}`,commitSha:commit.sha,created:ensured.created,fileCount:tree.length};
}
async function renderRequest(fetchImpl,c,path,opts={}){return api(fetchImpl,`https://api.render.com/v1${path}`,{...opts,token:c.renderKey})}
function renderUrl(service){return service?.serviceDetails?.url||service?.url||service?.service?.serviceDetails?.url||""}
async function syncRenderRuntimeSecrets(fetchImpl,c,serviceId){
  if(!serviceId)return;
  if(c.openSeaApiKey){
    await renderRequest(fetchImpl,c,`/services/${serviceId}/env-vars/OPENSEA_API_KEY`,{method:"PUT",body:{value:c.openSeaApiKey}});
    const check=await renderRequest(fetchImpl,c,`/services/${serviceId}/env-vars/OPENSEA_API_KEY`);
    if(!check) throw new Error("Render did not confirm OPENSEA_API_KEY after synchronization.");
  }
}
async function deployRender(fetchImpl,c,{repoUrl,serviceName,releaseMode="update"}){
  let services=[];try{services=await renderRequest(fetchImpl,c,`/services?name=${encodeURIComponent(serviceName)}`)}catch{}
  const list=Array.isArray(services)?services.map(x=>x.service||x):[];let service=list.find(x=>x.name===serviceName);let created=false;
  if(releaseMode==="create"){
    if(service)throw new Error(`Render service ${serviceName} already exists. Choose UPDATE EXISTING RELEASE instead.`);
    service=await renderRequest(fetchImpl,c,"/services",{method:"POST",body:{type:"web_service",name:serviceName,ownerId:c.renderOwnerId,repo:repoUrl,branch:"main",autoDeploy:"yes",serviceDetails:{runtime:"node",plan:"free",region:c.renderRegion,buildCommand:"npm install",startCommand:"npm start",healthCheckPath:"/healthz",envSpecificDetails:{buildCommand:"npm install",startCommand:"npm start"}}}});created=true;
    const serviceId=service.id||service.service?.id||null;
    if(c.openSeaApiKey&&serviceId){await syncRenderRuntimeSecrets(fetchImpl,c,serviceId);const deploy=await renderRequest(fetchImpl,c,`/services/${serviceId}/deploys`,{method:"POST",body:{clearCache:"do_not_clear"}});service={...service,_ctbDeploy:deploy};}
  }else{
    if(!service)throw new Error(`Render service ${serviceName} does not exist. Choose CREATE NEW RELEASE instead.`);
    await renderRequest(fetchImpl,c,`/services/${service.id}`,{method:"PATCH",body:{repo:repoUrl,branch:"main",autoDeploy:"yes"}});
    await syncRenderRuntimeSecrets(fetchImpl,c,service.id);
    const deploy=await renderRequest(fetchImpl,c,`/services/${service.id}/deploys`,{method:"POST",body:{clearCache:"do_not_clear"}});
    service={...service,_ctbDeploy:deploy};
  }
  const deploy=service._ctbDeploy||service.deploy||null;
  return {serviceId:service.id||service.service?.id||null,serviceName,publicUrl:renderUrl(service),created,deployId:deploy?.id||deploy?.deploy?.id||null,status:deploy?.status||deploy?.deploy?.status||service.status||"deploying"};
}
async function getRenderDeploymentStatus(serviceId,{fetchImpl=fetch,env=process.env}={}){
  const c=envConfig(env);
  if(!c.enabled)throw new Error("Connected deployments are disabled on this builder.");
  if(!c.renderKey||!c.renderOwnerId)throw new Error("Render integration is not configured on the builder server.");
  const id=String(serviceId||"").trim();
  if(!/^srv-[A-Za-z0-9]+$/.test(id))throw new Error("Invalid Render service ID.");
  const response=await renderRequest(fetchImpl,c,`/services/${encodeURIComponent(id)}/deploys?limit=1`);
  const list=Array.isArray(response)?response:Array.isArray(response?.items)?response.items:[];
  const deploy=list.map(item=>item?.deploy||item).find(Boolean)||null;
  let publicUrl="";
  try{const service=await renderRequest(fetchImpl,c,`/services/${encodeURIComponent(id)}`);publicUrl=renderUrl(service)||renderUrl(service?.service)||""}catch{}
  if(!deploy)return {ok:true,serviceId:id,status:"pending",deployId:null,finished:false,success:false,failed:false,publicUrl};
  const status=String(deploy.status||"pending").toLowerCase();
  const success=["live"].includes(status);
  const failed=["build_failed","update_failed","pre_deploy_failed","canceled","cancelled"].includes(status);
  return {ok:true,serviceId:id,deployId:deploy.id||null,status,finished:success||failed,success,failed,publicUrl,updatedAt:deploy.updatedAt||deploy.finishedAt||new Date().toISOString()};
}
async function connectedDeploy(input,{fetchImpl=fetch,env=process.env}={}){
  const c=envConfig(env);if(!c.enabled)throw new Error("Connected deployments are disabled on this builder.");
  if(!c.releaseActionsEnabled)throw new Error("Release actions are policy locked on this builder.");
  if(!c.githubToken)throw new Error("GitHub integration is not configured on the builder server.");
  if(!c.renderKey||!c.renderOwnerId)throw new Error("Render integration is not configured on the builder server.");
  consumeReleaseAuthorization(input);
  const project=input.project||{};const result=generate(project);const repoName=slug(input.repoName||`${result.project.id}-community-terminal`);const serviceName=slug(input.serviceName||`${result.project.id}-community-terminal`).slice(0,63);
  const releaseMode=input.releaseMode==="create"?"create":"update";
  if(!repoName||!serviceName)throw new Error("Repository and service names are required.");
  const github=await publishGitHub(fetchImpl,c,result,{repoName,visibility:input.visibility==="private"?"private":"public",releaseMode});
  const render=await deployRender(fetchImpl,c,{repoUrl:github.repoUrl,serviceName,releaseMode});
  return {ok:true,mode:"protected-release",releaseMode,project:result.project.name,github,render,generatedAt:new Date().toISOString(),warning:"Render may take several minutes to build and assign a public URL."};
}
module.exports={connectedDeploy,publicStatus,validateIntegrations,envConfig,relativeFiles,publishGitHub,deployRender,getRenderDeploymentStatus};
