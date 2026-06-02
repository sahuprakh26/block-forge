import { sfx } from "./audio.js";
import { bgm } from "./music.js";
import { W, H } from "./config.js";
import BootScene from "./scenes/BootScene.js";
import MenuScene from "./scenes/MenuScene.js";
import MapScene from "./scenes/MapScene.js";
import GameScene from "./scenes/GameScene.js";
import LeaderboardScene from "./scenes/LeaderboardScene.js";

function setupNative() {
  const cap = window.Capacitor;
  if (!cap?.isNativePlatform?.()) return;
  document.body.classList.add("native-app");
  cap.Plugins?.SplashScreen?.hide?.().catch(() => {});
  cap.Plugins?.App?.addListener?.("backButton", () => {
    const g = window.__bfGame;
    const gameSc = g?.scene?.getScene?.("Game");
    if (gameSc?.scene?.isActive?.()) {
      gameSc.showConfirmExit?.();
      return;
    }
    const mapSc = g?.scene?.getScene?.("Map");
    if (mapSc?.scene?.isActive?.()) {
      mapSc.scene.start("Menu");
      return;
    }
    const lbSc = g?.scene?.getScene?.("Leaderboard");
    if (lbSc?.scene?.isActive?.()) {
      lbSc.scene.start("Menu");
      return;
    }
    cap.Plugins?.App?.minimizeApp?.();
  });
}

function hideLoading() {
  const el = document.getElementById("loading");
  if (el) el.remove();
}

function showBootError(msg) {
  hideLoading();
  const el = document.getElementById("game-container");
  if (!el) return;
  el.innerHTML = `<div style="color:#f87171;padding:24px;font-family:Outfit,sans-serif;max-width:380px;margin:40px auto">
    <h2 style="color:#38bdf8;margin-bottom:12px">Block Forge failed to start</h2>
    <p style="color:#94a3b8;font-size:14px;line-height:1.5;word-break:break-word">${String(msg)}</p>
    <p style="margin-top:16px;font-size:13px;color:#64748b">LAUNCH.bat chalao → http://localhost:8097 → Ctrl+Shift+R</p>
  </div>`;
}

function startGame() {
  if (typeof Phaser === "undefined") {
    showBootError("Phaser missing — LAUNCH.bat chalao.");
    return;
  }

  const config = {
    type: Phaser.CANVAS,
    width: W,
    height: H,
    parent: "game-container",
    backgroundColor: "#060912",
    scene: [BootScene, MenuScene, MapScene, GameScene, LeaderboardScene],
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true, pixelArt: false, transparent: false },
  };

  try {
    const game = new Phaser.Game(config);
    window.__bfGame = game;
    window.__bfReady = true;
    hideLoading();
    setupNative();
  } catch (e) {
    showBootError(e.message || String(e));
  }
}

window.addEventListener("error", (e) => {
  if (!window.__bfReady) showBootError(e.message || "Script error");
});

startGame();

function unlockAudio() {
  sfx.ensure();
  bgm.unlock();
}

["pointerdown", "touchstart", "keydown", "click"].forEach((ev) => {
  document.addEventListener(ev, unlockAudio, { once: true, passive: true });
});

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  const gameSc = window.__bfGame?.scene?.getScene?.("Game");
  if (gameSc?.scene?.isActive?.()) gameSc.showConfirmExit?.();
});
