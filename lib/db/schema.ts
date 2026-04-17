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
// RELATIONS
// =====================

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  skillCategories: many(skillCategory),
  skills: many(skill),
  milestones: many(milestone),
  xpSessions: many(xpSession),
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
