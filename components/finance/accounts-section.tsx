"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { celebrate } from "@/lib/celebrate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createAccount,
  updateAccountBalance,
  deleteAccount,
  renameAccount,
  declareAccountUnchanged,
} from "@/modules/finance/actions";
import {
  isAccountStale,
  CHECKIN_STALE_DAYS,
} from "@/modules/finance/shared";
import type { AccountType, FinanceAccount } from "@/modules/finance/queries";
import { formatMoney, parseMoneyInput, centsToInputString } from "@/lib/money";
import { CsvImportButton } from "./csv-import-dialog";

const ACCOUNT_TYPES: { key: AccountType; label: string; icon: string }[] = [
  { key: "cash", label: "Cash", icon: "💵" },
  { key: "bank", label: "Bank", icon: "🏦" },
  { key: "investment", label: "Invest", icon: "📈" },
  { key: "crypto", label: "Crypto", icon: "🪙" },
  { key: "debt", label: "Debt", icon: "💳" },
  { key: "other", label: "Other", icon: "💰" },
];

function iconFor(type: AccountType): string {
  return ACCOUNT_TYPES.find((t) => t.key === type)?.icon ?? "💰";
}

export function AccountsSection({
  accounts,
  totalNetWorth,
  currency,
}: {
  accounts: FinanceAccount[];
  totalNetWorth: number;
  currency: string;
}) {
  const [adding, setAdding] = useState(false);
  const hasAccounts = accounts.length > 0;

  return (
    <section>
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          Accounts
        </h2>
        <CsvImportButton accounts={accounts} currency={currency} />
        {hasAccounts && !adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="text-xs font-mono px-3 py-1.5 rounded-md border border-border hover:border-glow/40 hover:text-foreground transition-colors"
          >
            + Add account
          </button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
            Net worth
          </span>
          <span
            className={`font-mono text-lg font-bold ${
              totalNetWorth >= 0 ? "text-xp" : "text-destructive"
            }`}
          >
            {formatMoney(totalNetWorth, currency)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {accounts.map((a) => (
          <AccountCard key={a.id} account={a} currency={currency} />
        ))}
        {adding && <AddAccountForm onDone={() => setAdding(false)} />}
        {!hasAccounts && !adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="rounded-xl border-2 border-dashed border-border bg-muted/10 hover:border-glow/40 hover:bg-glow/5 transition-all p-5 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground min-h-[120px]"
          >
            <span className="text-2xl opacity-60">+</span>
            <span className="text-xs font-mono uppercase tracking-wider">
              Add your first account
            </span>
          </button>
        )}
      </div>
    </section>
  );
}

function AccountCard({
  account,
  currency,
}: {
  account: FinanceAccount;
  currency: string;
}) {
  const [editingBalance, setEditingBalance] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [balance, setBalance] = useState(account.balance);
  const [balanceInput, setBalanceInput] = useState(centsToInputString(account.balance));
  const [nameInput, setNameInput] = useState(account.name);
  const [pending, startTransition] = useTransition();
  const [stale, setStale] = useState(isAccountStale(account));

  function saveBalance() {
    const parsedCents = parseMoneyInput(balanceInput);
    if (parsedCents === null) {
      toast.error("Enter a valid number");
      return;
    }
    startTransition(async () => {
      try {
        const res = await updateAccountBalance(account.id, parsedCents);
        setBalance(parsedCents);
        setEditingBalance(false);
        setStale(false);
        toast.success(
          res.xpAwarded
            ? `Balance updated · +${res.xpAwarded} XP`
            : "Balance updated"
        );
        if (res.newAchievements && res.newAchievements.length > 0) {
          celebrate(res.newAchievements);
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  function handleDeclareUnchanged() {
    startTransition(async () => {
      try {
        const res = await declareAccountUnchanged(account.id);
        setStale(false);
        toast.success(
          res.xpAwarded
            ? `Check-in logged · +${res.xpAwarded} XP`
            : "Check-in logged"
        );
        if (res.newAchievements && res.newAchievements.length > 0) {
          celebrate(res.newAchievements);
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  function saveName() {
    if (!nameInput.trim()) return;
    startTransition(async () => {
      try {
        await renameAccount(account.id, nameInput.trim());
        setEditingName(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  function handleDelete() {
    if (!confirm(`Archive "${account.name}"? Transactions stay in history.`))
      return;
    startTransition(async () => {
      try {
        await deleteAccount(account.id);
        toast.success("Account archived");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <div
      className={`rounded-xl border bg-card p-4 flex flex-col gap-3 min-h-[120px] ${
        stale ? "border-warning/40" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        <span className="text-2xl">{account.icon || iconFor(account.type)}</span>
        <div className="flex-1 min-w-0">
          {editingName ? (
            <div className="flex items-center gap-1">
              <Input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                autoFocus
                onBlur={saveName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveName();
                  if (e.key === "Escape") {
                    setNameInput(account.name);
                    setEditingName(false);
                  }
                }}
                className="h-7 text-sm"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditingName(true)}
              className="text-sm font-medium hover:text-glow transition-colors text-left truncate block w-full"
              title="Rename"
            >
              {account.name}
            </button>
          )}
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60 mt-0.5 flex items-center gap-1.5">
            <span>{account.type}</span>
            {stale && (
              <span
                className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-warning/20 text-warning text-[10px] font-bold"
                title={`Not checked in for ${CHECKIN_STALE_DAYS}+ days`}
              >
                !
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          className="text-xs text-muted-foreground/40 hover:text-destructive transition-colors"
          aria-label="Archive"
          title="Archive"
        >
          ✕
        </button>
      </div>

      <div className="mt-auto">
        {editingBalance ? (
          <div className="flex items-center gap-1">
            <Input
              autoFocus
              inputMode="decimal"
              value={balanceInput}
              onChange={(e) => setBalanceInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveBalance();
                if (e.key === "Escape") {
                  setBalanceInput(centsToInputString(balance));
                  setEditingBalance(false);
                }
              }}
              className="h-8 font-mono text-lg"
            />
            <Button
              size="sm"
              onClick={saveBalance}
              disabled={pending}
              className="h-8 px-2"
            >
              ✓
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setBalanceInput(centsToInputString(balance));
              setEditingBalance(true);
            }}
            className={`font-mono text-xl font-bold w-full text-left hover:opacity-80 transition-opacity ${
              balance >= 0 ? "text-foreground" : "text-destructive"
            }`}
          >
            {formatMoney(balance, currency)}
          </button>
        )}
        {stale && !editingBalance && (
          <button
            type="button"
            onClick={handleDeclareUnchanged}
            disabled={pending}
            className="mt-2 w-full text-[10px] font-mono px-2 py-1 rounded-md border border-warning/40 bg-warning/10 text-warning hover:bg-warning/20 transition-colors"
            title={`Confirm balance hasn't changed in ${CHECKIN_STALE_DAYS}+ days`}
          >
            Nothing changed · +1 XP
          </button>
        )}
      </div>
    </div>
  );
}

function AddAccountForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("cash");
  const [balance, setBalance] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Enter a name");
      return;
    }
    startTransition(async () => {
      try {
        const res = await createAccount({
          name: name.trim(),
          type,
          balance: parseMoneyInput(balance) ?? 0,
        });
        toast.success(`"${name.trim()}" added`);
        if (res.newAchievements && res.newAchievements.length > 0) {
          celebrate(res.newAchievements);
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
      className="rounded-xl border bg-card p-4 flex flex-col gap-3 min-h-[120px]"
    >
      <Input
        autoFocus
        placeholder="Account name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="h-8 text-sm"
      />
      <div className="flex flex-wrap gap-1">
        {ACCOUNT_TYPES.map((t) => (
          <button
            type="button"
            key={t.key}
            onClick={() => setType(t.key)}
            className={`text-[10px] font-mono px-2 py-1 rounded-md border transition-colors ${
              type === t.key
                ? "border-glow/60 bg-glow/10 text-glow"
                : "border-border bg-muted/20 text-muted-foreground"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Label htmlFor="balance" className="text-xs shrink-0">
          Balance
        </Label>
        <Input
          id="balance"
          inputMode="decimal"
          placeholder="0,00"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          className="h-8 font-mono"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending} className="flex-1">
          {pending ? "…" : "Add"}
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
