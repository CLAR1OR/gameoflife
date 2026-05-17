"use server";

import { db } from "@/lib/db";
import {
  friend,
  friendInteraction,
  friendResidence,
  friendTag,
  friendTagAssignment,
  friendContact,
  friendEvent,
  friendMilestone,
  userSettings,
} from "@/lib/db/schema";
import {
  getMilestonePack,
  type FriendMilestoneTemplate,
  type MilestonePackKey,
} from "./milestone-templates";
import { and, count, eq, inArray, sql } from "drizzle-orm";
import { requireSession } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { checkAccountLevelAchievements } from "@/lib/account-achievements";
import { checkFriendAchievements } from "@/lib/friends-achievements";
import { FRIEND_INTERACTION_XP } from "./constants";
import { writeFile, mkdir, unlink } from "node:fs/promises";
import path from "node:path";

export async function createFriend(data: {
  name: string;
  nickname?: string | null;
  photoUrl?: string | null;
  currentResidenceId?: string | null;
  birthday?: string | null;
  metAt?: string | null;
  howWeMet?: string | null;
  notes?: string | null;
  contactCadenceDays?: number | null;
  milestonePack?: MilestonePackKey | null;
}) {
  const session = await requireSession();
  const [row] = await db
    .insert(friend)
    .values({
      userId: session.user.id,
      name: data.name.trim(),
      nickname: data.nickname?.trim() || null,
      photoUrl: data.photoUrl?.trim() || null,
      currentResidenceId: data.currentResidenceId ?? null,
      birthday: data.birthday?.trim() || null,
      metAt: data.metAt?.trim() || null,
      howWeMet: data.howWeMet?.trim() || null,
      notes: data.notes?.trim() || null,
      milestonePack: data.milestonePack ?? "friend",
      contactCadenceDays: data.contactCadenceDays ?? null,
    })
    .returning();

  // Mirror the current residence into friend_residence so the history table
  // tracks "from day one" right from the start.
  if (row.currentResidenceId) {
    await db.insert(friendResidence).values({
      userId: session.user.id,
      friendId: row.id,
      placeId: row.currentResidenceId,
      isCurrent: true,
    });
  }

  // Seed milestones from the chosen pack, auto-completing what we can.
  await seedFriendMilestones(row.id, session.user.id, row.milestonePack);
  await syncAutoMilestonesForFriend(row.id, session.user.id);

  revalidatePath("/friends");
  revalidatePath("/places");
  await checkFriendAchievements(session.user.id);
  return row;
}

/** Insert the milestone-template rows for the chosen pack, skipping any
 *  template keys that already exist. Auto-completion (time + interaction
 *  based) is computed by `syncAutoMilestonesForFriend` afterward — this
 *  function just creates the rows in their initial unchecked state. */
async function seedFriendMilestones(
  friendId: string,
  userId: string,
  packKey: string | null | undefined
) {
  const pack = getMilestonePack(packKey);
  const existing = await db
    .select({ templateKey: friendMilestone.templateKey })
    .from(friendMilestone)
    .where(
      and(
        eq(friendMilestone.userId, userId),
        eq(friendMilestone.friendId, friendId)
      )
    );
  const seenKeys = new Set(
    existing.map((e) => e.templateKey).filter((k): k is string => !!k)
  );
  const toInsert = pack.templates.filter((t) => !seenKeys.has(t.key));
  if (toInsert.length === 0) return;

  await db.insert(friendMilestone).values(
    toInsert.map((t) => ({
      userId,
      friendId,
      name: t.name,
      templateKey: t.key,
      sortOrder: t.sortOrder,
      completed: false,
      completedAt: null,
    }))
  );
}

function yearsSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  // Accept YYYY-MM-DD or YYYY-MM or YYYY.
  const m = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(iso);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = m[2] ? Number(m[2]) - 1 : 0;
  const d = m[3] ? Number(m[3]) : 1;
  const then = new Date(y, mo, d);
  const ms = Date.now() - then.getTime();
  if (ms < 0) return 0;
  return ms / (1000 * 60 * 60 * 24 * 365.25);
}

