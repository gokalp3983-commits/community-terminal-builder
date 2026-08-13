const fs=require("fs");
const path=require("path");
const app=fs.readFileSync(path.join(__dirname,"public","app.js"),"utf8");
function ok(value,message){if(!value){console.error(`[ FAIL ] ${message}`);process.exit(1);}console.log(`[ PASS ] ${message}`);}
ok(app.includes('deployment:{githubUrl:deployment.githubUrl||"",publicUrl:deployment.publicUrl||""}'),"Export persists GitHub and Render URLs");
ok(app.includes('const imported=bundle.deployment||{}'),"Import reads optional deployment metadata");
ok(app.includes('...(githubUrl?{githubUrl}:{})'),"Blank imported GitHub URL does not overwrite existing value");
ok(app.includes('...(publicUrl?{publicUrl}:{})'),"Blank imported Render URL does not overwrite existing value");
ok(app.includes('renderDeploymentRecord(all[id]||prior)'),"Imported deployment URLs hydrate dashboard immediately");
console.log("Chapter 22 import/deployment regression: PASS");
