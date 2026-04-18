"use client";

import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { SkillWithPrerequisites } from "@/modules/skills/types";

const STAGE_NAMES = [
  "Untrained",
  "Novice",
  "Apprentice",
  "Journeyman",
  "Expert",
  "Master",
  "Legend",
] as const;

const TOTAL_STAGES = 6;

export function SkillStageHeader({
  skillName,
  coverImage,
  icon,
  subskills,
}: {
  skillName: string;
  coverImage: string | null;
  icon: string | null;
  subskills: SkillWithPrerequisites[];
}) {
  // Aggregate stats across all subskills
  const totalMilestones = subskills.reduce(
    (sum, s) => sum + s.milestones.length,
    0
  );
  const completedMilestones = subskills.reduce(
    (sum, s) => sum + s.milestones.filter((m) => m.completed).length,
    0
  );
  const totalXp = subskills.reduce((sum, s) => sum + s.currentXp, 0);
  const masteredSubskills = subskills.filter((s) => s.level === 4).length;

  // Calculate current stage (0-6)
  const stage =
    totalMilestones === 0
      ? 0
      : Math.min(
          TOTAL_STAGES,
          Math.floor((completedMilestones / totalMilestones) * TOTAL_STAGES)
        );

  const stageName = STAGE_NAMES[stage];

  // Progress toward next stage
  const milestonesPerStage = totalMilestones / TOTAL_STAGES;
  const milestonesAtCurrentStage = Math.floor(stage * milestonesPerStage);
  const milestonesAtNextStage = Math.ceil((stage + 1) * milestonesPerStage);
  const intoNextStage = completedMilestones - milestonesAtCurrentStage;
  const nextStageRange = milestonesAtNextStage - milestonesAtCurrentStage;
  const progressToNext =
    stage >= TOTAL_STAGES
      ? 100
      : nextStageRange > 0
        ? (intoNextStage / nextStageRange) * 100
        : 0;
  const milestonesToNext = Math.max(0, milestonesAtNextStage - completedMilestones);

  const gradient = coverImage || `linear-gradient(135deg, #1a1b35 0%, #2a2d52 100%)`;

  return (
    <div
      className="relative rounded-xl overflow-hidden border border-glow/20 mb-6"
      style={{ background: gradient }}
    >
      {/* Watermark emoji */}
      <div className="absolute -right-8 -bottom-8 text-[12rem] leading-none opacity-15 select-none pointer-events-none">
        {icon ?? "📚"}
      </div>
      {/* Scrim for readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30" />

      <div className="relative p-6 space-y-4">
        {/* Title row */}
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{icon ?? "📚"}</span>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">
                  {skillName}
                </h1>
                <p className="text-sm text-white/70 mt-0.5">
                  <span className="text-glow font-semibold">{stageName}</span>
                  {stage < TOTAL_STAGES && (
                    <span className="text-white/50">
                      {" "}
                      · Stage {stage} of {TOTAL_STAGES}
                    </span>
                  )}
                  {stage >= TOTAL_STAGES && (
                    <span className="text-xp">
                      {" "}
                      · ★ Fully Mastered
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Stats badges */}
          <div className="flex gap-2">
            <Badge variant="outline" className="border-xp/40 text-xp bg-black/30 font-mono">
              ⚡ {totalXp.toLocaleString()} XP
            </Badge>
            <Badge variant="outline" className="border-glow/40 text-glow bg-black/30 font-mono">
              {completedMilestones}/{totalMilestones} milestones
            </Badge>
            {masteredSubskills > 0 && (
              <Badge variant="outline" className="border-purple-400/40 text-purple-300 bg-black/30 font-mono">
                ★ {masteredSubskills} mastered
              </Badge>
            )}
          </div>
        </div>

        {/* Badges row */}
        <div className="flex items-center justify-center gap-3 py-2">
          {Array.from({ length: TOTAL_STAGES }).map((_, i) => {
            const badgeNum = i + 1;
            const earned = stage >= badgeNum;
            return (
              <div
                key={badgeNum}
                className="relative flex flex-col items-center gap-1"
              >
                <img
                  src={
                    earned ? `/badge${badgeNum}.png` : `/badge${badgeNum}not.png`
                  }
                  alt={`Stage ${badgeNum} ${earned ? "earned" : "locked"}`}
                  className={`h-16 w-16 object-contain transition-all ${
                    earned
                      ? "drop-shadow-[0_0_8px_rgba(0,255,136,0.5)]"
                      : "opacity-70"
                  }`}
                />
                <span
                  className={`text-[10px] font-mono uppercase tracking-wider ${
                    earned ? "text-glow" : "text-white/30"
                  }`}
                >
                  {STAGE_NAMES[badgeNum]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress to next stage */}
        {totalMilestones > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/70 font-mono uppercase tracking-wider">
                {stage >= TOTAL_STAGES
                  ? "All stages unlocked"
                  : `Next: ${STAGE_NAMES[stage + 1]}`}
              </span>
              <span className="text-white/70 font-mono">
                {stage >= TOTAL_STAGES
                  ? `${completedMilestones}/${totalMilestones}`
                  : `${milestonesToNext} milestone${milestonesToNext === 1 ? "" : "s"} to go`}
              </span>
            </div>
            <Progress
              value={progressToNext}
              className="h-2 bg-black/40 xp-bar"
            />
          </div>
        )}
      </div>
    </div>
  );
}
