"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { FOCUS_LABEL, type PracticeFocus } from "@/lib/practice-routines";

export type TimerBlock = {
  id: string;
  name: string;
  focus: PracticeFocus;
  minutes: number;
};

type RunningSession = {
  routineId: string;
  startedAt: number; // epoch ms
  totalMinutes: number;
  blocks: TimerBlock[];
  pausedAt: number | null;
  pausedAccum: number; // accumulated pause ms
};

function storageKey(categoryId: string) {
  return `gol:practice-session:${categoryId}`;
}

function loadSession(categoryId: string): RunningSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(categoryId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RunningSession;
    if (!parsed.routineId || !Array.isArray(parsed.blocks)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveSession(categoryId: string, s: RunningSession | null) {
  if (typeof window === "undefined") return;
  if (s === null) {
    window.localStorage.removeItem(storageKey(categoryId));
  } else {
    window.localStorage.setItem(storageKey(categoryId), JSON.stringify(s));
  }
}

/** Soft Web-Audio chime on block transitions / session end. No external assets. */
function playChime(kind: "tick" | "done" = "tick") {
  if (typeof window === "undefined") return;
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    const baseFreq = kind === "done" ? 660 : 880;
    const tones = kind === "done" ? [baseFreq, baseFreq * 1.5, baseFreq * 2] : [baseFreq];
    const now = ctx.currentTime;
    tones.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = 0;
      g.gain.linearRampToValueAtTime(0.18, now + i * 0.18 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.18 + 0.45);
      osc.connect(g);
      g.connect(gain);
      osc.start(now + i * 0.18);
      osc.stop(now + i * 0.18 + 0.5);
    });
    setTimeout(() => ctx.close(), 1500);
  } catch {
    // ignore audio failures
  }
}

