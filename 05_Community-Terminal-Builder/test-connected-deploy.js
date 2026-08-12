"use strict";
const {connectedDeploy,publicStatus}=require("./connected-deploy");
const {createReleaseAuthorization,clearAuthorizations}=require("./release-authorization");
const calls=[];let blob=0;
function response(status,data){return {ok:status>=200&&status<300,status,async text(){return data===null?"":JSON.stringify(data)}}}
async function fakeFetch(url,opts={}){calls.push({url,method:opts.method||"GET",body:opts.body?JSON.parse(opts.body):null});
 if(url.endsWith("/user"))return response(200,{login:"tester"});
 if(url.endsWith("/repos/tester/test-community-terminal")&&(opts.method||"GET")==="GET")return response(404,{message:"Not Found"});
 if(url.endsWith("/user/repos"))return response(201,{name:"test-community-terminal",default_branch:null});
 if(url.includes("/contents/")&&(opts.method||"GET")==="PUT")return response(201,{commit:{sha:"seed-commit"}});
 if(url.endsWith("/git/commits/seed-commit"))return response(200,{sha:"seed-commit",tree:{sha:"seed-tree"}});
 if(url.endsWith("/git/blobs"))return response(201,{sha:`blob-${++blob}`});
 if(url.endsWith("/git/trees"))return response(201,{sha:"tree-1"});
 if(url.endsWith("/git/commits"))return response(201,{sha:"commit-1"});
 if(url.endsWith("/git/refs/heads/main")&&(opts.method||"GET")==="PATCH")return response(200,{ref:"refs/heads/main"});
 if(url.includes("/repos/tester/test-community-terminal")&&(opts.method||"GET")==="PATCH")return response(200,{default_branch:"main"});
 if(url.includes("api.render.com/v1/services?"))return response(200,[]);
 if(url.endsWith("api.render.com/v1/services"))return response(201,{id:"srv-test",name:"test-community-terminal",status:"build_in_progress",serviceDetails:{url:"https://test-community-terminal.onrender.com"}});
 throw new Error(`Unexpected fake request ${opts.method||"GET"} ${url}`);
}
(async()=>{clearAuthorizations();const env={CONNECTED_DEPLOYMENTS_ENABLED:"true",RELEASE_ACTIONS_ENABLED:"true",GITHUB_TOKEN:"gh-test",GITHUB_OWNER:"tester",RENDER_API_KEY:"rnd-test",RENDER_OWNER_ID:"tea-test",RENDER_REGION:"oregon"};const st=publicStatus(env);if(!st.enabled||!st.releaseActionsEnabled||!st.github.configured||!st.render.configured||st.secretsExposed)throw new Error("Integration status failed");
 const project={projectName:"TEST",ticker:"TST",tokenContract:"0x1111111111111111111111111111111111111111",features:{whaleTracker:false,memeIntel:false,nftTerminal:false,liveMarket:false}};
 let locked=false;try{await connectedDeploy({project},{fetchImpl:fakeFetch,env:{...env,RELEASE_ACTIONS_ENABLED:"false"}})}catch(error){locked=/policy locked/i.test(error.message)}if(!locked)throw new Error("Release policy lock failed");
 const input={project,repoName:"test-community-terminal",serviceName:"test-community-terminal",visibility:"public",releaseMode:"create"};
 const auth=createReleaseAuthorization(input,{canRelease:true,target:{repoName:input.repoName,serviceName:input.serviceName}});const result=await connectedDeploy({...input,releaseAuthorization:auth.authorizationId,confirmation:auth.confirmation},{fetchImpl:fakeFetch,env});
 if(result.github.commitSha!=="commit-1"||result.render.serviceId!=="srv-test"||result.releaseMode!=="create")throw new Error("Connected deployment result failed");if(!calls.some(x=>x.url.endsWith("/git/blobs"))||!calls.some(x=>x.url.endsWith("api.render.com/v1/services")))throw new Error("Expected provider API calls missing");console.log("[ PASS ] Chapter 13B GitHub publish engine");console.log("[ PASS ] Chapter 13B Render service engine");console.log("[ PASS ] Chapter 14B authorization-required publish path");console.log("[ PASS ] Connected credentials remain server-side");})().catch(e=>{console.error(`[ FAIL ] ${e.message}`);process.exit(1)});
