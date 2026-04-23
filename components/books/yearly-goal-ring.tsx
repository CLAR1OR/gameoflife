"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateYearlyBookGoal } from "@/modules/settings/actions";
import { toast } from "sonner";

function dayOfYearPct(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const end = new Date(now.getFullYear() + 1, 0, 1);
  const total = end.getTime() - start.getTime();
  const so_far = now.getTime() - start.getTime();
  return so_far / total;
}

export function YearlyGoalRing({
  read,
  goal: initialGoal,
}: {
  read: number;
  goal: number;
}) {
  const [open, setOpen] = useState(false);
  const [goal, setGoal] = useState(initialGoal);
  const [input, setInput] = useState(String(initialGoal || 30));
  const [loading, setLoading] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const n = parseInt(input, 10);
    if (!Number.isFinite(n) || n < 0) {
      toast.error("Please enter a non-negative number");
      return;
    }
    setLoading(true);
    try {
      const { yearlyBookGoal } = await updateYearlyBookGoal(n);
      setGoal(yearlyBookGoal);
      toast.success(
        yearlyBookGoal === 0
          ? "Yearly goal cleared"
          : `Yearly goal set to ${yearlyBookGoal}`
      );
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setLoading(false);
  }

  const year = new Date().getFullYear();
  const hasGoal = goal > 0;
  const pct = hasGoal ? Math.min(1, read / goal) : 0;
  const size = 120;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - pct);

  // Pace: if you'd need to be at X% by today, how far ahead/behind is the user
  const expectedPct = dayOfYearPct();
  const aheadBy = hasGoal ? pct - expectedPct : 0;
  const onTrack = aheadBy >= -0.02; // small tolerance
  const paceLabel = !hasGoal
    ? null
    : pct >= 1
      ? "✓ Goal reached"
      : onTrack
        ? "On pace"
        : `${Math.round(Math.abs(aheadBy) * goal)} behind`;
  const paceClass = !hasGoal
    ? ""
    : pct >= 1
      ? "text-xp"
      : onTrack
        ? "text-glow"
        : "text-amber-400";

  const stroke_color = pct >= 1 ? "#facc15" : "#00ff88";

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setInput(String(goal || 30));
          setOpen(true);
        }}
        className="group relative rounded-xl border border-border/60 bg-card p-4 hover:border-glow/40 transition-colors flex items-center gap-4 h-full w-full text-left"
        title="Click to edit yearly reading goal"
      >
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeOpacity={0.15}
              strokeWidth={stroke}
              fill="none"
              className="text-muted-foreground"
            />
            {hasGoal && (
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={stroke_color}
                strokeWidth={stroke}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                style={{
                  transition: "stroke-dashoffset 500ms ease",
                  filter: `drop-shadow(0 0 6px ${stroke_color}80)`,
                }}
              />
            )}
            {/* Pace tick: small line at the "expected" position */}
            {hasGoal && pct < 1 && (() => {
              const angle = expectedPct * 2 * Math.PI - Math.PI / 2;
              const inner = radius - stroke / 2 - 2;
              const outer = radius + stroke / 2 + 2;
              const cx = size / 2;
              const cy = size / 2;
              const x1 = cx + inner * Math.cos(angle);
              const y1 = cy + inner * Math.sin(angle);
              const x2 = cx + outer * Math.cos(angle);
              const y2 = cy + outer * Math.sin(angle);
              return (
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="currentColor"
                  strokeWidth={2}
                  className="text-muted-foreground"
                  transform={`rotate(90 ${cx} ${cy})`}
                />
              );
            })()}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center font-mono leading-none">
            {hasGoal ? (
              <>
                <span className="text-2xl font-bold text-foreground">
                  {read}
                </span>
                <span className="text-xs text-muted-foreground mt-0.5">
                  / {goal}
                </span>
              </>
            ) : (
              <>
                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  Set
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  goal
                </span>
              </>
            )}
          </div>
        </div>
        <div className="text-left">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            {year} Reading Goal
          </div>
          {hasGoal ? (
            <>
              <div className={`text-sm font-semibold mt-0.5 ${paceClass}`}>
                {paceLabel}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {read} of {goal} book{goal === 1 ? "" : "s"} read
                {pct < 1 && (
                  <>
                    {" · "}
                    {goal - read} to go
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="text-xs text-muted-foreground mt-0.5">
              Click to set a yearly reading goal
            </div>
          )}
        </div>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>Yearly Reading Goal</DialogTitle>
              <DialogDescription>
                Set how many books you want to read in {year}. Set to 0 to
                remove the goal.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
              <Label htmlFor="yearly-goal">Books in {year}</Label>
              <Input
                id="yearly-goal"
                type="number"
                min="0"
                max="1000"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Common targets: 12 (one a month), 25, 50, 100.
              </p>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
