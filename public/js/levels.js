export const WORLDS = [
  {
    id: 1,
    name: "Crystal Caves",
    levels: [
      { id: 1, goal: { type: "score", target: 400 }, moves: null, name: "First Light" },
      { id: 2, goal: { type: "lines", target: 4 }, moves: 20, name: "Line Walker" },
      { id: 3, goal: { type: "score", target: 700 }, moves: 25, name: "Warm Up" },
      { id: 4, goal: { type: "combo", target: 2 }, moves: 22, name: "Double Clear" },
      { id: 5, goal: { type: "lines", target: 8 }, moves: 18, name: "Pressure" },
      { id: 6, goal: { type: "score", target: 1200 }, moves: 28, name: "Deep Cave" },
      { id: 7, goal: { type: "lines", target: 10 }, moves: 22, name: "Grid Master" },
      { id: 8, goal: { type: "combo", target: 3 }, moves: 24, name: "Chain Reaction" },
      { id: 9, goal: { type: "score", target: 1800 }, moves: 30, name: "Crystal Rush" },
      { id: 10, goal: { type: "lines", target: 14 }, moves: 20, name: "Boss Gate" },
      { id: 11, goal: { type: "score", target: 2200 }, moves: 32, name: "Glow Up" },
      { id: 12, goal: { type: "combo", target: 4 }, moves: 26, name: "Overdrive" },
      { id: 13, goal: { type: "lines", target: 16 }, moves: 24, name: "Tunnel Run" },
      { id: 14, goal: { type: "score", target: 2800 }, moves: 35, name: "High Score" },
      { id: 15, goal: { type: "lines", target: 20 }, moves: 22, name: "World 1 Finale" },
    ],
  },
];

export function getLevel(id) {
  for (const w of WORLDS) {
    const lv = w.levels.find((l) => l.id === id);
    if (lv) return { ...lv, world: w };
  }
  return null;
}

export function goalText(goal) {
  if (!goal) return "";
  switch (goal.type) {
    case "score":
      return `Reach ${goal.target} points`;
    case "lines":
      return `Clear ${goal.target} lines`;
    case "combo":
      return `Get ${goal.target}x combo`;
    default:
      return "Complete goal";
  }
}

/** One-line goal for game HUD (readable, no truncation). */
export function goalHudTitle(goal) {
  if (!goal) return "";
  switch (goal.type) {
    case "score":
      return `SCORE ${goal.target}`;
    case "lines":
      return `CLEAR ${goal.target} LINES`;
    case "combo":
      return `${goal.target}x COMBO`;
    default:
      return "GOAL";
  }
}

/** Short progress line for HUD (large font). */
export function goalProgress(goal, score, lines, maxCombo) {
  if (!goal) return "";
  if (goal.type === "score") return `${score} / ${goal.target}`;
  if (goal.type === "lines") return `${lines} / ${goal.target}`;
  return `${maxCombo} / ${goal.target}x`;
}

export function starThresholds(level, goal) {
  if (goal.type === "score") {
    return [goal.target, Math.round(goal.target * 1.35), Math.round(goal.target * 1.7)];
  }
  return [goal.target, goal.target + 2, goal.target + 4];
}
