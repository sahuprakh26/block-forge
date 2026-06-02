/** Polyomino definitions — anchor top-left of bounding box */
export const SHAPES = [
  { id: "I4", cells: [[0, 0], [0, 1], [0, 2], [0, 3]] },
  { id: "I3", cells: [[0, 0], [0, 1], [0, 2]] },
  { id: "I2", cells: [[0, 0], [0, 1]] },
  { id: "O", cells: [[0, 0], [0, 1], [1, 0], [1, 1]] },
  { id: "L3", cells: [[0, 0], [1, 0], [2, 0], [2, 1]] },
  { id: "L4", cells: [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]] },
  { id: "T4", cells: [[0, 0], [0, 1], [0, 2], [1, 1]] },
  { id: "S", cells: [[0, 1], [0, 2], [1, 0], [1, 1]] },
  { id: "Z", cells: [[0, 0], [0, 1], [1, 1], [1, 2]] },
  { id: "dot", cells: [[0, 0]] },
  { id: "penta", cells: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0]] },
];

export function randomShape(rng = Math.random) {
  const s = SHAPES[Math.floor(rng() * SHAPES.length)];
  const color = Math.floor(rng() * 7);
  return { ...s, color, uid: Math.random().toString(36).slice(2) };
}

export function randomTray(count = 3, rng = Math.random) {
  return Array.from({ length: count }, () => randomShape(rng));
}

/** Seeded rng for daily mode */
export function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function dailySeed() {
  const d = new Date();
  return d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
}
