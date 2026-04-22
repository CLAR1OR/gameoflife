import Link from "next/link";
import { formatMoney } from "@/lib/money";

export function NetWorthRow({
  initial,
  currency,
  staleAccountCount = 0,
  totalAccounts = 0,
}: {
  initial: number;
  currency: string;
  staleAccountCount?: number;
  totalAccounts?: number;
}) {
  const noAccounts = totalAccounts === 0;
  const hasStale = staleAccountCount > 0;
  const showBadge = noAccounts || hasStale;

  const badgeLabel = noAccounts
    ? "Add your first account"
    : staleAccountCount === 1
      ? "1 account needs a check-in"
      : `${staleAccountCount} accounts need a check-in`;

  const badgeContent = noAccounts
    ? "!"
    : staleAccountCount > 9
      ? "9+"
      : String(staleAccountCount);

  return (
    <Link
      href="/finance"
      className="group relative inline-flex items-center gap-2 rounded-md px-1 py-0.5 transition-colors hover:bg-accent/40"
      title={showBadge ? badgeLabel : "Open finance"}
    >
      <span className="text-xl leading-none">🪙</span>
      <span className="font-mono text-lg font-bold text-yellow-400 leading-none group-hover:text-yellow-300 transition-colors">
        {formatMoney(initial, currency)}
      </span>
      {showBadge && (
        <span
          className="absolute -right-2 -top-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-background bg-amber-500 text-[10px] font-bold text-black shadow-sm px-1"
          aria-label={badgeLabel}
        >
          {badgeContent}
        </span>
      )}
    </Link>
  );
}
