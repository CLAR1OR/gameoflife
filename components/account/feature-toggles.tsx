"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setFeatureEnabled } from "@/modules/settings/actions";
import {
  FEATURES,
  isFeatureEnabled,
  type FeatureKey,
} from "@/modules/settings/features";

type Props = {
  initial: Record<string, boolean>;
};

export function FeatureToggles({ initial }: Props) {
  const [features, setFeatures] = useState<Record<string, boolean>>(initial);
  const [pending, startTransition] = useTransition();
  const [pendingKey, setPendingKey] = useState<FeatureKey | null>(null);

  function handleToggle(key: FeatureKey, nextValue: boolean) {
    setFeatures((prev) => ({ ...prev, [key]: nextValue }));
    setPendingKey(key);
    startTransition(async () => {
      try {
        await setFeatureEnabled(key, nextValue);
        toast.success(
          nextValue ? "Feature enabled" : "Feature disabled"
        );
      } catch (err) {
        setFeatures((prev) => ({ ...prev, [key]: !nextValue }));
        toast.error(err instanceof Error ? err.message : "Failed to save");
      } finally {
        setPendingKey(null);
      }
    });
  }

  return (
    <div className="rounded-xl border bg-card divide-y divide-border/60">
      {FEATURES.map((f) => {
        const enabled = isFeatureEnabled(features, f.key);
        const isLoading = pending && pendingKey === f.key;
        return (
          <div
            key={f.key}
            className="flex items-center justify-between gap-4 p-4"
          >
            <div className="flex items-start gap-3 min-w-0">
              <span className="text-xl shrink-0 mt-0.5">{f.icon}</span>
              <div className="min-w-0">
                <div className="text-sm font-medium">{f.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {f.description}
                </div>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              disabled={isLoading}
              onClick={() => handleToggle(f.key, !enabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors ${
                enabled
                  ? "bg-glow/30 border-glow/60"
                  : "bg-muted border-border"
              } ${isLoading ? "opacity-60" : ""}`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-foreground shadow-sm transition-transform ${
                  enabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}
