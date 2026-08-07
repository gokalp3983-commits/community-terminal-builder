"use strict";
const crypto = require("crypto");

const AUTH_TTL_MS = 5 * 60 * 1000;
const MAX_CONFIRMATION_ATTEMPTS = 3;
const pending = new Map();

function canonical(value){
  if(Array.isArray(value))return value.map(canonical);
  if(value && typeof value === "object")return Object.keys(value).sort().reduce((out,key)=>{out[key]=canonical(value[key]);return out;},{});
  return value;
}
function fingerprint(input={}){
  const releaseMode = input.releaseMode === "create" ? "create" : "update";
  const critical = {
    project: input.project || {},
    repoName: String(input.repoName || ""),
    serviceName: String(input.serviceName || ""),
    visibility: input.visibility === "private" ? "private" : "public",
    releaseMode,
  };
  return crypto.createHash("sha256").update(JSON.stringify(canonical(critical))).digest("hex");
}
function cleanup(now=Date.now()){
  for(const [id,entry] of pending){if(entry.expiresAtMs<=now)pending.delete(id)}
  if(pending.size>100){for(const id of pending.keys()){pending.delete(id);if(pending.size<=100)break}}
}
function createReleaseAuthorization(input={}, readiness, {now=Date.now()}={}){
  cleanup(now);
  if(!readiness?.canRelease)throw new Error("Release authorization requires a READY project and an enabled release policy.");
  const repoName=String(input.repoName||readiness?.target?.repoName||"").trim();
  const serviceName=String(input.serviceName||readiness?.target?.serviceName||"").trim();
  const releaseMode=input.releaseMode==="create"?"create":"update";
  if(!repoName||!serviceName)throw new Error("Repository and Render service names are required before release authorization.");
  const authorizationId=crypto.randomUUID();
  const confirmation=`PUBLISH ${repoName} AS ${releaseMode.toUpperCase()}`;
  const expiresAtMs=now+AUTH_TTL_MS;
  pending.set(authorizationId,{fingerprint:fingerprint({...input,repoName,serviceName,releaseMode}),confirmation,expiresAtMs,failedAttempts:0});
  return {
    ok:true,
    authorizationId,
    confirmation,
    expiresAt:new Date(expiresAtMs).toISOString(),
    oneTime:true,
    maxConfirmationAttempts:MAX_CONFIRMATION_ATTEMPTS,
    releaseMode,
    target:{repoName,serviceName},
    secretsExposed:false,
  };
}
function verifyReleaseConfirmation(input={}, {now=Date.now()}={}){
  cleanup(now);
  const id=String(input.releaseAuthorization||"");
  if(!id)throw new Error("A prepared one-time release authorization is required.");
  const entry=pending.get(id);
  if(!entry)throw new Error("Release authorization is missing, expired, locked, or already used.");
  if(entry.expiresAtMs<=now){pending.delete(id);throw new Error("Release authorization expired. Prepare the release again.");}
  const matched=String(input.confirmation||"")===entry.confirmation;
  if(matched)return {ok:true,matched:true,locked:false,attemptsRemaining:MAX_CONFIRMATION_ATTEMPTS-entry.failedAttempts};
  entry.failedAttempts+=1;
  const attemptsRemaining=Math.max(0,MAX_CONFIRMATION_ATTEMPTS-entry.failedAttempts);
  if(attemptsRemaining===0){pending.delete(id);return {ok:true,matched:false,locked:true,attemptsRemaining:0};}
  return {ok:true,matched:false,locked:false,attemptsRemaining};
}
function consumeReleaseAuthorization(input={}, {now=Date.now()}={}){
  cleanup(now);
  const id=String(input.releaseAuthorization||"");
  if(!id)throw new Error("A prepared one-time release authorization is required.");
  const entry=pending.get(id);
  if(!entry)throw new Error("Release authorization is missing, expired, locked, or already used.");
  pending.delete(id);
  if(entry.expiresAtMs<=now)throw new Error("Release authorization expired. Prepare the release again.");
  if(String(input.confirmation||"")!==entry.confirmation)throw new Error("Release confirmation phrase does not match.");
  if(fingerprint(input)!==entry.fingerprint)throw new Error("Release target or project changed after authorization. Prepare the release again.");
  return {ok:true,authorized:true,releaseMode:input.releaseMode==="create"?"create":"update"};
}
function clearAuthorizations(){pending.clear()}
module.exports={AUTH_TTL_MS,MAX_CONFIRMATION_ATTEMPTS,fingerprint,createReleaseAuthorization,verifyReleaseConfirmation,consumeReleaseAuthorization,clearAuthorizations};
