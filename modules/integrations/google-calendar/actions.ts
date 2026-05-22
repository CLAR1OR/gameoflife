"use server";

import { db } from "@/lib/db";
import { integrationCredential } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth-server";
import { getIntegrationCredential } from "../queries";
import type { GoogleCalendar, GoogleEvent } from "../types";
import {
  deleteEvent,
  GoogleCalendarError,
  listCalendars,
  listWeekEvents,
  quickAddEvent,
} from "./client";
import {
  exchangeCode,
  refreshAccessToken,
  revokeToken,
  type TokenBundle,
} from "./oauth";

const PROVIDER = "google_calendar" as const;
/** Refresh access tokens this many ms before they actually expire so a
 *  long-running request never hits a stale token mid-flight. */
const REFRESH_SKEW_MS = 60_000;

function unwrap(e: unknown): string {
  if (e instanceof GoogleCalendarError) {
    if (e.status === 401 || e.status === 403)
      return "Google rejected the token. Reconnect from Account → Integrations.";
    return `Google Calendar error: ${e.message}`;
  }
  return e instanceof Error ? e.message : "Failed";
}

/** Save the fresh token bundle for a user, creating or updating the
 *  credential row. Also exported for the OAuth callback route. */
export async function storeGoogleTokens(
  userId: string,
  bundle: TokenBundle
): Promise<void> {
  const existing = await getIntegrationCredential(userId, PROVIDER);
  if (existing) {
    await db
      .update(integrationCredential)
      .set({
        accessToken: bundle.accessToken,
        // Google usually only returns a refresh token on the first
        // consent — preserve the existing one if a refresh is null.
        refreshToken: bundle.refreshToken ?? existing.refreshToken,
        expiresAt: bundle.expiresAt,
        scope: bundle.scope,
        updatedAt: new Date(),
      })
      .where(eq(integrationCredential.id, existing.id));
  } else {
    await db.insert(integrationCredential).values({
      userId,
      provider: PROVIDER,
      accessToken: bundle.accessToken,
      refreshToken: bundle.refreshToken,
      expiresAt: bundle.expiresAt,
      scope: bundle.scope,
    });
  }
}

/** Look up the user's Google credential and return a valid access
 *  token, transparently refreshing if it's about to expire. Returns
 *  null when the user has no credential. */
async function getValidAccessToken(userId: string): Promise<string | null> {
  const cred = await getIntegrationCredential(userId, PROVIDER);
  if (!cred) return null;
  const needsRefresh =
    !cred.expiresAt ||
    cred.expiresAt.getTime() - Date.now() < REFRESH_SKEW_MS;
  if (!needsRefresh) return cred.accessToken;
  if (!cred.refreshToken) {
    // No refresh token = we can't recover; force a reconnect by
    // returning null and letting the caller surface "not connected".
    return null;
  }
  try {
    const refreshed = await refreshAccessToken(cred.refreshToken);
    await db
      .update(integrationCredential)
      .set({
        accessToken: refreshed.accessToken,
        expiresAt: refreshed.expiresAt,
        scope: refreshed.scope,
        updatedAt: new Date(),
      })
      .where(eq(integrationCredential.id, cred.id));
    return refreshed.accessToken;
  } catch {
    return null;
  }
}

export async function exchangeAndStoreCode(
  userId: string,
  code: string
): Promise<void> {
  const bundle = await exchangeCode(code);
  await storeGoogleTokens(userId, bundle);
}

export async function disconnectGoogleCalendar(): Promise<void> {
  const session = await requireSession();
  const cred = await getIntegrationCredential(session.user.id, PROVIDER);
  if (cred?.refreshToken) await revokeToken(cred.refreshToken);
  await db
    .delete(integrationCredential)
    .where(
      and(
        eq(integrationCredential.userId, session.user.id),
        eq(integrationCredential.provider, PROVIDER)
      )
    );
  revalidatePath("/account");
}

export type CalendarWeekData = {
  connected: boolean;
  events: GoogleEvent[];
  calendars: GoogleCalendar[];
  /** ISO date (YYYY-MM-DD) of Monday at the start of the loaded week. */
  weekStart: string;
  error: string | null;
};

/** Load a week of events. The client computes both bounds in its own
 *  timezone and sends them as ISO instants, so the panel's day columns
 *  always line up with the user's wall clock. */
export async function loadCalendarWeek(opts: {
  weekStart: string;     // YYYY-MM-DD label (Monday) — used as cache key
  startIso: string;      // ISO instant for that Monday 00:00 local
  endIso: string;        // ISO instant for the following Monday 00:00 local
}): Promise<CalendarWeekData> {
  const session = await requireSession();
  const token = await getValidAccessToken(session.user.id);
  if (!token) {
    return {
      connected: false,
      events: [],
      calendars: [],
      weekStart: opts.weekStart,
      error: null,
    };
  }
  try {
    const calendars = await listCalendars(token);
    const events = await listWeekEvents(
      token,
      calendars,
      opts.startIso,
      opts.endIso
    );
    return {
      connected: true,
      events,
      calendars,
      weekStart: opts.weekStart,
      error: null,
    };
  } catch (e) {
    return {
      connected: true,
      events: [],
      calendars: [],
      weekStart: opts.weekStart,
      error: unwrap(e),
    };
  }
}

/** Total events scheduled today across all calendars — for the
 *  top-nav badge. Returns 0 on any failure. */
export async function getCalendarTodayCount(): Promise<number> {
  try {
    const session = await requireSession();
    const token = await getValidAccessToken(session.user.id);
    if (!token) return 0;
    const calendars = await listCalendars(token);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    const events = await listWeekEvents(
      token,
      calendars,
      start.toISOString(),
      end.toISOString()
    );
    return events.length;
  } catch {
    return 0;
  }
}

export async function quickAddCalendarEvent(text: string): Promise<GoogleEvent> {
  const session = await requireSession();
  const token = await getValidAccessToken(session.user.id);
  if (!token) throw new Error("Google Calendar not connected");
  const t = text.trim();
  if (!t) throw new Error("Event is empty");
  try {
    const ev = await quickAddEvent(token, t);
    if (!ev) throw new Error("Google returned no event");
    return ev;
  } catch (e) {
    throw new Error(unwrap(e));
  }
}

export async function deleteCalendarEvent(
  calendarId: string,
  eventId: string
): Promise<void> {
  const session = await requireSession();
  const token = await getValidAccessToken(session.user.id);
  if (!token) throw new Error("Google Calendar not connected");
  try {
    await deleteEvent(token, calendarId, eventId);
  } catch (e) {
    throw new Error(unwrap(e));
  }
}

