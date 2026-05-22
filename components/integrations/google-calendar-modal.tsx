"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
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

/** Pixel-per-hour density for the time grid (24h × 36px = 864px tall). */
const HOUR_PX = 36;
const DAY_PX = 24 * HOUR_PX;

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

function eventStartMs(ev: GoogleEvent): number {
  if (ev.allDay) return fromIsoDate(ev.start.slice(0, 10)).getTime();
  return new Date(ev.start).getTime();
}
function eventEndMs(ev: GoogleEvent): number {
  if (ev.allDay) return fromIsoDate(ev.end.slice(0, 10)).getTime();
  return new Date(ev.end).getTime();
}
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
  const [selectedEvent, setSelectedEvent] = useState<GoogleEvent | null>(null);
  const reloadRef = useRef(0);
  const wasOpenRef = useRef(false);
  const quickAddRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    writeHiddenCalendars(hidden);
  }, [hidden]);

  const shiftWeek = useCallback((days: number) => {
    setWeekStart((prev) => isoDate(addDays(fromIsoDate(prev), days)));
  }, []);

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
        if (selectedEvent) setSelectedEvent(null);
        else setOpen(false);
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
  }, [open, shiftWeek, selectedEvent]);

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

  // Auto-scroll the time grid to ~now (or 7am if not viewing this week).
  useLayoutEffect(() => {
    if (!open) return;
    const node = scrollRef.current;
    if (!node) return;
    const todayIso = isoDate(new Date());
    const startIso = weekStart;
    const endIso = isoDate(addDays(fromIsoDate(weekStart), 6));
    const showingToday = todayIso >= startIso && todayIso <= endIso;
    let targetTop: number;
    if (showingToday) {
      const now = new Date();
      const minutes = now.getHours() * 60 + now.getMinutes();
      targetTop = (minutes / 60) * HOUR_PX - 120;
    } else {
      targetTop = 7 * HOUR_PX;
    }
    node.scrollTop = Math.max(0, targetTop);
  }, [open, weekStart]);

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

        <div className="flex-1 overflow-hidden p-3 sm:p-4 flex flex-col gap-3 relative">
          {!data ? (
            <SkeletonGrid days={days} todayIso={todayIso} />
          ) : !data.connected ? (
            <ConnectPrompt />
          ) : data.error ? (
            <ErrorBox message={data.error} onRetry={() => refresh(weekStart)} />
          ) : (
            <>
              <form onSubmit={handleQuickAdd} className="flex gap-2 shrink-0">
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

              <TimeGrid
                scrollRef={scrollRef}
                days={days}
                todayIso={todayIso}
                events={data.events.filter((e) => !hidden.has(e.calendarId))}
                onSelect={setSelectedEvent}
                selectedId={selectedEvent?.id ?? null}
              />

              <CalendarLegend
                calendars={data.calendars}
                hidden={hidden}
                onToggle={toggleCalendarVisibility}
              />

              {selectedEvent && (
                <EventEditorOverlay
                  ev={selectedEvent}
                  onClose={() => setSelectedEvent(null)}
                  onSaved={(updated) => {
                    handleEventUpdate(selectedEvent, updated);
                    setSelectedEvent(null);
                  }}
                  onDelete={() => {
                    handleEventDelete(selectedEvent);
                    setSelectedEvent(null);
                  }}
                />
              )}
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

// ─── time grid ─────────────────────────────────────────────────────────────

type TimedLayout = {
  ev: GoogleEvent;
  lane: number;
  lanes: number;
  topPx: number;
  heightPx: number;
};

/** Pack overlapping timed events into side-by-side lanes within
 *  clusters. Each cluster recomputes its width fraction so isolated
 *  events still take the full column. */
function layoutTimedEventsForDay(
  events: GoogleEvent[],
  day: Date
): TimedLayout[] {
  const dayStartMs = day.getTime();
  const dayEndMs = dayStartMs + 24 * 60 * 60 * 1000;

  const items = events
    .filter((ev) => !ev.allDay && eventTouchesDay(ev, day))
    .map((ev) => ({
      ev,
      start: Math.max(eventStartMs(ev), dayStartMs),
      end: Math.min(eventEndMs(ev), dayEndMs),
    }))
    .filter((x) => x.end > x.start)
    .sort((a, b) => a.start - b.start || b.end - a.end);

  type Item = (typeof items)[number];
  const chunks: Item[][] = [];
  let cur: Item[] = [];
  let curEnd = 0;
  for (const it of items) {
    if (cur.length === 0 || it.start < curEnd) {
      cur.push(it);
      curEnd = Math.max(curEnd, it.end);
    } else {
      chunks.push(cur);
      cur = [it];
      curEnd = it.end;
    }
  }
  if (cur.length) chunks.push(cur);

  const layouts: TimedLayout[] = [];
  for (const chunk of chunks) {
    const lanes: number[] = []; // lane[i] = end of last event in lane i
    const inChunk: { item: Item; lane: number }[] = [];
    for (const item of chunk) {
      let lane = lanes.findIndex((end) => end <= item.start);
      if (lane === -1) {
        lane = lanes.length;
        lanes.push(item.end);
      } else {
        lanes[lane] = item.end;
      }
      inChunk.push({ item, lane });
    }
    const total = lanes.length;
    for (const { item, lane } of inChunk) {
      const topPx =
        ((item.start - dayStartMs) / (60 * 60 * 1000)) * HOUR_PX;
      const heightPx =
        ((item.end - item.start) / (60 * 60 * 1000)) * HOUR_PX;
      layouts.push({
        ev: item.ev,
        lane,
        lanes: total,
        topPx,
        heightPx,
      });
    }
  }
  return layouts;
}

function allDayEventsForDay(events: GoogleEvent[], day: Date): GoogleEvent[] {
  return events
    .filter((ev) => ev.allDay && eventTouchesDay(ev, day))
    .sort((a, b) => a.summary.localeCompare(b.summary));
}

function TimeGrid({
  scrollRef,
  days,
  todayIso,
  events,
  onSelect,
  selectedId,
}: {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  days: Date[];
  todayIso: string;
  events: GoogleEvent[];
  onSelect: (ev: GoogleEvent) => void;
  selectedId: string | null;
}) {
  // Re-render every minute to keep the now-line moving + past-events dimming fresh.
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      ref={scrollRef}
      className="flex-1 min-h-0 overflow-y-auto overflow-x-auto rounded-md border border-border/40 bg-card/20"
    >
      <div className="min-w-[760px] grid grid-cols-[44px_repeat(7,minmax(0,1fr))]">
        {/* Sticky header band: weekday + per-day all-day events */}
        <StickyHeaderRow days={days} todayIso={todayIso} />
        <StickyAllDayRow
          days={days}
          todayIso={todayIso}
          events={events}
          onSelect={onSelect}
          selectedId={selectedId}
        />

        {/* Hour gutter */}
        <div
          className="relative border-r border-border/40 bg-card/30"
          style={{ height: DAY_PX }}
        >
          {Array.from({ length: 24 }, (_, h) => (
            <div
              key={h}
              className="absolute right-1 text-[9px] font-mono text-muted-foreground/60"
              style={{ top: h * HOUR_PX - 6 }}
            >
              {h === 0 ? "" : `${pad(h)}:00`}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((d) => {
          const key = isoDate(d);
          const isToday = key === todayIso;
          const nowMs = Date.now();
          const layouts = layoutTimedEventsForDay(events, d);
          return (
            <div
              key={key}
              className={`relative border-r border-border/40 ${
                isToday ? "bg-glow/5" : ""
              }`}
              style={{ height: DAY_PX }}
            >
              {/* Hour gridlines */}
              {Array.from({ length: 24 }, (_, h) => (
                <div
                  key={h}
                  className={`absolute left-0 right-0 ${
                    h % 6 === 0 ? "border-t border-border/40" : "border-t border-border/15"
                  }`}
                  style={{ top: h * HOUR_PX }}
                />
              ))}
              {/* Event blocks */}
              {layouts.map((layout) => {
                const isPast =
                  isToday &&
                  eventEndMs(layout.ev) <= nowMs;
                return (
                  <EventBlock
                    key={`${layout.ev.id}-${key}`}
                    layout={layout}
                    isPast={isPast}
                    isContinuation={
                      eventStartMs(layout.ev) < d.getTime()
                    }
                    selected={selectedId === layout.ev.id}
                    onSelect={() => onSelect(layout.ev)}
                  />
                );
              })}
              {/* Now line */}
              {isToday && <NowLine />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StickyHeaderRow({
  days,
  todayIso,
}: {
  days: Date[];
  todayIso: string;
}) {
  return (
    <>
      <div className="sticky top-0 z-20 bg-card border-b border-border/40" />
      {days.map((d, i) => {
        const key = isoDate(d);
        const isToday = key === todayIso;
        return (
          <div
            key={key}
            className={`sticky top-0 z-20 border-b border-border/40 px-2 py-1.5 text-[11px] font-mono uppercase tracking-wider flex items-center justify-between ${
              isToday ? "bg-glow/10 text-glow" : "bg-card text-muted-foreground"
            }`}
          >
            <span>{DAY_NAMES[i]}</span>
            <span className="text-foreground font-semibold">{d.getDate()}</span>
          </div>
        );
      })}
    </>
  );
}

function StickyAllDayRow({
  days,
  todayIso,
  events,
  onSelect,
  selectedId,
}: {
  days: Date[];
  todayIso: string;
  events: GoogleEvent[];
  onSelect: (ev: GoogleEvent) => void;
  selectedId: string | null;
}) {
  return (
    <>
      <div className="sticky top-[28px] z-20 bg-card border-b border-border/40 text-[9px] font-mono text-right pr-1 py-1 text-muted-foreground/60">
        all-day
      </div>
      {days.map((d) => {
        const key = isoDate(d);
        const isToday = key === todayIso;
        const items = allDayEventsForDay(events, d);
        return (
          <div
            key={`ad-${key}`}
            className={`sticky top-[28px] z-20 border-b border-border/40 px-1 py-1 space-y-0.5 ${
              isToday ? "bg-glow/10" : "bg-card"
            }`}
          >
            {items.length === 0 ? (
              <div className="h-4" />
            ) : (
              items.map((ev) => {
                const isContinuation = ev.start.slice(0, 10) < key;
                return (
                  <AllDayChip
                    key={`${ev.id}-${key}`}
                    ev={ev}
                    isContinuation={isContinuation}
                    selected={selectedId === ev.id}
                    onSelect={() => onSelect(ev)}
                  />
                );
              })
            )}
          </div>
        );
      })}
    </>
  );
}

function AllDayChip({
  ev,
  isContinuation,
  selected,
  onSelect,
}: {
  ev: GoogleEvent;
  isContinuation: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      title={ev.summary}
      className={`block w-full text-left text-[10px] px-1.5 py-0.5 rounded truncate transition-colors ${
        selected ? "ring-1 ring-glow/70" : ""
      }`}
      style={{
        backgroundColor: `${ev.calendarColor}33`,
        borderLeft: `3px solid ${ev.calendarColor}`,
        color: ev.calendarColor,
      }}
    >
      {isContinuation ? "↗ " : ""}
      <span className="text-foreground">{ev.summary}</span>
    </button>
  );
}

function EventBlock({
  layout,
  isPast,
  isContinuation,
  selected,
  onSelect,
}: {
  layout: TimedLayout;
  isPast: boolean;
  isContinuation: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const widthPct = 100 / layout.lanes;
  const leftPct = layout.lane * widthPct;
  const showLabel = layout.heightPx >= 24;
  const showTime = layout.heightPx >= 36;

  const timeLabel = new Date(layout.ev.start).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <button
      type="button"
      onClick={onSelect}
      title={`${layout.ev.summary} · ${layout.ev.calendarName}`}
      className={`absolute overflow-hidden rounded text-left transition-opacity ${
        isPast ? "opacity-50" : ""
      } ${selected ? "ring-1 ring-glow/70 z-10" : ""}`}
      style={{
        top: layout.topPx,
        height: Math.max(layout.heightPx - 1, 14),
        left: `calc(${leftPct}% + 2px)`,
        width: `calc(${widthPct}% - 4px)`,
        backgroundColor: `${layout.ev.calendarColor}44`,
        borderLeft: `3px solid ${layout.ev.calendarColor}`,
      }}
    >
      <div className="px-1 py-0.5 text-[10px] leading-tight">
        {showTime && (
          <div className="font-mono text-[9px] text-muted-foreground">
            {isContinuation ? "↗ " : ""}
            {timeLabel}
          </div>
        )}
        {showLabel && (
          <div className="line-clamp-2 text-foreground/90">
            {layout.ev.summary}
          </div>
        )}
        {!showLabel && (
          <div className="truncate text-foreground/90">
            {layout.ev.summary}
          </div>
        )}
      </div>
    </button>
  );
}

function NowLine() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const minutes = now.getHours() * 60 + now.getMinutes();
  const top = (minutes / 60) * HOUR_PX;
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <div
      className="pointer-events-none absolute left-0 right-0 z-[5]"
      style={{ top: top - 1 }}
    >
      <div className="relative">
        <div className="h-px bg-destructive" />
        <span className="absolute -top-2 left-1 text-[9px] font-mono text-destructive bg-card/80 px-0.5 rounded">
          {time}
        </span>
      </div>
    </div>
  );
}

// ─── overlay editor ────────────────────────────────────────────────────────

function EventEditorOverlay({
  ev,
  onClose,
  onSaved,
  onDelete,
}: {
  ev: GoogleEvent;
  onClose: () => void;
  onSaved: (updated: GoogleEvent) => void;
  onDelete: () => void;
}) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close editor"
        className="absolute inset-0 bg-background/60 backdrop-blur-[2px] pointer-events-auto"
      />
      <div className="relative w-full max-w-md rounded-lg border border-glow/40 bg-card shadow-xl pointer-events-auto">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/60">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="inline-block h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: ev.calendarColor }}
            />
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground truncate">
              {ev.calendarName || "Calendar"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors text-sm px-1"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <EventEditor
          ev={ev}
          onCancel={onClose}
          onSaved={onSaved}
          onDelete={onDelete}
        />
      </div>
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
  const [startVal, setStartVal] = useState(() =>
    ev.allDay ? ev.start.slice(0, 10) : isoDateTimeLocal(new Date(ev.start))
  );
  const [endVal, setEndVal] = useState(() => {
    if (ev.allDay) {
      const inclusive = addDays(fromIsoDate(ev.end.slice(0, 10)), -1);
      return isoDate(inclusive);
    }
    return isoDateTimeLocal(new Date(ev.end));
  });
  const [saving, setSaving] = useState(false);

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
        const endExclusive = isoDate(addDays(fromIsoDate(endVal), 1));
        patch.start = { date: startVal };
        patch.end = { date: endExclusive };
      } else {
        patch.start = { dateTime: new Date(startVal).toISOString() };
        patch.end = { dateTime: new Date(endVal).toISOString() };
      }
      const updated = await updateCalendarEvent(ev.calendarId, ev.id, patch);
      toast.success("Saved");
      onSaved({
        ...updated,
        calendarColor: ev.calendarColor,
        calendarName: ev.calendarName,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setSaving(false);
  }

  function handleDelete() {
    if (!confirm(`Delete "${ev.summary}"?`)) return;
    onDelete();
  }

  return (
    <div className="px-3 py-3 space-y-2 text-xs">
      <input
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder="Title"
        className="w-full rounded border border-border/60 bg-card/60 px-2 py-1.5 text-sm outline-none focus:border-glow/60"
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
          className="flex-1 min-w-0 rounded border border-border/60 bg-card/60 px-2 py-1.5 outline-none focus:border-glow/60"
        />
        <input
          type={allDay ? "date" : "datetime-local"}
          value={endVal}
          onChange={(e) => setEndVal(e.target.value)}
          className="flex-1 min-w-0 rounded border border-border/60 bg-card/60 px-2 py-1.5 outline-none focus:border-glow/60"
        />
      </div>
      <input
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Location"
        className="w-full rounded border border-border/60 bg-card/60 px-2 py-1.5 outline-none focus:border-glow/60"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        rows={Math.min(8, Math.max(3, description.split("\n").length + 1))}
        className="w-full rounded border border-border/60 bg-card/60 px-2 py-1.5 outline-none focus:border-glow/60 resize-y whitespace-pre-wrap"
      />
      <div className="flex flex-wrap gap-1 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded border border-glow/40 bg-glow/10 px-3 py-1.5 font-mono text-[11px] text-glow hover:bg-glow/20 disabled:opacity-40 transition-colors"
        >
          {saving ? "saving…" : "save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-border/60 bg-card/40 px-3 py-1.5 font-mono text-[11px] text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
        >
          cancel
        </button>
        <a
          href={ev.htmlLink}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded border border-border/60 bg-card/40 px-3 py-1.5 font-mono text-[11px] text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
          title="Open in Google Calendar"
        >
          open ↗
        </a>
        <button
          type="button"
          onClick={handleDelete}
          className="ml-auto rounded border border-destructive/40 bg-destructive/5 px-3 py-1.5 font-mono text-[11px] text-destructive hover:bg-destructive/15 transition-colors"
        >
          delete
        </button>
      </div>
    </div>
  );
}

// ─── leftover bits ─────────────────────────────────────────────────────────

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
    <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-muted-foreground/70 shrink-0">
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
          onClick={() =>
            calendars.forEach((c) => hidden.has(c.id) && onToggle(c.id))
          }
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
    <div className="flex-1 min-h-0 overflow-hidden rounded-md border border-border/40 bg-card/20">
      <div className="grid grid-cols-[44px_repeat(7,minmax(0,1fr))] min-w-[760px]">
        <div className="bg-card border-b border-border/40" />
        {days.map((d, i) => {
          const key = isoDate(d);
          const isToday = key === todayIso;
          return (
            <div
              key={key}
              className={`border-b border-border/40 px-2 py-1.5 text-[11px] font-mono uppercase tracking-wider flex items-center justify-between ${
                isToday ? "bg-glow/10 text-glow" : "bg-card text-muted-foreground"
              }`}
            >
              <span>{DAY_NAMES[i]}</span>
              <span className="text-foreground font-semibold">{d.getDate()}</span>
            </div>
          );
        })}
        <div className="bg-card/30 border-r border-border/40" style={{ height: 240 }} />
        {days.map((d) => (
          <div
            key={`sk-${isoDate(d)}`}
            className="border-r border-border/40 p-1.5 space-y-1.5 animate-pulse"
            style={{ height: 240 }}
          >
            {Array.from({ length: 3 }).map((_, j) => (
              <div
                key={j}
                className="h-10 rounded bg-card/40 border border-border/20"
              />
            ))}
          </div>
        ))}
      </div>
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
