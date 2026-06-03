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

const publicUrl = readUrlFile(publicUrlFile);
let url = (process.env.BF_API_URL || "").trim();
if (!url) url = readUrlFile(urlFile);
// Web: API base is only api-url / BF_API_URL (GitHub Pages is static — no /api there).
// Android release: fall back to public game URL when no separate API host.
if (!url && isAndroid) url = publicUrl;

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

const gistFile = path.join(__dirname, "..", "config", "gist-id.public.txt");
function readGistIdFile() {
  if (!fs.existsSync(gistFile)) return "";
  return (
    fs
      .readFileSync(gistFile, "utf8")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .find((l) => l && !l.startsWith("#")) || ""
  );
}
const gistId = (process.env.BF_GIST_ID || process.env.GITHUB_GIST_ID || readGistIdFile() || "").trim();
let sitePrefix = "";
const pub = (process.env.BF_PUBLIC_URL || publicUrl || "").trim();
if (pub.includes("github.io")) {
  try {
    sitePrefix = new URL(pub).pathname.replace(/\/$/, "") || "";
  } catch {
    /* ignore */
  }
}
const body =
  `/** Auto-generated — do not edit */\n` +
  `window.BF_API_BASE = ${JSON.stringify(base)};\n` +
  `window.BF_SITE_PREFIX = ${JSON.stringify(sitePrefix)};\n` +
  `window.BF_IS_NATIVE = ${JSON.stringify(!!isAndroid)};\n` +
  `window.BF_GIST_ID = ${JSON.stringify(gistId)};\n`;
fs.writeFileSync(out, body);
console.log("runtime-config.js →", base || "(same origin)", isRelease ? "[release]" : isAndroid ? "[dev]" : "[web]");
