"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateRecurring } from "@/modules/finance/actions";
import type {
  FinanceAccount,
  FinanceRecurring,
} from "@/modules/finance/types";
import { formatMoney, parseMoneyInput, centsToInputString } from "@/lib/money";

type Props = {
  recurring: FinanceRecurring;
  accounts: FinanceAccount[];
  currency: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RecurringEditDialog({
  recurring,
  accounts,
  currency,
  open,
  onOpenChange,
}: Props) {
  const [type, setType] = useState<"income" | "expense">(recurring.type);
  const [amount, setAmount] = useState(centsToInputString(recurring.amount));
  const [category, setCategory] = useState(recurring.category);
  const [note, setNote] = useState(recurring.note ?? "");
  const [cadence, setCadence] = useState<"monthly" | "yearly">(recurring.cadence);
  const [nextDueOn, setNextDueOn] = useState(recurring.nextDueOn);
  const [accountId, setAccountId] = useState<string>(recurring.accountId ?? "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedCents = parseMoneyInput(amount);
    if (parsedCents === null || parsedCents <= 0) {
      toast.error("Enter a positive amount");
      return;
    }
    if (!category.trim()) {
      toast.error("Category is required");
      return;
    }
    setLoading(true);
    try {
      await updateRecurring(recurring.id, {
        type,
        amount: parsedCents,
        category: category.trim(),
        note: note.trim() || undefined,
        cadence,
        nextDueOn,
        accountId: accountId || null,
      });
      toast.success("Recurring updated");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Edit recurring</DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={`flex-1 py-1.5 rounded-md border text-xs font-mono uppercase tracking-wider transition-all ${
                type === "expense"
                  ? "border-destructive/60 bg-destructive/10 text-destructive"
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
            <div className="space-y-1">
              <Label htmlFor="edit-r-amount">
                Amount ({formatMoney(parseMoneyInput(amount) ?? 0, currency)})
              </Label>
              <Input
                id="edit-r-amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-r-category">Category</Label>
              <Input
                id="edit-r-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
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
              <Label htmlFor="edit-r-date">Next due</Label>
              <Input
                id="edit-r-date"
                type="date"
                value={nextDueOn}
                onChange={(e) => setNextDueOn(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-r-account">Account</Label>
              <select
                id="edit-r-account"
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

          <div className="space-y-1">
            <Label htmlFor="edit-r-note">Note</Label>
            <Input
              id="edit-r-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
