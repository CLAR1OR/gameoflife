export const LEVEL_THRESHOLDS = [
  { level: 1, name: "Beginner", xpRequired: 0 },
  { level: 2, name: "Intermediate", xpRequired: 100 },
  { level: 3, name: "Advanced", xpRequired: 300 },
  { level: 4, name: "Mastered", xpRequired: 600 },
] as const;

export function calculateLevel(xp: number): number {
  let level = 1;
  for (const threshold of LEVEL_THRESHOLDS) {
    if (xp >= threshold.xpRequired) {
      level = threshold.level;
    }
  }
  return level;
}

export function getLevelName(level: number): string {
  if (level === 0) return "Locked";
  const threshold = LEVEL_THRESHOLDS.find((t) => t.level === level);
  return threshold?.name ?? "Unknown";
}

export function xpForNextLevel(currentXp: number): {
  nextLevelXp: number;
  currentLevelXp: number;
  progress: number;
} | null {
  const currentLevel = calculateLevel(currentXp);
  const nextThreshold = LEVEL_THRESHOLDS.find(
    (t) => t.level === currentLevel + 1
  );
  if (!nextThreshold) return null; // Already mastered

  const currentThreshold = LEVEL_THRESHOLDS.find(
    (t) => t.level === currentLevel
  )!;
  const xpIntoLevel = currentXp - currentThreshold.xpRequired;
  const xpNeeded = nextThreshold.xpRequired - currentThreshold.xpRequired;
  return {
    nextLevelXp: nextThreshold.xpRequired,
    currentLevelXp: currentThreshold.xpRequired,
    progress: xpNeeded > 0 ? xpIntoLevel / xpNeeded : 1,
  };
}
