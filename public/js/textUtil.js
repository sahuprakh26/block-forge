/** Sharper Phaser text on high-DPI phones */
export function uiResolution() {
  if (typeof window === "undefined") return 1;
  return Math.min(2, Math.max(1, window.devicePixelRatio || 1));
}

export function applyCrispText(textObj) {
  const r = uiResolution();
  if (r > 1 && textObj.setResolution) textObj.setResolution(r);
  return textObj;
}

/** Readable UI text defaults */
export function uiTextStyle(overrides = {}) {
  return {
    fontFamily: "Outfit, sans-serif",
    color: "#e2e8f0",
    stroke: "#0f172a",
    strokeThickness: 2,
    ...overrides,
  };
}