/** Manually re-seed (idempotent). Re-runs auto-completion too. */
export async function reseedFriendMilestones(friendId: string) {
  const session = await requireSession();
  const f = await db.query.friend.findFirst({
    where: (row, { and: a, eq: e }) =>
      a(e(row.id, friendId), e(row.userId, session.user.id)),
  });
  if (!f) throw new Error("Friend not found");
  await seedFriendMilestones(friendId, session.user.id, f.milestonePack);
  await syncAutoMilestonesForFriend(friendId, session.user.id);
  revalidatePath(`/friends/${friendId}`);
  revalidatePath("/friends");
}

/** Switch a friend to a different milestone pack. Removes any
 *  template-keyed milestones from the previous pack that aren't in the
 *  new pack (custom milestones, identified by null templateKey, stay),
 *  then seeds the new pack and runs auto-completion. */
export async function setFriendMilestonePack(
  friendId: string,
  pack: MilestonePackKey
) {
  const session = await requireSession();
  const f = await db.query.friend.findFirst({
    where: (row, { and: a, eq: e }) =>
      a(e(row.id, friendId), e(row.userId, session.user.id)),
  });
  if (!f) throw new Error("Friend not found");

  const newPack = getMilestonePack(pack);
  const newKeys = new Set(newPack.templates.map((t) => t.key));

  // Drop template-keyed milestones not in the new pack.
  const stale = await db
    .select({ id: friendMilestone.id, templateKey: friendMilestone.templateKey })
    .from(friendMilestone)
    .where(
      and(
        eq(friendMilestone.userId, session.user.id),
        eq(friendMilestone.friendId, friendId)
      )
    );
  for (const m of stale) {
    if (m.templateKey && !newKeys.has(m.templateKey)) {
      await db
        .delete(friendMilestone)
        .where(eq(friendMilestone.id, m.id));
    }
  }

  await db
    .update(friend)
    .set({ milestonePack: pack, updatedAt: new Date() })
    .where(eq(friend.id, friendId));

  // Seed any missing rows from the new pack + run auto-completion.
  await seedFriendMilestones(friendId, session.user.id, pack);
  await syncAutoMilestonesForFriend(friendId, session.user.id);

  revalidatePath(`/friends/${friendId}`);
  revalidatePath("/friends");
  await checkFriendAchievements(session.user.id);
}

/** Compute per-friend interaction stats used by auto-completing templates. */
async function getFriendInteractionStats(
  friendId: string,
  userId: string
): Promise<{
  total: number;
  meets: number;
  distinctPlaces: number;
}> {
  const rows = await db
    .select({
      kind: friendInteraction.kind,
      placeId: friendInteraction.placeId,
    })
    .from(friendInteraction)
    .where(
      and(
        eq(friendInteraction.userId, userId),
        eq(friendInteraction.friendId, friendId)
      )
    );
  const total = rows.length;
  const meets = rows.filter(
    (r) => r.kind === "meet" || r.kind === "event" || r.kind === "trip"
  ).length;
  const placeSet = new Set<string>();
  for (const r of rows) {
    if (r.placeId) placeSet.add(r.placeId);
  }
  return { total, meets, distinctPlaces: placeSet.size };
}

function autoCompletedFromStats(
  auto: FriendMilestoneTemplate["auto"],
  yearsKnown: number | null,
  stats: { total: number; meets: number; distinctPlaces: number }
): boolean {
  if (!auto) return false;
  if (auto.kind === "time-years") {
    return yearsKnown != null && yearsKnown >= auto.years;
  }
  if (auto.kind === "interactions") return stats.total >= auto.count;
  if (auto.kind === "meets") return stats.meets >= auto.count;
  if (auto.kind === "places") return stats.distinctPlaces >= auto.count;
  return false;
}

/** Look at a friend's metAt + interaction log, then flip any auto-template
 *  milestones whose conditions are now met (and un-flip ones that no
 *  longer apply — e.g. an interaction was deleted and we dropped below
 *  the threshold). */
