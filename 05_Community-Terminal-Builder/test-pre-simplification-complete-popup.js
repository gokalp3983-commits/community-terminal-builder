const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const multiJs = fs.readFileSync(path.join(root, "03_NFT-Collection-Terminal-Multi-Phase/public/countdown.js"), "utf8");
const singleCss = fs.readFileSync(path.join(root, "03_NFT-Collection-Terminal/public/countdown.css"), "utf8");
const multiCss = fs.readFileSync(path.join(root, "03_NFT-Collection-Terminal-Multi-Phase/public/countdown.css"), "utf8");

assert.match(multiJs, /let completeAnnounced = false;/, "Completed-load modal guard missing");
assert.match(multiJs, /if \(isMintComplete\(now\)\)\{\s*setOverallComplete\(\);/, "Completed schedule must be detected by the initial tick");
assert.match(multiJs, /phaseLiveTag"\)\.textContent = "\[ MINT COMPLETE \]"/, "Completion modal tag missing");
assert.match(multiJs, /phaseLiveTitle"\)\.textContent = "THE __CTB_PROJECT_NAME_UPPER__ MINT IS COMPLETE"/, "Completion modal project title missing");
assert.match(multiJs, /if \(!completeAnnounced\) \{[\s\S]*completionModal\.hidden = false;/, "Completion modal must open once per page load");

for (const css of [singleCss, multiCss]) {
  assert(css.includes("Pre-simplification mobile link label cleanup"));
  assert(css.includes(".project-launch-label,"));
  assert(css.includes(".project-launch-colon{display:none!important}"));
  assert(css.includes("grid-row:1!important"));
}

console.log("PASS pre-simplification completed-mint popup + mobile link cleanup regression");
