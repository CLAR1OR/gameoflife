"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  loadCalendarWeek,
  quickAddCalendarEvent,
  type CalendarWeekData,
} from "@/modules/integrations/google-calendar/actions";
import type { GoogleEvent } from "@/modules/integrations/types";

const CACHE_KEY_PREFIX = "gcal-week-cache:";
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function isTypingTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  if (t.isContentEditable) return true;
  const tag = t.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
function isoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function mondayOf(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const offset = (d.getDay() + 6) % 7; // Mon = 0, Sun = 6
  d.setDate(d.getDate() - offset);
  return d;
}
function addDays(d: Date, n: number): Date {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + n);
  return nd;
}
function fromIsoDate(s: string): Date {
  return new Date(s + "T00:00:00");
}

type CacheEntry = { data: CalendarWeekData; fetchedAt: number };

function readCache(weekStart: string): CacheEntry | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY_PREFIX + weekStart);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry;
    if (!parsed.data || typeof parsed.fetchedAt !== "number") return null;
    if (Date.now() - parsed.fetchedAt > CACHE_MAX_AGE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}
function writeCache(weekStart: string, data: CalendarWeekData) {
  if (typeof window === "undefined") return;
  if (data.error || !data.connected) return;
  try {
    window.localStorage.setItem(
      CACHE_KEY_PREFIX + weekStart,
      JSON.stringify({ data, fetchedAt: Date.now() })
    );
  } catch {}
}

function dispatchEventsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("gcal-events-changed"));
  }
}

