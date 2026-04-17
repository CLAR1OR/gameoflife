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
import type { SkillTemplate } from "@/lib/skill-templates";

type SkillWithCount = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  status: string;
  skillCount: number;
};

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
  const isActive = skill.status === "active";
  return (
    <Card className={`group relative transition-all hover:border-glow/30 ${isActive ? "border-glow/30 glow-green" : ""}`}>
      <Link href={`/skills/${skill.id}`}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{skill.icon ?? "📚"}</span>
            <div className="flex-1">
              <CardTitle className={`text-lg ${isActive ? "text-glow" : ""}`}>{skill.name}</CardTitle>
              {skill.description && (
                <CardDescription className="line-clamp-2">
                  {skill.description}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Badge variant="secondary" className={isActive ? "border-glow/20 text-glow bg-glow/10" : ""}>
            {skill.skillCount}{" "}
            {skill.skillCount === 1 ? "subskill" : "subskills"}
          </Badge>
        </CardContent>
      </Link>
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {skill.status === "inactive" && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={(e) => {
                e.preventDefault();
                onStatusChange("background");
              }}
            >
              Activate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={(e) => {
                e.preventDefault();
                onStatusChange("active");
              }}
            >
              Focus
            </Button>
          </>
        )}
        {skill.status === "background" && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={(e) => {
                e.preventDefault();
                onStatusChange("active");
              }}
            >
              Focus
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={(e) => {
                e.preventDefault();
                onStatusChange("inactive");
              }}
            >
              Deactivate
            </Button>
          </>
        )}
        {skill.status === "active" && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={(e) => {
              e.preventDefault();
              onStatusChange("background");
            }}
          >
            Unfocus
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
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
          className="h-7 px-2 text-xs text-destructive"
          onClick={(e) => {
            e.preventDefault();
            onDelete();
          }}
        >
          Delete
        </Button>
      </div>
    </Card>
  );
}

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
        <Badge variant="outline">
          {template.subskills.length} subskills
        </Badge>
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
      toast.error(
        e instanceof Error ? e.message : "Failed to activate template"
      );
    }
  }

  return (
    <>
      {/* Active Skills */}
      <section>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-lg font-semibold text-glow uppercase tracking-wide">⚔️ Active Focus</h2>
          <Badge variant="outline" className="text-xs text-glow border-glow/30">
            {active.length}/3
          </Badge>
        </div>
        {active.length === 0 && (
          <p className="text-sm text-muted-foreground mb-3">
            No active skills yet. Focus on 1-3 skills each month by clicking
            &quot;Focus&quot; on a skill below.
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((s) => (
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

      {/* Background Skills */}
      <section>
        <h2 className="text-lg font-semibold mb-3 text-glow-purple uppercase tracking-wide">🛡️ Background</h2>
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
          <h2 className="text-lg font-semibold uppercase tracking-wide">📜 Available Skills</h2>
          <Button size="sm" variant="outline" onClick={handleCreate}>
            Create Custom Skill
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Pre-built skill trees you can add, or create your own. Click
          &quot;Focus&quot; or &quot;Unfocus&quot; to move them up.
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
