"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CategoryDialog } from "./category-dialog";
import {
  deleteCategory,
  setSkillStatus,
  activateTemplate,
} from "@/modules/skills/actions";
import { toast } from "sonner";
import { resolveCoverImage, type SkillTemplate } from "@/lib/skill-templates";

type SkillWithCount = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  coverImage: string | null;
  templateId: string | null;
  status: string;
  skillCount: number;
};

function StatusButtons({
  status,
  onStatusChange,
}: {
  status: string;
  onStatusChange: (s: "active" | "background" | "inactive") => void;
}) {
  return (
    <>
      {status === "inactive" && (
        <>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={(e) => { e.preventDefault(); onStatusChange("background"); }}>
            Activate
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={(e) => { e.preventDefault(); onStatusChange("active"); }}>
            Focus
          </Button>
        </>
      )}
      {status === "background" && (
        <>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={(e) => { e.preventDefault(); onStatusChange("active"); }}>
            Focus
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={(e) => { e.preventDefault(); onStatusChange("inactive"); }}>
            Deactivate
          </Button>
        </>
      )}
      {status === "active" && (
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={(e) => { e.preventDefault(); onStatusChange("background"); }}>
          Unfocus
        </Button>
      )}
    </>
  );
}

// =====================
// Vertical banner for active/focused skills
// =====================
function FocusBanner({
  skill,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  skill: SkillWithCount;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: "active" | "background" | "inactive") => void;
}) {
  const cover = resolveCoverImage({
    templateId: skill.templateId,
    coverImage: skill.coverImage,
  });
  const background =
    cover || `linear-gradient(160deg, #1a1b35 0%, #2a2d52 100%)`;

  return (
    <Link href={`/skills/${skill.id}`} className="block group">
      <div
        className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden border-2 border-glow/30 glow-green transition-all hover:border-glow/60 hover:scale-[1.02]"
        style={{ background }}
      >
        {/* Watermark emoji (top-right, faded into background) */}
        <div className="absolute -right-6 -top-6 text-[6rem] leading-none opacity-15 select-none pointer-events-none">
          {skill.icon ?? "📚"}
        </div>

        {/* Bottom-to-top scrim for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/10" />

        {/* Glowing border shimmer on hover */}
        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-glow/20 pointer-events-none" />

        {/* Content — bottom anchored */}
        <div className="relative h-full flex flex-col justify-end p-5">
          <span className="text-4xl mb-2 drop-shadow-lg">
            {skill.icon ?? "📚"}
          </span>
          <h3 className="text-xl font-bold text-white leading-tight drop-shadow-lg">
            {skill.name}
          </h3>
          {skill.description && (
            <p className="text-xs text-white/70 mt-1 line-clamp-2">
              {skill.description}
            </p>
          )}
          <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between gap-2">
            <Badge
              variant="outline"
              className="border-glow/40 text-glow bg-black/40 text-[10px] font-mono"
            >
              ⚔️ FOCUSED
            </Badge>
            <span className="text-[10px] text-white/50 font-mono">
              {skill.skillCount}{" "}
              {skill.skillCount === 1 ? "subskill" : "subskills"}
            </span>
          </div>
        </div>

        {/* Hover actions */}
        <div className="absolute top-3 left-3 right-3 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <StatusButtons
            status={skill.status}
            onStatusChange={onStatusChange}
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs bg-black/60 text-white/80 hover:text-white hover:bg-black/80"
            onClick={(e) => {
              e.preventDefault();
              onEdit();
            }}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs bg-black/60 text-red-400 hover:text-red-300 hover:bg-black/80"
            onClick={(e) => {
              e.preventDefault();
              onDelete();
            }}
          >
            Delete
          </Button>
        </div>
      </div>
    </Link>
  );
}

// Empty slot placeholder
function EmptyFocusSlot() {
  return (
    <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden border-2 border-dashed border-border bg-muted/20 flex flex-col items-center justify-center gap-2 transition-all hover:border-border hover:bg-muted/30">
      <span className="text-6xl text-muted-foreground/30">?</span>
      <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground/50">
        Open Slot
      </span>
    </div>
  );
}

