import { db } from "@/lib/db";
import {
  place,
  placeVisit,
  friend,
  friendInteraction,
  friendEvent,
  financeAccount,
  financeTransaction,
  financeRecurring,
  book,
  quest,
  habit,
  habitCompletion,
} from "@/lib/db/schema";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { getNetWorth } from "@/modules/finance/queries";
import { computeTotalAccountXp } from "./account-achievements";
import { levelFromXp } from "./level";
import { todayISO } from "./date";

/** Map from triggerType → user's current value. Used to render progress
 * bars on locked achievements. Per-habit / per-quest progress (keyed by
 * triggerHabitId / triggerQuestId) is layered on top. */
export type ProgressMap = Record<string, number>;

/** Computes the user's current stat for every count-based, globally-scoped
 * achievement trigger. Per-instance triggers (`habit_streak`,
 * `habit_total`, `quest_completed`) live in `PerInstanceProgress` below. */
export async function getAchievementProgress(
  userId: string
): Promise<ProgressMap> {
  const [
    places,
    visits,
    friends,
    interactions,
    events,
    fAccounts,
    fTx,
    fRec,
    settings,
    readBooks,
    completedQuests,
    netWorth,
    totalXp,
  ] = await Promise.all([
    db.select().from(place).where(eq(place.userId, userId)),
    db.select().from(placeVisit).where(eq(placeVisit.userId, userId)),
    db.select().from(friend).where(eq(friend.userId, userId)),
    db
      .select({ id: friendInteraction.id })
      .from(friendInteraction)
      .where(eq(friendInteraction.userId, userId)),
    db
      .select({ id: friendEvent.id })
      .from(friendEvent)
      .where(eq(friendEvent.userId, userId)),
    db
      .select({ id: financeAccount.id })
      .from(financeAccount)
      .where(
        and(
          eq(financeAccount.userId, userId),
          isNull(financeAccount.archivedAt)
        )
      ),
    db
      .select({ id: financeTransaction.id })
      .from(financeTransaction)
      .where(eq(financeTransaction.userId, userId)),
    db
      .select({ id: financeRecurring.id })
      .from(financeRecurring)
      .where(
        and(
          eq(financeRecurring.userId, userId),
          eq(financeRecurring.active, true)
        )
      ),
    db.query.userSettings.findFirst({
      where: (s, { eq: e }) => e(s.userId, userId),
    }),
    db
      .select()
      .from(book)
      .where(and(eq(book.userId, userId), eq(book.status, "read"))),
    db
      .select({ type: quest.type })
      .from(quest)
      .where(and(eq(quest.userId, userId), eq(quest.status, "completed"))),
    getNetWorth(userId),
    computeTotalAccountXp(userId),
  ]);

  // Places + countries
  const countrySet = new Set<string>();
  for (const p of places) if (p.countryCode) countrySet.add(p.countryCode);

  // Hikes
  const hikes = visits.filter((v) => v.isHike);
  let hikeKm = 0;
  let hikeElev = 0;
  let maxKm = 0;
  let maxElev = 0;
  for (const v of hikes) {
    if (v.distanceKm != null) {
      hikeKm += v.distanceKm;
      if (v.distanceKm > maxKm) maxKm = v.distanceKm;
    }
    if (v.elevationM != null) {
      hikeElev += v.elevationM;
      if (v.elevationM > maxElev) maxElev = v.elevationM;
    }
  }

  // Friend countries via current residences
  const activeFriends = friends.filter((f) => !f.archived);
  const residenceIds = activeFriends
    .map((f) => f.currentResidenceId)
    .filter((id): id is string => !!id);
  const friendPlaces =
    residenceIds.length > 0
      ? await db
          .select({ id: place.id, countryCode: place.countryCode })
          .from(place)
          .where(inArray(place.id, residenceIds))
      : [];
  const friendPlaceMap = new Map(friendPlaces.map((p) => [p.id, p]));
  const friendCountrySet = new Set<string>();
  for (const f of activeFriends) {
    const p = f.currentResidenceId
      ? friendPlaceMap.get(f.currentResidenceId)
      : null;
    if (p?.countryCode) friendCountrySet.add(p.countryCode);
  }

  // Books page totals
  const maxPages = readBooks.reduce((m, b) => Math.max(m, b.pages ?? 0), 0);
  const totalPages = readBooks.reduce((s, b) => s + (b.pages ?? 0), 0);

  // Quest counts
  const mainQuestCount = completedQuests.filter((q) => q.type === "main").length;
  const sideQuestCount = completedQuests.filter((q) => q.type === "side").length;

  return {
    places_count: places.length,
    countries_visited: countrySet.size,
    hikes_count: hikes.length,
    hike_total_km: hikeKm,
    hike_total_elevation: hikeElev,
    hike_single_max_km: maxKm,
    hike_single_max_elevation: maxElev,
    friends_count: activeFriends.length,
    friend_interactions_count: interactions.length,
    friend_countries: friendCountrySet.size,
    friend_events_count: events.length,
    finance_accounts: fAccounts.length,
    finance_transactions: fTx.length,
    finance_recurrings: fRec.length,
    finance_net_worth: netWorth,
    finance_checkins: settings?.generalXp ?? 0,
    books_read_count: readBooks.length,
    book_max_pages: maxPages,
    book_total_pages: totalPages,
    account_level: levelFromXp(totalXp),
    main_quest_count: mainQuestCount,
    side_quest_count: sideQuestCount,
  };
}

