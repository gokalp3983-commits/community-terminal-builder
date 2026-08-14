const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const single = fs.readFileSync(path.join(root, "03_NFT-Collection-Terminal/public/countdown.css"), "utf8");
const multi = fs.readFileSync(path.join(root, "03_NFT-Collection-Terminal-Multi-Phase/public/countdown.css"), "utf8");

for (const css of [single, multi]) {
  assert(css.includes("Pre-simplification mobile countdown polish"));
  assert(css.includes("@media (max-width:760px), (hover:none) and (pointer:coarse)"));
  assert(css.includes("grid-template-columns:10ch minmax(0,1fr)!important"));
  assert(css.includes(".project-launch-colon{display:none!important}"));
}
assert(multi.includes(".phase-countdown-grid{grid-template-columns:minmax(0,1fr)!important"));
assert(multi.includes(".phase-detail-row{grid-template-columns:minmax(0,1fr) 1ch max-content!important}"));

console.log("PASS pre-simplification mobile countdown CSS regression");
