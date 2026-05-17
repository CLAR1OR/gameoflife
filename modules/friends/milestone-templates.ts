/**
 * Universal friendship milestones seeded for every new friend. Each is
 * deletable per-friend, so users can drop the ones that don't apply to
 * a given relationship (sibling vs colleague vs long-distance pen-pal
 * have very different markers of closeness).
 *
 * Time-based milestones ("known-Xy") are auto-completed by
 * `syncTimeBasedMilestones` based on `friend.metAt`.
 */
export type FriendMilestoneTemplate = {
  key: string;
  name: string;
  /** Lower numbers float to the top. */
  sortOrder: number;
};

export const FRIEND_MILESTONE_TEMPLATES: FriendMilestoneTemplate[] = [
  // Time
  { key: "known-1y",       name: "1 year known",                                    sortOrder: 10 },
  { key: "known-5y",       name: "5 years known",                                   sortOrder: 11 },
  { key: "known-10y",      name: "10 years known",                                  sortOrder: 12 },

  // Hospitality + breadth
  { key: "shared-meal",    name: "Shared a meal at their place or yours",           sortOrder: 20 },
  { key: "overnight-host", name: "Hosted them overnight",                           sortOrder: 21 },
  { key: "overnight-guest",name: "Stayed overnight at their place",                 sortOrder: 22 },
  { key: "trip-together",  name: "Took a trip together (overnight or longer)",      sortOrder: 23 },

  // Social network integration
  { key: "met-family",     name: "Met their family",                                sortOrder: 30 },
  { key: "met-friends",    name: "Met their close friends",                         sortOrder: 31 },
  { key: "witnessed-event",name: "Witnessed a major life event of theirs",          sortOrder: 32 },

  // Depth + reciprocity
  { key: "shared-secret",  name: "Shared a secret or something vulnerable",         sortOrder: 40 },
  { key: "cried-together", name: "Cried together / shared something hard",          sortOrder: 41 },
  { key: "laughed-tears",  name: "Laughed until tears together",                    sortOrder: 42 },
  { key: "they-helped",    name: "They helped you through something hard",          sortOrder: 43 },
  { key: "you-helped",     name: "You helped them through something hard",          sortOrder: 44 },
  { key: "they-asked",     name: "They asked you for help with something real",     sortOrder: 45 },
  { key: "you-asked",      name: "You asked them for help with something real",     sortOrder: 46 },

  // Endurance
  { key: "big-transition", name: "Knew them through one of their big life changes", sortOrder: 50 },
  { key: "long-distance",  name: "Stayed close after distance separated you",       sortOrder: 51 },
  { key: "weathered-fight",name: "Had a fight and came out the other side",         sortOrder: 52 },
];

export const FRIEND_MILESTONE_TEMPLATE_KEYS = new Set(
  FRIEND_MILESTONE_TEMPLATES.map((t) => t.key)
);

export type FriendStage = {
  key: "acquaintance" | "friend" | "close_friend" | "inner_circle" | "family";
  /** Minimum completed-milestone count to reach this stage. */
  min: number;
  name: string;
  icon: string;
  /** A friendly tier color name used by the badge component. */
  color: "muted" | "glow-purple" | "glow" | "xp" | "destructive";
};

export const FRIEND_STAGES: FriendStage[] = [
  { key: "acquaintance", min: 0,  name: "Acquaintance", icon: "👋", color: "muted" },
  { key: "friend",       min: 3,  name: "Friend",       icon: "🤝", color: "glow-purple" },
  { key: "close_friend", min: 7,  name: "Close friend", icon: "💛", color: "glow" },
  { key: "inner_circle", min: 12, name: "Inner circle", icon: "🌟", color: "xp" },
  { key: "family",       min: 20, name: "Family",       icon: "🫶", color: "xp" },
];

export function friendStageFromCount(completed: number): FriendStage {
  let cur = FRIEND_STAGES[0];
  for (const s of FRIEND_STAGES) {
    if (completed >= s.min) cur = s;
  }
  return cur;
}

/** Next stage above the current one, or null if at the top. */
export function nextFriendStage(current: FriendStage): FriendStage | null {
  const idx = FRIEND_STAGES.findIndex((s) => s.key === current.key);
  if (idx < 0 || idx === FRIEND_STAGES.length - 1) return null;
  return FRIEND_STAGES[idx + 1];
}
