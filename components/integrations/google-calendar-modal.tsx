"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  deleteCalendarEvent,
  loadCalendarWeek,
  quickAddCalendarEvent,
  updateCalendarEvent,
  type CalendarWeekData,
} from "@/modules/integrations/google-calendar/actions";
import type { GoogleEvent } from "@/modules/integrations/types";

const CACHE_KEY_PREFIX = "gcal-week-cache:";
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const HIDDEN_CALS_KEY = "gcal-hidden-calendars";

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
function isoDateTimeLocal(d: Date): string {
  return `${isoDate(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function mondayOf(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const offset = (d.getDay() + 6) % 7;
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

function readHiddenCalendars(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(HIDDEN_CALS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}
function writeHiddenCalendars(s: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HIDDEN_CALS_KEY, JSON.stringify([...s]));
  } catch {}
}

function dispatchEventsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("gcal-events-changed"));
  }
}

/** Resolve an event's start instant for sorting and overlap checks. */
function eventStartMs(ev: GoogleEvent): number {
  if (ev.allDay) return fromIsoDate(ev.start.slice(0, 10)).getTime();
  return new Date(ev.start).getTime();
}
function eventEndMs(ev: GoogleEvent): number {
  if (ev.allDay) return fromIsoDate(ev.end.slice(0, 10)).getTime();
  return new Date(ev.end).getTime();
}

/** Does this event touch the given day? (start < day_end AND end > day_start) */
function eventTouchesDay(ev: GoogleEvent, day: Date): boolean {
  const dayStart = day.getTime();
  const dayEnd = dayStart + 24 * 60 * 60 * 1000;
  return eventStartMs(ev) < dayEnd && eventEndMs(ev) > dayStart;
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
  const [hidden, setHidden] = useState<Set<string>>(() => readHiddenCalendars());
  const reloadRef = useRef(0);
  const wasOpenRef = useRef(false);
  const quickAddRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    writeHiddenCalendars(hidden);
  }, [hidden]);

  const shiftWeek = useCallback((days: number) => {
    setWeekStart((prev) => isoDate(addDays(fromIsoDate(prev), days)));
  }, []);

  // Global hotkeys: w toggles, Esc closes, and while-open: arrow keys
  // for weeks, t for today, n to focus quick-add. Ignored while typing.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.defaultPrevented) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const typing = isTypingTarget(e.target);
      if (e.key === "w" && !typing) {
        e.preventDefault();
        setOpen((s) => !s);
        return;
      }
      if (!open) return;
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      } else if (!typing && e.key === "ArrowLeft") {
        e.preventDefault();
        shiftWeek(-7);
      } else if (!typing && e.key === "ArrowRight") {
        e.preventDefault();
        shiftWeek(7);
      } else if (!typing && e.key === "t") {
        e.preventDefault();
        setWeekStart(isoDate(mondayOf(new Date())));
      } else if (!typing && e.key === "n") {
        e.preventDefault();
        quickAddRef.current?.focus();
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
  }, [open, shiftWeek]);

  const refresh = useCallback(async (week: string) => {
    const id = ++reloadRef.current;
    setLoading(true);
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

  useEffect(() => {
    const cached = readCache(weekStart);
    if (cached) setData(cached.data);
    else setData(null);
    refresh(weekStart);
  }, [refresh, weekStart]);

  useEffect(() => {
    if (data) writeCache(weekStart, data);
  }, [data, weekStart]);

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

  useEffect(() => {
    if (open && !wasOpenRef.current) refresh(weekStart);
    wasOpenRef.current = open;
  }, [open, refresh, weekStart]);

  async function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setAdding(true);
    try {
      await quickAddCalendarEvent(text);
      setDraft("");
      toast.success("Added");
      await refresh(weekStart);
      dispatchEventsChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setAdding(false);
  }

  function handleEventUpdate(original: GoogleEvent, updated: GoogleEvent) {
    if (!data) return;
    // The PATCH call is owned by EventEditor; we just splice the new
    // event into the loaded week. The event may have moved to a
    // different day — the day-overlap filter on render handles that.
    setData({
      ...data,
      events: data.events.map((e) => (e.id === original.id ? updated : e)),
    });
    dispatchEventsChanged();
  }

  async function handleEventDelete(ev: GoogleEvent) {
    if (!data) return;
    const prev = data;
    setData({
      ...data,
      events: data.events.filter((e) => e.id !== ev.id),
    });
    try {
      await deleteCalendarEvent(ev.calendarId, ev.id);
      toast.success("Deleted");
      dispatchEventsChanged();
    } catch (e) {
      setData(prev);
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  function toggleCalendarVisibility(id: string) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (!open) return null;

  const start = fromIsoDate(weekStart);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const todayIso = isoDate(new Date());
  const nowMs = Date.now();

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
        <ModalHeader
          weekStart={weekStart}
          onShift={shiftWeek}
          onToday={() => setWeekStart(isoDate(mondayOf(new Date())))}
          onRefresh={() => refresh(weekStart)}
          onClose={() => setOpen(false)}
          loading={loading}
        />

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
          {!data ? (
            <SkeletonGrid days={days} todayIso={todayIso} />
          ) : !data.connected ? (
            <ConnectPrompt />
          ) : data.error ? (
            <ErrorBox message={data.error} onRetry={() => refresh(weekStart)} />
          ) : (
            <>
              <form onSubmit={handleQuickAdd} className="flex gap-2">
                <input
                  ref={quickAddRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="+ Quick add (e.g. 'Lunch with Sam tomorrow 12:30')   ·   n to focus"
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

              <WeekGrid
                days={days}
                todayIso={todayIso}
                events={data.events.filter((e) => !hidden.has(e.calendarId))}
                nowMs={nowMs}
                onUpdate={handleEventUpdate}
                onDelete={handleEventDelete}
              />

              <CalendarLegend
                calendars={data.calendars}
                hidden={hidden}
                onToggle={toggleCalendarVisibility}
              />
            </>
          )}
        </div>

        <footer className="px-4 py-2 border-t border-border/60 text-[10px] font-mono text-muted-foreground/50 text-center">
          <kbd className="px-1 py-0.5 rounded bg-card/60 border border-border/40">w</kbd> / <kbd className="px-1 py-0.5 rounded bg-card/60 border border-border/40">esc</kbd> close
          {" · "}
          <kbd className="px-1 py-0.5 rounded bg-card/60 border border-border/40">←</kbd>/<kbd className="px-1 py-0.5 rounded bg-card/60 border border-border/40">→</kbd> week
          {" · "}
          <kbd className="px-1 py-0.5 rounded bg-card/60 border border-border/40">t</kbd> today
          {" · "}
          <kbd className="px-1 py-0.5 rounded bg-card/60 border border-border/40">n</kbd> new
        </footer>
      </div>
    </div>
  );
}

function ModalHeader({
  weekStart,
  onShift,
  onToday,
  onRefresh,
  onClose,
  loading,
}: {
  weekStart: string;
  onShift: (days: number) => void;
  onToday: () => void;
  onRefresh: () => void;
  onClose: () => void;
  loading: boolean;
}) {
  const start = fromIsoDate(weekStart);
  const last = addDays(start, 6);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const sameMonth = start.getMonth() === last.getMonth();
  const left = start.toLocaleDateString(undefined, opts);
  const right = last.toLocaleDateString(
    undefined,
    sameMonth ? { day: "numeric", year: "numeric" } : { ...opts, year: "numeric" }
  );
  const rangeLabel = `${left} – ${right}`;

  return (
    <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/60 flex-wrap">
      <div className="flex items-center gap-2">
        <h2 className="text-xs font-mono uppercase tracking-wider text-glow">
          📅 Calendar
        </h2>
        <div className="flex items-center gap-1 ml-2">
          <button
            type="button"
            onClick={() => onShift(-7)}
            className="h-7 w-7 rounded-md border border-border/60 bg-card/40 text-xs hover:border-foreground/40 hover:text-foreground transition-colors"
            title="Previous week (←)"
          >
            ←
          </button>
          <button
            type="button"
            onClick={onToday}
            className="h-7 px-2 rounded-md border border-border/60 bg-card/40 text-[11px] font-mono hover:border-foreground/40 hover:text-foreground transition-colors"
            title="This week (t)"
          >
            today
          </button>
          <button
            type="button"
            onClick={() => onShift(7)}
            className="h-7 w-7 rounded-md border border-border/60 bg-card/40 text-xs hover:border-foreground/40 hover:text-foreground transition-colors"
            title="Next week (→)"
          >
            →
          </button>
          <span className="ml-2 text-xs font-mono text-muted-foreground">
            {rangeLabel}
          </span>
          <button
            type="button"
            onClick={onRefresh}
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
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors text-sm px-1"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </header>
  );
}

function WeekGrid({
  days,
  todayIso,
  events,
  nowMs,
  onUpdate,
  onDelete,
}: {
  days: Date[];
  todayIso: string;
  events: GoogleEvent[];
  nowMs: number;
  onUpdate: (original: GoogleEvent, updated: GoogleEvent) => void;
  onDelete: (ev: GoogleEvent) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
      {days.map((d, i) => {
        const key = isoDate(d);
        const isToday = key === todayIso;
        const dayEvents = events
          .filter((ev) => eventTouchesDay(ev, d))
          .sort((a, b) => {
            if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
            return eventStartMs(a) - eventStartMs(b);
          });
        const firstUpcomingIndex = isToday
          ? dayEvents.findIndex((ev) => !ev.allDay && eventEndMs(ev) > nowMs)
          : -1;

        return (
          <div
            key={key}
            className={`rounded-lg border ${
              isToday
                ? "border-glow/60 bg-glow/5"
                : "border-border/60 bg-card/30"
            } flex flex-col min-h-[14rem]`}
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
              {dayEvents.length === 0 ? (
                <li className="text-[10px] font-mono text-muted-foreground/40 px-1 py-2">
                  —
                </li>
              ) : (
                dayEvents.map((ev, idx) => {
                  const isPast = isToday && !ev.allDay && eventEndMs(ev) <= nowMs;
                  const isContinuation = ev.allDay
                    ? ev.start.slice(0, 10) < key
                    : isoDate(new Date(ev.start)) < key;
                  return (
                    <li key={`${ev.id}-${key}`}>
                      {isToday && idx === firstUpcomingIndex && idx > 0 && (
                        <NowDivider />
                      )}
                      <EventCard
                        ev={ev}
                        isPast={isPast}
                        isContinuation={isContinuation}
                        onUpdate={onUpdate}
                        onDelete={onDelete}
                      />
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function NowDivider() {
  const time = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div className="flex items-center gap-1 px-1 py-1 my-0.5">
      <div className="h-px flex-1 bg-destructive/70" />
      <span className="text-[9px] font-mono text-destructive">{time}</span>
      <div className="h-px flex-1 bg-destructive/70" />
    </div>
  );
}

function EventCard({
  ev,
  isPast,
  isContinuation,
  onUpdate,
  onDelete,
}: {
  ev: GoogleEvent;
  isPast: boolean;
  isContinuation: boolean;
  onUpdate: (original: GoogleEvent, updated: GoogleEvent) => void;
  onDelete: (ev: GoogleEvent) => void;
}) {
  const [editing, setEditing] = useState(false);

  const timeLabel = ev.allDay
    ? "all-day"
    : new Date(ev.start).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

  return (
    <div
      className={`rounded transition-colors ${
        isPast ? "opacity-40" : ""
      } ${editing ? "bg-card/70 border border-glow/40" : "hover:bg-card/60"}`}
    >
      <button
        type="button"
        onClick={() => setEditing((s) => !s)}
        className="w-full text-left px-1.5 py-1 text-[11px]"
        title={`${ev.summary} · ${ev.calendarName}`}
      >
        <div className="flex items-start gap-1.5">
          <span
            className="mt-1 inline-block h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: ev.calendarColor }}
          />
          <div className="flex-1 min-w-0">
            <div className="font-mono text-[10px] text-muted-foreground">
              {isContinuation ? "↗" : ""} {timeLabel}
            </div>
            <div className="leading-snug break-words">{ev.summary}</div>
            {ev.location && (
              <div className="text-[10px] text-muted-foreground/70 mt-0.5 truncate">
                📍 {ev.location}
              </div>
            )}
          </div>
        </div>
      </button>
      {editing && (
        <EventEditor
          ev={ev}
          onCancel={() => setEditing(false)}
          onSaved={(updated) => {
            setEditing(false);
            onUpdate(ev, updated);
          }}
          onDelete={() => {
            setEditing(false);
            onDelete(ev);
          }}
        />
      )}
    </div>
  );
}

function EventEditor({
  ev,
  onCancel,
  onSaved,
  onDelete,
}: {
  ev: GoogleEvent;
  onCancel: () => void;
  onSaved: (updated: GoogleEvent) => void;
  onDelete: () => void;
}) {
  const [summary, setSummary] = useState(ev.summary);
  const [description, setDescription] = useState(ev.description ?? "");
  const [location, setLocation] = useState(ev.location ?? "");
  const [allDay, setAllDay] = useState(ev.allDay);
  // For all-day Google events, end is exclusive (= day AFTER last day).
  // Display the inclusive last day; convert back on save.
  const [startVal, setStartVal] = useState(() =>
    ev.allDay
      ? ev.start.slice(0, 10)
      : isoDateTimeLocal(new Date(ev.start))
  );
  const [endVal, setEndVal] = useState(() => {
    if (ev.allDay) {
      const inclusive = addDays(fromIsoDate(ev.end.slice(0, 10)), -1);
      return isoDate(inclusive);
    }
    return isoDateTimeLocal(new Date(ev.end));
  });
  const [saving, setSaving] = useState(false);

  // When toggling all-day on/off, coerce the start/end to the right shape.
  function toggleAllDay(next: boolean) {
    if (next && !allDay) {
      setStartVal(startVal.slice(0, 10));
      setEndVal(endVal.slice(0, 10));
    } else if (!next && allDay) {
      setStartVal(`${startVal}T09:00`);
      setEndVal(`${endVal}T10:00`);
    }
    setAllDay(next);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const patch: Parameters<typeof updateCalendarEvent>[2] = {
        summary,
        description: description || null,
        location: location || null,
      };
      if (allDay) {
        // Convert inclusive end → exclusive (Google's convention).
        const endExclusive = isoDate(addDays(fromIsoDate(endVal), 1));
        patch.start = { date: startVal };
        patch.end = { date: endExclusive };
      } else {
        patch.start = { dateTime: new Date(startVal).toISOString() };
        patch.end = { dateTime: new Date(endVal).toISOString() };
      }
      const updated = await updateCalendarEvent(ev.calendarId, ev.id, patch);
      toast.success("Saved");
      // Preserve the original calendar color since the patched event's
      // calendar metadata isn't fetched.
      onSaved({ ...updated, calendarColor: ev.calendarColor, calendarName: ev.calendarName });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete "${ev.summary}"?`)) return;
    onDelete();
  }

  return (
    <div
      className="border-t border-border/40 px-2 py-2 space-y-1.5 text-[11px]"
      // Stop clicks from bubbling to the parent toggle button.
      onClick={(e) => e.stopPropagation()}
    >
      <input
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder="Title"
        className="w-full rounded border border-border/60 bg-card/60 px-1.5 py-1 outline-none focus:border-glow/60"
      />
      <label className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
        <input
          type="checkbox"
          checked={allDay}
          onChange={(e) => toggleAllDay(e.target.checked)}
          className="accent-glow"
        />
        all-day
      </label>
      <div className="flex gap-1.5">
        <input
          type={allDay ? "date" : "datetime-local"}
          value={startVal}
          onChange={(e) => setStartVal(e.target.value)}
          className="flex-1 min-w-0 rounded border border-border/60 bg-card/60 px-1.5 py-1 text-[10px] outline-none focus:border-glow/60"
        />
        <input
          type={allDay ? "date" : "datetime-local"}
          value={endVal}
          onChange={(e) => setEndVal(e.target.value)}
          className="flex-1 min-w-0 rounded border border-border/60 bg-card/60 px-1.5 py-1 text-[10px] outline-none focus:border-glow/60"
        />
      </div>
      <input
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Location"
        className="w-full rounded border border-border/60 bg-card/60 px-1.5 py-1 outline-none focus:border-glow/60"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        rows={Math.min(6, Math.max(2, description.split("\n").length + 1))}
        className="w-full rounded border border-border/60 bg-card/60 px-1.5 py-1 outline-none focus:border-glow/60 resize-y whitespace-pre-wrap"
      />
      <div className="flex flex-wrap gap-1 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded border border-glow/40 bg-glow/10 px-2 py-1 font-mono text-[10px] text-glow hover:bg-glow/20 disabled:opacity-40 transition-colors"
        >
          {saving ? "saving…" : "save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-border/60 bg-card/40 px-2 py-1 font-mono text-[10px] text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
        >
          cancel
        </button>
        <a
          href={ev.htmlLink}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded border border-border/60 bg-card/40 px-2 py-1 font-mono text-[10px] text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
          title="Open in Google Calendar"
        >
          open ↗
        </a>
        <button
          type="button"
          onClick={handleDelete}
          className="ml-auto rounded border border-destructive/40 bg-destructive/5 px-2 py-1 font-mono text-[10px] text-destructive hover:bg-destructive/15 transition-colors"
        >
          delete
        </button>
      </div>
    </div>
  );
}

