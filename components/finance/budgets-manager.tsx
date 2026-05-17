"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setBudget, deleteBudget } from "@/modules/finance/actions";
import { formatMoney, parseMoneyInput, centsToInputString } from "@/lib/money";
import { toast } from "sonner";
import type { FinanceBudget } from "@/modules/finance/types";

/**
 * List + add + edit + delete budgets. Shows current-month actual vs.
 * target so the user can see at a glance whether a budget is realistic.
 */
export function BudgetsManager({
  budgets,
  actualByCategory,
  categorySuggestions,
  currency,
  yearMonth,
}: {
  budgets: FinanceBudget[];
  actualByCategory: Record<string, number>;
  categorySuggestions: string[];
  currency: string;
  yearMonth: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState("");

  const monthLabel = (() => {
    const [y, m] = yearMonth.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  })();

  async function handleCreate() {
    const trimmed = newCategory.trim();
    if (!trimmed) {
      toast.error("Pick a category");
      return;
    }
    const cents = parseMoneyInput(newTarget);
    if (cents === null || cents < 0) {
      toast.error("Enter a valid target amount");
      return;
    }
    setBusy(true);
    try {
      await setBudget({ category: trimmed, targetCents: cents });
      toast.success(`Budget set: ${trimmed}`);
      setNewCategory("");
      setNewTarget("");
      setAdding(false);
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }

  async function handleSaveEdit(b: FinanceBudget) {
    const cents = parseMoneyInput(editTarget);
    if (cents === null || cents < 0) {
      toast.error("Enter a valid target amount");
      return;
    }
    setBusy(true);
    try {
      await setBudget({ category: b.category, targetCents: cents });
      toast.success("Updated");
      setEditingId(null);
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }

  async function handleDelete(b: FinanceBudget) {
    if (!confirm(`Remove budget for "${b.category}"?`)) return;
    try {
      await deleteBudget(b.id);
      toast.success("Removed");
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  // Categories already in use that don't yet have a budget — handy for the
  // "+ add" autocomplete.
  const budgetedCats = new Set(budgets.map((b) => b.category));
  const unbudgeted = categorySuggestions.filter((c) => !budgetedCats.has(c));

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          Monthly budgets · actual is {monthLabel}
        </h2>
        {!adding && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAdding(true)}
          >
            + Add budget
          </Button>
        )}
      </div>

      {adding && (
        <div className="rounded-md border border-glow/30 bg-glow/5 p-3 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px_auto_auto] gap-2 items-end">
            <div className="space-y-1">
              <Label className="text-[10px]">Category</Label>
              <Input
                list="budget-cat-suggestions"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="e.g. Groceries"
                className="h-8 text-xs"
                autoFocus
              />
              <datalist id="budget-cat-suggestions">
                {unbudgeted.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Monthly target</Label>
              <Input
                inputMode="decimal"
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value)}
                placeholder="200.00"
                className="h-8 text-xs"
              />
            </div>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={busy || !newCategory.trim() || !newTarget.trim()}
            >
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setAdding(false);
                setNewCategory("");
                setNewTarget("");
              }}
              disabled={busy}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {budgets.length === 0 && !adding ? (
        <div className="rounded-xl border border-dashed bg-muted/20 p-6 text-center text-sm text-muted-foreground">
          No budgets yet. Pick a category, set a monthly cap, and the
          Overview page will start showing whether you&apos;re on track.
        </div>
      ) : (
        <ul className="space-y-1.5">
          {budgets.map((b) => {
            const actual = actualByCategory[b.category] ?? 0;
            const pct = b.targetCents > 0
              ? Math.min(150, (actual / b.targetCents) * 100)
              : 0;
            const over = actual > b.targetCents;
            const near = !over && actual / b.targetCents >= 0.8;
            const barColor = over
              ? "bg-destructive"
              : near
                ? "bg-amber-500"
                : "bg-emerald-500";
            return (
              <li
                key={b.id}
                className="rounded-md border border-border/60 bg-card px-3 py-2.5 group"
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <span className="text-sm font-medium truncate">
                        {b.category}
                      </span>
                      <span className="text-xs font-mono tabular-nums shrink-0">
                        <span
                          className={
                            over
                              ? "text-destructive"
                              : near
                                ? "text-amber-500"
                                : "text-emerald-500"
                          }
                        >
                          {formatMoney(actual, currency)}
                        </span>
                        <span className="text-muted-foreground">
                          {" "}
                          / {formatMoney(b.targetCents, currency)}
                        </span>
                        <span className="text-[10px] text-muted-foreground/70 ml-2">
                          {((actual / Math.max(1, b.targetCents)) * 100).toFixed(0)}%
                        </span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
                      <div
                        className={`${barColor} h-full rounded-full transition-[width] duration-300`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {over && (
                      <div className="text-[10px] font-mono text-destructive mt-1">
                        ⚠ over by {formatMoney(actual - b.targetCents, currency)}
                      </div>
                    )}
                  </div>

                  {editingId === b.id ? (
                    <div className="flex items-end gap-1">
                      <Input
                        inputMode="decimal"
                        value={editTarget}
                        onChange={(e) => setEditTarget(e.target.value)}
                        className="h-8 text-xs w-28"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={() => handleSaveEdit(b)}
                        disabled={busy}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                      >
                        ✕
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 touch:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => {
                          setEditingId(b.id);
                          setEditTarget(centsToInputString(b.targetCents));
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-destructive"
                        onClick={() => handleDelete(b)}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
