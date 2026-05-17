"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS: { href: string; label: string; icon: string }[] = [
  { href: "/finance", label: "Overview", icon: "📊" },
  { href: "/finance/accounts", label: "Accounts", icon: "🏦" },
  { href: "/finance/transactions", label: "Transactions", icon: "📃" },
  { href: "/finance/budgets", label: "Budgets", icon: "🎯" },
];

/**
 * Sub-navigation strip for the finance area. Lets the user flip between
 * the rolled-up overview and the account-management subpage without
 * scrolling past everything on a single huge page.
 */
export function FinanceTabs() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1 -mt-2 overflow-x-auto no-scrollbar">
      {TABS.map((t) => {
        const isActive =
          t.href === "/finance" ? pathname === "/finance" : pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`shrink-0 text-xs font-mono px-3 py-1.5 rounded-full border transition-colors ${
              isActive
                ? "border-glow text-glow bg-glow/10"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.icon} {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
