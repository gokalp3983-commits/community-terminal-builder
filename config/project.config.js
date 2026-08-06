"use strict";
const profile=String(process.env.PROJECT_PROFILE||"stonkbrokers").trim().toLowerCase();
const profiles={stonkbrokers:require("./projects/stonkbrokers"),hoodrat:require("./projects/hoodrat")};
if(!profiles[profile]) throw new Error(`Unknown PROJECT_PROFILE: ${profile}`);
module.exports=profiles[profile];
