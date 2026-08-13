"use strict";

// Canonical CTB source must boot project-neutral by default.
// Generated terminals receive their own project.config.js during Builder generation.
const profile = String(process.env.PROJECT_PROFILE || "template").trim().toLowerCase();
const profiles = { template: require("./projects/template") };
if (!profiles[profile]) throw new Error(`Unknown PROJECT_PROFILE: ${profile}`);
module.exports = profiles[profile];
