import type { GoogleCalendar, GoogleEvent } from "../types";

const BASE = "https://www.googleapis.com/calendar/v3";

class GoogleCalendarError extends Error {
  status: number;
  body: string;
  constructor(message: string, status: number, body: string) {
    super(message);
    this.name = "GoogleCalendarError";
    this.status = status;
    this.body = body;
  }
}

async function call<T>(
  token: string,
  path: string,
  init?: RequestInit
): Promise<T | null> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (res.status === 204) return null;
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new GoogleCalendarError(
      `Google Calendar API ${res.status}: ${res.statusText}`,
      res.status,
      body
    );
  }
  return (await res.json()) as T;
}

type RawCalendarList = {
  items?: Array<{
    id: string;
    summary: string;
    summaryOverride?: string;
    backgroundColor?: string;
    foregroundColor?: string;
    primary?: boolean;
    accessRole: string;
    selected?: boolean;
    hidden?: boolean;
    deleted?: boolean;
  }>;
};

type RawEventTime = {
  date?: string;
  dateTime?: string;
  timeZone?: string;
};

type RawEvent = {
  id: string;
  status?: string;
  summary?: string;
  description?: string;
  location?: string;
  htmlLink: string;
  start: RawEventTime;
  end: RawEventTime;
};

type RawEventList = {
  items?: RawEvent[];
  nextPageToken?: string;
};

export async function listCalendars(token: string): Promise<GoogleCalendar[]> {
  const data = await call<RawCalendarList>(
    token,
    "/users/me/calendarList?minAccessRole=reader"
  );
  return (data?.items ?? [])
    .filter((c) => !c.hidden && !c.deleted)
    .map((c) => ({
      id: c.id,
      summary: c.summaryOverride || c.summary,
      backgroundColor: c.backgroundColor || "#7986cb",
      foregroundColor: c.foregroundColor || "#ffffff",
      primary: c.primary ?? false,
      accessRole: c.accessRole,
      selected: c.selected ?? true,
    }));
}

/** Fetch events from one calendar between [timeMin, timeMax] in RFC3339. */
async function listEvents(
  token: string,
  calendarId: string,
  timeMin: string,
  timeMax: string
): Promise<RawEvent[]> {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "250",
  });
  const data = await call<RawEventList>(
    token,
    `/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`
  );
  return (data?.items ?? []).filter((e) => e.status !== "cancelled");
}

/** Fetch events from all selected calendars in one shot — calendars
 *  fan out in parallel, mapped onto our internal shape with their
 *  parent calendar's color attached. */
export async function listWeekEvents(
  token: string,
  calendars: GoogleCalendar[],
  timeMin: string,
  timeMax: string
): Promise<GoogleEvent[]> {
  const visible = calendars.filter((c) => c.selected);
  if (visible.length === 0) return [];

  const results = await Promise.all(
    visible.map(async (cal) => {
      try {
        const items = await listEvents(token, cal.id, timeMin, timeMax);
        return items.map<GoogleEvent>((e) => mapEvent(e, cal));
      } catch {
        // One bad calendar shouldn't kill the whole panel.
        return [] as GoogleEvent[];
      }
    })
  );

  return results.flat().sort((a, b) => a.start.localeCompare(b.start));
}

function mapEvent(e: RawEvent, cal: GoogleCalendar): GoogleEvent {
  const allDay = !!e.start.date;
  return {
    id: e.id,
    calendarId: cal.id,
    calendarName: cal.summary,
    calendarColor: cal.backgroundColor,
    summary: e.summary || "(no title)",
    description: e.description || null,
    start: e.start.dateTime || e.start.date || "",
    end: e.end.dateTime || e.end.date || "",
    allDay,
    location: e.location || null,
    htmlLink: e.htmlLink,
  };
}

/** Create an event via Google's natural-language Quick Add. Posts to
 *  the primary calendar — the simplest write-path for v1. */
export async function quickAddEvent(
  token: string,
  text: string
): Promise<GoogleEvent | null> {
  const params = new URLSearchParams({ text });
  const raw = await call<RawEvent>(
    token,
    `/calendars/primary/events/quickAdd?${params.toString()}`,
    { method: "POST" }
  );
  if (!raw) return null;
  // We don't have the parent calendar metadata at this layer — caller
  // re-fetches the week to pick up colors, but return a placeholder
  // mapping just in case.
  return mapEvent(raw, {
    id: "primary",
    summary: "Primary",
    backgroundColor: "#7986cb",
    foregroundColor: "#ffffff",
    primary: true,
    accessRole: "owner",
    selected: true,
  });
}

export async function deleteEvent(
  token: string,
  calendarId: string,
  eventId: string
): Promise<void> {
  await call<null>(
    token,
    `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    { method: "DELETE" }
  );
}

export { GoogleCalendarError };
