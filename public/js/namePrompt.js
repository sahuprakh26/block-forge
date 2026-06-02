import { getPlayer, setPlayerName, hasName } from "./player.js";

function pauseGameInput() {
  const game = window.__bfGame;
  if (!game?.input) return null;
  const state = { input: game.input.enabled, keyboard: game.input.keyboard?.enabled };
  game.input.enabled = false;
  if (game.input.keyboard) game.input.keyboard.enabled = false;
  return state;
}

function resumeGameInput(state) {
  const game = window.__bfGame;
  if (!game?.input || !state) return;
  game.input.enabled = state.input;
  if (game.input.keyboard && state.keyboard !== undefined) game.input.keyboard.enabled = state.keyboard;
}

function stopKeys(el) {
  ["keydown", "keyup", "keypress"].forEach((evt) => {
    el.addEventListener(evt, (e) => e.stopPropagation());
  });
}

function initialValue(name) {
  const n = String(name || "").trim();
  if (!n || n.toLowerCase() === "player") return "";
  return n;
}

/** Name modal — empty / "Player" save nahi hoga. */
export function promptName(initial = "") {
  return new Promise((resolve) => {
    const prevInput = pauseGameInput();

    const wrap = document.createElement("div");
    wrap.id = "name-modal";
    wrap.style.cssText =
      "position:fixed;inset:0;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;z-index:99999;pointer-events:auto";

    const panel = document.createElement("div");
    panel.style.cssText =
      "background:#1e293b;border:2px solid #6366f1;border-radius:16px;padding:24px;width:min(320px,90vw);text-align:center;font-family:Outfit,sans-serif;pointer-events:auto";

    panel.innerHTML = `
      <h3 style="color:#38bdf8;margin-bottom:8px;font-size:18px">Apna naam likho</h3>
      <p style="color:#94a3b8;font-size:13px;margin-bottom:16px">Yeh naam global rankings par dikhega</p>
      <input id="name-input" type="text" maxlength="16" placeholder="e.g. Rahul, Priya..." autocomplete="nickname"
        style="width:100%;padding:12px;border-radius:8px;border:1px solid #475569;background:#0f172a;color:#fff;font-size:16px;margin-bottom:8px;user-select:text;-webkit-user-select:text;pointer-events:auto;outline:none" />
      <p id="name-err" style="color:#f87171;font-size:12px;margin-bottom:8px;min-height:16px"></p>
      <button type="button" id="name-save" style="width:100%;padding:12px;border:none;border-radius:8px;background:#6366f1;color:#fff;font-weight:700;font-size:16px;cursor:pointer">Save</button>
    `;

    wrap.appendChild(panel);
    document.body.appendChild(wrap);

    const input = panel.querySelector("#name-input");
    const btn = panel.querySelector("#name-save");
    const err = panel.querySelector("#name-err");
    input.value = initialValue(initial);
    stopKeys(input);
    stopKeys(panel);

    const trySave = () => {
      const saved = setPlayerName(input.value);
      if (!saved) {
        err.textContent = "Kam se kam 2 letters — asli naam likho (Player mat likho)";
        input.style.borderColor = "#f87171";
        input.focus();
        return;
      }
      wrap.remove();
      resumeGameInput(prevInput);
      resolve(saved.name);
    };

    btn.onclick = trySave;
    input.onkeydown = (e) => {
      e.stopPropagation();
      if (e.key === "Enter") {
        e.preventDefault();
        trySave();
      }
    };
    input.oninput = () => {
      err.textContent = "";
      input.style.borderColor = "#475569";
    };

    wrap.addEventListener("pointerdown", (e) => e.stopPropagation());
    setTimeout(() => input.focus(), 50);
  });
}

/** Real naam mandatory — tab tak puchta rahega. */
export async function ensureName() {
  if (hasName()) return getPlayer().name;
  while (!hasName()) {
    await promptName("");
  }
  return getPlayer().name;
}
