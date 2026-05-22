"use client";

import { useCallback, useEffect, useState } from "react";
import { getCalendarTodayCount } from "@/modules/integrations/google-calendar/actions";

export function GoogleCalendarNavBadge() {
  const [count, setCount] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const n = await getCalendarTodayCount();
      setCount(n);
    } catch {
      setCount(0);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    function onFocus() {
      if (document.visibilityState === "visible") refresh();
    }
    function onChanged() {
      refresh();
    }
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("gcal-events-changed", onChanged);
    const interval = setInterval(refresh, 5 * 60 * 1000);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("gcal-events-changed", onChanged);
      clearInterval(interval);
    };
  }, [refresh]);

  function open() {
    window.dispatchEvent(new CustomEvent("open-gcal-modal"));
  }

  if (count === null || count === 0) {
    return (
      <button
        type="button"
        onClick={open}
        title="Calendar (w)"
        className="group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl text-muted-foreground/40 hover:text-foreground hover:bg-accent hover:scale-110 transition-all"
      >
        📅
        <span className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground border border-border opacity-0 group-hover:opacity-100 touch:opacity-100 transition-opacity font-mono">
          Calendar (w)
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={open}
      title={`${count} event${count === 1 ? "" : "s"} today · press w`}
      className="group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl text-glow hover:bg-accent hover:scale-110 transition-all"
    >
      📅
      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-glow text-background text-[10px] font-mono font-bold flex items-center justify-center border border-background">
        {count > 99 ? "99+" : count}
      </span>
      <span className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground border border-border opacity-0 group-hover:opacity-100 touch:opacity-100 transition-opacity font-mono">
        {count} today · w
      </span>
    </button>
  );
}
