"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTransaction } from "@/modules/finance/actions";
import type {
  FinanceAccount,
  TransactionType,
} from "@/modules/finance/queries";
import { formatMoney, parseMoneyInput } from "@/lib/money";

type Props = {
  today: string;
  categorySuggestions: string[];
  accounts: FinanceAccount[];
  currency: string;
};

const DEFAULT_CATEGORIES_INCOME = ["Salary", "Freelance", "Gift", "Investment", "Other"];
const DEFAULT_CATEGORIES_EXPENSE = [
  "Food",
  "Rent",
  "Transport",
  "Entertainment",
  "Shopping",
  "Health",
  "Other",
];
const DEFAULT_CATEGORIES_TRANSFER = ["Transfer", "Savings", "Rebalance"];

export function TransactionForm({ today, categorySuggestions, accounts, currency }: Props) {
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(today);
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id ?? "");
  const [transferToAccountId, setTransferToAccountId] = useState<string>(
    accounts[1]?.id ?? ""
  );
  const [loading, setLoading] = useState(false);

  const defaults =
    type === "income"
      ? DEFAULT_CATEGORIES_INCOME
      : type === "expense"
        ? DEFAULT_CATEGORIES_EXPENSE
        : DEFAULT_CATEGORIES_TRANSFER;
  const suggestions = Array.from(new Set([...categorySuggestions, ...defaults])).slice(0, 12);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedCents = parseMoneyInput(amount);
    if (parsedCents === null || parsedCents <= 0) {
      toast.error("Enter a positive amount");
      return;
    }
    if (!category.trim()) {
      toast.error("Pick or type a category");
      return;
    }
    if (type === "transfer") {
      if (!accountId || !transferToAccountId) {
        toast.error("Pick source and destination accounts");
        return;
      }
      if (accountId === transferToAccountId) {
        toast.error("Source and destination must differ");
        return;
      }
    }
    setLoading(true);
    try {
      const res = await createTransaction({
        type,
        amount: parsedCents,
        category: category.trim(),
        note: note.trim() || undefined,
        occurredOn: date,
        accountId: accountId || null,
        transferToAccountId:
          type === "transfer" ? transferToAccountId || null : null,
      });
      const prefix = type === "income" ? "+" : type === "expense" ? "−" : "↔";
      toast.success(
        `${prefix}${formatMoney(parsedCents, currency)} · ${category.trim()}` +
          (res.xpAwarded ? ` · +${res.xpAwarded} XP` : "")
      );
      if (res.newAchievements && res.newAchievements.length > 0) {
        toast.success(
          `🏆 Achievement unlocked: ${res.newAchievements.join(", ")}!`,
          { duration: 6000 }
        );
      }
      setAmount("");
      setNote("");
      setCategory("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
    setLoading(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border bg-card p-5 space-y-4"
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setType("expense")}
          className={`flex-1 py-2 rounded-lg border-2 text-xs font-mono uppercase tracking-wider transition-all ${
            type === "expense"
              ? "border-red-500/60 bg-red-500/10 text-red-400"
              : "border-border bg-muted/20 text-muted-foreground hover:border-border"
          }`}
        >
          − Expense
        </button>
        <button
          type="button"
          onClick={() => setType("income")}
          className={`flex-1 py-2 rounded-lg border-2 text-xs font-mono uppercase tracking-wider transition-all ${
            type === "income"
              ? "border-glow/60 bg-glow/10 text-glow"
              : "border-border bg-muted/20 text-muted-foreground hover:border-border"
          }`}
        >
          + Income
        </button>
        <button
          type="button"
          onClick={() => setType("transfer")}
          className={`flex-1 py-2 rounded-lg border-2 text-xs font-mono uppercase tracking-wider transition-all ${
            type === "transfer"
              ? "border-yellow-400/60 bg-yellow-400/10 text-yellow-400"
              : "border-border bg-muted/20 text-muted-foreground hover:border-border"
          }`}
        >
          ↔ Transfer
        </button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">
          Amount
          {amount && (
            <span className="text-muted-foreground/70 ml-2 text-xs font-mono">
              {formatMoney(parseMoneyInput(amount) ?? 0, currency)}
            </span>
          )}
        </Label>
        <Input
          id="amount"
          inputMode="decimal"
          placeholder="0,00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="text-lg font-mono"
        />
      </div>

      {type === "transfer" ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="from">From</Label>
            <select
              id="from"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="">— pick —</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <select
              id="to"
              value={transferToAccountId}
              onChange={(e) => setTransferToAccountId(e.target.value)}
              className="w-full h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="">— pick —</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="account">Account</Label>
          <select
            id="account"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full h-9 rounded-md border bg-background px-3 text-sm"
          >
            <option value="">— none (log only) —</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} · {formatMoney(a.balance, currency)}
              </option>
            ))}
          </select>
          {accounts.length === 0 && (
            <p className="text-[11px] text-muted-foreground/70">
              Add an account to track balance changes.
            </p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Input
          id="category"
          placeholder="e.g. Food, Rent, Salary"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <div className="flex flex-wrap gap-1.5 pt-1">
          {suggestions.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setCategory(c)}
              className={`text-[10px] font-mono px-2 py-1 rounded-md border transition-colors ${
                category === c
                  ? "border-glow/60 bg-glow/10 text-glow"
                  : "border-border bg-muted/20 text-muted-foreground hover:border-glow/40 hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="note">Note (optional)</Label>
          <Input
            id="note"
            placeholder=""
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Saving…" : "Add transaction"}
      </Button>
    </form>
  );
}