// =====================
// Regular card for background/inactive skills
// =====================
function SkillCard({
  skill,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  skill: SkillWithCount;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: "active" | "background" | "inactive") => void;
}) {
  return (
    <Card className="group relative transition-all hover:border-glow/30">
      <Link href={`/skills/${skill.id}`}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{skill.icon ?? "📚"}</span>
            <div className="flex-1">
              <CardTitle className="text-lg">{skill.name}</CardTitle>
              {skill.description && (
                <CardDescription className="line-clamp-2">
                  {skill.description}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Badge variant="secondary">
            {skill.skillCount} {skill.skillCount === 1 ? "subskill" : "subskills"}
          </Badge>
        </CardContent>
      </Link>
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <StatusButtons status={skill.status} onStatusChange={onStatusChange} />
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={(e) => { e.preventDefault(); onEdit(); }}>
          Edit
        </Button>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive" onClick={(e) => { e.preventDefault(); onDelete(); }}>
          Delete
        </Button>
      </div>
    </Card>
  );
}

// =====================
// Template card for available templates
// =====================
function TemplateCard({
  template,
  onActivate,
}: {
  template: SkillTemplate;
  onActivate: () => void;
}) {
  const totalMilestones = template.subskills.reduce(
    (sum, s) => sum + s.milestones.length,
    0
  );
  return (
    <Card className="group relative border-dashed border-glow-purple/20 hover:border-glow-purple/40 transition-all">
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{template.icon}</span>
          <div className="flex-1">
            <CardTitle className="text-lg">{template.name}</CardTitle>
            <CardDescription className="line-clamp-2">
              {template.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex items-center gap-2">
        <Badge variant="outline">{template.subskills.length} subskills</Badge>
        <Badge variant="outline">{totalMilestones} milestones</Badge>
      </CardContent>
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button size="sm" className="h-7 text-xs" onClick={onActivate}>
          Add to my skills
        </Button>
      </div>
    </Card>
  );
}

// =====================
// Main skills view
// =====================
export function SkillsView({
  active,
  background,
  inactive,
  availableTemplates,
}: {
  active: SkillWithCount[];
  background: SkillWithCount[];
  inactive: SkillWithCount[];
  availableTemplates: SkillTemplate[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<SkillWithCount | null>(null);

  function handleEdit(skill: SkillWithCount) {
    setEditingSkill(skill);
    setDialogOpen(true);
  }

  function handleCreate() {
    setEditingSkill(null);
    setDialogOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this skill and all its subskills?")) return;
    await deleteCategory(id);
  }

  async function handleStatusChange(
    id: string,
    status: "active" | "background" | "inactive"
  ) {
    try {
      await setSkillStatus(id, status);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to change status");
    }
  }

  async function handleActivateTemplate(templateId: string) {
    try {
      await activateTemplate(templateId);
      toast.success("Skill added! Move it to Active or Background to start.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to activate template");
    }
  }

  return (
    <>
      {/* Active Skills — Banner layout */}
      <section>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-lg font-semibold text-glow uppercase tracking-wide">
            ⚔️ Active Focus
          </h2>
          <Badge variant="outline" className="text-xs text-glow border-glow/30">
            {active.length}/3
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Your monthly priorities. Focus on 1-3 skills at a time.
        </p>
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => {
            const s = active[i];
            if (!s) return <EmptyFocusSlot key={`empty-${i}`} />;
            return (
              <FocusBanner
                key={s.id}
                skill={s}
                onEdit={() => handleEdit(s)}
                onDelete={() => handleDelete(s.id)}
                onStatusChange={(st) => handleStatusChange(s.id, st)}
              />
            );
          })}
        </div>
      </section>

      {/* Background Skills */}
      <section>
        <h2 className="text-lg font-semibold mb-3 text-glow-purple uppercase tracking-wide">
          🛡️ Background
        </h2>
        {background.length === 0 && active.length === 0 && inactive.length === 0 && (
          <p className="text-sm text-muted-foreground mb-3">
            Skills you&apos;re working on but not focusing on this month.
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {background.map((s) => (
            <SkillCard
              key={s.id}
              skill={s}
              onEdit={() => handleEdit(s)}
              onDelete={() => handleDelete(s.id)}
              onStatusChange={(st) => handleStatusChange(s.id, st)}
            />
          ))}
        </div>
      </section>

      {/* Inactive / Available */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold uppercase tracking-wide">
            📜 Available Skills
          </h2>
          <Button size="sm" variant="outline" onClick={handleCreate}>
            Create Custom Skill
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Pre-built skill trees you can add, or create your own.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {inactive.map((s) => (
            <SkillCard
              key={s.id}
              skill={s}
              onEdit={() => handleEdit(s)}
              onDelete={() => handleDelete(s.id)}
              onStatusChange={(st) => handleStatusChange(s.id, st)}
            />
          ))}
          {availableTemplates.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              onActivate={() => handleActivateTemplate(t.id)}
            />
          ))}
        </div>
      </section>

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editingSkill}
      />
    </>
  );
}
