"use strict";
const fs=require("fs"),path=require("path"),assert=require("assert");
const root=__dirname;
const app=fs.readFileSync(path.join(root,"public","app.js"),"utf8");
assert(app.includes('const mode=releaseMode();return {project,repoName:target,serviceName:target'),"Quick deploy must respect selected release action and generated target");
console.log("Chapter 20B FIX4 regression PASS");