function CalendarLegend({
  calendars,
  hidden,
  onToggle,
}: {
  calendars: { id: string; summary: string; backgroundColor: string }[];
  hidden: Set<string>;
  onToggle: (id: string) => void;
}) {
  if (calendars.length === 0) return null;
  const anyHidden = calendars.some((c) => hidden.has(c.id));
  return (
    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40 text-[10px] font-mono text-muted-foreground/70">
      <span>Calendars:</span>
      {calendars.map((c) => {
        const off = hidden.has(c.id);
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onToggle(c.id)}
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors hover:bg-card/60 ${
              off ? "line-through opacity-40" : ""
            }`}
            title={off ? "Click to show" : "Click to hide"}
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: c.backgroundColor }}
            />
            {c.summary}
          </button>
        );
      })}
      {anyHidden && (
        <button
          type="button"
          onClick={() => calendars.forEach((c) => hidden.has(c.id) && onToggle(c.id))}
          className="ml-2 text-glow hover:underline"
        >
          show all
        </button>
      )}
    </div>
  );
}

function SkeletonGrid({
  days,
  todayIso,
}: {
  days: Date[];
  todayIso: string;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
      {days.map((d, i) => {
        const key = isoDate(d);
        const isToday = key === todayIso;
        return (
          <div
            key={key}
            className={`rounded-lg border ${
              isToday ? "border-glow/40 bg-glow/5" : "border-border/40 bg-card/20"
            } flex flex-col min-h-[14rem]`}
          >
            <div
              className={`px-2 py-1.5 border-b border-border/40 text-[11px] font-mono uppercase tracking-wider flex items-center justify-between ${
                isToday ? "text-glow" : "text-muted-foreground"
              }`}
            >
              <span>{DAY_NAMES[i]}</span>
              <span className="text-foreground font-semibold">{d.getDate()}</span>
            </div>
            <ul className="flex-1 p-1.5 space-y-1.5 animate-pulse">
              {Array.from({ length: 3 }).map((_, j) => (
                <li
                  key={j}
                  className="h-8 rounded bg-card/40 border border-border/20"
                />
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function ConnectPrompt() {
  return (
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
  );
}

function ErrorBox({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs space-y-2">
      <p className="text-destructive font-medium">Calendar error</p>
      <p className="text-muted-foreground">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="text-glow font-mono hover:underline"
      >
        retry
      </button>
    </div>
  );
}