async function syncAutoMilestonesForFriend(
  friendId: string,
  userId: string
) {
  const f = await db.query.friend.findFirst({
    where: (row, { and: a, eq: e }) =>
      a(e(row.id, friendId), e(row.userId, userId)),
  });
  if (!f) return;
  const pack = getMilestonePack(f.milestonePack);
  const autoByKey = new Map<string, FriendMilestoneTemplate["auto"]>();
  for (const t of pack.templates) {
    if (t.auto) autoByKey.set(t.key, t.auto);
  }
  if (autoByKey.size === 0) return;

  const yearsKnown = yearsSince(f.metAt);
  const stats = await getFriendInteractionStats(friendId, userId);

  const rows = await db
    .select()
    .from(friendMilestone)
    .where(
      and(
        eq(friendMilestone.userId, userId),
        eq(friendMilestone.friendId, friendId)
      )
    );
  for (const r of rows) {
    if (!r.templateKey) continue;
    const auto = autoByKey.get(r.templateKey);
    if (!auto) continue;
    const shouldBe = autoCompletedFromStats(auto, yearsKnown, stats);
    if (shouldBe && !r.completed) {
      await db
        .update(friendMilestone)
        .set({ completed: true, completedAt: new Date() })
        .where(eq(friendMilestone.id, r.id));
    } else if (!shouldBe && r.completed) {
      // Drop back if a deleted interaction took us below threshold.
      await db
        .update(friendMilestone)
        .set({ completed: false, completedAt: null })
        .where(eq(friendMilestone.id, r.id));
    }
  }
}

/** Cheap pass that re-runs auto-milestone sync for every friend. Called
 *  when the friends list page loads so gallery stages stay current. */
export async function syncTimeBasedFriendMilestones() {
  const session = await requireSession();
  const friends = await db
    .select({ id: friend.id })
    .from(friend)
    .where(eq(friend.userId, session.user.id));
  for (const f of friends) {
    await syncAutoMilestonesForFriend(f.id, session.user.id);
  }
}

export async function toggleFriendMilestone(id: string) {
  const session = await requireSession();
  const row = await db.query.friendMilestone.findFirst({
    where: (m, { and: a, eq: e }) =>
      a(e(m.id, id), e(m.userId, session.user.id)),
  });
  if (!row) throw new Error("Milestone not found");
  const next = !row.completed;
  await db
    .update(friendMilestone)
    .set({ completed: next, completedAt: next ? new Date() : null })
    .where(eq(friendMilestone.id, id));
  revalidatePath(`/friends/${row.friendId}`);
  revalidatePath("/friends");
  await checkFriendAchievements(session.user.id);
  return { completed: next };
}

export async function addFriendMilestone(data: {
  friendId: string;
  name: string;
}) {
  const session = await requireSession();
  const name = data.name.trim();
  if (!name) throw new Error("Name is required");
  // Verify ownership of the friend.
  const f = await db.query.friend.findFirst({
    where: (row, { and: a, eq: e }) =>
      a(e(row.id, data.friendId), e(row.userId, session.user.id)),
  });
  if (!f) throw new Error("Friend not found");
  // Place after existing rows; custom milestones live below template ones.
  const max = await db
    .select({
      max: sql`max(${friendMilestone.sortOrder})`.as("max"),
    } as never)
    .from(friendMilestone)
    .where(
      and(
        eq(friendMilestone.userId, session.user.id),
        eq(friendMilestone.friendId, data.friendId)
      )
    );
  const nextOrder = (Number((max[0] as { max?: number } | undefined)?.max) || 0) + 10;
  const [row] = await db
    .insert(friendMilestone)
    .values({
      userId: session.user.id,
      friendId: data.friendId,
      name,
      sortOrder: nextOrder,
    })
    .returning();
  revalidatePath(`/friends/${data.friendId}`);
  revalidatePath("/friends");
  return row;
}

export async function updateFriendMilestone(
  id: string,
  data: { name?: string }
) {
  const session = await requireSession();
  const row = await db.query.friendMilestone.findFirst({
    where: (m, { and: a, eq: e }) =>
      a(e(m.id, id), e(m.userId, session.user.id)),
  });
  if (!row) throw new Error("Milestone not found");
  const updates: Record<string, unknown> = {};
  if (data.name !== undefined) {
    const trimmed = data.name.trim();
    if (!trimmed) throw new Error("Name is required");
    updates.name = trimmed;
  }
  if (Object.keys(updates).length === 0) return row;
  await db
    .update(friendMilestone)
    .set(updates)
    .where(eq(friendMilestone.id, id));
  revalidatePath(`/friends/${row.friendId}`);
}

export async function deleteFriendMilestone(id: string) {
  const session = await requireSession();
  const row = await db.query.friendMilestone.findFirst({
    where: (m, { and: a, eq: e }) =>
      a(e(m.id, id), e(m.userId, session.user.id)),
  });
  if (!row) return;
  await db.delete(friendMilestone).where(eq(friendMilestone.id, id));
  revalidatePath(`/friends/${row.friendId}`);
  revalidatePath("/friends");
  await checkFriendAchievements(session.user.id);
}

