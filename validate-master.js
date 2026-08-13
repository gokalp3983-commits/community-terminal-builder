"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = __dirname;
const modules = [
  "01_Landing-Page",
  "02_Whale-Activity-Tracker",
  "03_NFT-Collection-Terminal",
  "03_NFT-Collection-Terminal-Multi-Phase",
  "04_Meme-Intel",
  "06_Community-Pulse",
  "07_Timeline",
];
const profiles = ["template"];
const forbiddenInModules = [
  "STONKBROKERS",
  "HOODRAT",
  "0xe934e36A439C94017B64a3FecE66AF12099aBF50",
  "0x8e62F281f282686fCa6dCB39288069a93fC23F1c",
  "0x539cdd042c2f3d93ebc5be7dfff0c79f3b4fabf0",
];
const sourceExtensions = new Set([".js", ".html", ".css", ".json"]);
const ignoredFiles = new Set(["package-lock.json"]);
let failures = 0;

function pass(message) {
  console.log(`PASS  ${message}`);
}

function fail(message) {
  failures += 1;
  console.error(`FAIL  ${message}`);
}

function walk(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === "node_modules") continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

for (const profile of profiles) {
  const result = spawnSync(
    process.execPath,
    ["-e", "const c=require('./config'); console.log(JSON.stringify({name:c.project.name,token:c.contracts.token,nft:c.contracts.nft,nftEnabled:c.features.nftTerminal}))"],
    {
      cwd: root,
      env: { ...process.env, PROJECT_PROFILE: profile },
      encoding: "utf8",
    },
  );
  if (result.status === 0) pass(`profile '${profile}' validates: ${result.stdout.trim()}`);
  else fail(`profile '${profile}' validation failed: ${result.stderr.trim()}`);
}

for (const moduleName of modules) {
  const modulePath = path.join(root, moduleName);
  if (!fs.existsSync(modulePath)) {
    fail(`missing module directory: ${moduleName}`);
    continue;
  }

  for (const required of ["package.json", "server.js", "public"]) {
    const requiredPath = path.join(modulePath, required);
    if (fs.existsSync(requiredPath)) pass(`${moduleName}/${required} exists`);
    else fail(`${moduleName}/${required} is missing`);
  }

  const neutralMascot = path.join(modulePath, "public", "assets", "ctb-placeholder-mascot.svg");
  if (fs.existsSync(neutralMascot)) pass(`${moduleName} contains neutral CTB placeholder mascot`);
  else fail(`${moduleName} is missing neutral CTB placeholder mascot`);

  for (const file of walk(modulePath)) {
    const relative = path.relative(root, file);
    const extension = path.extname(file).toLowerCase();
    if (ignoredFiles.has(path.basename(file)) || !sourceExtensions.has(extension)) continue;

    if (extension === ".js") {
      const syntax = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
      if (syntax.status !== 0) fail(`${relative} has a JavaScript syntax error: ${syntax.stderr.trim()}`);
    }

    const text = fs.readFileSync(file, "utf8");
    for (const forbidden of forbiddenInModules) {
      if (text.includes(forbidden)) fail(`${relative} contains hardcoded project value: ${forbidden}`);
    }
  }
}

if (failures > 0) {
  console.error(`\nMaster validation failed with ${failures} issue(s).`);
  process.exit(1);
}

console.log("\nMaster validation passed.");
