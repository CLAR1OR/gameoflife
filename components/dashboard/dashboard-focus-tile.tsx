"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";

type FocusSkill = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  coverImage: string | null;
  templateId: string | null;
  skillCount: number;
  hasHabit: boolean;
  /** Pre-resolved cover string (user upload → pack image → fallback). */
  resolvedCover: string | null;
};

export function DashboardFocusTile({ skill }: { skill: FocusSkill }) {
  const background =
    skill.resolvedCover ||
    `linear-gradient(160deg, #1a1b35 0%, #2a2d52 100%)`;

  return (
    <Link href={`/skills/${skill.id}`} className="block group">
      <div
        className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden border-2 border-glow/30 glow-green transition-all hover:border-glow/60 hover:scale-[1.02]"
        style={{ background }}
      >
        {/* Watermark emoji */}
        <div className="absolute -right-6 -top-6 text-[6rem] leading-none opacity-15 select-none pointer-events-none">
          {skill.icon ?? "📚"}
        </div>

        {/* Scrim for text */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/10" />

        <div className="relative h-full flex flex-col justify-end p-4">
          <span className="text-3xl mb-1.5 drop-shadow-lg">
            {skill.icon ?? "📚"}
          </span>
          <h3 className="text-lg font-bold text-white leading-tight drop-shadow-lg">
            {skill.name}
          </h3>
          <div className="mt-2 pt-2 border-t border-white/20 flex items-center gap-1.5 flex-wrap">
            <Badge
              variant="outline"
              className="border-glow/40 text-glow bg-black/40 text-[10px] font-mono"
            >
              ⚔️ FOCUSED
            </Badge>
            {skill.hasHabit && (
              <Badge
                variant="outline"
                className="border-xp/40 text-xp bg-black/40 text-[10px] font-mono"
              >
                🔄 HABIT
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function EmptyFocusTile() {
  return (
    <Link href="/skills" className="block group">
      <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden border-2 border-dashed border-border bg-muted/20 flex flex-col items-center justify-center gap-2 hover:border-border hover:bg-muted/30 transition-all">
        <span className="text-5xl text-muted-foreground/30">?</span>
        <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground/50">
          Open Slot
        </span>
      </div>
    </Link>
  );
}
