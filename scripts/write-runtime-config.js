"use strict";

const fs = require("fs");
const path = require("path");

const out = path.join(__dirname, "..", "public", "js", "runtime-config.js");
const urlFile = path.join(__dirname, "..", "config", "api-url.txt");
const publicUrlFile = path.join(__dirname, "..", "config", "public-url.txt");

function readUrlFile(file) {
  if (!fs.existsSync(file)) return "";
  return (
    fs
      .readFileSync(file, "utf8")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .find((l) => l && !l.startsWith("#")) || ""
  );
}
const isAndroid = process.argv.includes("--android") || process.env.BF_ANDROID_BUILD === "1";
const isRelease = process.argv.includes("--release") || process.env.BF_ANDROID_RELEASE === "1";

let url = (process.env.BF_API_URL || "").trim();
if (!url) url = readUrlFile(urlFile);
if (!url) url = readUrlFile(publicUrlFile);

if (isAndroid && isRelease && !url) {
  console.error("");
  console.error("  Play Store build ke liye cloud URL chahiye (PC par server nahi).");
  console.error("  1) DEPLOY_FREE.bat se Render par deploy karo");
  console.error("  2) config\\api-url.txt mein likho: https://tumhara-app.onrender.com");
  console.error("  Ya: set BF_API_URL=https://...");
  console.error("");
  process.exit(1);
}

let base = url;
if (!base && isAndroid) {
  base = "http://10.0.2.2:8097";
}

const gistId = (process.env.BF_GIST_ID || process.env.GITHUB_GIST_ID || "").trim();
const body =
  `/** Auto-generated — do not edit */\n` +
  `window.BF_API_BASE = ${JSON.stringify(base)};\n` +
  `window.BF_IS_NATIVE = ${JSON.stringify(!!isAndroid)};\n` +
  `window.BF_GIST_ID = ${JSON.stringify(gistId)};\n`;
fs.writeFileSync(out, body);
console.log("runtime-config.js →", base || "(same origin)", isRelease ? "[release]" : isAndroid ? "[dev]" : "[web]");