function formatMMSS(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

type Computed = {
  /** Current block index in `blocks`, or -1 if not started, or blocks.length if done. */
  currentIndex: number;
  blockElapsedMs: number;
  blockTotalMs: number;
  totalElapsedMs: number;
  totalMs: number;
};

function computeProgress(s: RunningSession, nowMs: number): Computed {
  const totalMs = s.totalMinutes * 60_000;
  const pauseExtra = s.pausedAt ? nowMs - s.pausedAt : 0;
  const elapsed = Math.max(
    0,
    Math.min(totalMs, nowMs - s.startedAt - s.pausedAccum - pauseExtra)
  );

  // Walk the blocks to find the current one.
  let acc = 0;
  for (let i = 0; i < s.blocks.length; i++) {
    const blockMs = s.blocks[i].minutes * 60_000;
    if (elapsed < acc + blockMs) {
      return {
        currentIndex: i,
        blockElapsedMs: elapsed - acc,
        blockTotalMs: blockMs,
        totalElapsedMs: elapsed,
        totalMs,
      };
    }
    acc += blockMs;
  }
  return {
    currentIndex: s.blocks.length,
    blockElapsedMs: 0,
    blockTotalMs: 0,
    totalElapsedMs: totalMs,
    totalMs,
  };
}

export function PracticeTimer({
  categoryId,
  routineId,
  blocks,
  totalMinutes,
  onActiveBlockChange,
  disabled,
}: {
  categoryId: string;
  routineId: string;
  blocks: TimerBlock[];
  totalMinutes: number;
  onActiveBlockChange?: (blockId: string | null) => void;
  disabled?: boolean;
}) {
  const [session, setSession] = useState<RunningSession | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const lastIndexRef = useRef<number>(-1);

  // Restore in-flight session for this category from storage.
  useEffect(() => {
    const loaded = loadSession(categoryId);
    if (loaded && loaded.routineId === routineId) {
      setSession(loaded);
    }
  }, [categoryId, routineId]);

  // Persist whenever it changes.
  useEffect(() => {
    saveSession(categoryId, session);
  }, [categoryId, session]);

  // Tick.
  useEffect(() => {
    if (!session || session.pausedAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [session, session?.pausedAt]);

  // Detect block transitions for chime + active-block emit.
  useEffect(() => {
    if (!session) {
      if (lastIndexRef.current !== -1) {
        lastIndexRef.current = -1;
        onActiveBlockChange?.(null);
      }
      return;
    }
    const c = computeProgress(session, now);
    if (c.currentIndex !== lastIndexRef.current) {
      // Chime on every transition except the very first activation
      // (which happens on Start).
      if (lastIndexRef.current !== -1) {
        if (c.currentIndex >= session.blocks.length) {
          playChime("done");
          toast.success("Session complete");
        } else {
          playChime("tick");
          const b = session.blocks[c.currentIndex];
          if (b) toast.info(`Next: ${b.name}`);
        }
      }
      lastIndexRef.current = c.currentIndex;
      const activeId =
        c.currentIndex >= session.blocks.length
          ? null
          : session.blocks[c.currentIndex]?.id ?? null;
      onActiveBlockChange?.(activeId);
    }
  }, [now, session, onActiveBlockChange]);

  // Auto-stop when complete (after one render so chime + state both fire).
  useEffect(() => {
    if (!session) return;
    const c = computeProgress(session, now);
    if (c.currentIndex >= session.blocks.length) {
      const t = window.setTimeout(() => {
        setSession(null);
      }, 200);
      return () => window.clearTimeout(t);
    }
  }, [now, session]);

  function start() {
    if (disabled) return;
    const filtered = blocks.filter((b) => b.minutes > 0);
    if (filtered.length === 0) {
      toast.error("This routine has no time-allocated blocks.");
      return;
    }
    const fresh: RunningSession = {
      routineId,
      startedAt: Date.now(),
      totalMinutes,
      blocks: filtered,
      pausedAt: null,
      pausedAccum: 0,
    };
    setSession(fresh);
    lastIndexRef.current = -1;
    onActiveBlockChange?.(filtered[0]?.id ?? null);
    playChime("tick");
  }

  function pauseOrResume() {
    if (!session) return;
    if (session.pausedAt) {
      const extra = Date.now() - session.pausedAt;
      setSession({
        ...session,
        pausedAt: null,
        pausedAccum: session.pausedAccum + extra,
      });
    } else {
      setSession({ ...session, pausedAt: Date.now() });
    }
  }

  function skipBlock() {
    if (!session) return;
    const c = computeProgress(session, Date.now());
    if (c.currentIndex >= session.blocks.length) return;
    const blockRemaining = c.blockTotalMs - c.blockElapsedMs;
    // Effectively fast-forward by reducing pausedAccum by the remaining ms
    // (i.e. as if no pause, "extra time" already used).
    setSession({
      ...session,
      pausedAccum: Math.max(0, session.pausedAccum - blockRemaining),
    });
  }

  function finish() {
    if (!session) return;
    if (!confirm("End this practice session?")) return;
    setSession(null);
    onActiveBlockChange?.(null);
  }

  if (!session) {
    return (
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={start}
          disabled={disabled || blocks.filter((b) => b.minutes > 0).length === 0}
          className="bg-glow/15 hover:bg-glow/25 text-glow border border-glow/40 h-8 text-xs"
        >
          ▶ Start session
        </Button>
        <span className="text-[10px] font-mono text-muted-foreground">
          {totalMinutes} min · {blocks.filter((b) => b.minutes > 0).length} blocks
        </span>
      </div>
    );
  }

  const c = computeProgress(session, now);
  const block = session.blocks[c.currentIndex];
  const blockRemaining = block ? c.blockTotalMs - c.blockElapsedMs : 0;
  const totalRemaining = c.totalMs - c.totalElapsedMs;
  const totalPct = (c.totalElapsedMs / c.totalMs) * 100;
  const blockPct = block ? (c.blockElapsedMs / c.blockTotalMs) * 100 : 100;
  const isPaused = !!session.pausedAt;

  return (
    <div className="rounded-lg border border-glow/40 bg-glow/5 p-3 space-y-2">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-glow flex items-center gap-2">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isPaused ? "bg-warning" : "bg-glow animate-pulse"
              }`}
            />
            {block ? FOCUS_LABEL[block.focus] : "Done"} ·{" "}
            {isPaused ? "paused" : "in session"}
          </div>
          <div className="text-base font-bold leading-tight mt-0.5">
            {block ? block.name : "Session complete"}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-mono text-glow leading-none tabular-nums">
            {formatMMSS(blockRemaining / 1000)}
          </div>
          <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
            block · {formatMMSS(totalRemaining / 1000)} left in session
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <Progress value={blockPct} className="h-1 xp-bar" />
        <Progress value={totalPct} className="h-0.5" />
      </div>

      <div className="flex items-center gap-1 flex-wrap">
        <Button
          size="sm"
          variant="ghost"
          onClick={pauseOrResume}
          className="h-7 text-xs"
        >
          {isPaused ? "▶ Resume" : "⏸ Pause"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={skipBlock}
          className="h-7 text-xs"
          disabled={c.currentIndex >= session.blocks.length}
        >
          ⏭ Skip block
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={finish}
          className="h-7 text-xs text-destructive ml-auto"
        >
          ⏹ End session
        </Button>
      </div>
    </div>
  );
}
