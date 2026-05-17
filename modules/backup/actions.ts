"use server";

import { db } from "@/lib/db";
import {
  skillCategory,
  skill,
  skillPrerequisite,
  milestone,
  xpSession,
  userSettings,
  quest,
  questTask,
  practiceRoutine,
  practiceBlock,
  habit,
  habitCompletion,
  achievement,
  financeAccount,
  financeTransaction,
  financeRecurring,
  financeNetWorthSnapshot,
  financeBudget,
  book,
  bookRead,
  readingList,
  readingListItem,
  place,
  placeVisit,
  trip,
  friend,
  friendResidence,
  friendInteraction,
  friendTag,
  friendTagAssignment,
  friendContact,
  friendEvent,
} from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { requireSession } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { BACKUP_VERSION } from "./constants";

type Scalar = string | number | boolean | null;
type Row = Record<string, Scalar | Date>;

/** Every user-scoped table in the app. Order here is the INSERT order for
 * import — parents before children. Wipe order is the reverse. */
const TABLES = [
  { name: "skillCategory", table: skillCategory },
  { name: "skill", table: skill },
  { name: "skillPrerequisite", table: skillPrerequisite },
  { name: "milestone", table: milestone },
  { name: "quest", table: quest },
  { name: "questTask", table: questTask },
  { name: "practiceRoutine", table: practiceRoutine },
  { name: "practiceBlock", table: practiceBlock },
  { name: "habit", table: habit },
  { name: "habitCompletion", table: habitCompletion },
  { name: "achievement", table: achievement },
  { name: "xpSession", table: xpSession },
  { name: "book", table: book },
  { name: "bookRead", table: bookRead },
  { name: "readingList", table: readingList },
  { name: "readingListItem", table: readingListItem },
  { name: "trip", table: trip },
  { name: "place", table: place },
  { name: "placeVisit", table: placeVisit },
  { name: "friend", table: friend },
  { name: "friendResidence", table: friendResidence },
  { name: "friendInteraction", table: friendInteraction },
  { name: "friendTag", table: friendTag },
  { name: "friendTagAssignment", table: friendTagAssignment },
  { name: "friendContact", table: friendContact },
  { name: "friendEvent", table: friendEvent },
  { name: "financeAccount", table: financeAccount },
  { name: "financeTransaction", table: financeTransaction },
  { name: "financeRecurring", table: financeRecurring },
  { name: "financeNetWorthSnapshot", table: financeNetWorthSnapshot },
  { name: "financeBudget", table: financeBudget },
  { name: "userSettings", table: userSettings },
] as const;

type TableName = (typeof TABLES)[number]["name"];

type Snapshot = Partial<Record<TableName, Row[]>>;

type BackupFile = {
  version: number;
  exportedAt: string;
  user: { id: string; email: string; name: string };
  data: Snapshot;
};

export async function exportBackup(): Promise<BackupFile> {
  const session = await requireSession();
  const userId = session.user.id;

  // skillPrerequisite has no userId column — find it via the user's skills.
  const userSkillRows = await db
    .select({ id: skill.id })
    .from(skill)
    .where(eq(skill.userId, userId));
  const userSkillIds = userSkillRows.map((r) => r.id);

  const data: Snapshot = {};
  for (const t of TABLES) {
    if (t.name === "skillPrerequisite") {
      if (userSkillIds.length === 0) {
        data[t.name] = [];
        continue;
      }
      const rows = await db
        .select()
        .from(skillPrerequisite)
        .where(inArray(skillPrerequisite.skillId, userSkillIds));
      data[t.name] = rows as Row[];
      continue;
    }
    // Other user-scoped tables all have a userId column. Drizzle select()
    // returns JS values (Dates for timestamp columns) which JSON.stringify
    // serialises to ISO strings.
    const rows = await db
      .select()
      .from(t.table as typeof skill)
      .where(eq((t.table as typeof skill).userId, userId));
    data[t.name] = rows as Row[];
  }

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    },
    data,
  };
}

/**
 * Column names on each table that are timestamp-typed; Drizzle's SQLite
 * timestamp mode needs JS Date objects on insert, not ISO strings.
 */
const TIMESTAMP_COLS: Partial<Record<TableName, string[]>> = {
  skillCategory: ["createdAt", "updatedAt"],
  skill: ["createdAt", "updatedAt"],
  milestone: ["completedAt", "createdAt"],
  quest: ["completedAt", "dueAt", "createdAt"],
  questTask: ["completedAt", "createdAt"],
  practiceRoutine: ["createdAt", "updatedAt"],
  practiceBlock: ["createdAt"],
  habit: ["createdAt"],
  habitCompletion: ["completedAt"],
  achievement: ["unlockedAt", "createdAt"],
  xpSession: ["loggedAt"],
  book: ["startedAt", "finishedAt", "createdAt"],
  bookRead: ["startedAt", "finishedAt", "createdAt"],
  readingList: ["createdAt"],
  place: ["createdAt", "updatedAt"],
  placeVisit: ["createdAt"],
  trip: ["createdAt", "updatedAt"],
  friend: ["lastContactedAt", "createdAt", "updatedAt"],
  friendResidence: ["createdAt"],
  friendInteraction: ["createdAt"],
  friendTag: ["createdAt"],
  friendTagAssignment: ["createdAt"],
  friendContact: ["createdAt"],
  friendEvent: ["createdAt"],
  financeAccount: ["archivedAt", "lastCheckedAt", "createdAt", "updatedAt"],
  financeTransaction: ["createdAt"],
  financeRecurring: ["createdAt"],
  financeNetWorthSnapshot: ["createdAt"],
  financeBudget: ["createdAt", "updatedAt"],
  userSettings: ["updatedAt", "onboardedAt"],
};

