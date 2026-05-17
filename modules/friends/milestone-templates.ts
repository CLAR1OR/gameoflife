/**
 * Friendship-milestone packs.
 *
 * Each pack is a curated list of universal milestones seeded for friends
 * tagged with that relationship type. The default pack ("friend") fits
 * most relationships; switch to "family" / "romantic" / "colleague" on
 * the friend detail page to swap to a more relationship-appropriate set.
 *
 * Auto-completion: time-based milestones (`auto: "time-Xy"`) and
 * interaction-based ones (`auto: "interactions-N" | "meets-N" |
 * "places-N"`) tick automatically — the sync action in actions.ts reads
 * the friend's `metAt` + interaction log and flips `completed`.
 */
export type FriendMilestoneAuto =
  | { kind: "time-years"; years: number }
  | { kind: "interactions"; count: number }
  | { kind: "meets"; count: number }
  | { kind: "places"; count: number };

export type FriendMilestoneTemplate = {
  key: string;
  name: string;
  /** Lower numbers float to the top. */
  sortOrder: number;
  /** If set, this milestone is auto-completed by the sync action based
   *  on the friend's `metAt` / interaction log. */
  auto?: FriendMilestoneAuto;
};

export type MilestonePackKey =
  | "friend"
  | "family"
  | "romantic"
  | "colleague";

export type MilestonePack = {
  key: MilestonePackKey;
  name: string;
  icon: string;
  description: string;
  templates: FriendMilestoneTemplate[];
};

