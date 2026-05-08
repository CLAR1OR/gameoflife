import { db } from "@/lib/db";
import {
  friend,
  friendInteraction,
  friendResidence,
  friendTag,
  friendTagAssignment,
  friendContact,
  friendEvent,
  place,
} from "@/lib/db/schema";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { InferSelectModel } from "drizzle-orm";

export type Friend = InferSelectModel<typeof friend>;
export type FriendInteraction = InferSelectModel<typeof friendInteraction>;
export type FriendResidence = InferSelectModel<typeof friendResidence>;
export type FriendTag = InferSelectModel<typeof friendTag>;
export type FriendContact = InferSelectModel<typeof friendContact>;
export type FriendEvent = InferSelectModel<typeof friendEvent>;

export type FriendCardData = Friend & {
  currentPlace: {
    id: string;
    name: string;
    countryName: string | null;
    countryCode: string | null;
    lat: number | null;
    lng: number | null;
  } | null;
  /** Days since last contact, or null if never contacted. */
  daysSinceContact: number | null;
  /** Negative = overdue (days past cadence), positive = days remaining. */
  daysUntilDue: number | null;
  interactionCount: number;
  tags: FriendTag[];
  /** Most recent interaction's notes (truncated by the UI), or null. */
  lastInteractionNote: string | null;
  /** Most recent interaction kind (message/call/meet/...), or null. */
  lastInteractionKind: FriendInteraction["kind"] | null;
};

export async function getFriendsByUser(
  userId: string,
  opts: { includeArchived?: boolean } = {}
): Promise<FriendCardData[]> {
  const where = opts.includeArchived
    ? eq(friend.userId, userId)
    : and(eq(friend.userId, userId), eq(friend.archived, false));
  const friends = await db
    .select()
    .from(friend)
    .where(where)
    .orderBy(asc(friend.name));

  if (friends.length === 0) return [];

  // Pull place rows for current residences in one query.
  const residenceIds = friends
    .map((f) => f.currentResidenceId)
    .filter((id): id is string => !!id);
  const places = residenceIds.length
    ? await db
        .select()
        .from(place)
        .where(eq(place.userId, userId))
    : [];
  const placeMap = new Map(places.map((p) => [p.id, p]));

  // Interaction counts per friend.
  const counts = await db
    .select({
      friendId: friendInteraction.friendId,
      c: sql<number>`count(${friendInteraction.id})`,
    })
    .from(friendInteraction)
    .where(eq(friendInteraction.userId, userId))
    .groupBy(friendInteraction.friendId);
  const countMap = new Map(counts.map((c) => [c.friendId, Number(c.c)]));

  // Most-recent interaction (notes + kind) per friend in one query.
  const friendIds = friends.map((f) => f.id);
  const allInts =
    friendIds.length > 0
      ? await db
          .select({
            friendId: friendInteraction.friendId,
            occurredOn: friendInteraction.occurredOn,
            createdAt: friendInteraction.createdAt,
            notes: friendInteraction.notes,
            kind: friendInteraction.kind,
          })
          .from(friendInteraction)
          .where(
            and(
              eq(friendInteraction.userId, userId),
              inArray(friendInteraction.friendId, friendIds)
            )
          )
      : [];
  const latestByFriend = new Map<
    string,
    { notes: string | null; kind: FriendInteraction["kind"] }
  >();
  for (const i of allInts) {
    const existing = latestByFriend.get(i.friendId);
    const cur = `${i.occurredOn}|${
      typeof i.createdAt === "number"
        ? i.createdAt
        : (i.createdAt as Date).getTime()
    }`;
    const existingKey = existing
      ? `${(existing as unknown as { _key: string })._key ?? ""}`
      : "";
    if (!existing || cur > existingKey) {
      // Stash a synthetic _key for the comparison on next iteration.
      const v = {
        notes: i.notes,
        kind: i.kind,
        _key: cur,
      } as unknown as {
        notes: string | null;
        kind: FriendInteraction["kind"];
      };
      latestByFriend.set(i.friendId, v);
    }
  }

  // Tags per friend in two queries.
  const assignments =
    friendIds.length > 0
      ? await db
          .select()
          .from(friendTagAssignment)
          .where(
            and(
              eq(friendTagAssignment.userId, userId),
              inArray(friendTagAssignment.friendId, friendIds)
            )
          )
      : [];
  const allTags = await db
    .select()
    .from(friendTag)
    .where(eq(friendTag.userId, userId))
    .orderBy(asc(friendTag.sortOrder), asc(friendTag.name));
  const tagById = new Map(allTags.map((t) => [t.id, t]));
  const tagsByFriend = new Map<string, FriendTag[]>();
  for (const a of assignments) {
    const t = tagById.get(a.tagId);
    if (!t) continue;
    const list = tagsByFriend.get(a.friendId) ?? [];
    list.push(t);
    tagsByFriend.set(a.friendId, list);
  }

  const now = Date.now();
  const dayMs = 1000 * 60 * 60 * 24;

  return friends.map((f) => {
    const p = f.currentResidenceId ? placeMap.get(f.currentResidenceId) : null;
    const lastMs = f.lastContactedAt
      ? typeof f.lastContactedAt === "number"
        ? f.lastContactedAt * 1000
        : (f.lastContactedAt as Date).getTime()
      : null;
    const daysSinceContact =
      lastMs == null ? null : Math.floor((now - lastMs) / dayMs);
    const daysUntilDue =
      f.contactCadenceDays && daysSinceContact !== null
        ? f.contactCadenceDays - daysSinceContact
        : f.contactCadenceDays && daysSinceContact === null
          ? -f.contactCadenceDays // never contacted → very overdue
          : null;
    const latest = latestByFriend.get(f.id);
    return {
      ...f,
      currentPlace: p
        ? {
            id: p.id,
            name: p.name,
            countryName: p.countryName,
            countryCode: p.countryCode,
            lat: p.lat,
            lng: p.lng,
          }
        : null,
      daysSinceContact,
      daysUntilDue,
      interactionCount: countMap.get(f.id) ?? 0,
      tags: tagsByFriend.get(f.id) ?? [],
      lastInteractionNote: latest?.notes ?? null,
      lastInteractionKind: latest?.kind ?? null,
    };
  });
}

