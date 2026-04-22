"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createRecurring,
  deleteRecurring,
  toggleRecurring,
} from "@/modules/finance/actions";
import type {
  FinanceRecurring,
  FinanceAccount,
} from "@/modules/finance/queries";
import { RecurringEditDialog } from "./recurring-edit-dialog";
import { formatMoney, parseMoneyInput } from "@/lib/money";

function formatDueLabel(iso: string, today: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const [ty, tm, td] = today.split("-").map(Number);
  const due = new Date(y, m - 1, d);
  const now = new Date(ty, tm - 1, td);
  const days = Math.round((due.getTime() - now.getTime()) / 86400000);
  const date = due.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  if (days === 0) return `${date} · today`;
  if (days === 1) return `${date} · tomorrow`;
  if (days > 1 && days <= 30) return `${date} · in ${days} days`;
  if (days < 0) return `${date} · ${-days}d overdue`;
  return date;
}

export function RecurringSection({
  recurrings,
  accounts,
  today,
  currency,
}: {
  recurrings: FinanceRecurring[];
  accounts: FinanceAccount[];
  today: string;
  currency: string;
}) {
  const [adding, setAdding] = useState(false);

  return (
    <section>
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          Recurring
        </h2>
        <button
          type="button"
          onClick={() => setAdding((s) => !s)}
          className="ml-auto text-xs text-muted-foreground hover:text-foreground font-mono transition-colors"
        >
          {adding ? "Cancel" : "+ Add"}
        </button>
      </div>

      {adding && (
        <div className="mb-3">
          <AddRecurringForm
            accounts={accounts}
            today={today}
            onDone={() => setAdding(false)}
          />
        </div>
      )}

      {recurrings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/10 p-6 text-center">
          <p className="text-xs text-muted-foreground">
            No recurring transactions yet. Add your salary, rent, or subscriptions.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card divide-y divide-border/60">
          {recurrings.map((r) => (
            <RecurringRow
              key={r.id}
              recurring={r}
              accounts={accounts}
              today={today}
              currency={currency}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function RecurringRow({
  recurring,
  accounts,
  today,
  currency,
}: {
  recurring: FinanceRecurring;
  accounts: FinanceAccount[];
  today: string;
  currency: string;
}) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const account = accounts.find((a) => a.id === recurring.accountId);

  function handleToggle() {
    startTransition(async () => {
      try {
        await toggleRecurring(recurring.id, !recurring.active);
        toast.success(recurring.active ? "Paused" : "Resumed");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  function handleDelete() {
    if (!confirm(`Delete "${recurring.category}"? Past transactions stay.`))
      return;
    startTransition(async () => {
      try {
        await deleteRecurring(recurring.id);
        toast.success("Deleted");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <div
      className={`flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors ${
        recurring.active ? "" : "opacity-50"
      }`}
    >
      <div
        className={`shrink-0 w-1 h-10 rounded-full ${
          recurring.type === "income" ? "bg-glow/70" : "bg-red-500/70"
        }`}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{recurring.category}</span>
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
            {recurring.cadence}
          </span>
          {account && (
            <span className="text-[10px] font-mono text-muted-foreground/60">
              · {account.name}
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          Next: {formatDueLabel(recurring.nextDueOn, today)}
          {recurring.note ? ` · ${recurring.note}` : ""}
        </div>
      </div>
      <div
        className={`font-mono text-sm font-bold shrink-0 ${
          recurring.type === "income" ? "text-glow" : "text-red-400"
        }`}
      >
        {recurring.type === "income" ? "+" : "−"}
        {formatMoney(recurring.amount, currency)}
      </div>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-[10px] font-mono px-2 py-1 rounded border border-border hover:border-glow/40 hover:text-foreground transition-colors"
        aria-label="Edit"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={handleToggle}
        disabled={pending}
        className="text-[10px] font-mono px-2 py-1 rounded border border-border hover:border-glow/40 hover:text-foreground transition-colors"
        aria-label={recurring.active ? "Pause" : "Resume"}
      >
        {recurring.active ? "Pause" : "Resume"}
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        className="text-xs text-muted-foreground/40 hover:text-red-400 transition-colors"
        aria-label="Delete"
      >
        ✕
      </button>
      {editing && (
        <RecurringEditDialog
          recurring={recurring}
          accounts={accounts}
          currency={currency}
          open={editing}
          onOpenChange={setEditing}
        />
      )}
    </div>
  );
}

function AddRecurringForm({
  accounts,
  today,
  onDone,
}: {
  accounts: FinanceAccount[];
  today: string;
  onDone: () => void;
}) {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [cadence, setCadence] = useState<"monthly" | "yearly">("monthly");
  const [nextDueOn, setNextDueOn] = useState(today);
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedCents = parseMoneyInput(amount);
    if (parsedCents === null || parsedCents <= 0) {
      toast.error("Enter a positive amount");
      return;
    }
    if (!category.trim()) {
      toast.error("Pick a category");
      return;
    }
    startTransition(async () => {
      try {
        const res = await createRecurring({
          type,
          amount: parsedCents,
          category: category.trim(),
          cadence,
          nextDueOn,
          note: note.trim() || undefined,
          accountId: accountId || null,
        });
        toast.success("Recurring added");
        if (res.newAchievements && res.newAchievements.length > 0) {
          toast.success(
            `🏆 Achievement unlocked: ${res.newAchievements.join(", ")}!`,
            { duration: 6000 }
          );
        }
        onDone();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border bg-card p-4 space-y-3"
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setType("expense")}
          className={`flex-1 py-1.5 rounded-md border text-xs font-mono uppercase tracking-wider transition-all ${
            type === "expense"
              ? "border-red-500/60 bg-red-500/10 text-red-400"
              : "border-border bg-muted/20 text-muted-foreground"
          }`}
        >
          − Expense
        </button>
        <button
          type="button"
          onClick={() => setType("income")}
          className={`flex-1 py-1.5 rounded-md border text-xs font-mono uppercase tracking-wider transition-all ${
            type === "income"
              ? "border-glow/60 bg-glow/10 text-glow"
              : "border-border bg-muted/20 text-muted-foreground"
          }`}
        >
          + Income
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Input
          inputMode="decimal"
          placeholder="Amount (0,00)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="font-mono"
        />
        <Input
          placeholder="Category (e.g. Rent)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setCadence("monthly")}
          className={`flex-1 py-1.5 rounded-md border text-xs font-mono uppercase tracking-wider transition-all ${
            cadence === "monthly"
              ? "border-glow/60 bg-glow/10 text-glow"
              : "border-border bg-muted/20 text-muted-foreground"
          }`}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => setCadence("yearly")}
          className={`flex-1 py-1.5 rounded-md border text-xs font-mono uppercase tracking-wider transition-all ${
            cadence === "yearly"
              ? "border-glow/60 bg-glow/10 text-glow"
              : "border-border bg-muted/20 text-muted-foreground"
          }`}
        >
          Yearly
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor="next-due-on" className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Next due
          </Label>
          <Input
            id="next-due-on"
            type="date"
            value={nextDueOn}
            onChange={(e) => setNextDueOn(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="account" className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Account
          </Label>
          <select
            id="account"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full h-9 rounded-md border bg-background px-3 text-sm"
          >
            <option value="">— none —</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Input
        placeholder="Note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending} className="flex-1">
          {pending ? "…" : "Add recurring"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onDone}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
