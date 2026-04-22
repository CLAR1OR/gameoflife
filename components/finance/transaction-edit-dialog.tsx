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
import { updateTransaction } from "@/modules/finance/actions";
import type {
  FinanceAccount,
  FinanceTransaction,
  TransactionType,
} from "@/modules/finance/queries";
import { formatMoney, parseMoneyInput, centsToInputString } from "@/lib/money";

type Props = {
  transaction: FinanceTransaction;
  accounts: FinanceAccount[];
  currency: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TransactionEditDialog({
  transaction,
  accounts,
  currency,
  open,
  onOpenChange,
}: Props) {
  const [type, setType] = useState<TransactionType>(transaction.type);
  const [amount, setAmount] = useState(centsToInputString(transaction.amount));
  const [category, setCategory] = useState(transaction.category);
  const [note, setNote] = useState(transaction.note ?? "");
  const [date, setDate] = useState(transaction.occurredOn);
  const [accountId, setAccountId] = useState<string>(
    transaction.accountId ?? ""
  );
  const [transferToAccountId, setTransferToAccountId] = useState<string>(
    transaction.transferToAccountId ?? ""
  );
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
      const res = await updateTransaction(transaction.id, {
        type,
        amount: parsedCents,
        category: category.trim(),
        note: note.trim() || undefined,
        occurredOn: date,
        accountId: accountId || null,
        transferToAccountId:
          type === "transfer" ? transferToAccountId || null : null,
      });
      toast.success(
        "Transaction updated" +
          (res.xpAwarded ? ` · +${res.xpAwarded} XP` : "")
      );
      if (res.newAchievements && res.newAchievements.length > 0) {
        toast.success(
          `🏆 Achievement unlocked: ${res.newAchievements.join(", ")}!`,
          { duration: 6000 }
        );
      }
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
            <DialogTitle>Edit transaction</DialogTitle>
          </DialogHeader>

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
            <button
              type="button"
              onClick={() => setType("transfer")}
              className={`flex-1 py-1.5 rounded-md border text-xs font-mono uppercase tracking-wider transition-all ${
                type === "transfer"
                  ? "border-yellow-400/60 bg-yellow-400/10 text-yellow-400"
                  : "border-border bg-muted/20 text-muted-foreground"
              }`}
            >
              ↔ Transfer
            </button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-amount">
              Amount ({formatMoney(parseMoneyInput(amount) ?? 0, currency)})
            </Label>
            <Input
              id="edit-amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="font-mono text-lg"
            />
          </div>

          {type === "transfer" ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="edit-from">From</Label>
                <select
                  id="edit-from"
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
              <div className="space-y-1">
                <Label htmlFor="edit-to">To</Label>
                <select
                  id="edit-to"
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
              <Label htmlFor="edit-account">Account</Label>
              <select
                id="edit-account"
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
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-category">Category</Label>
            <Input
              id="edit-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="edit-date">Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-note">Note</Label>
              <Input
                id="edit-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
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