function hydrateTimestamps(name: TableName, row: Row): Row {
  const cols = TIMESTAMP_COLS[name];
  if (!cols) return row;
  const out: Row = { ...row };
  for (const c of cols) {
    const v = out[c];
    if (typeof v === "string") {
      const d = new Date(v);
      if (!Number.isNaN(d.getTime())) out[c] = d;
    } else if (typeof v === "number") {
      // Unix-seconds (SQLite raw) — convert to ms
      out[c] = new Date(v * 1000);
    }
  }
  return out;
}

/**
 * In earlier versions of the app, hike data lived on the `place` row
 * (place.type === "hike" + place.distanceKm/elevationM). The current schema
 * keeps hike data on each `placeVisit` so multiple distinct routes can start
 * from the same place. When restoring an older backup we translate:
 *  - any place with type="hike" → type="spot"
 *  - for each such place's visits, flip isHike to true and copy the
 *    place-level km/elev down to the visit if the visit didn't already
 *    have its own.
 * Mutates the snapshot in place.
 */
function migrateLegacyHikeData(data: Snapshot): void {
  const places = data.place;
  const visits = data.placeVisit;
  if (!places || !visits) return;
  const legacy = new Map<
    string,
    { distanceKm: number | null; elevationM: number | null }
  >();
  for (const p of places) {
    if (p.type === "hike") {
      legacy.set(p.id as string, {
        distanceKm: (p.distanceKm as number | null) ?? null,
        elevationM: (p.elevationM as number | null) ?? null,
      });
      p.type = "spot";
    }
  }
  if (legacy.size === 0) return;
  for (const v of visits) {
    const src = legacy.get(v.placeId as string);
    if (!src) continue;
    if (!v.isHike) v.isHike = true;
    if (v.distanceKm == null) v.distanceKm = src.distanceKm;
    if (v.elevationM == null) v.elevationM = src.elevationM;
  }
}

/**
 * Import a backup into the CURRENT user's account. Every row's `userId` is
 * rewritten to the current session user, so migrating between accounts
 * works cleanly. Existing user data is wiped first — the caller must confirm.
 */
export async function importBackup(raw: unknown) {
  const session = await requireSession();
  const userId = session.user.id;

  // Basic shape checks — we don't trust uploaded JSON.
  if (!raw || typeof raw !== "object") throw new Error("Invalid backup file");
  const file = raw as Partial<BackupFile>;
  if (file.version !== BACKUP_VERSION) {
    throw new Error(
      `Unsupported backup version: got ${file.version}, expected ${BACKUP_VERSION}`
    );
  }
  if (!file.data || typeof file.data !== "object") {
    throw new Error("Backup is missing `data`");
  }

  const data = file.data as Snapshot;
  migrateLegacyHikeData(data);

  // Wipe current data — reverse insertion order respects FK constraints.
  // skillPrerequisite has no userId column; delete by matching the user's
  // current skill IDs (and let the cascade clean up any stragglers when we
  // delete the skills below).
  const existingSkillRows = await db
    .select({ id: skill.id })
    .from(skill)
    .where(eq(skill.userId, userId));
  const existingSkillIds = existingSkillRows.map((r) => r.id);

  for (const t of [...TABLES].reverse()) {
    if (t.name === "skillPrerequisite") {
      if (existingSkillIds.length > 0) {
        await db
          .delete(skillPrerequisite)
          .where(inArray(skillPrerequisite.skillId, existingSkillIds));
      }
      continue;
    }
    await db
      .delete(t.table as typeof skill)
      .where(eq((t.table as typeof skill).userId, userId));
  }

  // Insert in parent → child order. skillPrerequisite is the only table with
  // no userId column, so we don't re-stamp it.
  for (const t of TABLES) {
    const rows = data[t.name];
    if (!rows || !Array.isArray(rows) || rows.length === 0) continue;

    const prepped = rows.map((r) => {
      const withTs = hydrateTimestamps(t.name, r);
      return t.name === "skillPrerequisite"
        ? withTs
        : { ...withTs, userId };
    });

    // Chunk to avoid ballooning SQL statement size.
    const CHUNK = 200;
    for (let i = 0; i < prepped.length; i += CHUNK) {
      const slice = prepped.slice(i, i + CHUNK);
      await db.insert(t.table as typeof skill).values(slice as never[]);
    }
  }

  // The entire dashboard depends on this data — invalidate everything.
  revalidatePath("/", "layout");
  return { restored: true };
}
