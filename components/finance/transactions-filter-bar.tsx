"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type {
  FinanceAccount,
  TransactionFilter,
} from "@/modules/finance/types";

/**
 * Filter bar for the transactions history page. Drives URL search params
 * so the server-rendered list above reflects the chosen filters and
 * filters survive a refresh / share-the-URL.
 */
export function TransactionsFilterBar({
  accounts,
  categorySuggestions,
  initial,
}: {
  accounts: FinanceAccount[];
  categorySuggestions: string[];
  initial: TransactionFilter;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [account, setAccount] = useState(initial.accountId ?? "");
  const [type, setType] = useState(initial.type ?? "");
  const [category, setCategory] = useState(initial.category ?? "");
  const [fromDate, setFromDate] = useState(initial.fromDate ?? "");
  const [toDate, setToDate] = useState(initial.toDate ?? "");
  const [search, setSearch] = useState(initial.search ?? "");
  const [sort, setSort] = useState(initial.sort ?? "date_desc");

  function buildHref(extra?: Record<string, string | null>): string {
    const params = new URLSearchParams();
    const merge: Record<string, string | null> = {
      account,
      type,
      category,
      from: fromDate,
      to: toDate,
      q: search.trim(),
      sort,
      ...extra,
    };
    for (const [k, v] of Object.entries(merge)) {
      if (v && v.length > 0) params.set(k, v);
    }
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  function apply() {
    router.push(buildHref());
  }

  function clear() {
    setAccount("");
    setType("");
    setCategory("");
    setFromDate("");
    setToDate("");
    setSearch("");
    setSort("date_desc");
    router.push(pathname);
  }

  function quickRange(months: number) {
    const now = new Date();
    const to = now.toISOString().slice(0, 10);
    const from = new Date(now.getFullYear(), now.getMonth() - months, 1)
      .toISOString()
      .slice(0, 10);
    setFromDate(from);
    setToDate(to);
    router.push(buildHref({ from, to }));
  }

  function thisYear() {
    const now = new Date();
    const from = `${now.getFullYear()}-01-01`;
    const to = now.toISOString().slice(0, 10);
    setFromDate(from);
    setToDate(to);
    router.push(buildHref({ from, to }));
  }

  const filtersActive = !!(
    account ||
    type ||
    category ||
    fromDate ||
    toDate ||
    search.trim() ||
    (sort && sort !== "date_desc")
  );

  return (
    <div className="rounded-xl border bg-card p-3 space-y-3">
      {/* Quick date ranges */}
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mr-1">
          Range
        </span>
        <QuickPill onClick={() => quickRange(1)}>Last 30d</QuickPill>
        <QuickPill onClick={() => quickRange(3)}>Last 3mo</QuickPill>
        <QuickPill onClick={() => quickRange(6)}>Last 6mo</QuickPill>
        <QuickPill onClick={thisYear}>This year</QuickPill>
        {filtersActive && (
          <button
            type="button"
            onClick={clear}
            className="ml-auto text-[10px] font-mono text-muted-foreground hover:text-foreground"
          >
            clear all
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <div className="space-y-1">
          <Label className="text-[10px]">Account</Label>
          <select
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
          >
            <option value="">All accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">Type</Label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
          >
            <option value="">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
            <option value="transfer">Transfer</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">Category</Label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
          >
            <option value="">All categories</option>
            {categorySuggestions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">From</Label>
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">To</Label>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">Sort</Label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
          >
            <option value="date_desc">Newest first</option>
            <option value="date_asc">Oldest first</option>
            <option value="amount_desc">Largest first</option>
            <option value="amount_asc">Smallest first</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") apply();
          }}
          placeholder="Search note or category…"
          className="h-8 text-xs flex-1"
        />
        <Button size="sm" onClick={apply}>
          Apply
        </Button>
      </div>
    </div>
  );
}

function QuickPill({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[11px] font-mono px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
    >
      {children}
    </button>
  );
}
