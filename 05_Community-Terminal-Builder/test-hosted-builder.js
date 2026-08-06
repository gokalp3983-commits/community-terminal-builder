"use strict";
const {spawn}=require("child_process");
const http=require("http");
const port=3187;
const child=spawn(process.execPath,["server.js"],{cwd:__dirname,env:{...process.env,PORT:String(port),NODE_ENV:"test"},stdio:["ignore","pipe","pipe"]});
function get(path){return new Promise((resolve,reject)=>{const req=http.get({host:"127.0.0.1",port,path},res=>{let body="";res.on("data",c=>body+=c);res.on("end",()=>resolve({status:res.statusCode,headers:res.headers,body}));});req.on("error",reject);});}
(async()=>{try{await new Promise(r=>setTimeout(r,350));for(const route of ["/health","/status","/api/builder-status"]){const r=await get(route);if(r.status!==200)throw new Error(`${route} returned ${r.status}`);JSON.parse(r.body);console.log(`[ PASS ] Builder ${route}`);}const home=await get("/");if(home.status!==200||!home.body.includes("COMMUNITY TERMINAL BUILDER"))throw new Error("Builder home failed");if(!home.headers["content-security-policy"])throw new Error("Security headers missing");console.log("[ PASS ] Hosted builder home and security headers");}finally{child.kill("SIGTERM");}})().catch(e=>{console.error(`[ FAIL ] ${e.message}`);child.kill("SIGTERM");process.exit(1);});
