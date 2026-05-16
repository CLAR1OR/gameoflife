/** Format a Date as YYYY-MM-DD in local time. */
export function formatLocalDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Today's local date as YYYY-MM-DD. */
export function todayISO(): string {
  return formatLocalDate(new Date());
}

/** Return an array of the last `days` dates as YYYY-MM-DD, oldest first, ending today. */
export function lastNDates(days: number): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    out.push(formatLocalDate(d));
  }
  return out;
}

/**
 * Count consecutive days of completion ending today (or yesterday if today is missed).
 * `completedDates` must be sorted ascending.
 */
export function calcStreak(completedDates: string[]): number {
  if (completedDates.length === 0) return 0;
  const set = new Set(completedDates);
  const today = new Date();

  // Start from today — if missed, start from yesterday (so you don't break streak before daily window)
  const startOffset = set.has(formatLocalDate(today)) ? 0 : 1;
  let streak = 0;
  for (let i = startOffset; i < 3650; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (set.has(formatLocalDate(d))) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

/** Local ISO date (YYYY-MM-DD) of the Monday that starts the week
 * containing `d`. ISO weeks (Mon → Sun) — keeps consistency regardless of
 * locale defaults. */
export function startOfIsoWeek(d: Date): string {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  // Sunday=0 in JS; we want Monday=0 so shift by 1.
  const dow = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - dow);
  return formatLocalDate(x);
}

/**
 * Streak of consecutive weeks (ending this week, or last week if this week
 * hasn't met its target yet) in which the habit hit `targetPerWeek` or more
 * completions. Used for flexible-cadence habits (e.g. "3x/week").
 */
export function calcWeeklyStreak(
  completedDates: string[],
  targetPerWeek: number
): number {
  if (completedDates.length === 0 || targetPerWeek <= 0) return 0;
  const byWeek = new Map<string, number>();
  for (const date of completedDates) {
    const d = new Date(date + "T00:00:00");
    const key = startOfIsoWeek(d);
    byWeek.set(key, (byWeek.get(key) ?? 0) + 1);
  }
  const today = new Date();
  const thisWeek = startOfIsoWeek(today);
  // Walk weeks backward. Start from this week — if it hasn't met the
  // target yet, start from last week instead (so the streak isn't broken
  // until the week actually ends).
  let cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if ((byWeek.get(thisWeek) ?? 0) < targetPerWeek) {
    cursor.setDate(cursor.getDate() - 7);
  }
  let streak = 0;
  for (let i = 0; i < 520; i++) {
    const key = startOfIsoWeek(cursor);
    if ((byWeek.get(key) ?? 0) >= targetPerWeek) {
      streak++;
      cursor.setDate(cursor.getDate() - 7);
    } else break;
  }
  return streak;
}

/**
 * Consecutive days ending today (or yesterday) where at least one of the
 * provided habit completion-date-lists has that date.
 */
export function calcDailyStreak(allCompletedDateLists: string[][]): number {
  const union = new Set<string>();
  for (const list of allCompletedDateLists) {
    for (const d of list) union.add(d);
  }
  if (union.size === 0) return 0;

  const today = new Date();
  const startOffset = union.has(formatLocalDate(today)) ? 0 : 1;
  let streak = 0;
  for (let i = startOffset; i < 3650; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (union.has(formatLocalDate(d))) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}