export async function updateFriend(
  id: string,
  data: {
    name?: string;
    nickname?: string | null;
    photoUrl?: string | null;
    birthday?: string | null;
    metAt?: string | null;
    howWeMet?: string | null;
    notes?: string | null;
    contactCadenceDays?: number | null;
  }
) {
  const session = await requireSession();
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) updates[k] = typeof v === "string" ? v.trim() || null : v;
  }
  await db
    .update(friend)
    .set(updates)
    .where(and(eq(friend.id, id), eq(friend.userId, session.user.id)));

  // When `metAt` changes, the time-based milestones (known-Xy) may
  // need to flip. Re-sync that specific friend.
  if (data.metAt !== undefined) {
    await syncAutoMilestonesForFriend(id, session.user.id);
  }

  revalidatePath("/friends");
  revalidatePath(`/friends/${id}`);
}

export async function archiveFriend(id: string) {
  const session = await requireSession();
  await db
    .update(friend)
    .set({ archived: true, updatedAt: new Date() })
    .where(and(eq(friend.id, id), eq(friend.userId, session.user.id)));
  revalidatePath("/friends");
  await checkFriendAchievements(session.user.id);
}

export async function deleteFriend(id: string) {
  const session = await requireSession();
  await db
    .delete(friend)
    .where(and(eq(friend.id, id), eq(friend.userId, session.user.id)));
  revalidatePath("/friends");
  await checkFriendAchievements(session.user.id);
}

const PHOTO_DIR = path.join(process.cwd(), "public", "friends");
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Upload a photo for a friend. The file is written under public/friends/
 * with a UUID filename and the friend's photoUrl is set to the public path.
 * Replaces any previous upload.
 */
export async function uploadFriendPhoto(friendId: string, formData: FormData) {
  const session = await requireSession();
  const f = await db.query.friend.findFirst({
    where: (row, { and: a, eq: e }) =>
      a(e(row.id, friendId), e(row.userId, session.user.id)),
  });
  if (!f) throw new Error("Friend not found");

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("No file uploaded");
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Unsupported image type — use JPG, PNG, WebP, or GIF");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image too large (max 10 MB)");
  }

  await mkdir(PHOTO_DIR, { recursive: true });

  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : file.type === "image/gif"
          ? "gif"
          : "jpg";
  const filename = `${friendId}-${Date.now()}.${ext}`;
  const dest = path.join(PHOTO_DIR, filename);
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(dest, bytes);
  const publicUrl = `/friends/${filename}`;

  // Best-effort: remove the previous photo file if it was one we wrote.
  if (f.photoUrl && f.photoUrl.startsWith("/friends/")) {
    const prev = path.join(process.cwd(), "public", f.photoUrl);
    try {
      await unlink(prev);
    } catch {
      // already gone — ignore
    }
  }

  await db
    .update(friend)
    .set({ photoUrl: publicUrl, updatedAt: new Date() })
    .where(eq(friend.id, friendId));

  revalidatePath("/friends");
  revalidatePath(`/friends/${friendId}`);
  return { photoUrl: publicUrl };
}

/** Drop the photo from a friend (and delete the file if we wrote it). */
export async function clearFriendPhoto(friendId: string) {
  const session = await requireSession();
  const f = await db.query.friend.findFirst({
    where: (row, { and: a, eq: e }) =>
      a(e(row.id, friendId), e(row.userId, session.user.id)),
  });
  if (!f) throw new Error("Friend not found");
  if (f.photoUrl && f.photoUrl.startsWith("/friends/")) {
    try {
      await unlink(path.join(process.cwd(), "public", f.photoUrl));
    } catch {
      // already gone — ignore
    }
  }
  await db
    .update(friend)
    .set({ photoUrl: null, updatedAt: new Date() })
    .where(eq(friend.id, friendId));
  revalidatePath("/friends");
  revalidatePath(`/friends/${friendId}`);
}

/** Add (or move) a friend to a new residence. The previous "current" gets
 * its endedOn set, the new one becomes current and is mirrored back to
 * `friend.currentResidenceId`. */
