/** API origin — empty = same host (browser). Set BF_API_BASE in runtime-config.js for Android. */
export function apiBase() {
  const b = typeof window !== "undefined" ? window.BF_API_BASE : "";
  return typeof b === "string" ? b.replace(/\/$/, "") : "";
}

export function apiUrl(path) {
  const base = apiBase();
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}