export function GoogleCalendarModal() {
  const [open, setOpen] = useState(false);
  const [weekStart, setWeekStart] = useState<string>(() =>
    isoDate(mondayOf(new Date()))
  );
  const [data, setData] = useState<CalendarWeekData | null>(null);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const reloadRef = useRef(0);
  const wasOpenRef = useRef(false);

  // Keyboard: 'w' toggles, Escape closes. Ignore while typing.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.defaultPrevented) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "w" && !isTypingTarget(e.target)) {
        e.preventDefault();
        setOpen((s) => !s);
        return;
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
      }
    }
    function onOpenEvent() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-gcal-modal", onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-gcal-modal", onOpenEvent);
    };
  }, [open]);

  const refresh = useCallback(async (week: string) => {
    const id = ++reloadRef.current;
    setLoading(true);
    // Build the UTC bounds in the user's local zone — `toISOString()`
    // on a local Date gives back the equivalent UTC instant, which is
    // exactly what Google's timeMin/timeMax wants.
    const start = fromIsoDate(week);
    const end = addDays(start, 7);
    const next = await loadCalendarWeek({
      weekStart: week,
      startIso: start.toISOString(),
      endIso: end.toISOString(),
    });
    if (id !== reloadRef.current) return;
    setData(next);
    setLoading(false);
  }, []);

  // Hydrate cache instantly, then refresh in background.
  useEffect(() => {
    const cached = readCache(weekStart);
    if (cached) setData(cached.data);
    else setData(null);
    refresh(weekStart);
  }, [refresh, weekStart]);

  // Persist data to cache.
  useEffect(() => {
    if (data) writeCache(weekStart, data);
  }, [data, weekStart]);

  // Auto-refresh on focus while open.
  useEffect(() => {
    function onFocus() {
      if (open && document.visibilityState === "visible") refresh(weekStart);
    }
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [refresh, weekStart, open]);

  // Fresh fetch on open transition.
  useEffect(() => {
    if (open && !wasOpenRef.current) refresh(weekStart);
    wasOpenRef.current = open;
  }, [open, refresh, weekStart]);

  function shiftWeek(days: number) {
    const next = addDays(fromIsoDate(weekStart), days);
    setWeekStart(isoDate(next));
  }

  async function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setAdding(true);
    try {
      await quickAddCalendarEvent(text);
      setDraft("");
      toast.success("Added to Google Calendar");
      await refresh(weekStart);
      dispatchEventsChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setAdding(false);
  }

  if (!open) return null;

  const start = fromIsoDate(weekStart);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const todayIso = isoDate(new Date());

  // Group events by date (local). For timed events, use the start's
  // local date; for all-day, the YYYY-MM-DD start is already local.
  const eventsByDay = new Map<string, GoogleEvent[]>();
  for (const d of days) eventsByDay.set(isoDate(d), []);
  if (data) {
    for (const ev of data.events) {
      const dayKey = ev.allDay
        ? ev.start.slice(0, 10)
        : isoDate(new Date(ev.start));
      const arr = eventsByDay.get(dayKey);
      if (arr) arr.push(ev);
    }
    for (const arr of eventsByDay.values()) {
      arr.sort((a, b) => {
        if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
        return a.start.localeCompare(b.start);
      });
    }
  }

  const rangeLabel = (() => {
    const last = addDays(start, 6);
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    const sameMonth = start.getMonth() === last.getMonth();
    const left = start.toLocaleDateString(undefined, opts);
    const right = last.toLocaleDateString(
      undefined,
      sameMonth ? { day: "numeric", year: "numeric" } : { ...opts, year: "numeric" }
    );
    return sameMonth ? `${left} – ${right}` : `${left} – ${right}`;
  })();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Google Calendar week"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-7xl max-h-[90vh] flex flex-col rounded-xl border border-border bg-card shadow-2xl shadow-black/40">
        <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/60 flex-wrap">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-mono uppercase tracking-wider text-glow">
              📅 Calendar
            </h2>
            <div className="flex items-center gap-1 ml-2">
              <button
                type="button"
                onClick={() => shiftWeek(-7)}
                className="h-7 w-7 rounded-md border border-border/60 bg-card/40 text-xs hover:border-foreground/40 hover:text-foreground transition-colors"
                title="Previous week"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => setWeekStart(isoDate(mondayOf(new Date())))}
                className="h-7 px-2 rounded-md border border-border/60 bg-card/40 text-[11px] font-mono hover:border-foreground/40 hover:text-foreground transition-colors"
                title="This week"
              >
                today
              </button>
              <button
                type="button"
                onClick={() => shiftWeek(7)}
                className="h-7 w-7 rounded-md border border-border/60 bg-card/40 text-xs hover:border-foreground/40 hover:text-foreground transition-colors"
                title="Next week"
              >
                →
              </button>
              <span className="ml-2 text-xs font-mono text-muted-foreground">
                {rangeLabel}
              </span>
              <button
                type="button"
                onClick={() => refresh(weekStart)}
                disabled={loading}
                className={`h-7 px-2 rounded-md border border-border/60 bg-card/40 text-xs font-mono text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors ${
                  loading ? "animate-pulse" : ""
                }`}
                title={loading ? "Refreshing…" : "Refresh"}
              >
                ↻
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <a
              href="https://calendar.google.com/calendar/u/0/r/week"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors text-xs font-mono px-2 py-1 rounded border border-border/60 hover:border-foreground/40"
              title="Open Google Calendar in a new tab"
            >
              open ↗
            </a>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors text-sm px-1"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
          {!data ? (
            <p className="text-xs font-mono text-muted-foreground py-12 text-center">
              loading…
            </p>
          ) : !data.connected ? (
            <div className="rounded-md border border-border/60 bg-card/40 p-4 text-sm space-y-2">
              <p className="font-medium">Google Calendar not connected</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Connect from the integrations settings to see your week here.
              </p>
              <Link
                href="/account#integrations"
                className="inline-block text-xs font-mono text-glow hover:underline"
              >
                → Open settings
              </Link>
            </div>
          ) : data.error ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs space-y-2">
              <p className="text-destructive font-medium">Calendar error</p>
              <p className="text-muted-foreground">{data.error}</p>
              <button
                type="button"
                onClick={() => refresh(weekStart)}
                className="text-glow font-mono hover:underline"
              >
                retry
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={handleQuickAdd} className="flex gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="+ Quick add (e.g. 'Lunch with Sam tomorrow 12:30')"
                  className="flex-1 rounded-md border border-border/60 bg-card/40 px-3 py-2 text-sm outline-none focus:border-glow/60"
                />
                <button
                  type="submit"
                  disabled={adding || !draft.trim()}
                  className="rounded-md border border-glow/40 bg-glow/10 px-4 py-2 text-xs font-mono text-glow hover:bg-glow/20 disabled:opacity-40 transition-colors"
                >
                  {adding ? "adding…" : "add"}
                </button>
              </form>

              <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                {days.map((d, i) => {
                  const key = isoDate(d);
                  const isToday = key === todayIso;
                  const events = eventsByDay.get(key) ?? [];
                  return (
                    <div
                      key={key}
                      className={`rounded-lg border ${
                        isToday
                          ? "border-glow/60 bg-glow/5"
                          : "border-border/60 bg-card/30"
                      } flex flex-col min-h-[12rem]`}
                    >
                      <div
                        className={`px-2 py-1.5 border-b border-border/40 text-[11px] font-mono uppercase tracking-wider flex items-center justify-between ${
                          isToday ? "text-glow" : "text-muted-foreground"
                        }`}
                      >
                        <span>{DAY_NAMES[i]}</span>
                        <span className="text-foreground font-semibold">
                          {d.getDate()}
                        </span>
                      </div>
                      <ul className="flex-1 p-1.5 space-y-1">
                        {events.length === 0 ? (
                          <li className="text-[10px] font-mono text-muted-foreground/40 px-1 py-2">
                            —
                          </li>
                        ) : (
                          events.map((ev) => (
                            <EventItem key={ev.id} ev={ev} />
                          ))
                        )}
                      </ul>
                    </div>
                  );
                })}
              </div>

              {data.calendars.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40 text-[10px] font-mono text-muted-foreground/70">
                  <span>Showing:</span>
                  {data.calendars
                    .filter((c) => c.selected)
                    .map((c) => (
                      <span
                        key={c.id}
                        className="inline-flex items-center gap-1"
                      >
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: c.backgroundColor }}
                        />
                        {c.summary}
                      </span>
                    ))}
                </div>
              )}
            </>
          )}
        </div>

        <footer className="px-4 py-2 border-t border-border/60 text-[10px] font-mono text-muted-foreground/50 text-center">
          press{" "}
          <kbd className="px-1 py-0.5 rounded bg-card/60 border border-border/40">
            w
          </kbd>{" "}
          or{" "}
          <kbd className="px-1 py-0.5 rounded bg-card/60 border border-border/40">
            esc
          </kbd>{" "}
          to close
        </footer>
      </div>
    </div>
  );
}

function EventItem({ ev }: { ev: GoogleEvent }) {
  const timeLabel = ev.allDay
    ? "all-day"
    : new Date(ev.start).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

  return (
    <li>
      <a
        href={ev.htmlLink}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded px-1.5 py-1 text-[11px] hover:bg-card/60 transition-colors"
        title={`${ev.summary} · ${ev.calendarName}`}
      >
        <div className="flex items-start gap-1.5">
          <span
            className="mt-1 inline-block h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: ev.calendarColor }}
          />
          <div className="flex-1 min-w-0">
            <div className="font-mono text-[10px] text-muted-foreground">
              {timeLabel}
            </div>
            <div className="leading-snug break-words">{ev.summary}</div>
            {ev.location && (
              <div className="text-[10px] text-muted-foreground/70 mt-0.5 truncate">
                📍 {ev.location}
              </div>
            )}
          </div>
        </div>
      </a>
    </li>
  );
}
