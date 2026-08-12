"use strict";
const { generate } = require("./generator");
const { envConfig, publicStatus } = require("./connected-deploy");
const { buildFingerprint } = require("./build-fingerprint");

function slug(value){return String(value||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,80)}
function check(id,label,ready,detail){return {id,label,ready:Boolean(ready),detail:String(detail||"")}}

function releaseReadiness(input={}, {env=process.env,providerStatus=null}={}){
  const project=input.project&&typeof input.project==="object"?input.project:{};
  const c=envConfig(env);
  const integrations=providerStatus||publicStatus(env);
  let generatedProject=null, projectError="";
  try{generatedProject=generate(project).project}catch(error){projectError=error.message}
  const base=slug(project.projectName)||"community-terminal";
  const repoName=slug(input.repoName||`${base}-community-terminal`);
  const serviceName=slug(input.serviceName||`${base}-community-terminal`).slice(0,63);
  const projectReady=Boolean(generatedProject);
  const expectedBuildFingerprint=projectReady?buildFingerprint(project):"";
  const generatedReady=Boolean(projectReady&&input.generatedFingerprint&&input.generatedFingerprint===expectedBuildFingerprint);
  const targetReady=Boolean(repoName&&serviceName);
  const releaseMode=input.releaseMode==="create"?"create":"update";
  const acceptanceReady=releaseMode==="create"||input.publicAcceptance===true;
  const checks=[
    check("project","Project configuration",projectReady,projectReady?"Generator validation passed.":projectError||"Project configuration is incomplete."),
    check("build","Generated build",generatedReady,generatedReady?"Saved generated package matches the current project configuration.":input.generatedFingerprint?"Saved generated package is stale because the project changed. Generate again before release.":"Generate the current project before release."),
    check("target","Repository target",targetReady,targetReady?`${repoName} / ${serviceName}`:"Repository and Render service names are required."),
    check("github","GitHub connection",providerStatus?integrations.github.verified:integrations.github.configured,providerStatus?(integrations.github.verified?`Verified as ${integrations.github.login||"GitHub user"}.`:integrations.github.error||"GitHub credential could not be verified."):(integrations.github.configured?"Server credential configured.":"GitHub server credential is not configured.")),
    check("render","Render connection",providerStatus?integrations.render.verified:integrations.render.configured,providerStatus?(integrations.render.verified?`Verified Render workspace${integrations.render.workspaceName?` ${integrations.render.workspaceName}`:""}.`:integrations.render.error||"Render credential/workspace could not be verified."):(integrations.render.configured?"Server credential and workspace configured.":"Render server credential/workspace is not configured.")),
    check("acceptance","Public acceptance",acceptanceReady,releaseMode==="create"?"Not required for the first deployment; run public acceptance after the site becomes live.":acceptanceReady?"Latest saved public acceptance passed.":"Run and pass public acceptance for this project before updating the live release."),
    check("secrets","Server credentials protected",integrations.secretsExposed===false,"Credentials remain server-side and are not returned to the browser.")
  ];
  const ready=checks.every(item=>item.ready);
  const releaseControlEnabled=Boolean(c.enabled&&c.releaseActionsEnabled);
  return {
    ok:true,
    chapter:"14A",
    state:ready?(releaseControlEnabled?"RELEASE ENABLED":"READY / CONTROL LOCKED"):"NOT READY",
    ready,
    canRelease:Boolean(ready&&releaseControlEnabled),
    releaseControlEnabled,
    connectedDeploymentsEnabled:Boolean(c.enabled),
    target:{repoName,serviceName},
    releaseMode,
    buildFingerprint:expectedBuildFingerprint,
    checks,
    secretsExposed:false,
    checkedAt:new Date().toISOString()
  };
}
module.exports={releaseReadiness};
