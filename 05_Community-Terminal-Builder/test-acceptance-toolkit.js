"use strict";
const {spawn}=require("child_process");
const path=require("path");
const port=3191;
const child=spawn(process.execPath,["server.js"],{cwd:__dirname,env:{...process.env,PORT:String(port),NODE_ENV:"test"},stdio:["ignore","pipe","pipe"]});
function wait(ms){return new Promise(r=>setTimeout(r,ms))}
(async()=>{try{await wait(400);const result=spawn(process.execPath,["verify-public-builder.js",`http://127.0.0.1:${port}`],{cwd:__dirname,stdio:["ignore","pipe","pipe"]});let out="",err="";result.stdout.on("data",d=>out+=d);result.stderr.on("data",d=>err+=d);const code=await new Promise(r=>result.on("close",r));if(code!==0)throw new Error((err||out).trim());if(!out.includes("[ ACCEPTED ]"))throw new Error("Acceptance verifier did not finish");console.log("[ PASS ] Chapter 11 public-deployment acceptance toolkit");}finally{child.kill("SIGTERM")}})().catch(e=>{console.error(`[ FAIL ] ${e.message}`);child.kill("SIGTERM");process.exit(1)});
