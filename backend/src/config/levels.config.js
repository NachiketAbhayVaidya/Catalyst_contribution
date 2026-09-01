// Configurable XP → level thresholds (spec §46). Add/edit entries here only.
export const LEVEL_THRESHOLDS = [
  { level: 1, minXp: 0 },
  { level: 2, minXp: 250 },
  { level: 3, minXp: 500 },
  { level: 4, minXp: 1000 },
  { level: 5, minXp: 1500 },
  { level: 6, minXp: 2250 },
  { level: 7, minXp: 3250 },
  { level: 8, minXp: 4500 },
  { level: 9, minXp: 6000 },
  { level: 10, minXp: 8000 },
];

export function levelForXp(xp) {
  let current = LEVEL_THRESHOLDS[0];
  for (const threshold of LEVEL_THRESHOLDS) {
    if (xp >= threshold.minXp) {
      current = threshold;
    } else {
      break;
    }
  }
  return current.level;
}

export function nextLevelThreshold(xp) {
  return LEVEL_THRESHOLDS.find((threshold) => threshold.minXp > xp) ?? null;
}