export async function setFriendCurrentResidence(
  friendId: string,
  placeId: string,
  startedOn?: string | null
) {
  const session = await requireSession();
  const f = await db.query.friend.findFirst({
    where: (row, { and: a, eq: e }) =>
      a(e(row.id, friendId), e(row.userId, session.user.id)),
  });
  if (!f) throw new Error("Friend not found");

  const today = new Date().toISOString().slice(0, 10);

  // End the previous current residence (if any), unless it points at the
  // same place — in which case there's nothing to change.
  const previous = await db.query.friendResidence.findFirst({
    where: (r, { and: a, eq: e }) =>
      a(
        e(r.friendId, friendId),
        e(r.userId, session.user.id),
        e(r.isCurrent, true)
      ),
  });
  if (previous) {
    if (previous.placeId === placeId) return;
    await db
      .update(friendResidence)
      .set({ isCurrent: false, endedOn: today })
      .where(eq(friendResidence.id, previous.id));
  }

  await db.insert(friendResidence).values({
    userId: session.user.id,
    friendId,
    placeId,
    startedOn: startedOn ?? today,
    isCurrent: true,
  });

  await db
    .update(friend)
    .set({ currentResidenceId: placeId, updatedAt: new Date() })
    .where(eq(friend.id, friendId));

  revalidatePath("/friends");
  revalidatePath(`/friends/${friendId}`);
  revalidatePath("/places");
}

export async function logInteraction(data: {
  friendId: string;
  occurredOn: string;
  kind: "message" | "call" | "meet" | "trip" | "event" | "letter" | "other";
  placeId?: string | null;
  notes?: string | null;
}) {
  const session = await requireSession();
  const f = await db.query.friend.findFirst({
    where: (row, { and: a, eq: e }) =>
      a(e(row.id, data.friendId), e(row.userId, session.user.id)),
  });
  if (!f) throw new Error("Friend not found");

  await db.insert(friendInteraction).values({
    userId: session.user.id,
    friendId: data.friendId,
    occurredOn: data.occurredOn,
    kind: data.kind,
    placeId: data.placeId ?? null,
    notes: data.notes?.trim() || null,
    xpAwarded: FRIEND_INTERACTION_XP,
  });

  // Update lastContactedAt so the "due to reach out" reminder updates.
  await db
    .update(friend)
    .set({
      lastContactedAt: new Date(`${data.occurredOn}T12:00:00`),
      updatedAt: new Date(),
    })
    .where(eq(friend.id, data.friendId));

  // Pour the XP into the user's general account.
  const settings = await db.query.userSettings.findFirst({
    where: (s, { eq: e }) => e(s.userId, session.user.id),
  });
  const nextGeneral = (settings?.generalXp ?? 0) + FRIEND_INTERACTION_XP;
  if (settings) {
    await db
      .update(userSettings)
      .set({ generalXp: nextGeneral, updatedAt: new Date() })
      .where(eq(userSettings.userId, session.user.id));
  } else {
    await db.insert(userSettings).values({
      userId: session.user.id,
      generalXp: nextGeneral,
    });
  }

  // Some milestones auto-complete from interaction stats (meets-5,
  // interactions-50, places-3, …). Re-sync this friend's milestones.
  await syncAutoMilestonesForFriend(data.friendId, session.user.id);

  const [accountLevelAchievements, friendAchievements] = await Promise.all([
    checkAccountLevelAchievements(session.user.id),
    checkFriendAchievements(session.user.id),
  ]);

  revalidatePath("/friends");
  revalidatePath(`/friends/${data.friendId}`);
  revalidatePath("/account");
  revalidatePath("/");
  return {
    xpAwarded: FRIEND_INTERACTION_XP,
    newAchievements: [...accountLevelAchievements, ...friendAchievements],
  };
}

/**
 * Log the same interaction against several friends at once. Used for
 * events / group meetups / trips where you'd otherwise have to check
 * each person in individually. One row per friend (so per-friend stats
 * and achievement progress count normally), XP added once per row.
 */
