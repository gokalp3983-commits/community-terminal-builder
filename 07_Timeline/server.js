"use strict";
const express = require("express");
const path = require("path");
const config = require("../config");
const app = express();
const PORT = Number(process.env.PORT || 3000);
app.get("/project-config.js", (_req, res) => {
  res.type("application/javascript").send(`window.PROJECT_CONFIG=${JSON.stringify({project:config.project,contracts:config.contracts,branding:config.branding,links:config.links,nft:config.nft,timeline:config.timeline||{events:[]},features:config.features,modules:config.modules,market:{refreshMs:config.market.refreshMs,blockscoutApiBase:config.market.blockscoutApiBase,blockscoutExplorerBase:new URL(config.market.blockscoutApiBase).origin}})};`);
});
app.use(express.static(path.join(__dirname, "public")));
app.listen(PORT, () => console.log(`[ READY ] ${config.project.name} Community Timeline: http://localhost:${PORT}`));
