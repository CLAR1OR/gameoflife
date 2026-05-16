/** Maps each `triggerType` to the visual module it should appear under on
 * the Achievements page. Skill-category achievements (subskill_mastered,
 * stage_reached, all_mastered) are routed by categoryId instead and never
 * land here; manual + miscellaneous fall into "custom". */
export type AchievementModuleKey =
  | "level"
  | "places"
  | "hikes"
  | "friends"
  | "finance"
  | "books"
  | "habits"
  | "quests"
  | "custom";

export type AchievementModule = {
  key: AchievementModuleKey;
  name: string;
  icon: string;
  /** The unit for the formatted progress label (e.g. "km", "m", " books"). */
  unitByTrigger?: Record<string, string>;
  triggerTypes: string[];
};

export const ACHIEVEMENT_MODULES: AchievementModule[] = [
  {
    key: "level",
    name: "Level",
    icon: "⭐",
    triggerTypes: ["account_level"],
    unitByTrigger: { account_level: "" },
  },
  {
    key: "places",
    name: "Places",
    icon: "🗺️",
    triggerTypes: ["places_count", "countries_visited"],
    unitByTrigger: {
      places_count: " places",
      countries_visited: " countries",
    },
  },
  {
    key: "hikes",
    name: "Hikes",
    icon: "🥾",
    triggerTypes: [
      "hikes_count",
      "hike_total_km",
      "hike_total_elevation",
      "hike_single_max_km",
      "hike_single_max_elevation",
    ],
    unitByTrigger: {
      hikes_count: " hikes",
      hike_total_km: " km",
      hike_total_elevation: " m",
      hike_single_max_km: " km",
      hike_single_max_elevation: " m",
    },
  },
  {
    key: "friends",
    name: "Friends",
    icon: "🫂",
    triggerTypes: [
      "friends_count",
      "friend_interactions_count",
      "friend_countries",
      "friend_events_count",
    ],
    unitByTrigger: {
      friends_count: " friends",
      friend_interactions_count: " interactions",
      friend_countries: " countries",
      friend_events_count: " events",
    },
  },
  {
    key: "finance",
    name: "Finance",
    icon: "💰",
    triggerTypes: [
      "finance_accounts",
      "finance_transactions",
      "finance_net_worth",
      "finance_recurrings",
      "finance_checkins",
    ],
    unitByTrigger: {
      finance_accounts: " accounts",
      finance_transactions: " transactions",
      finance_recurrings: " active",
      finance_checkins: " check-ins",
      finance_net_worth: "",
    },
  },
  {
    key: "books",
    name: "Books",
    icon: "📚",
    triggerTypes: [
      "books_read_count",
      "reading_list_completed",
      "book_max_pages",
      "book_total_pages",
      "book_burst",
      "book_rating_streak",
      "book_monthly_streak",
    ],
    unitByTrigger: {
      books_read_count: " books",
      book_max_pages: " pages",
      book_total_pages: " pages",
    },
  },
  {
    key: "habits",
    name: "Habits",
    icon: "🔄",
    triggerTypes: ["habit_streak", "habit_total"],
    unitByTrigger: {
      habit_streak: "-day streak",
      habit_total: " completions",
    },
  },
  {
    key: "quests",
    name: "Quests",
    icon: "📜",
    triggerTypes: ["quest_completed", "side_quest_count", "main_quest_count"],
    unitByTrigger: {
      side_quest_count: " side quests",
      main_quest_count: " main quests",
    },
  },
];

const TRIGGER_TO_MODULE = new Map<string, AchievementModule>();
for (const m of ACHIEVEMENT_MODULES) {
  for (const t of m.triggerTypes) TRIGGER_TO_MODULE.set(t, m);
}

export function moduleForTrigger(
  triggerType: string
): AchievementModule | null {
  return TRIGGER_TO_MODULE.get(triggerType) ?? null;
}

export function unitForTrigger(triggerType: string): string {
  const m = moduleForTrigger(triggerType);
  return m?.unitByTrigger?.[triggerType] ?? "";
}

/** Compact human-format for progress numbers: 1234 → "1.2k", 1234567 → "1.2M". */
export function formatProgressNumber(n: number): string {
  if (n === 0) return "0";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 10_000) return `${(n / 1_000).toFixed(0)}k`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(1);
}