// ---- Friend (default, universal) ----------------------------------------
const FRIEND_TEMPLATES: FriendMilestoneTemplate[] = [
  // Time
  { key: "known-1y",  name: "1 year known",  sortOrder: 10, auto: { kind: "time-years", years: 1 } },
  { key: "known-5y",  name: "5 years known",  sortOrder: 11, auto: { kind: "time-years", years: 5 } },
  { key: "known-10y", name: "10 years known", sortOrder: 12, auto: { kind: "time-years", years: 10 } },

  // Activity (auto from interactions log)
  { key: "meets-5",        name: "Met up 5 times",                 sortOrder: 15, auto: { kind: "meets", count: 5 } },
  { key: "meets-25",       name: "Met up 25 times",                sortOrder: 16, auto: { kind: "meets", count: 25 } },
  { key: "interactions-50",name: "50 logged interactions",         sortOrder: 17, auto: { kind: "interactions", count: 50 } },
  { key: "places-3",       name: "Together in 3+ different places",sortOrder: 18, auto: { kind: "places", count: 3 } },

  // Hospitality + breadth
  { key: "shared-meal",     name: "Shared a meal at their place or yours",          sortOrder: 20 },
  { key: "overnight-host",  name: "Hosted them overnight",                          sortOrder: 21 },
  { key: "overnight-guest", name: "Stayed overnight at their place",                sortOrder: 22 },
  { key: "trip-together",   name: "Took a trip together (overnight or longer)",     sortOrder: 23 },

  // Social network integration
  { key: "met-family",      name: "Met their family",                               sortOrder: 30 },
  { key: "met-friends",     name: "Met their close friends",                        sortOrder: 31 },
  { key: "witnessed-event", name: "Witnessed a major life event of theirs",         sortOrder: 32 },

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

// ---- Family ------------------------------------------------------------
const FAMILY_TEMPLATES: FriendMilestoneTemplate[] = [
  // Time
  { key: "known-5y",  name: "5 years close",  sortOrder: 10, auto: { kind: "time-years", years: 5 } },
  { key: "known-10y", name: "10 years close", sortOrder: 11, auto: { kind: "time-years", years: 10 } },
  { key: "known-25y", name: "25 years close", sortOrder: 12, auto: { kind: "time-years", years: 25 } },

  // Activity
  { key: "interactions-50",  name: "50 logged interactions",            sortOrder: 15, auto: { kind: "interactions", count: 50 } },
  { key: "interactions-200", name: "200 logged interactions",           sortOrder: 16, auto: { kind: "interactions", count: 200 } },

  // Hospitality + ritual
  { key: "fam-shared-meal",      name: "Shared a meal together this year",       sortOrder: 20 },
  { key: "fam-holiday",          name: "Spent a holiday or tradition together",  sortOrder: 21 },
  { key: "fam-trip",             name: "Took a trip together",                   sortOrder: 22 },
  { key: "fam-lived-together",   name: "Lived under the same roof at some point",sortOrder: 23 },

  // Depth + reciprocity
  { key: "fam-said-hard",        name: "Said something hard out loud to them",   sortOrder: 30 },
  { key: "fam-survived-conflict",name: "Came out the other side of a conflict",  sortOrder: 31 },
  { key: "fam-asked-advice",     name: "Asked them for advice on something real",sortOrder: 32 },
  { key: "fam-gave-advice",      name: "Gave them advice they actually took",    sortOrder: 33 },
  { key: "fam-shared-loss",      name: "Shared a loss together",                 sortOrder: 34 },

  // Generational / continuity
  { key: "fam-witnessed-event",  name: "Was there for one of their major events",sortOrder: 40 },
  { key: "fam-passed-down",      name: "Inherited or passed down something meaningful", sortOrder: 41 },
  { key: "fam-met-their-people", name: "Got to know their family or close friends", sortOrder: 42 },
];

// ---- Romantic ----------------------------------------------------------
const ROMANTIC_TEMPLATES: FriendMilestoneTemplate[] = [
  // Time / partnership
  { key: "together-1y",  name: "1 year together",  sortOrder: 10, auto: { kind: "time-years", years: 1 } },
  { key: "together-5y",  name: "5 years together",  sortOrder: 11, auto: { kind: "time-years", years: 5 } },
  { key: "together-10y", name: "10 years together", sortOrder: 12, auto: { kind: "time-years", years: 10 } },

  // Activity
  { key: "meets-50",         name: "Met up 50 times since we started tracking", sortOrder: 15, auto: { kind: "meets", count: 50 } },
  { key: "interactions-100", name: "100 logged interactions",                   sortOrder: 16, auto: { kind: "interactions", count: 100 } },

  // Foundations
  { key: "rom-first-date",     name: "First date",                           sortOrder: 20 },
  { key: "rom-said-love",      name: "Said \"I love you\" out loud",         sortOrder: 21 },
  { key: "rom-met-friends",    name: "Met each other's close friends",       sortOrder: 22 },
  { key: "rom-met-family",     name: "Met each other's family",              sortOrder: 23 },

  // Shared life
  { key: "rom-lived-together", name: "Lived together",                       sortOrder: 30 },
  { key: "rom-traveled",       name: "Took a trip together (overnight+)",    sortOrder: 31 },
  { key: "rom-big-decision",   name: "Made a major life decision together",  sortOrder: 32 },
  { key: "rom-survived-fight", name: "Survived a real fight and reconnected",sortOrder: 33 },
  { key: "rom-shared-loss",    name: "Got through a hard loss together",     sortOrder: 34 },

  // Depth
  { key: "rom-shared-secret",  name: "Shared something you'd told no one else", sortOrder: 40 },
  { key: "rom-cried-together", name: "Cried together",                        sortOrder: 41 },
  { key: "rom-asked-help",     name: "Asked them for help with something real", sortOrder: 42 },
  { key: "rom-they-asked",     name: "They asked you for help with something real", sortOrder: 43 },
];

// ---- Colleague / professional -----------------------------------------
const COLLEAGUE_TEMPLATES: FriendMilestoneTemplate[] = [
  // Time
  { key: "known-1y", name: "1 year working alongside",   sortOrder: 10, auto: { kind: "time-years", years: 1 } },
  { key: "known-5y", name: "5 years known professionally", sortOrder: 11, auto: { kind: "time-years", years: 5 } },

  // Activity
  { key: "interactions-25", name: "25 logged interactions", sortOrder: 15, auto: { kind: "interactions", count: 25 } },

  // Work-context milestones
  { key: "col-project",        name: "Shipped a project together",                sortOrder: 20 },
  { key: "col-coffee",         name: "Got coffee or lunch outside work",          sortOrder: 21 },
  { key: "col-recommended",    name: "Recommended each other (job / project)",    sortOrder: 22 },
  { key: "col-saved-bacon",    name: "Saved each other's bacon at work",          sortOrder: 23 },
  { key: "col-honest-feedback",name: "Gave each other genuinely honest feedback", sortOrder: 24 },

  // Beyond-the-cubicle
  { key: "col-met-outside",     name: "Met up outside of work",                   sortOrder: 30 },
  { key: "col-shared-meal",     name: "Shared a meal at their place or yours",    sortOrder: 31 },
  { key: "col-met-family",      name: "Met their family or partner",              sortOrder: 32 },
  { key: "col-survived-crisis", name: "Survived a work crisis together",          sortOrder: 33 },

  // Depth
  { key: "col-shared-secret", name: "Told them something you wouldn't tell most colleagues", sortOrder: 40 },
  { key: "col-asked-advice",  name: "Asked them for career advice",                 sortOrder: 41 },
  { key: "col-gave-advice",   name: "Gave them advice they actually took",          sortOrder: 42 },
];

export const MILESTONE_PACKS: MilestonePack[] = [
  {
    key: "friend",
    name: "Friend",
    icon: "🤝",
    description: "Default universal pack — fits most relationships.",
    templates: FRIEND_TEMPLATES,
  },
  {
    key: "family",
    name: "Family",
    icon: "🫶",
    description: "Sibling / parent / child / chosen-family framing.",
    templates: FAMILY_TEMPLATES,
  },
  {
    key: "romantic",
    name: "Romantic",
    icon: "💞",
    description: "Partner / dating focus — relationship milestones.",
    templates: ROMANTIC_TEMPLATES,
  },
  {
    key: "colleague",
    name: "Colleague",
    icon: "💼",
    description: "Work / professional relationship.",
    templates: COLLEAGUE_TEMPLATES,
  },
];

export const MILESTONE_PACKS_BY_KEY = new Map(
  MILESTONE_PACKS.map((p) => [p.key, p])
);

export function getMilestonePack(
  key: string | null | undefined
): MilestonePack {
  return MILESTONE_PACKS_BY_KEY.get(key as MilestonePackKey) ?? MILESTONE_PACKS[0];
}

/** Legacy export — kept so older imports still work. Resolves to the
 *  default "friend" pack's templates. */
export const FRIEND_MILESTONE_TEMPLATES = FRIEND_TEMPLATES;

export const FRIEND_MILESTONE_TEMPLATE_KEYS = new Set(
  FRIEND_TEMPLATES.map((t) => t.key)
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
