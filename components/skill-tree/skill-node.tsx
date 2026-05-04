"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getLevelName, xpForNextLevel } from "@/lib/xp";

export type SkillNodeData = {
  name: string;
  level: number;
  currentXp: number;
  description: string | null;
  isSelected: boolean;
  milestonesCompleted: number;
  milestonesTotal: number;
};

const LEVEL_STYLES: Record<number, { badge: string; border: string; glow: string }> = {
  0: {
    badge: "bg-muted/50 text-muted-foreground border-muted",
    border: "border-muted-foreground/20",
    glow: "",
  },
  1: {
    badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    border: "border-emerald-500/40",
    glow: "",
  },
  2: {
    badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    border: "border-blue-500/40",
    glow: "shadow-[0_0_8px_rgba(59,130,246,0.2)]",
  },
  3: {
    badge: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    border: "border-purple-500/40",
    glow: "shadow-[0_0_12px_rgba(168,85,247,0.3)]",
  },
  4: {
    badge: "bg-xp/20 text-xp border-xp/30",
    border: "border-xp/50",
    glow: "shadow-[0_0_16px_rgba(250,204,21,0.3)]",
  },
};

function SkillNodeComponent({ data }: NodeProps) {
  const nodeData = data as unknown as SkillNodeData;
  const {
    name,
    level,
    currentXp,
    isSelected,
    milestonesCompleted,
    milestonesTotal,
  } = nodeData;
  const isLocked = level === 0;
  const progressInfo = xpForNextLevel(currentXp);
  const style = LEVEL_STYLES[level] ?? LEVEL_STYLES[1];

  return (
    <div
      className={`relative rounded-lg border-2 bg-card px-4 py-3 transition-all min-w-[150px] max-w-[185px] ${
        style.border
      } ${style.glow} ${
        isSelected ? "ring-2 ring-glow ring-offset-2 ring-offset-background" : ""
      } ${isLocked ? "opacity-50" : ""}`}
    >
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground/50 !border-border" />

      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold leading-tight">
          {isLocked ? "🔒 " : ""}
          {name}
        </span>
      </div>

      <div className="flex items-center gap-1.5 mt-1.5">
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0 ${style.badge}`}
        >
          {getLevelName(level)}
        </Badge>
        {!isLocked && milestonesTotal > 0 && (
          <span className="text-[10px] text-muted-foreground">
            {milestonesCompleted}/{milestonesTotal}
          </span>
        )}
      </div>

      {!isLocked && progressInfo && (
        <div className="mt-2 xp-bar">
          <Progress value={progressInfo.progress * 100} className="h-1.5 bg-muted" />
          <span className="text-[10px] text-xp mt-0.5 block font-mono">
            {currentXp} / {progressInfo.nextLevelXp} XP
          </span>
        </div>
      )}

      {!isLocked && !progressInfo && (
        <span className="text-[10px] text-xp mt-1 block font-bold font-mono">
          ★ {currentXp} XP — MASTERED
        </span>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-muted-foreground/50 !border-border"
      />
    </div>
  );
}

export const SkillNode = memo(SkillNodeComponent);
