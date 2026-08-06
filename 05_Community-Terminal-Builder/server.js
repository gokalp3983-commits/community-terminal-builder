"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const { generate } = require("./generator");

const VERSION = "1.1.0";
const PORT = Number(process.env.PORT || 3050);
const HOST = process.env.HOST || "0.0.0.0";
const NODE_ENV = process.env.NODE_ENV || "development";
const PUBLIC = path.join(__dirname, "public");
const MAX_BODY = Number(process.env.MAX_GENERATE_BODY_BYTES || 12_000_000);
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = Number(process.env.GENERATE_RATE_LIMIT || 12);
const startedAt = Date.now();
const requests = new Map();
const types = {".html":"text/html; charset=utf-8",".js":"application/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".svg":"image/svg+xml",".json":"application/json; charset=utf-8"};

function securityHeaders(contentType) {
  return {
    "Content-Type": contentType,
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Content-Security-Policy": "default-src 'self'; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'",
  };
}
function send(res,status,body,type="application/json; charset=utf-8",headers={}) {
  res.writeHead(status,{...securityHeaders(type),"Cache-Control":type.startsWith("text/html")?"no-cache":"no-store",...headers});
  res.end(body);
}
function json(res,status,value){send(res,status,JSON.stringify(value,null,2));}
function clientIp(req){return String(req.headers["x-forwarded-for"]||req.socket.remoteAddress||"unknown").split(",")[0].trim();}
function rateAllowed(req){
  const now=Date.now(), ip=clientIp(req), prior=(requests.get(ip)||[]).filter(t=>now-t<RATE_WINDOW_MS);
  if(prior.length>=RATE_LIMIT){requests.set(ip,prior);return false;}
  prior.push(now);requests.set(ip,prior);return true;
}
function builderStatus(){return {ok:true,product:"Community Terminal Builder",version:VERSION,environment:NODE_ENV,mode:NODE_ENV==="production"?"hosted":"local",storage:"browser-local",uptimeSeconds:Math.floor((Date.now()-startedAt)/1000),generation:{rateLimitPerMinute:RATE_LIMIT,maxRequestBytes:MAX_BODY},timestamp:new Date().toISOString()};}

const server = http.createServer((req,res) => {
  const url = new URL(req.url,`http://${req.headers.host||"localhost"}`);
  if(req.method==="GET" && url.pathname==="/health") return json(res,200,{ok:true,status:"healthy",product:"Community Terminal Builder",version:VERSION,uptimeSeconds:Math.floor((Date.now()-startedAt)/1000),timestamp:new Date().toISOString()});
  if(req.method==="GET" && (url.pathname==="/status" || url.pathname==="/api/builder-status")) return json(res,200,builderStatus());
  if(req.method === "POST" && url.pathname === "/api/generate") {
    if(!rateAllowed(req)) return json(res,429,{error:"Generation rate limit reached. Wait one minute and try again.",code:"RATE_LIMITED"});
    let body="",tooLarge=false;
    req.on("data",chunk=>{if(tooLarge)return;body+=chunk;if(Buffer.byteLength(body)>MAX_BODY){tooLarge=true;json(res,413,{error:"Generation request is too large.",code:"PAYLOAD_TOO_LARGE"});req.destroy();}});
    req.on("end",()=>{if(tooLarge)return;try{const result=generate(JSON.parse(body||"{}"));send(res,200,result.buffer,"application/zip",{"Content-Disposition":`attachment; filename="${result.filename}"`,"Cache-Control":"no-store"});}catch(error){json(res,400,{error:error.message,code:"INVALID_PROJECT_CONFIG"});}});
    return;
  }
  if(req.method!=="GET" && req.method!=="HEAD") return json(res,405,{error:"Method not allowed",code:"METHOD_NOT_ALLOWED"});
  const target = url.pathname === "/" ? "/index.html" : url.pathname;
  const file = path.resolve(PUBLIC,`.${target}`);
  if(!file.startsWith(PUBLIC+path.sep)) return send(res,403,"Forbidden","text/plain; charset=utf-8");
  fs.readFile(file,(error,data)=>{
    if(error)return send(res,404,"Not found","text/plain; charset=utf-8");
    const type=types[path.extname(file)]||"application/octet-stream";
    const headers=type.startsWith("text/html")?{}:{"Cache-Control":"public, max-age=3600"};
    if(req.method==="HEAD"){res.writeHead(200,{...securityHeaders(type),...headers});return res.end();}
    send(res,200,data,type,headers);
  });
});
server.requestTimeout=30_000;
server.headersTimeout=15_000;
server.listen(PORT,HOST,()=>{
  console.log(`\n[ READY ] Community Terminal Builder: http://localhost:${PORT}`);
  console.log(`[ READY ] Health: http://localhost:${PORT}/health`);
  console.log(`[ READY ] Status: http://localhost:${PORT}/status`);
  console.log(`[ MODE ] ${NODE_ENV==="production"?"HOSTED":"LOCAL"} // browser-local project storage\n`);
});
function shutdown(signal){console.log(`[ STOP ] ${signal} received`);server.close(()=>process.exit(0));setTimeout(()=>process.exit(1),5000).unref();}
process.on("SIGTERM",()=>shutdown("SIGTERM"));process.on("SIGINT",()=>shutdown("SIGINT"));
