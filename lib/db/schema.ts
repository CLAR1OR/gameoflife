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
  status: text("status", { enum: ["active", "completed", "abandoned"] }).notNull().default("active"),
  completedAt: integer("completed_at", { mode: "timestamp" }),
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
  rating: integer("rating"), // 1-5
  startedAt: integer("started_at", { mode: "timestamp" }),
  finishedAt: integer("finished_at", { mode: "timestamp" }),
  notes: text("notes"),
  source: text("source"), // "manual" | "goodreads_csv" | "template" | "openlibrary"
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

export const questRelations = relations(quest, ({ one }) => ({
  user: one(user, { fields: [quest.userId], references: [user.id] }),
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
