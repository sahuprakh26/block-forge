import { W } from "./config.js";
import { sfx } from "./audio.js";
import { applyCrispText, uiTextStyle } from "./textUtil.js";

const NAV_DEPTH = 120;
const MODAL_DEPTH = 200;

/** Top-corner pill button (BACK / QUIT) — large and sharp */
export function addNavButton(scene, x, y, label, color, onClick, width = 108) {
  const h = 40;
  const bg = scene.add
    .rectangle(x, y, width, h, color, 1)
    .setStrokeStyle(2, 0xffffff, 0.2)
    .setInteractive({ useHandCursor: true })
    .setDepth(NAV_DEPTH);
  const txt = applyCrispText(
    scene.add
      .text(x, y, label, uiTextStyle({
        fontFamily: "Outfit, sans-serif",
        fontSize: "15px",
        fontStyle: "800",
        color: "#ffffff",
        stroke: "#0f172a",
        strokeThickness: 2,
      }))
      .setOrigin(0.5)
      .setDepth(NAV_DEPTH + 1)
  );

  const press = () => {
    sfx.play("click");
    onClick();
  };
  txt.setInteractive({ useHandCursor: true }).on("pointerdown", press);
  bg.on("pointerdown", press);
  bg.on("pointerover", () => bg.setFillStyle(lighten(color)));
  bg.on("pointerout", () => bg.setFillStyle(color));

  return { bg, txt };
}

function lighten(hex) {
  const c = Phaser.Display.Color.IntegerToColor(hex);
  c.lighten(12);
  return c.color;
}

export function showLeaveDialog(scene, { title = "Leave game?", onLeave }) {
  if (scene._leaveModal) return;

  const items = [];
  const add = (obj) => {
    obj.setDepth(MODAL_DEPTH);
    items.push(obj);
    return obj;
  };

  const close = () => {
    items.forEach((o) => o.destroy());
    scene._leaveModal = null;
    scene.input.enabled = true;
  };

  scene._leaveModal = { close };
  scene.input.enabled = true;

  add(scene.add.rectangle(W / 2, 390, W, 780, 0x000000, 0.72).setInteractive());
  add(
    scene.add
      .text(W / 2, 298, title, {
        fontFamily: "Syne, sans-serif",
        fontSize: "22px",
        fontStyle: "700",
        color: "#e2e8f0",
        align: "center",
        wordWrap: { width: W - 48 },
      })
      .setOrigin(0.5)
  );
  add(
    scene.add
      .text(W / 2, 338, "Progress in this run will be lost.", {
        fontFamily: "Outfit, sans-serif",
        fontSize: "13px",
        color: "#94a3b8",
      })
      .setOrigin(0.5)
  );

  const quitBg = add(
    scene.add.rectangle(W / 2, 400, 220, 46, 0xdc2626).setInteractive({ useHandCursor: true })
  );
  add(
    scene.add
      .text(W / 2, 400, "QUIT", {
        fontFamily: "Outfit, sans-serif",
        fontSize: "16px",
        fontStyle: "800",
        color: "#fff",
      })
      .setOrigin(0.5)
  );

  const stayBg = add(
    scene.add.rectangle(W / 2, 462, 220, 46, 0x334155).setInteractive({ useHandCursor: true })
  );
  add(
    scene.add
      .text(W / 2, 462, "KEEP PLAYING", {
        fontFamily: "Outfit, sans-serif",
        fontSize: "15px",
        fontStyle: "700",
        color: "#e2e8f0",
      })
      .setOrigin(0.5)
  );

  quitBg.on("pointerdown", () => {
    sfx.play("click");
    close();
    onLeave();
  });
  stayBg.on("pointerdown", () => {
    sfx.play("click");
    close();
  });
}

export function addGameTopNav(scene, { onBack, onQuit, backLabel = "← BACK", navY = 26 }) {
  addNavButton(scene, 52, navY, backLabel, 0x475569, onBack, 88);
  if (onQuit) addNavButton(scene, W - 52, navY, "QUIT", 0xb91c1c, onQuit, 72);
}
