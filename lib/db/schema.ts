import { sqliteTable, text, integer, real, uniqueIndex } from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";

// =====================
// AUTH TABLES (Better Auth manages these)
// =====================

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

// =====================
// SKILL TREE MODULE
// =====================

export const skillCategory = sqliteTable("skill_category", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  color: text("color"),
  status: text("status", { enum: ["active", "background", "inactive"] }).notNull().default("inactive"),
  templateId: text("template_id"),
  coverImage: text("cover_image"),
  /** Set the first time we auto-seed deliberate-practice routines from the
   * template, so subsequent visits don't silently re-add deleted ones. */
  practiceRoutinesSeeded: integer("practice_routines_seeded", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const skill = sqliteTable("skill", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  categoryId: text("category_id").notNull().references(() => skillCategory.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  currentXp: integer("current_xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  positionX: real("position_x"),
  positionY: real("position_y"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const skillPrerequisite = sqliteTable(
  "skill_prerequisite",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    skillId: text("skill_id").notNull().references(() => skill.id, { onDelete: "cascade" }),
    prerequisiteId: text("prerequisite_id").notNull().references(() => skill.id, { onDelete: "cascade" }),
    requiredLevel: integer("required_level").notNull().default(1),
  },
  (table) => [
    uniqueIndex("skill_prereq_unique").on(table.skillId, table.prerequisiteId),
  ]
);

export const milestone = sqliteTable("milestone", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  skillId: text("skill_id").notNull().references(() => skill.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  xpReward: integer("xp_reward").notNull().default(25),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const userSettings = sqliteTable("user_settings", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  netWorth: integer("net_worth").notNull().default(0),
  features: text("features", { mode: "json" }).$type<Record<string, boolean>>(),
  currency: text("currency").notNull().default("EUR"),
  generalXp: integer("general_xp").notNull().default(0),
  yearlyBookGoal: integer("yearly_book_goal").notNull().default(0),
  theme: text("theme").notNull().default("forest"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const financeAccount = sqliteTable("finance_account", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type", { enum: ["cash", "bank", "investment", "crypto", "debt", "other"] }).notNull().default("cash"),
  balance: integer("balance").notNull().default(0),
  icon: text("icon"),
  sortOrder: integer("sort_order").notNull().default(0),
  archivedAt: integer("archived_at", { mode: "timestamp" }),
  lastCheckedAt: integer("last_checked_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const financeTransaction = sqliteTable("finance_transaction", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").references(() => financeAccount.id, { onDelete: "set null" }),
  transferToAccountId: text("transfer_to_account_id").references(() => financeAccount.id, { onDelete: "set null" }),
  type: text("type", { enum: ["income", "expense", "transfer"] }).notNull(),
  amount: integer("amount").notNull(),
  category: text("category").notNull(),
  note: text("note"),
  occurredOn: text("occurred_on").notNull(),
  importHash: text("import_hash"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const financeRecurring = sqliteTable("finance_recurring", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").references(() => financeAccount.id, { onDelete: "set null" }),
  type: text("type", { enum: ["income", "expense"] }).notNull(),
  amount: integer("amount").notNull(),
  category: text("category").notNull(),
  note: text("note"),
  cadence: text("cadence", { enum: ["monthly", "yearly"] }).notNull(),
  nextDueOn: text("next_due_on").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const financeNetWorthSnapshot = sqliteTable("finance_net_worth_snapshot", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  takenOn: text("taken_on").notNull(),
  netWorth: integer("net_worth").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (t) => ({
  uniqueDaily: uniqueIndex("finance_snapshot_unique_daily").on(t.userId, t.takenOn),
}));

export const quest = sqliteTable("quest", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["main", "side"] }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon").notNull().default("📜"),
  xpReward: integer("xp_reward").notNull().default(10),
  status: text("status", { enum: ["active", "backlog", "completed", "abandoned"] }).notNull().default("active"),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  dueAt: integer("due_at", { mode: "timestamp" }),
  templateId: text("template_id"), // null for custom; non-null when seeded from a template
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const questTask = sqliteTable("quest_task", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  questId: text("quest_id").notNull().references(() => quest.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  // Auto-completion trigger. "manual" = checkbox, others auto-evaluate from
  // the linked module's state.
  triggerType: text("trigger_type", {
    enum: ["manual", "habit_count", "milestone", "book"],
  }).notNull().default("manual"),
  triggerHabitId: text("trigger_habit_id").references(() => habit.id, { onDelete: "set null" }),
  triggerMilestoneId: text("trigger_milestone_id").references(() => milestone.id, { onDelete: "set null" }),
  triggerBookId: text("trigger_book_id").references(() => book.id, { onDelete: "set null" }),
  triggerCount: integer("trigger_count"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const habit = sqliteTable("habit", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  skillId: text("skill_id").references(() => skill.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon").notNull().default("✅"),
  kind: text("kind", { enum: ["daily", "irregular"] }).notNull().default("daily"),
  xpPerCompletion: integer("xp_per_completion").notNull().default(1),
  sortOrder: integer("sort_order").notNull().default(0),
  paused: integer("paused", { mode: "boolean" }).notNull().default(false),
  archived: integer("archived", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const habitCompletion = sqliteTable("habit_completion", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  habitId: text("habit_id").notNull().references(() => habit.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD in user's local time
  completedAt: integer("completed_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const achievement = sqliteTable("achievement", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  categoryId: text("category_id").references(() => skillCategory.id, { onDelete: "cascade" }),
  source: text("source", { enum: ["template", "custom"] }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon").notNull().default("🏆"),
  isUnlocked: integer("is_unlocked", { mode: "boolean" }).notNull().default(false),
  unlockedAt: integer("unlocked_at", { mode: "timestamp" }),
  triggerType: text("trigger_type", {
    enum: [
      "manual",
      "subskill_mastered",
      "stage_reached",
      "all_mastered",
      "habit_streak",
      "habit_total",
      "quest_completed",
      "side_quest_count",
      "main_quest_count",
      "account_level",
      "finance_accounts",
      "finance_transactions",
      "finance_net_worth",
      "finance_recurrings",
      "finance_checkins",
      "books_read_count",
      "reading_list_completed",
      "book_max_pages",
      "book_total_pages",
      "book_burst",
      "book_rating_streak",
      "book_monthly_streak",
    ],
  }).notNull().default("manual"),
  triggerSkillId: text("trigger_skill_id").references(() => skill.id, { onDelete: "cascade" }),
  triggerStage: integer("trigger_stage"),
  triggerHabitId: text("trigger_habit_id").references(() => habit.id, { onDelete: "cascade" }),
  triggerQuestId: text("trigger_quest_id").references(() => quest.id, { onDelete: "cascade" }),
  triggerReadingListId: text("trigger_reading_list_id"),
  triggerCount: integer("trigger_count"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const practiceRoutine = sqliteTable("practice_routine", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  categoryId: text("category_id").notNull().references(() => skillCategory.id, { onDelete: "cascade" }),
  templateId: text("template_id"),
  name: text("name").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const practiceBlock = sqliteTable("practice_block", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  routineId: text("routine_id").notNull().references(() => practiceRoutine.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  focus: text("focus").notNull().default("general"),
  weight: integer("weight").notNull().default(10),
  minLevel: integer("min_level").notNull().default(1),
  notes: text("notes"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const xpSession = sqliteTable("xp_session", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  skillId: text("skill_id").notNull().references(() => skill.id, { onDelete: "cascade" }),
  milestoneId: text("milestone_id").references(() => milestone.id, { onDelete: "set null" }),
  xpGained: integer("xp_gained").notNull(),
  note: text("note"),
  loggedAt: integer("logged_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

// =====================
// PLACES (world map)
// =====================

export const place = sqliteTable("place", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type", { enum: ["spot", "city", "region", "country"] }).notNull().default("spot"),
  countryCode: text("country_code"), // ISO-3166-1 alpha-2
  countryName: text("country_name"),
  region: text("region"),
  lat: real("lat"),
  lng: real("lng"),
  notes: text("notes"),
  coverImage: text("cover_image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const placeVisit = sqliteTable("place_visit", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  placeId: text("place_id").notNull().references(() => place.id, { onDelete: "cascade" }),
  startedOn: text("started_on").notNull(),
  endedOn: text("ended_on"),
  rating: integer("rating"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

// =====================
// FRIENDS
// =====================

export const friend = sqliteTable("friend", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  nickname: text("nickname"),
  photoUrl: text("photo_url"),
  currentResidenceId: text("current_residence_id").references(() => place.id, { onDelete: "set null" }),
  birthday: text("birthday"), // YYYY-MM-DD; year may be 0001 if unknown
  metAt: text("met_at"),
  howWeMet: text("how_we_met"),
  notes: text("notes"),
  /** How often the user wants to reach out, in days. NULL = no reminder. */
  contactCadenceDays: integer("contact_cadence_days"),
  lastContactedAt: integer("last_contacted_at", { mode: "timestamp" }),
  archived: integer("archived", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const friendResidence = sqliteTable("friend_residence", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  friendId: text("friend_id").notNull().references(() => friend.id, { onDelete: "cascade" }),
  placeId: text("place_id").notNull().references(() => place.id, { onDelete: "cascade" }),
  startedOn: text("started_on"),
  endedOn: text("ended_on"),
  isCurrent: integer("is_current", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const friendInteraction = sqliteTable("friend_interaction", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  friendId: text("friend_id").notNull().references(() => friend.id, { onDelete: "cascade" }),
  placeId: text("place_id").references(() => place.id, { onDelete: "set null" }),
  occurredOn: text("occurred_on").notNull(),
  kind: text("kind", {
    enum: ["message", "call", "meet", "trip", "event", "letter", "other"],
  }).notNull().default("message"),
  notes: text("notes"),
  xpAwarded: integer("xp_awarded").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

// =====================
// BOOKS
// =====================

export const book = sqliteTable("book", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  authors: text("authors").notNull(), // comma-separated
  isbn: text("isbn"),
  coverUrl: text("cover_url"),
  pages: integer("pages"),
  year: integer("year"),
  description: text("description"),
  status: text("status", { enum: ["want", "reading", "read"] }).notNull().default("want"),
  rating: integer("rating"), // 1-5 (most recent read)
  startedAt: integer("started_at", { mode: "timestamp" }),
  finishedAt: integer("finished_at", { mode: "timestamp" }), // most recent finish
  notes: text("notes"),
  source: text("source"),
  skillId: text("skill_id").references(() => skill.id, { onDelete: "set null" }),
  questId: text("quest_id").references(() => quest.id, { onDelete: "set null" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

/** Historical row per completed read — supports rereads. */
export const bookRead = sqliteTable("book_read", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  bookId: text("book_id").notNull().references(() => book.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  startedAt: integer("started_at", { mode: "timestamp" }),
  finishedAt: integer("finished_at", { mode: "timestamp" }).notNull(),
  rating: integer("rating"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const readingList = sqliteTable("reading_list", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  templateId: text("template_id"), // null for custom
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon").notNull().default("📚"),
  coverImage: text("cover_image"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const readingListItem = sqliteTable("reading_list_item", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  listId: text("list_id").notNull().references(() => readingList.id, { onDelete: "cascade" }),
  bookId: text("book_id").notNull().references(() => book.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
});

// =====================
// RELATIONS
// =====================

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  skillCategories: many(skillCategory),
  skills: many(skill),
  milestones: many(milestone),
  xpSessions: many(xpSession),
  achievements: many(achievement),
  habits: many(habit),
  habitCompletions: many(habitCompletion),
  books: many(book),
  readingLists: many(readingList),
}));

export const bookRelations = relations(book, ({ one, many }) => ({
  user: one(user, { fields: [book.userId], references: [user.id] }),
  readingListItems: many(readingListItem),
  reads: many(bookRead),
  skill: one(skill, { fields: [book.skillId], references: [skill.id] }),
  quest: one(quest, { fields: [book.questId], references: [quest.id] }),
}));

export const bookReadRelations = relations(bookRead, ({ one }) => ({
  book: one(book, { fields: [bookRead.bookId], references: [book.id] }),
  user: one(user, { fields: [bookRead.userId], references: [user.id] }),
}));

export const readingListRelations = relations(readingList, ({ one, many }) => ({
  user: one(user, { fields: [readingList.userId], references: [user.id] }),
  items: many(readingListItem),
}));

export const readingListItemRelations = relations(readingListItem, ({ one }) => ({
  list: one(readingList, {
    fields: [readingListItem.listId],
    references: [readingList.id],
  }),
  book: one(book, {
    fields: [readingListItem.bookId],
    references: [book.id],
  }),
}));

export const questRelations = relations(quest, ({ one, many }) => ({
  user: one(user, { fields: [quest.userId], references: [user.id] }),
  tasks: many(questTask),
}));

export const questTaskRelations = relations(questTask, ({ one }) => ({
  quest: one(quest, { fields: [questTask.questId], references: [quest.id] }),
  user: one(user, { fields: [questTask.userId], references: [user.id] }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(user, { fields: [userSettings.userId], references: [user.id] }),
}));

export const habitRelations = relations(habit, ({ one, many }) => ({
  user: one(user, { fields: [habit.userId], references: [user.id] }),
  skill: one(skill, { fields: [habit.skillId], references: [skill.id] }),
  completions: many(habitCompletion),
}));

export const habitCompletionRelations = relations(habitCompletion, ({ one }) => ({
  habit: one(habit, { fields: [habitCompletion.habitId], references: [habit.id] }),
  user: one(user, { fields: [habitCompletion.userId], references: [user.id] }),
}));

export const achievementRelations = relations(achievement, ({ one }) => ({
  user: one(user, { fields: [achievement.userId], references: [user.id] }),
  category: one(skillCategory, { fields: [achievement.categoryId], references: [skillCategory.id] }),
  triggerSkill: one(skill, { fields: [achievement.triggerSkillId], references: [skill.id] }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const skillCategoryRelations = relations(skillCategory, ({ one, many }) => ({
  user: one(user, { fields: [skillCategory.userId], references: [user.id] }),
  skills: many(skill),
}));

export const skillRelations = relations(skill, ({ one, many }) => ({
  category: one(skillCategory, { fields: [skill.categoryId], references: [skillCategory.id] }),
  user: one(user, { fields: [skill.userId], references: [user.id] }),
  prerequisites: many(skillPrerequisite, { relationName: "skillPrerequisites" }),
  dependents: many(skillPrerequisite, { relationName: "prerequisiteOf" }),
  milestones: many(milestone),
  xpSessions: many(xpSession),
}));

export const skillPrerequisiteRelations = relations(skillPrerequisite, ({ one }) => ({
  skill: one(skill, {
    fields: [skillPrerequisite.skillId],
    references: [skill.id],
    relationName: "skillPrerequisites",
  }),
  prerequisite: one(skill, {
    fields: [skillPrerequisite.prerequisiteId],
    references: [skill.id],
    relationName: "prerequisiteOf",
  }),
}));

export const milestoneRelations = relations(milestone, ({ one }) => ({
  skill: one(skill, { fields: [milestone.skillId], references: [skill.id] }),
  user: one(user, { fields: [milestone.userId], references: [user.id] }),
}));

export const xpSessionRelations = relations(xpSession, ({ one }) => ({
  user: one(user, { fields: [xpSession.userId], references: [user.id] }),
  skill: one(skill, { fields: [xpSession.skillId], references: [skill.id] }),
  milestone: one(milestone, { fields: [xpSession.milestoneId], references: [milestone.id] }),
}));
