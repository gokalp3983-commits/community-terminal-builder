"use strict";
const {createReleaseAuthorization,verifyReleaseConfirmation,consumeReleaseAuthorization,clearAuthorizations,fingerprint}=require("./release-authorization");
const project={projectName:"TEST",ticker:"TST",tokenContract:"0x1111111111111111111111111111111111111111",features:{whaleTracker:false,memeIntel:false,nftTerminal:false,liveMarket:false}};
const input={project,repoName:"test-community-terminal",serviceName:"test-community-terminal",visibility:"public",releaseMode:"update"};
clearAuthorizations();
let denied=false;try{createReleaseAuthorization(input,{canRelease:false})}catch(error){denied=/READY project/i.test(error.message)}if(!denied)throw new Error("Authorization was created while readiness was blocked");
const auth=createReleaseAuthorization(input,{canRelease:true,target:{repoName:input.repoName,serviceName:input.serviceName}});
if(!auth.authorizationId||!auth.oneTime||auth.secretsExposed||!/^PUBLISH /.test(auth.confirmation))throw new Error("Protected authorization metadata invalid");
if(fingerprint(input)!==fingerprint({...input}))throw new Error("Release fingerprint is not deterministic");
let mismatch=false;try{consumeReleaseAuthorization({...input,releaseAuthorization:auth.authorizationId,confirmation:"WRONG"})}catch(error){mismatch=/confirmation phrase/i.test(error.message)}if(!mismatch)throw new Error("Incorrect confirmation phrase was accepted");
let replay=false;try{consumeReleaseAuthorization({...input,releaseAuthorization:auth.authorizationId,confirmation:auth.confirmation})}catch(error){replay=/missing|expired|locked|already used/i.test(error.message)}if(!replay)throw new Error("Consumed authorization could be replayed");
const changed=createReleaseAuthorization(input,{canRelease:true,target:{repoName:input.repoName,serviceName:input.serviceName}});let mutation=false;try{consumeReleaseAuthorization({...input,repoName:"other-repo",releaseAuthorization:changed.authorizationId,confirmation:changed.confirmation})}catch(error){mutation=/target or project changed/i.test(error.message)}if(!mutation)throw new Error("Changed target did not invalidate authorization");
const good=createReleaseAuthorization(input,{canRelease:true,target:{repoName:input.repoName,serviceName:input.serviceName}});const consumed=consumeReleaseAuthorization({...input,releaseAuthorization:good.authorizationId,confirmation:good.confirmation});if(!consumed.authorized)throw new Error("Valid authorization was not consumed");
console.log("[ PASS ] Chapter 14B readiness-gated release authorization");
console.log("[ PASS ] Chapter 14B exact confirmation phrase");
console.log("[ PASS ] Chapter 14B one-time/replay protection");
console.log("[ PASS ] Chapter 14B target-change invalidation");

clearAuthorizations();
const attempts=createReleaseAuthorization(input,{canRelease:true,target:{repoName:input.repoName,serviceName:input.serviceName}});
for(let i=0;i<2;i++){const r=verifyReleaseConfirmation({releaseAuthorization:attempts.authorizationId,confirmation:"WRONG"});if(r.locked||r.attemptsRemaining!==2-i)throw new Error("Incorrect confirmation attempt count failed");}
const third=verifyReleaseConfirmation({releaseAuthorization:attempts.authorizationId,confirmation:"WRONG"});if(!third.locked||third.attemptsRemaining!==0)throw new Error("Third incorrect confirmation did not lock authorization");
let locked=false;try{consumeReleaseAuthorization({...input,releaseAuthorization:attempts.authorizationId,confirmation:attempts.confirmation})}catch(error){locked=/locked|missing|expired/i.test(error.message)}if(!locked)throw new Error("Locked authorization could still be consumed");
console.log("[ PASS ] Chapter 14B three-attempt confirmation lockout");
