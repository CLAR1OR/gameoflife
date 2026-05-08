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
  userSettings,
} from "@/lib/db/schema";
import { and, count, eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { checkAccountLevelAchievements } from "@/lib/account-achievements";
import { FRIEND_INTERACTION_XP } from "./constants";
import { writeFile, mkdir, unlink } from "node:fs/promises";
import path from "node:path";

export async function createFriend(data: {
  name: string;
  nickname?: string | null;
  photoUrl?: string | null;
  currentResidenceId?: string | null;
  birthday?: string | null;
  phone?: string | null;
  email?: string | null;
  metAt?: string | null;
  howWeMet?: string | null;
  notes?: string | null;
  contactCadenceDays?: number | null;
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
      phone: data.phone?.trim() || null,
      email: data.email?.trim() || null,
      metAt: data.metAt?.trim() || null,
      howWeMet: data.howWeMet?.trim() || null,
      notes: data.notes?.trim() || null,
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

  revalidatePath("/friends");
  revalidatePath("/places");
  return row;
}

export async function updateFriend(
  id: string,
  data: {
    name?: string;
    nickname?: string | null;
    photoUrl?: string | null;
    birthday?: string | null;
    phone?: string | null;
    email?: string | null;
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
}

export async function deleteFriend(id: string) {
  const session = await requireSession();
  await db
    .delete(friend)
    .where(and(eq(friend.id, id), eq(friend.userId, session.user.id)));
  revalidatePath("/friends");
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

  const newAchievements = await checkAccountLevelAchievements(session.user.id);

  revalidatePath("/friends");
  revalidatePath(`/friends/${data.friendId}`);
  revalidatePath("/account");
  revalidatePath("/");
  return {
    xpAwarded: FRIEND_INTERACTION_XP,
    newAchievements,
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
