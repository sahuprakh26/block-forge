const { chromium, devices } = require("playwright");
const phones = [
  { name: "Pixel-7", device: devices["Pixel 7"] },
  { name: "Pixel-6", device: devices["Pixel 5"] }, // closest preset
  { name: "Pixel-5", device: devices["Pixel 5"] },
  { name: "Pixel-4a", device: devices["Pixel 4"] },
  { name: "Galaxy-S9+", device: devices["Galaxy S9+"] },
  { name: "Galaxy-S8", device: devices["Galaxy S8"] },
  { name: "Small-Phone", viewport: { width: 360, height: 640 }, userAgent: devices["Nexus 5"].userAgent },
];

(async () => {
  const browser = await chromium.launch();
  let failed = 0;
  for (const p of phones) {
    const ctx = await browser.newContext(
      p.device ? { ...p.device } : { viewport: p.viewport, userAgent: p.userAgent }
    );
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    try {
      await page.goto("http://localhost:8097", { waitUntil: "networkidle", timeout: 15000 });
      await page.waitForTimeout(2000);
      const ok = await page.evaluate(() => !!window.__bfReady);
      console.log(ok && !errors.length ? "OK" : "FAIL", p.name, errors[0] || "");
      if (!ok || errors.length) failed++;
      await page.screenshot({ path: `release/screen-${p.name.replace(/\s+/g, "-")}.png` });
    } catch (e) {
      console.log("FAIL", p.name, e.message);
      failed++;
    }
    await ctx.close();
  }
  await browser.close();
  if (failed) {
    console.log("\nSome devices failed. Server chal raha hai? LAUNCH.bat chalao.");
    process.exit(1);
  }
  console.log("\nAll phone layouts OK — screenshots in release/");
})();
