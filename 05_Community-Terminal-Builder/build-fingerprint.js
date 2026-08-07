"use strict";
const crypto = require("crypto");
function canonical(value){
  if(Array.isArray(value))return value.map(canonical);
  if(value && typeof value === "object")return Object.keys(value).sort().reduce((out,key)=>{out[key]=canonical(value[key]);return out;},{});
  return value;
}
function buildFingerprint(project={}){
  return crypto.createHash("sha256").update(JSON.stringify(canonical(project||{}))).digest("hex");
}
module.exports={canonical,buildFingerprint};