export async function logBulkInteraction(data: {
  friendIds: string[];
  occurredOn: string;
  kind: "message" | "call" | "meet" | "trip" | "event" | "letter" | "other";
  placeId?: string | null;
  notes?: string | null;
}): Promise<{
  count: number;
  xpAwarded: number;
  newAchievements: string[];
}> {
  const session = await requireSession();
  const ids = Array.from(new Set(data.friendIds)).filter(Boolean);
  if (ids.length === 0) {
    return { count: 0, xpAwarded: 0, newAchievements: [] };
  }

  // Verify every id actually belongs to this user — guards against
  // tampering. Drop any unknown ids silently.
  const owned = await db
    .select({ id: friend.id })
    .from(friend)
    .where(
      and(eq(friend.userId, session.user.id), inArray(friend.id, ids))
    );
  const validIds = owned.map((f) => f.id);
  if (validIds.length === 0) {
    throw new Error("No matching friends");
  }

  const noteTrimmed = data.notes?.trim() || null;

  await db.insert(friendInteraction).values(
    validIds.map((friendId) => ({
      userId: session.user.id,
      friendId,
      occurredOn: data.occurredOn,
      kind: data.kind,
      placeId: data.placeId ?? null,
      notes: noteTrimmed,
      xpAwarded: FRIEND_INTERACTION_XP,
    }))
  );

  // Bump lastContactedAt for every friend in this event.
  const stamp = new Date(`${data.occurredOn}T12:00:00`);
  await db
    .update(friend)
    .set({ lastContactedAt: stamp, updatedAt: new Date() })
    .where(
      and(
        eq(friend.userId, session.user.id),
        inArray(friend.id, validIds)
      )
    );

  // Pour XP into the user's general account — one award per friend.
  const totalXp = FRIEND_INTERACTION_XP * validIds.length;
  const settings = await db.query.userSettings.findFirst({
    where: (s, { eq: e }) => e(s.userId, session.user.id),
  });
  const nextGeneral = (settings?.generalXp ?? 0) + totalXp;
  if (settings) {
    await db
      .update(userSettings)
      .set({ generalXp: nextGeneral, updatedAt: new Date() })
      .where(eq(userSettings.userId, session.user.id));
  } else {
    await db.insert(userSettings).values({
      userId: session.user.id,
      generalXp: nextGeneral,
    });
  }

  // Sync auto-milestones for every friend touched by this bulk event.
  for (const id of validIds) {
    await syncAutoMilestonesForFriend(id, session.user.id);
  }

  const [accountLevelAchievements, friendAchievements] = await Promise.all([
    checkAccountLevelAchievements(session.user.id),
    checkFriendAchievements(session.user.id),
  ]);

  revalidatePath("/friends");
  for (const id of validIds) revalidatePath(`/friends/${id}`);
  revalidatePath("/account");
  revalidatePath("/");

  return {
    count: validIds.length,
    xpAwarded: totalXp,
    newAchievements: [...accountLevelAchievements, ...friendAchievements],
  };
}

export async function deleteInteraction(id: string) {
  const session = await requireSession();
  const row = await db.query.friendInteraction.findFirst({
    where: (i, { and: a, eq: e }) =>
      a(e(i.id, id), e(i.userId, session.user.id)),
  });
  if (!row) return;
  await db.delete(friendInteraction).where(eq(friendInteraction.id, id));

  // Roll back XP from the general bucket.
  if (row.xpAwarded > 0) {
    const settings = await db.query.userSettings.findFirst({
      where: (s, { eq: e }) => e(s.userId, session.user.id),
    });
    const next = Math.max(0, (settings?.generalXp ?? 0) - row.xpAwarded);
    if (settings) {
      await db
        .update(userSettings)
        .set({ generalXp: next, updatedAt: new Date() })
        .where(eq(userSettings.userId, session.user.id));
    }
  }

  // Recompute the friend's lastContactedAt from the remaining most-recent
  // interaction.
  const remaining = await db
    .select({ occurredOn: friendInteraction.occurredOn })
    .from(friendInteraction)
    .where(
      and(
        eq(friendInteraction.friendId, row.friendId),
        eq(friendInteraction.userId, session.user.id)
      )
    );
  const newest =
    remaining
      .map((r) => r.occurredOn)
      .sort()
      .pop() ?? null;
  await db
    .update(friend)
    .set({
      lastContactedAt: newest ? new Date(`${newest}T12:00:00`) : null,
      updatedAt: new Date(),
    })
    .where(eq(friend.id, row.friendId));

  // An interaction-based auto-milestone might now drop below threshold.
  await syncAutoMilestonesForFriend(row.friendId, session.user.id);

  await checkFriendAchievements(session.user.id);
  revalidatePath("/friends");
  revalidatePath(`/friends/${row.friendId}`);
}

