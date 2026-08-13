"use strict";
const { spawnSync } = require("node:child_process");
for (const profile of ["template"]) {
  const result = spawnSync(process.execPath, ["-e", "const c=require('./config'); console.log(c.project.name,c.contracts.token,c.features.nftTerminal)"], {
    cwd: __dirname,
    env: { ...process.env, PROJECT_PROFILE: profile },
    encoding: "utf8",
  });
  if (result.status !== 0) throw new Error(`${profile}: ${result.stderr}`);
  process.stdout.write(`${profile}: ${result.stdout}`);
}
