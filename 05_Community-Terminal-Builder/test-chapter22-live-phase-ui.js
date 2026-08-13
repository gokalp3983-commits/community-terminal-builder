"use strict";

const fs=require("fs");
const path=require("path");
const assert=require("assert");
const ROOT=path.resolve(__dirname,"..");
const countdown=fs.readFileSync(path.join(ROOT,"03_NFT-Collection-Terminal-Multi-Phase","public","countdown.js"),"utf8");
const countdownCss=fs.readFileSync(path.join(ROOT,"03_NFT-Collection-Terminal-Multi-Phase","public","countdown.css"),"utf8");
const builderCss=fs.readFileSync(path.join(__dirname,"public","style.css"),"utf8");

assert(!countdown.includes("one or more mint phases are active or underway"),"Generic mint-live subtitle must be removed");
assert(countdown.includes("function livePhaseSummary(now = Date.now())"),"Dynamic cumulative live-phase helper missing");
assert(countdown.includes('return `PHASE-${index + 1} (${name})`;'),"Live phase summary must render PHASE-N (configured name)");
assert(countdown.includes('if (!started.length || started.length >= phases.length) return "";'),"Phase summary must disappear once every configured phase has opened");
assert(countdown.includes('.join(" & ")'),"Multiple opened phases must be joined cumulatively");
assert(countdown.includes('setOverallLive(now);'),"Live summary must refresh as later phases open");
assert(countdownCss.includes(".mint-live-phase-summary"),"Live phase summary styling missing");
assert(/\.mint-live-phase-summary\{[\s\S]*font-size:clamp\(\.96rem,2\.2vw,1\.18rem\)/.test(countdownCss),"Dynamic phase line must be more prominent than old subtitle");
assert(/#close-build-complete-action\{[\s\S]*color:var\(--danger\)!important;[\s\S]*border-color:var\(--danger\)!important;/.test(builderCss),"Build-complete CLOSE action must be red");
assert(/#deploy-built-terminal,.final-product-actions #confirm-deploy-built-terminal\{color:var\(--green\);border-color:var\(--green\)\}/.test(builderCss),"Deploy actions must remain green");
console.log("[ PASS ] Chapter 22 cumulative mint-live phase text + red CTB close action");
