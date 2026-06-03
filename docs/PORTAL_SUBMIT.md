# Submit Block Forge to Poki & CrazyGames

The game includes portal SDK hooks. **You** must finish signup and upload (accounts are personal/legal).

## Files ready for you

| Item | Path |
|------|------|
| Portal build folder (CrazyGames upload) | `dist-portal/` — drag **all files inside** (not a `.zip`) |
| Portal ZIP (backup / email) | `BlockForge-portal.zip` (from `scripts/build-portal-zip.ps1`) |
| Live demo URL | `https://sahuprakh26.github.io/block-forge/` |
| Test Poki SDK locally | `http://localhost:8097/?portal=poki` |
| Test CrazyGames SDK locally | `http://localhost:8097/?portal=crazy` |

---

## 1. CrazyGames (upload build yourself)

1. Open **https://developer.crazygames.com/** → create account → accept terms.
2. **Submit a game** → open `dist-portal/` in Explorer, select **everything inside** (`index.html`, `css/`, `js/`, `vendor/`, …) and drag into the upload zone. **Do not upload** `BlockForge-portal.zip` — CrazyGames rejects archives. (Or use hosted URL if the form offers it: `https://sahuprakh26.github.io/block-forge/`)
3. Fill metadata (copy below).
4. Use their **Preview** tool before final submit.
5. QA may ask for full SDK — basic `gameplayStart` is already wired.

### Suggested listing text

- **Title:** Block Forge  
- **Genre:** Puzzle / Blocks  
- **Description:** Drag block shapes onto an 8×8 grid. Clear full rows and columns to score. Campaign with goals and move limits, daily challenge, and endless mode. Chain clears for streak bonuses.  
- **Controls:** Mouse or touch — drag pieces from the bottom tray onto the board. BACK / QUIT in the top corners.  
- **Mobile:** Yes (touch, portrait-friendly).

---

## 2. Poki (apply first — closed beta)

1. Open **https://developers.poki.com/share**  
2. Fill the form (English). Use studio alias, not your real name if you prefer.  
3. **Game link:** `https://sahuprakh26.github.io/block-forge/?portal=poki`  
4. If they approve, they email you → **Poki for Developers** dashboard → upload build + thumbnails.

Poki blocks external APIs: **global rankings are hidden** on Poki; the game still runs campaign / daily / endless.

### Suggested form answers

- **Studio:** Night Forge (or your alias)  
- **Engines:** Phaser 3, HTML5  
- **Genres:** Puzzle, Casual  
- **Links:** `https://sahuprakh26.github.io/block-forge/`  
- **What you want:** Distribution + player testing (no social media)

---

## 3. After approval

- Push updates to Netlify; re-upload new ZIP to CrazyGames when you change the game.  
- Poki: upload new version in their dashboard.  
- Bump `APP_VERSION` in `public/js/version.js` each release.

---

## Support emails

- CrazyGames: technical-support@crazygames.com  
- Poki: developersupport@poki.com  
