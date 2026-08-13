"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { generate } = require("./generator");

const result = generate({
  projectName: "TESTCAT",
  ticker: "TCAT",
  tokenContract: "0x1111111111111111111111111111111111111111",
  links: { home: "" },
  features: { whaleTracker: true, memeIntel: true, nftTerminal: false, liveMarket: true },
});

if (result.buffer.readUInt32LE(0) !== 0x04034b50) throw new Error("Invalid ZIP signature");
if (result.project.links.home !== "/") throw new Error("Blank Home URL fallback failed");

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "terminal-builder-test-"));
const zipPath = path.join(temp, result.filename);
fs.writeFileSync(zipPath, result.buffer);
execFileSync("unzip", ["-q", zipPath, "-d", temp]);
const generatedRoot = path.join(temp, "TESTCAT_Community_Terminal");
const configCheck = execFileSync(process.execPath, ["-e", "const c=require('./config'); process.stdout.write(JSON.stringify({id:c.project.id,nft:c.features.nftTerminal}))"], { cwd: generatedRoot, stdio: "pipe" }).toString();
const generatedConfig = JSON.parse(configCheck);
if (generatedConfig.id !== "testcat") throw new Error("Generated profile is not active by default");
if (generatedConfig.nft !== false) throw new Error("NFT feature should be disabled without an NFT contract");
const landingServer = fs.readFileSync(path.join(generatedRoot, "01_Landing-Page", "server.js"), "utf8");
if (!landingServer.includes("contracts: config.contracts") || !landingServer.includes("quoteSymbol") || landingServer.includes("[\"WETH\", \"ETH\"]")) throw new Error("Landing multi-quote/config fix missing");
const landingScript = fs.readFileSync(path.join(generatedRoot, "01_Landing-Page", "public", "script.js"), "utf8");
if (!landingScript.includes('nft: "nftTerminal"') || !landingScript.includes('market.quoteSymbol')) throw new Error("Landing Page feature filtering is missing");
if (!fs.existsSync(path.join(generatedRoot, "package.json"))) throw new Error("Root package.json missing");
if (!fs.existsSync(path.join(generatedRoot, "server.js"))) throw new Error("Unified root server missing");
if (!fs.existsSync(path.join(generatedRoot, "render.yaml"))) throw new Error("render.yaml missing");
if (!fs.existsSync(path.join(generatedRoot, ".env.example"))) throw new Error(".env.example missing");
const rootServerSource = fs.readFileSync(path.join(generatedRoot, "server.js"), "utf8");
if (!rootServerSource.includes('app.get("/health"') || !rootServerSource.includes('app.get("/healthz"') || !rootServerSource.includes('app.get("/status"')) throw new Error("Diagnostic routes missing");
if (rootServerSource.includes('app.get("/api/config"')) throw new Error("Root server must not shadow the proven Landing /api/config route");
if (!rootServerSource.includes('app.use("/",require("./01_Landing-Page/server"))')) throw new Error("Landing app mount missing");
if (!rootServerSource.includes('app.use("/ctb-shared"')) throw new Error("Shared footer asset route missing");
if (!landingScript.includes('fetch("/api/config"') || landingScript.includes("project-config.json")) throw new Error("Landing must use the proven mounted /api/config path");
for(const moduleName of ["01_Landing-Page","02_Whale-Activity-Tracker","03_NFT-Collection-Terminal","04_Meme-Intel","06_Community-Pulse","07_Timeline"]){
  const footerPath=path.join(generatedRoot,moduleName,"public","canonical-footer.js");
  if(!fs.existsSync(footerPath)) throw new Error(`Canonical footer runtime missing: ${moduleName}`);
  const footer=fs.readFileSync(footerPath,"utf8");
  if(!footer.includes('/ctb-shared/gokalp-hoodrat-signature.png')) throw new Error(`Shared footer avatar route missing: ${moduleName}`);
}
if (!fs.existsSync(path.join(generatedRoot,"ctb-shared","gokalp-hoodrat-signature.png"))) throw new Error("Shared creator avatar missing from generated project");
const renderYaml = fs.readFileSync(path.join(generatedRoot, "render.yaml"), "utf8");
if (!renderYaml.includes("healthCheckPath: /healthz")) throw new Error("Render health check missing");
execFileSync(process.execPath, ["--check", path.join(generatedRoot, "server.js")]);
for (const moduleName of ["01_Landing-Page","02_Whale-Activity-Tracker","03_NFT-Collection-Terminal","04_Meme-Intel"]) execFileSync(process.execPath, ["--check", path.join(generatedRoot, moduleName, "server.js")]);
const whaleHtml = fs.readFileSync(path.join(generatedRoot, "02_Whale-Activity-Tracker", "public", "index.html"), "utf8");
const whaleJs = fs.readFileSync(path.join(generatedRoot, "02_Whale-Activity-Tracker", "public", "whale.js"), "utf8");
if (!whaleHtml.includes('/whales/project-config.js') || !whaleJs.includes('/whales/api/')) throw new Error("Whale routes were not namespaced");
fs.rmSync(temp, { recursive: true, force: true });
console.log(`PASS: ${result.filename}, ${result.entryCount} files, default profile and disabled NFT visibility verified`);
