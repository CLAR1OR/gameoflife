"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setTheme } from "@/modules/settings/actions";
import { THEMES, type ThemeId } from "@/lib/themes";
import { toast } from "sonner";

function ThemePreview({ theme }: { theme: (typeof THEMES)[number] }) {
  // Inline-styled preview using the swatches — independent of the live
  // theme so users can see what they're picking even before they commit.
  const { bg, accent, warm } = theme.swatches;
  const isLight = theme.mode === "light";
  const cardBg = isLight ? "#ffffff" : adjustL(bg, 0.06);
  const text = isLight ? "#0f172a" : "#e2e4f0";
  const muted = isLight ? "#64748b" : "#7a7f9e";
  const border = isLight ? "#cbd5e1" : adjustL(bg, 0.12);

  return (
    <div
      className="rounded-md border p-3 space-y-2"
      style={{ background: bg, color: text, borderColor: border }}
    >
      {/* Mock quest tile */}
      <div
        className="rounded-md border p-2"
        style={{ background: cardBg, borderColor: border }}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <span
            className="text-[8px] font-mono uppercase tracking-wider px-1 py-0.5 rounded border"
            style={{ borderColor: warm, color: warm }}
          >
            ⚔️ MAIN
          </span>
          <span
            className="text-[8px] font-mono uppercase tracking-wider px-1 py-0.5 rounded border"
            style={{ borderColor: warm, color: warm }}
          >
            +100 XP
          </span>
        </div>
        <div className="text-xs font-bold">Ship the MVP</div>
        {/* Mock progress bar */}
        <div
          className="mt-1.5 h-1 rounded-full"
          style={{ background: border }}
        >
          <div
            className="h-full rounded-full"
            style={{ width: "62%", background: accent }}
          />
        </div>
      </div>
      {/* Swatch row */}
      <div className="flex items-center gap-1.5 text-[9px] font-mono">
        <span
          className="h-3 w-3 rounded-full"
          style={{ background: accent }}
        />
        <span style={{ color: muted }}>accent</span>
        <span
          className="h-3 w-3 rounded-full ml-1"
          style={{ background: warm }}
        />
        <span style={{ color: muted }}>xp</span>
      </div>
    </div>
  );
}

/** Lighten/darken a hex by a fraction (positive = lighter). Tiny utility
 * for the preview cards so they don't need to ship Tailwind colours. */
function adjustL(hex: string, delta: number): string {
  const m = hex.match(/^#([\da-f]{6})$/i);
  if (!m) return hex;
  const r = parseInt(m[1].slice(0, 2), 16);
  const g = parseInt(m[1].slice(2, 4), 16);
  const b = parseInt(m[1].slice(4, 6), 16);
  const lift = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v + delta * 255)));
  const toHex = (v: number) => v.toString(16).padStart(2, "0");
  return `#${toHex(lift(r))}${toHex(lift(g))}${toHex(lift(b))}`;
}

export function ThemePicker({ initial }: { initial: ThemeId }) {
  const router = useRouter();
  const [selected, setSelected] = useState<ThemeId>(initial);
  const [pending, startTransition] = useTransition();

  function handlePick(id: ThemeId) {
    if (id === selected || pending) return;
    setSelected(id);
    startTransition(async () => {
      try {
        await setTheme(id);
        toast.success(
          `Theme: ${THEMES.find((t) => t.id === id)?.name ?? id}`
        );
        // Force a refresh so the new data-theme attribute on <html>
        // ships from the server.
        router.refresh();
      } catch (e) {
        // revert on error
        setSelected(initial);
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {THEMES.map((t) => {
        const isSelected = selected === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => handlePick(t.id)}
            disabled={pending}
            className={`group rounded-xl border p-3 text-left transition-all ${
              isSelected
                ? "border-glow shadow-[0_0_12px_color-mix(in_srgb,var(--glow)_30%,transparent)]"
                : "border-border hover:border-glow/40"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-sm font-semibold">{t.name}</div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  {t.mode === "light" ? "Light" : "Dark"}
                </div>
              </div>
              <span
                className={`h-4 w-4 rounded-full border-2 flex items-center justify-center text-[10px] ${
                  isSelected
                    ? "border-glow bg-glow text-background"
                    : "border-muted-foreground/40"
                }`}
              >
                {isSelected ? "✓" : ""}
              </span>
            </div>
            <ThemePreview theme={t} />
            <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2">
              {t.tagline}
            </p>
          </button>
        );
      })}
    </div>
  );
}
