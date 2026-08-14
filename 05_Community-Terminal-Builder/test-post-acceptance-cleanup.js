"use strict";
const assert=require("assert"),fs=require("fs"),path=require("path");
const root=path.resolve(__dirname,"..");
const app=fs.readFileSync(path.join(__dirname,"public","app.js"),"utf8");
const html=fs.readFileSync(path.join(__dirname,"public","index.html"),"utf8");
const server=fs.readFileSync(path.join(__dirname,"server.js"),"utf8");
const landingCss=fs.readFileSync(path.join(root,"01_Landing-Page","public","style.css"),"utf8");
assert.match(app,/function pastScheduleTimeSignature/);
assert.match(app,/const sig=pastScheduleTimeSignature\(schedule\)/);
assert.match(html,/REMOVE BACKGROUND \(BETA\)/);
assert.match(app,/async function removeMascotBackground/);
assert.match(app,/consecutive>=2/);
assert.match(server,/Landing stylesheet/);
assert.match(server,/Landing script/);
assert.match(landingCss,/content-driven landing height/);
for(const f of ["01_Landing-Page/public/index.html","02_Whale-Activity-Tracker/public/index.html","04_Meme-Intel/public/index.html","06_Community-Pulse/public/index.html","07_Timeline/public/index.html"]){const s=fs.readFileSync(path.join(root,f),"utf8");assert.match(s,/ctb-styles-ready/,`${f} missing style guard`)}
console.log("[ PASS ] post-acceptance cleanup regressions");
