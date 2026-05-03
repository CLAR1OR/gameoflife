"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { activateQuestTemplate } from "@/modules/quests/actions";
import { toast } from "sonner";
import type { QuestTemplate } from "@/lib/quest-templates";

function TemplateCard({ t }: { t: QuestTemplate }) {
  const [busy, setBusy] = useState(false);
  async function activate() {
    setBusy(true);
    try {
      await activateQuestTemplate(t.id);
      toast.success(`Added "${t.name}" to backlog`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }
  return (
    <div className="rounded-xl border border-dashed border-glow-purple/30 hover:border-glow-purple/60 bg-card/60 p-3 flex flex-col gap-2 transition-colors">
      <div className="flex items-start gap-2">
        <span className="text-2xl shrink-0">{t.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap mb-0.5">
            <Badge
              variant="outline"
              className={
                t.type === "main"
                  ? "border-xp/40 text-xp text-[9px] font-mono px-1.5 py-0"
                  : "border-glow/40 text-glow text-[9px] font-mono px-1.5 py-0"
              }
            >
              {t.type === "main" ? "⚔️ MAIN" : "📜 SIDE"}
            </Badge>
            <Badge
              variant="outline"
              className="text-[9px] font-mono text-muted-foreground px-1.5 py-0"
            >
              +{t.xpReward}
            </Badge>
            {t.tasks && (
              <Badge
                variant="outline"
                className="text-[9px] font-mono text-muted-foreground px-1.5 py-0"
              >
                {t.tasks.length} tasks
              </Badge>
            )}
          </div>
          <div className="text-sm font-medium leading-tight">{t.name}</div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-3 flex-1">
        {t.description}
      </p>
      <Button
        size="sm"
        variant="outline"
        onClick={activate}
        disabled={busy}
        className="w-full text-xs"
      >
        {busy ? "Adding…" : "+ Add to backlog"}
      </Button>
    </div>
  );
}

export function QuestTemplatesGallery({
  templates,
}: {
  templates: QuestTemplate[];
}) {
  const [openCat, setOpenCat] = useState<string | null>(null);

  if (templates.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/20 p-6 text-center text-sm text-muted-foreground">
        Every quest template is already in your backlog or active board. 🎯
      </div>
    );
  }

  // Group by category, preserving the order from QUEST_TEMPLATES.
  const groups = new Map<string, QuestTemplate[]>();
  for (const t of templates) {
    const list = groups.get(t.category) ?? [];
    list.push(t);
    groups.set(t.category, list);
  }
  const categories = Array.from(groups.keys());

  return (
    <div className="space-y-3">
      {categories.map((cat) => {
        const list = groups.get(cat)!;
        const isOpen = openCat === cat;
        return (
          <div key={cat} className="rounded-xl border bg-card">
            <button
              type="button"
              onClick={() => setOpenCat(isOpen ? null : cat)}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-accent/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-glow-purple/80">
                  {cat}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {list.length} {list.length === 1 ? "idea" : "ideas"}
                </span>
              </div>
              <span className="text-muted-foreground text-xs">
                {isOpen ? "▾" : "▸"}
              </span>
            </button>
            {isOpen && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 p-3 pt-0">
                {list.map((t) => (
                  <TemplateCard key={t.id} t={t} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