// =====================
// TAGS
// =====================

export async function createTag(data: {
  name: string;
  color?: string;
  defaultCadenceDays?: number | null;
}) {
  const session = await requireSession();
  const peers = await db
    .select({ c: count() })
    .from(friendTag)
    .where(eq(friendTag.userId, session.user.id));

  const [row] = await db
    .insert(friendTag)
    .values({
      userId: session.user.id,
      name: data.name.trim(),
      color: data.color ?? "glow",
      defaultCadenceDays: data.defaultCadenceDays ?? null,
      sortOrder: Number(peers[0].c),
    })
    .returning();
  revalidatePath("/friends");
  return row;
}

export async function updateTag(
  id: string,
  data: { name?: string; color?: string; defaultCadenceDays?: number | null }
) {
  const session = await requireSession();
  const updates: Record<string, unknown> = {};
  if (data.name !== undefined) updates.name = data.name.trim();
  if (data.color !== undefined) updates.color = data.color;
  if (data.defaultCadenceDays !== undefined)
    updates.defaultCadenceDays = data.defaultCadenceDays;
  await db
    .update(friendTag)
    .set(updates)
    .where(and(eq(friendTag.id, id), eq(friendTag.userId, session.user.id)));
  revalidatePath("/friends");
}

export async function deleteTag(id: string) {
  const session = await requireSession();
  await db
    .delete(friendTag)
    .where(and(eq(friendTag.id, id), eq(friendTag.userId, session.user.id)));
  revalidatePath("/friends");
}

export async function assignTag(friendId: string, tagId: string) {
  const session = await requireSession();
  // Confirm both belong to the user.
  const [f, t] = await Promise.all([
    db.query.friend.findFirst({
      where: (row, { and: a, eq: e }) =>
        a(e(row.id, friendId), e(row.userId, session.user.id)),
    }),
    db.query.friendTag.findFirst({
      where: (row, { and: a, eq: e }) =>
        a(e(row.id, tagId), e(row.userId, session.user.id)),
    }),
  ]);
  if (!f) throw new Error("Friend not found");
  if (!t) throw new Error("Tag not found");

  // Avoid duplicate assignments.
  const existing = await db.query.friendTagAssignment.findFirst({
    where: (row, { and: a, eq: e }) =>
      a(e(row.friendId, friendId), e(row.tagId, tagId)),
  });
  if (existing) return;

  await db.insert(friendTagAssignment).values({
    userId: session.user.id,
    friendId,
    tagId,
  });

  // If the tag has a defaultCadenceDays AND the friend has none yet,
  // adopt it so creating a friend + applying a tag in one go just works.
  if (t.defaultCadenceDays && !f.contactCadenceDays) {
    await db
      .update(friend)
      .set({
        contactCadenceDays: t.defaultCadenceDays,
        updatedAt: new Date(),
      })
      .where(eq(friend.id, friendId));
  }

  revalidatePath("/friends");
  revalidatePath(`/friends/${friendId}`);
}

export async function unassignTag(friendId: string, tagId: string) {
  const session = await requireSession();
  await db
    .delete(friendTagAssignment)
    .where(
      and(
        eq(friendTagAssignment.userId, session.user.id),
        eq(friendTagAssignment.friendId, friendId),
        eq(friendTagAssignment.tagId, tagId)
      )
    );
  revalidatePath("/friends");
  revalidatePath(`/friends/${friendId}`);
}

// =====================
// CONTACT METHODS
// =====================

const CONTACT_KINDS = [
  "phone",
  "whatsapp",
  "telegram",
  "signal",
  "email",
  "instagram",
  "linkedin",
  "twitter",
  "facebook",
  "discord",
  "snapchat",
  "address",
  "other",
] as const;
type ContactKind = (typeof CONTACT_KINDS)[number];
function isContactKind(s: string): s is ContactKind {
  return (CONTACT_KINDS as readonly string[]).includes(s);
}

