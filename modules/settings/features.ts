export type FeatureKey =
  | "todaysQuests"
  | "statusBarNetWorth"
  | "statusBarBooks"
  | "dashboardCountryFill"
  | "dashboardFriendsDue";

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
  {
    key: "statusBarNetWorth",
    label: "Net worth in status bar",
    description:
      "Show the coin icon and net worth chip in the top-right of the character status bar.",
    icon: "🪙",
  },
  {
    key: "statusBarBooks",
    label: "Books in status bar",
    description:
      "Show books read (or yearly goal progress) in the top-right of the character status bar.",
    icon: "📚",
  },
  {
    key: "dashboardCountryFill",
    label: "Country fill on dashboard",
    description:
      "Show a small world map with the countries you've visited shaded in, on the dashboard.",
    icon: "🗺️",
  },
  {
    key: "dashboardFriendsDue",
    label: "Friends to reach out on dashboard",
    description:
      "Surface friends whose contact cadence is overdue at the top of the dashboard.",
    icon: "🫂",
  },
];

export const FEATURE_DEFAULTS: Record<FeatureKey, boolean> = {
  todaysQuests: false,
  statusBarNetWorth: true,
  statusBarBooks: true,
  dashboardCountryFill: true,
  dashboardFriendsDue: true,
};

export function isFeatureEnabled(
  features: Record<string, boolean> | null | undefined,
  key: FeatureKey
): boolean {
  return features?.[key] ?? FEATURE_DEFAULTS[key];
}
