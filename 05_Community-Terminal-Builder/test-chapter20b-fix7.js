"use strict";
const fs=require("fs"),path=require("path"),assert=require("assert");
const root=__dirname;
const app=fs.readFileSync(path.join(root,"public","app.js"),"utf8");
const html=fs.readFileSync(path.join(root,"public","index.html"),"utf8");
const style=fs.readFileSync(path.join(root,"public","style.css"),"utf8");
const landingStyle=fs.readFileSync(path.join(root,"..","01_Landing-Page","public","style.css"),"utf8");

assert(html.includes('app.js?v=21a-finalfix'),"Latest Builder JS must be cache-busted");
assert(app.includes('function terminalIdentityFromTicker(value)'),"Visible terminal identity helper must exist");
assert(app.includes('user.value=terminalIdentityFromTicker(val("ticker"))'),"Ticker must drive visible terminal identity");
assert(html.includes('Terminal identity'),"Builder must label the derived identity clearly");
assert(html.includes('ticker@robinhood — auto-derived'),"Fresh-state identity placeholder must be neutral and explicit");

for(const stale of ["jacket-community-terminal","CATCOIN","catcoin","SPRITEHOOD","HOODBIRDS","HOODMANCERS","HOODRAT","STONKBROKERS"]){
  assert(!html.includes(stale),`Fresh builder HTML must not contain stale project data: ${stale}`);
}

assert(!html.includes('id="open-built-terminal"'),"Build-complete dialog must not expose Open Terminal before deployment completes");
assert(!html.includes('id="copy-built-terminal-link"'),"Build-complete dialog must not expose Copy Link before deployment completes");
assert(html.includes('<a id="deployment-success-open" class="deployment-success-open" aria-disabled="true">OPEN WEBSITE</a>'),"Success Open Website must be a native link action");
assert(html.includes('<form method="dialog"><button type="submit" id="deployment-success-close" value="close">CLOSE</button></form>'),"Success close must use native dialog submission and CLOSE label");
assert(html.includes('deployment-success-x'),"Success dialog must expose an X close control");
assert(!app.includes('window.open(url,"_blank","noopener,noreferrer")'),"Post-deploy links must not depend on popup-prone window.open handlers");
assert(style.includes('.action-link[aria-disabled="true"]'),"Native action links must preserve disabled semantics before live URL exists");

assert(landingStyle.includes('grid-template-columns:19ch 10ch 1ch minmax(0,1fr)!important'),"Landing live metrics must reserve a stable status column");
assert(landingStyle.includes('#terminal-live-panel .market-tag{display:block!important;min-width:0!important'),"Landing status tags must not overlap metric labels");

console.log("Chapter 20B FIX7 final cleanup regression PASS");