/** Per-habit progress used for `habit_streak` / `habit_total` achievements,
 * keyed by habit id. */
export type PerHabitProgress = Record<
  string,
  { streak: number; total: number }
>;

export async function getPerHabitProgress(
  userId: string
): Promise<PerHabitProgress> {
  const habits = await db
    .select({ id: habit.id })
    .from(habit)
    .where(eq(habit.userId, userId));
  if (habits.length === 0) return {};

  const completions = await db
    .select({ habitId: habitCompletion.habitId, date: habitCompletion.date })
    .from(habitCompletion)
    .where(eq(habitCompletion.userId, userId));

  const byHabit = new Map<string, string[]>();
  for (const c of completions) {
    const list = byHabit.get(c.habitId) ?? [];
    list.push(c.date);
    byHabit.set(c.habitId, list);
  }

  const out: PerHabitProgress = {};
  const today = todayISO();
  for (const h of habits) {
    const dates = byHabit.get(h.id) ?? [];
    const set = new Set(dates);
    const startOffset = set.has(today) ? 0 : 1;
    const now = new Date();
    let streak = 0;
    for (let i = startOffset; i < 3650; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (set.has(key)) streak++;
      else break;
    }
    out[h.id] = { streak, total: dates.length };
  }
  return out;
}

/** Resolve the right numeric progress for a single achievement, or null if
 * the trigger doesn't lend itself to a progress bar (manual / one-off /
 * not-yet-supported). */
export function progressForAchievement(
  triggerType: string,
  triggerHabitId: string | null | undefined,
  global: ProgressMap,
  perHabit: PerHabitProgress
): number | null {
  if (triggerType === "habit_streak" && triggerHabitId) {
    return perHabit[triggerHabitId]?.streak ?? 0;
  }
  if (triggerType === "habit_total" && triggerHabitId) {
    return perHabit[triggerHabitId]?.total ?? 0;
  }
  // Non-count or per-instance non-habit ones we don't track yet
  if (
    triggerType === "manual" ||
    triggerType === "subskill_mastered" ||
    triggerType === "stage_reached" ||
    triggerType === "all_mastered" ||
    triggerType === "quest_completed" ||
    triggerType === "reading_list_completed" ||
    triggerType === "book_burst" ||
    triggerType === "book_rating_streak" ||
    triggerType === "book_monthly_streak"
  ) {
    return null;
  }
  return global[triggerType] ?? null;
}
