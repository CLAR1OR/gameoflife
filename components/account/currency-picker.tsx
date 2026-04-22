"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateCurrency } from "@/modules/settings/actions";
import { SUPPORTED_CURRENCIES } from "@/lib/money";

export function CurrencyPicker({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  const [, startTransition] = useTransition();

  function handleChange(code: string) {
    if (code === value) return;
    const prev = value;
    setValue(code);
    startTransition(async () => {
      try {
        await updateCurrency(code);
        toast.success(`Currency set to ${code}`);
      } catch (err) {
        setValue(prev);
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <div className="rounded-xl border bg-card p-4 flex items-center justify-between gap-4 flex-wrap">
      <div className="min-w-0">
        <div className="text-sm font-medium">Display currency</div>
        <div className="text-xs text-muted-foreground mt-0.5">
          Used for all money shown in the app.
        </div>
      </div>
      <select
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className="h-9 rounded-md border bg-background px-3 text-sm font-mono"
      >
        {SUPPORTED_CURRENCIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.symbol} · {c.code} — {c.label}
          </option>
        ))}
      </select>
    </div>
  );
}