export async function addContact(data: {
  friendId: string;
  kind: string;
  value: string;
}) {
  const session = await requireSession();
  if (!isContactKind(data.kind)) throw new Error("Unknown contact kind");
  const trimmed = data.value.trim();
  if (!trimmed) throw new Error("Value is required");
  const f = await db.query.friend.findFirst({
    where: (row, { and: a, eq: e }) =>
      a(e(row.id, data.friendId), e(row.userId, session.user.id)),
  });
  if (!f) throw new Error("Friend not found");

  const [{ c }] = await db
    .select({ c: count() })
    .from(friendContact)
    .where(eq(friendContact.friendId, data.friendId));

  await db.insert(friendContact).values({
    userId: session.user.id,
    friendId: data.friendId,
    kind: data.kind,
    value: trimmed,
    sortOrder: Number(c),
  });
  revalidatePath(`/friends/${data.friendId}`);
}

export async function updateContact(
  id: string,
  data: { kind?: string; value?: string }
) {
  const session = await requireSession();
  const updates: Record<string, unknown> = {};
  if (data.kind !== undefined) {
    if (!isContactKind(data.kind)) throw new Error("Unknown contact kind");
    updates.kind = data.kind;
  }
  if (data.value !== undefined) {
    const v = data.value.trim();
    if (!v) throw new Error("Value is required");
    updates.value = v;
  }
  const row = await db.query.friendContact.findFirst({
    where: (r, { and: a, eq: e }) =>
      a(e(r.id, id), e(r.userId, session.user.id)),
  });
  if (!row) throw new Error("Contact not found");
  await db
    .update(friendContact)
    .set(updates)
    .where(eq(friendContact.id, id));
  revalidatePath(`/friends/${row.friendId}`);
}

export async function deleteContact(id: string) {
  const session = await requireSession();
  const row = await db.query.friendContact.findFirst({
    where: (r, { and: a, eq: e }) =>
      a(e(r.id, id), e(r.userId, session.user.id)),
  });
  if (!row) return;
  await db.delete(friendContact).where(eq(friendContact.id, id));
  revalidatePath(`/friends/${row.friendId}`);
}

// =====================
// LIFE EVENTS
// =====================

const EVENT_KINDS = [
  "milestone",
  "moved",
  "job",
  "married",
  "child",
  "loss",
  "health",
  "achievement",
  "other",
] as const;
type EventKind = (typeof EVENT_KINDS)[number];
function isEventKind(s: string): s is EventKind {
  return (EVENT_KINDS as readonly string[]).includes(s);
}

export async function addEvent(data: {
  friendId: string;
  occurredOn: string;
  kind?: string;
  title: string;
  notes?: string | null;
}) {
  const session = await requireSession();
  const kind = data.kind && isEventKind(data.kind) ? data.kind : "milestone";
  const f = await db.query.friend.findFirst({
    where: (row, { and: a, eq: e }) =>
      a(e(row.id, data.friendId), e(row.userId, session.user.id)),
  });
  if (!f) throw new Error("Friend not found");

  await db.insert(friendEvent).values({
    userId: session.user.id,
    friendId: data.friendId,
    occurredOn: data.occurredOn,
    kind,
    title: data.title.trim(),
    notes: data.notes?.trim() || null,
  });
  await checkFriendAchievements(session.user.id);
  revalidatePath(`/friends/${data.friendId}`);
}

export async function updateEvent(
  id: string,
  data: {
    occurredOn?: string;
    kind?: string;
    title?: string;
    notes?: string | null;
  }
) {
  const session = await requireSession();
  const updates: Record<string, unknown> = {};
  if (data.occurredOn !== undefined) updates.occurredOn = data.occurredOn;
  if (data.kind !== undefined) {
    if (!isEventKind(data.kind)) throw new Error("Unknown event kind");
    updates.kind = data.kind;
  }
  if (data.title !== undefined) updates.title = data.title.trim();
  if (data.notes !== undefined)
    updates.notes = data.notes?.trim() || null;
  const row = await db.query.friendEvent.findFirst({
    where: (r, { and: a, eq: e }) =>
      a(e(r.id, id), e(r.userId, session.user.id)),
  });
  if (!row) throw new Error("Event not found");
  await db
    .update(friendEvent)
    .set(updates)
    .where(eq(friendEvent.id, id));
  revalidatePath(`/friends/${row.friendId}`);
}

export async function deleteEvent(id: string) {
  const session = await requireSession();
  const row = await db.query.friendEvent.findFirst({
    where: (r, { and: a, eq: e }) =>
      a(e(r.id, id), e(r.userId, session.user.id)),
  });
  if (!row) return;
  await db.delete(friendEvent).where(eq(friendEvent.id, id));
  revalidatePath(`/friends/${row.friendId}`);
}
