/**
 * Character level system.
 *
 * Triangular XP curve: each level costs 100 × (level - 1) XP.
 *   Level 1 → 2: 100 XP
 *   Level 2 → 3: 200 XP
 *   Level 3 → 4: 300 XP
 *   ...
 *   Level N → N+1: 100N XP
 *
 * Cumulative to reach level L: 50 × L × (L - 1)
 *   Level 5: 1,000 XP
 *   Level 10: 4,500 XP
 *   Level 20: 19,000 XP
 *   Level 50: 122,500 XP
 *   Level 100: 495,000 XP
 *
 * Feels fast early on (one good session = a level-up) and scales into
 * weeks-of-effort territory at higher levels, which matches the spirit
 * of a life-long tracking app.
 */

export type LevelTier = {
  min: number;
  max: number;
  name: string;
  accent: "emerald" | "blue" | "purple" | "pink" | "xp" | "orange" | "legend";
};

export const LEVEL_TIERS: LevelTier[] = [
  { min: 1, max: 9, name: "Novice", accent: "emerald" },
  { min: 10, max: 19, name: "Apprentice", accent: "blue" },
  { min: 20, max: 34, name: "Adept", accent: "purple" },
  { min: 35, max: 49, name: "Expert", accent: "pink" },
  { min: 50, max: 74, name: "Master", accent: "xp" },
  { min: 75, max: 99, name: "Grandmaster", accent: "orange" },
  { min: 100, max: Infinity, name: "Legend", accent: "legend" },
];

/** Cumulative XP required to REACH the given level. Level 1 = 0 XP. */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return 50 * level * (level - 1);
}

/** Current level given total account XP. */
export function levelFromXp(xp: number): number {
  if (xp <= 0) return 1;
  // Inverse of xpForLevel: level = floor((1 + sqrt(1 + 8*xp/100)) / 2) + 0
  // xpForLevel(L) = 50 * L * (L - 1) → L² - L - xp/50 = 0 → L = (1 + √(1 + xp/12.5)) / 2
  // Simpler: iterate (cheap, no floating-point edge cases)
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

export function tierForLevel(level: number): LevelTier {
  return (
    LEVEL_TIERS.find((t) => level >= t.min && level <= t.max) ??
    LEVEL_TIERS[LEVEL_TIERS.length - 1]
  );
}

export type LevelProgress = {
  level: number;
  tier: LevelTier;
  currentLevelXp: number;
  nextLevelXp: number;
  xpIntoLevel: number;
  xpNeededForLevel: number;
  xpToNext: number;
  pct: number;
};

export function getLevelProgress(xp: number): LevelProgress {
  const level = levelFromXp(xp);
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const xpIntoLevel = xp - currentLevelXp;
  const xpNeededForLevel = nextLevelXp - currentLevelXp;
  return {
    level,
    tier: tierForLevel(level),
    currentLevelXp,
    nextLevelXp,
    xpIntoLevel,
    xpNeededForLevel,
    xpToNext: xpNeededForLevel - xpIntoLevel,
    pct: (xpIntoLevel / xpNeededForLevel) * 100,
  };
}