// =====================
// TAGS / CONTACTS / EVENTS
// =====================

export async function getFriendTags(userId: string): Promise<FriendTag[]> {
  return db
    .select()
    .from(friendTag)
    .where(eq(friendTag.userId, userId))
    .orderBy(asc(friendTag.sortOrder), asc(friendTag.name));
}

export async function getTagsForFriend(
  friendId: string,
  userId: string
): Promise<FriendTag[]> {
  const rows = await db
    .select({ tag: friendTag })
    .from(friendTagAssignment)
    .innerJoin(friendTag, eq(friendTagAssignment.tagId, friendTag.id))
    .where(
      and(
        eq(friendTagAssignment.userId, userId),
        eq(friendTagAssignment.friendId, friendId)
      )
    )
    .orderBy(asc(friendTag.sortOrder), asc(friendTag.name));
  return rows.map((r) => r.tag);
}

export async function getContactsForFriend(
  friendId: string,
  userId: string
): Promise<FriendContact[]> {
  return db
    .select()
    .from(friendContact)
    .where(
      and(
        eq(friendContact.userId, userId),
        eq(friendContact.friendId, friendId)
      )
    )
    .orderBy(asc(friendContact.sortOrder), asc(friendContact.createdAt));
}

export async function getEventsForFriend(
  friendId: string,
  userId: string
): Promise<FriendEvent[]> {
  return db
    .select()
    .from(friendEvent)
    .where(
      and(eq(friendEvent.userId, userId), eq(friendEvent.friendId, friendId))
    )
    .orderBy(desc(friendEvent.occurredOn), desc(friendEvent.createdAt));
}

export async function getFriendById(
  id: string,
  userId: string
): Promise<Friend | null> {
  const row = await db.query.friend.findFirst({
    where: (f, { and: a, eq: e }) => a(e(f.id, id), e(f.userId, userId)),
  });
  return row ?? null;
}

export async function getResidencesForFriend(
  friendId: string,
  userId: string
): Promise<(FriendResidence & { place: { name: string; countryName: string | null } })[]> {
  const rows = await db
    .select({ r: friendResidence, p: place })
    .from(friendResidence)
    .innerJoin(place, eq(friendResidence.placeId, place.id))
    .where(
      and(
        eq(friendResidence.friendId, friendId),
        eq(friendResidence.userId, userId)
      )
    )
    .orderBy(desc(friendResidence.isCurrent), desc(friendResidence.startedOn));
  return rows.map((row) => ({
    ...row.r,
    place: { name: row.p.name, countryName: row.p.countryName },
  }));
}

export async function getInteractionsForFriend(
  friendId: string,
  userId: string,
  limit = 50
): Promise<FriendInteraction[]> {
  return db
    .select()
    .from(friendInteraction)
    .where(
      and(
        eq(friendInteraction.friendId, friendId),
        eq(friendInteraction.userId, userId)
      )
    )
    .orderBy(desc(friendInteraction.occurredOn), desc(friendInteraction.createdAt))
    .limit(limit);
}

export type FriendsStats = {
  total: number;
  countries: number;
  overdueCount: number;
  thisYearInteractions: number;
};

export async function getFriendsStats(userId: string): Promise<FriendsStats> {
  const friends = await getFriendsByUser(userId);
  const overdueCount = friends.filter(
    (f) => f.daysUntilDue !== null && f.daysUntilDue < 0
  ).length;
  const countries = new Set<string>();
  for (const f of friends) {
    if (f.currentPlace?.countryCode) countries.add(f.currentPlace.countryCode);
  }
  const thisYear = String(new Date().getFullYear());
  const ints = await db
    .select({ occurredOn: friendInteraction.occurredOn })
    .from(friendInteraction)
    .where(eq(friendInteraction.userId, userId));
  return {
    total: friends.length,
    countries: countries.size,
    overdueCount,
    thisYearInteractions: ints.filter((i) => i.occurredOn.startsWith(thisYear))
      .length,
  };
}

