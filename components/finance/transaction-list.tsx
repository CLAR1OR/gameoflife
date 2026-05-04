"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { celebrate } from "@/lib/celebrate";
import { deleteTransaction } from "@/modules/finance/actions";
import { TransactionEditDialog } from "./transaction-edit-dialog";
import type {
  FinanceTransaction,
  FinanceAccount,
} from "@/modules/finance/queries";
import { formatMoney } from "@/lib/money";

function formatShortDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatFullDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function TransactionList({
  transactions,
  accounts,
  currency,
}: {
  transactions: FinanceTransaction[];
  accounts: FinanceAccount[];
  currency: string;
}) {
  const [items, setItems] = useState(transactions);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const accountMap = useMemo(() => {
    const m = new Map<string, FinanceAccount>();
    for (const a of accounts) m.set(a.id, a);
    return m;
  }, [accounts]);

  function handleDelete(id: string) {
    if (!confirm("Delete this transaction?")) return;
    const prev = items;
    setItems((list) => list.filter((t) => t.id !== id));
    setDeletingId(id);
    startTransition(async () => {
      try {
        const res = await deleteTransaction(id);
        toast.success(
          "Transaction deleted" +
            (res.xpAwarded ? ` · +${res.xpAwarded} XP` : "")
        );
        if (res.newAchievements && res.newAchievements.length > 0) {
          celebrate(res.newAchievements);
        }
        if (expandedId === id) setExpandedId(null);
      } catch (err) {
        setItems(prev);
        toast.error(err instanceof Error ? err.message : "Failed");
      } finally {
        setDeletingId(null);
      }
    });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/10 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No transactions yet. Add your first one →
        </p>
      </div>
    );
  }

  const editingTx = editingId ? items.find((t) => t.id === editingId) : null;

  return (
    <>
      <div className="rounded-xl border bg-card divide-y divide-border/60 overflow-hidden">
        {items.map((t) => {
          const fromAccount = t.accountId ? accountMap.get(t.accountId) : null;
          const toAccount = t.transferToAccountId
            ? accountMap.get(t.transferToAccountId)
            : null;
          const accentBar =
            t.type === "income"
              ? "bg-glow/70"
              : t.type === "expense"
                ? "bg-destructive/70"
                : "bg-xp/70";
          const amountClass =
            t.type === "income"
              ? "text-glow"
              : t.type === "expense"
                ? "text-destructive"
                : "text-xp";
          const prefixSymbol =
            t.type === "income" ? "+" : t.type === "expense" ? "−" : "↔";
          const expanded = expandedId === t.id;

          return (
            <div key={t.id} className="group">
              <button
                type="button"
                onClick={() => setExpandedId(expanded ? null : t.id)}
                aria-expanded={expanded}
                className="w-full flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors text-left"
              >
                <div className={`shrink-0 w-1 h-10 rounded-full ${accentBar}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 min-w-0">
                    <span className="text-sm font-medium truncate flex-1 min-w-0">
                      {t.category}
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60 shrink-0">
                      {formatShortDate(t.occurredOn)}
                    </span>
                  </div>
                  {!expanded &&
                    (t.type === "transfer" && fromAccount && toAccount ? (
                      <div className="text-xs text-muted-foreground truncate mt-0.5">
                        {fromAccount.name} → {toAccount.name}
                      </div>
                    ) : fromAccount ? (
                      <div className="text-xs text-muted-foreground truncate mt-0.5">
                        {fromAccount.name}
                      </div>
                    ) : null)}
                </div>
                <div className={`font-mono text-sm font-bold shrink-0 ${amountClass}`}>
                  {prefixSymbol}
                  {formatMoney(t.amount, currency)}
                </div>
                <span
                  aria-hidden
                  className={`text-[10px] font-mono text-muted-foreground/40 shrink-0 transition-transform ${
                    expanded ? "rotate-90" : ""
                  }`}
                >
                  ▸
                </span>
              </button>

              {expanded && (
                <div className="px-4 pb-3 pt-0 space-y-2 bg-muted/10">
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                    <dt className="text-muted-foreground/60 font-mono uppercase tracking-wider">
                      Date
                    </dt>
                    <dd>{formatFullDate(t.occurredOn)}</dd>

                    <dt className="text-muted-foreground/60 font-mono uppercase tracking-wider">
                      Type
                    </dt>
                    <dd className="capitalize">{t.type}</dd>

                    {t.type === "transfer" && fromAccount && toAccount ? (
                      <>
                        <dt className="text-muted-foreground/60 font-mono uppercase tracking-wider">
                          From → To
                        </dt>
                        <dd>
                          {fromAccount.name} → {toAccount.name}
                        </dd>
                      </>
                    ) : fromAccount ? (
                      <>
                        <dt className="text-muted-foreground/60 font-mono uppercase tracking-wider">
                          Account
                        </dt>
                        <dd>{fromAccount.name}</dd>
                      </>
                    ) : null}

                    <dt className="text-muted-foreground/60 font-mono uppercase tracking-wider">
                      Category
                    </dt>
                    <dd className="break-words">{t.category}</dd>

                    {t.note && (
                      <>
                        <dt className="text-muted-foreground/60 font-mono uppercase tracking-wider self-start pt-0.5">
                          Note
                        </dt>
                        <dd className="break-words whitespace-pre-wrap text-foreground/80">
                          {t.note}
                        </dd>
                      </>
                    )}
                  </dl>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(t.id)}
                      className="text-[10px] font-mono px-2 py-1 rounded border border-border hover:border-glow/40 hover:text-foreground transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(t.id)}
                      disabled={deletingId === t.id}
                      className="text-[10px] font-mono px-2 py-1 rounded border border-border hover:border-destructive/40 hover:text-destructive transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {editingTx && (
        <TransactionEditDialog
          key={editingTx.id}
          transaction={editingTx}
          accounts={accounts}
          currency={currency}
          open={!!editingTx}
          onOpenChange={(v) => !v && setEditingId(null)}
        />
      )}
    </>
  );
}
