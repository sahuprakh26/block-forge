const PLAYER_KEY = "bf-player";
const MIN_NAME_LEN = 2;

function clean(raw) {
  return String(raw || "")
    .trim()
    .slice(0, 16)
    .replace(/[<>"'&\\]/g, "");
}

function isAutoPlayer(name) {
  return clean(name).toLowerCase() === "player";
}

export function isValidName(name) {
  const n = clean(name);
  return n.length >= MIN_NAME_LEN && !isAutoPlayer(n);
}

export function getPlayer() {
  try {
    const p = JSON.parse(localStorage.getItem(PLAYER_KEY) || "{}");
    const id = p.id || crypto.randomUUID?.() || "p" + Math.random().toString(36).slice(2, 12);
    let name = clean(p.name);
    let nameSet = !!p.nameSet;

    // Legacy auto "Player" — ask again
    if (nameSet && isAutoPlayer(name)) {
      nameSet = false;
      name = "";
    }

    if (id && nameSet && isValidName(name)) {
      return { id, name, nameSet: true };
    }

    const out = { id, name: nameSet ? name : "", nameSet: false };
    try {
      localStorage.setItem(PLAYER_KEY, JSON.stringify(out));
    } catch {
      /* incognito */
    }
    return out;
  } catch {
    return { id: "p" + Date.now(), name: "", nameSet: false };
  }
}

/** Save name. Returns player object or null if invalid. */
export function setPlayerName(name) {
  const n = clean(name);
  if (!isValidName(n)) return null;
  const p = getPlayer();
  p.name = n;
  p.nameSet = true;
  try {
    localStorage.setItem(PLAYER_KEY, JSON.stringify(p));
  } catch {
    return null;
  }
  return p;
}

export function hasName() {
  const p = getPlayer();
  return !!p.nameSet && isValidName(p.name);
}
