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

const LEVEL_COLORS: Record<number, string> = {
  0: "bg-muted text-muted-foreground border-muted",
  1: "bg-emerald-100 text-emerald-800 border-emerald-300",
  2: "bg-blue-100 text-blue-800 border-blue-300",
  3: "bg-purple-100 text-purple-800 border-purple-300",
  4: "bg-amber-100 text-amber-800 border-amber-300",
};

const BORDER_COLORS: Record<number, string> = {
  0: "border-muted-foreground/30",
  1: "border-emerald-400",
  2: "border-blue-400",
  3: "border-purple-400",
  4: "border-amber-400",
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

  return (
    <div
      className={`relative rounded-lg border-2 bg-card px-4 py-3 shadow-sm transition-all min-w-[140px] max-w-[180px] ${
        BORDER_COLORS[level] ?? BORDER_COLORS[1]
      } ${isSelected ? "ring-2 ring-primary ring-offset-2" : ""} ${
        isLocked ? "opacity-60" : ""
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-border" />

      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium leading-tight">
          {isLocked ? "🔒 " : ""}
          {name}
        </span>
      </div>

      <div className="flex items-center gap-1.5 mt-1.5">
        <Badge
          variant="secondary"
          className={`text-[10px] px-1.5 py-0 ${LEVEL_COLORS[level] ?? ""}`}
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
        <div className="mt-2">
          <Progress value={progressInfo.progress * 100} className="h-1.5" />
          <span className="text-[10px] text-muted-foreground mt-0.5 block">
            {currentXp} / {progressInfo.nextLevelXp} XP
          </span>
        </div>
      )}

      {!isLocked && !progressInfo && (
        <span className="text-[10px] text-amber-600 mt-1 block font-medium">
          {currentXp} XP — Mastered
        </span>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-border"
      />
    </div>
  );
}

export const SkillNode = memo(SkillNodeComponent);
