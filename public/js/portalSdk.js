/** Poki + CrazyGames — safe on own domain; active on their hosts or ?portal=poki|crazy */

import { sfx } from "./audio.js";
import { bgm } from "./music.js";

export function getPortal() {
  if (typeof location === "undefined") return null;
  const q = new URLSearchParams(location.search);
  if (q.get("portal") === "poki") return "poki";
  if (q.get("portal") === "crazy") return "crazy";
  const h = location.hostname || "";
  if (/poki\.com|poki-gdn\.com/i.test(h)) return "poki";
  if (/crazygames\.com/i.test(h)) return "crazy";
  return null;
}

export function portalAllowsGlobalRankings() {
  return getPortal() !== "poki";
}

function crazySdk() {
  return typeof window !== "undefined" ? window.CrazyGames?.SDK : null;
}

function crazyEnv() {
  try {
    return crazySdk()?.environment;
  } catch {
    return null;
  }
}

function crazyReady() {
  const env = crazyEnv();
  return env === "local" || env === "crazygames";
}

function applyCrazyMute() {
  if (!crazyReady()) return;
  try {
    if (crazySdk()?.game?.settings?.muteAudio) {
      sfx.toggle(false);
      bgm.toggle(false);
    }
  } catch (e) {
    console.warn("[portal] muteAudio", e);
  }
}

function waitForCrazySdk(maxMs = 4000) {
  if (!/crazygames\.com/i.test(location?.hostname || "")) {
    return Promise.resolve();
  }
  if (crazySdk()) return Promise.resolve();
  return new Promise((resolve) => {
    const t0 = Date.now();
    const tick = () => {
      if (crazySdk() || Date.now() - t0 >= maxMs) resolve();
      else setTimeout(tick, 50);
    };
    tick();
  });
}

export async function initPortalSdk() {
  await waitForCrazySdk();
  const portal = getPortal();

  if (portal === "poki" && window.PokiSDK?.init) {
    try {
      await window.PokiSDK.init();
    } catch (e) {
      console.warn("[portal] Poki init", e);
    }
  }

  if (portal === "crazy" || crazyReady()) {
    if (crazySdk()?.init) {
      try {
        await crazySdk().init();
      } catch (e) {
        console.warn("[portal] CrazyGames init", e);
      }
    }
    applyCrazyMute();
    portalGameplayStart();
  }
}

export function portalGameplayStart() {
  const portal = getPortal();
  if (portal === "poki" && window.PokiSDK?.gameplayStart) {
    try {
      window.PokiSDK.gameplayStart();
    } catch (e) {
      console.warn("[portal] Poki gameplayStart", e);
    }
  }
  if (portal === "crazy" || crazyReady()) {
    try {
      crazySdk()?.game?.gameplayStart?.();
    } catch (e) {
      console.warn("[portal] Crazy gameplayStart", e);
    }
  }
}

export function portalGameplayStop() {
  const portal = getPortal();
  if (portal === "poki" && window.PokiSDK?.gameplayStop) {
    try {
      window.PokiSDK.gameplayStop();
    } catch (e) {
      console.warn("[portal] Poki gameplayStop", e);
    }
  }
  if (portal === "crazy" || crazyReady()) {
    try {
      crazySdk()?.game?.gameplayStop?.();
    } catch (e) {
      console.warn("[portal] Crazy gameplayStop", e);
    }
  }
}

export function portalCommercialBreak() {
  const portal = getPortal();
  if (portal !== "poki" || !window.PokiSDK?.commercialBreak) {
    return Promise.resolve();
  }
  return window.PokiSDK.commercialBreak().catch(() => {});
}