/** Friends overdue or due-today on their contact cadence. */
export async function getFriendsDueToReach(
  userId: string
): Promise<FriendCardData[]> {
  const all = await getFriendsByUser(userId);
  return all
    .filter((f) => f.daysUntilDue !== null && f.daysUntilDue <= 0)
    .sort((a, b) => (a.daysUntilDue ?? 0) - (b.daysUntilDue ?? 0));
}

/** A unified "people to think about" feed combining overdue contacts and
 * upcoming birthdays, prioritised by urgency. Used by the dashboard. */
export type PersonAttentionItem =
  | {
      kind: "overdue";
      friendId: string;
      name: string;
      nickname: string | null;
      photoUrl: string | null;
      currentPlace: FriendCardData["currentPlace"];
      daysOverdue: number;
      sortKey: number;
    }
  | {
      kind: "birthday";
      friendId: string;
      name: string;
      nickname: string | null;
      photoUrl: string | null;
      label: string;
      daysUntil: number;
      turningAge: number | null;
      sortKey: number;
    };

export async function getPeopleToThinkAbout(
  userId: string
): Promise<PersonAttentionItem[]> {
  const [due, birthdays] = await Promise.all([
    getFriendsDueToReach(userId),
    getUpcomingBirthdays(userId, 30),
  ]);

  const items: PersonAttentionItem[] = [];

  // Birthdays first if they're imminent (≤2 days), otherwise overdues
  // first. We rank with a numeric sortKey: lower = more urgent.
  for (const f of due) {
    const days = f.daysUntilDue ?? 0;
    items.push({
      kind: "overdue",
      friendId: f.id,
      name: f.name,
      nickname: f.nickname,
      photoUrl: f.photoUrl,
      currentPlace: f.currentPlace,
      daysOverdue: -days, // positive integer, 0 = today
      // Overdue starts at 0, gets more urgent the longer it's been.
      // Map "today" to 1; "1 day overdue" to 0.5; "10 days overdue" to 0.05.
      sortKey: 10 / (10 + Math.max(0, -days)),
    });
  }

  for (const b of birthdays) {
    items.push({
      kind: "birthday",
      friendId: b.friendId,
      name: b.name,
      nickname: b.nickname,
      photoUrl: b.photoUrl,
      label: b.label,
      daysUntil: b.daysUntil,
      turningAge: b.turningAge,
      // Birthdays today are extremely urgent. Sort so today=0 is at top.
      sortKey: b.daysUntil === 0 ? -10 : b.daysUntil,
    });
  }

  items.sort((a, b) => a.sortKey - b.sortKey);
  return items;
}

export type UpcomingBirthday = {
  friendId: string;
  name: string;
  nickname: string | null;
  photoUrl: string | null;
  /** Friendly month/day label, e.g. "May 12". */
  label: string;
  /** Days until the next occurrence (0 = today). */
  daysUntil: number;
  /** Will they be N years old? null if year unknown. */
  turningAge: number | null;
};

/** Friends with a birthday in the next `withinDays` days (or today). */
export async function getUpcomingBirthdays(
  userId: string,
  withinDays = 30
): Promise<UpcomingBirthday[]> {
  const rows = await db
    .select({
      id: friend.id,
      name: friend.name,
      nickname: friend.nickname,
      photoUrl: friend.photoUrl,
      birthday: friend.birthday,
    })
    .from(friend)
    .where(and(eq(friend.userId, userId), eq(friend.archived, false)));

  const out: UpcomingBirthday[] = [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (const r of rows) {
    if (!r.birthday) continue;
    const noYear = r.birthday.startsWith("--");
    const parts = r.birthday.replace(/^--/, "").split("-");
    const yOrig = noYear ? null : Number(parts[0]);
    const m = Number(parts[noYear ? 0 : 1]);
    const d = Number(parts[noYear ? 1 : 2]);
    if (!m || !d) continue;

    // Find the next occurrence: this year if not yet passed, else next year.
    let occYear = today.getFullYear();
    let occ = new Date(occYear, m - 1, d);
    if (occ.getTime() < today.getTime()) {
      occYear += 1;
      occ = new Date(occYear, m - 1, d);
    }
    const days = Math.round(
      (occ.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days < 0 || days > withinDays) continue;

    const turningAge = yOrig ? occYear - yOrig : null;
    const label = occ.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });

    out.push({
      friendId: r.id,
      name: r.name,
      nickname: r.nickname,
      photoUrl: r.photoUrl,
      label,
      daysUntil: days,
      turningAge,
    });
  }

  out.sort((a, b) => a.daysUntil - b.daysUntil);
  return out;
}
