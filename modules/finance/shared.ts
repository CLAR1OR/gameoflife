// Client-safe helpers and constants that both server queries and client
// components need. This file must NOT import anything from `@/lib/db` or
// other Node-only modules, otherwise importing it from a client component
// pulls Node built-ins into the browser bundle.

/** Accounts need a check-in if their last check-in was this long ago or more. */
export const CHECKIN_STALE_DAYS = 7;
const CHECKIN_STALE_MS = CHECKIN_STALE_DAYS * 24 * 60 * 60 * 1000;

export function isAccountStale(
  account: { lastCheckedAt: Date | null },
  now: number = Date.now()
): boolean {
  if (!account.lastCheckedAt) return true;
  return now - account.lastCheckedAt.getTime() >= CHECKIN_STALE_MS;
}
