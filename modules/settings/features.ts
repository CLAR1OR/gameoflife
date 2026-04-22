export type FeatureKey = "todaysQuests";

export type FeatureDefinition = {
  key: FeatureKey;
  label: string;
  description: string;
  icon: string;
};

export const FEATURES: FeatureDefinition[] = [
  {
    key: "todaysQuests",
    label: "Today's Quests",
    description:
      "Show one suggested next milestone per active skill on your dashboard.",
    icon: "🎯",
  },
];

export const FEATURE_DEFAULTS: Record<FeatureKey, boolean> = {
  todaysQuests: false,
};

export function isFeatureEnabled(
  features: Record<string, boolean> | null | undefined,
  key: FeatureKey
): boolean {
  return features?.[key] ?? FEATURE_DEFAULTS[key];
}
