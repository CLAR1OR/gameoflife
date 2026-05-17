"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { activateTemplate } from "@/modules/skills/actions";
import {
  updateYearlyBookGoal,
  markOnboarded,
} from "@/modules/settings/actions";
import { toast } from "sonner";

type TemplateSummary = {
  id: string;
  name: string;
  description: string;
  icon: string;
};

type Step = 0 | 1 | 2;

const TOTAL_STEPS = 3;

/**
 * 3-step onboarding wizard shown once after registration. Every step
 * is skippable — the wizard exists to set expectations and seed the
 * dashboard with one or two things, not to gate access to the app.
 */
export function WelcomeWizard({
  name,
  templates,
  alreadyHasSkill,
  currentYearlyGoal,
}: {
  name: string;
  templates: TemplateSummary[];
  alreadyHasSkill: boolean;
  currentYearlyGoal: number;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [picking, setPicking] = useState<string | null>(null);
  const [pickedIds, setPickedIds] = useState<Set<string>>(new Set());
  const [bookGoal, setBookGoal] = useState(
    currentYearlyGoal > 0 ? String(currentYearlyGoal) : ""
  );
  const [finishing, setFinishing] = useState(false);

  async function pickTemplate(t: TemplateSummary) {
    if (pickedIds.has(t.id)) return;
    setPicking(t.id);
    try {
      await activateTemplate(t.id);
      setPickedIds((s) => new Set(s).add(t.id));
      toast.success(`Activated: ${t.name}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setPicking(null);
  }

  async function finish() {
    setFinishing(true);
    try {
      const goal = bookGoal.trim() ? Number(bookGoal) : 0;
      if (Number.isFinite(goal) && goal > 0) {
        await updateYearlyBookGoal(Math.round(goal));
      }
      await markOnboarded();
      toast.success(`Welcome, ${name.split(" ")[0]}`);
      router.push("/");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
      setFinishing(false);
    }
  }

  async function skipAll() {
    setFinishing(true);
    try {
      await markOnboarded();
      router.push("/");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
      setFinishing(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar — escape hatch + restore-backup link. */}
      <div className="border-b border-border/60 bg-card/40">
        <div className="mx-auto w-full max-w-3xl flex items-center justify-between gap-3 px-4 sm:px-6 py-3">
          <div className="text-sm font-mono uppercase tracking-wider text-glow">
            🎮 Game of Life
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <Link
              href="/account"
              className="text-muted-foreground hover:text-foreground"
            >
              Restore from backup →
            </Link>
            <button
              type="button"
              onClick={skipAll}
              disabled={finishing}
              className="text-muted-foreground hover:text-foreground"
            >
              skip
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center py-8 sm:py-12 px-4">
        <div className="w-full max-w-3xl space-y-6">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step
                    ? "w-10 bg-glow"
                    : i < step
                      ? "w-6 bg-glow/60"
                      : "w-6 bg-muted"
                }`}
              />
            ))}
          </div>

          {step === 0 && (
            <Intro
              name={name}
              onNext={() => setStep(1)}
              onSkip={skipAll}
              skipping={finishing}
            />
          )}

          {step === 1 && (
            <PickSkill
              templates={templates}
              alreadyHasSkill={alreadyHasSkill}
              pickedIds={pickedIds}
              picking={picking}
              onPick={pickTemplate}
              onBack={() => setStep(0)}
              onNext={() => setStep(2)}
            />
          )}

          {step === 2 && (
            <Finish
              bookGoal={bookGoal}
              setBookGoal={setBookGoal}
              hasPickedSkill={pickedIds.size > 0}
              onBack={() => setStep(1)}
              onFinish={finish}
              finishing={finishing}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Intro({
  name,
  onNext,
  onSkip,
  skipping,
}: {
  name: string;
  onNext: () => void;
  onSkip: () => void;
  skipping: boolean;
}) {
  const firstName = name.split(" ")[0] || name;
  return (
    <section className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Welcome, {firstName} 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          Game of Life turns the slow projects of adult life into something
          with XP, levels, streaks, and achievements. A short tour:
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <ConceptCard
          icon="⚔️"
          title="Skills"
          body="Long-term learning goals with prerequisites, milestones, and stages. Activate one from a template or build your own tree."
        />
        <ConceptCard
          icon="🔄"
          title="Habits"
          body="Daily or weekly actions that build streaks. Each completion grants XP — to a linked skill, or to your general account."
        />
        <ConceptCard
          icon="📜"
          title="Quests"
          body="A main quest and a few side quests at any time. Personal goals you actively work toward."
        />
        <ConceptCard
          icon="🏆"
          title="Achievements"
          body="A trophy room with progress bars on locked goals. They cover every module — places visited, friends called, books read."
        />
      </div>

      <div className="rounded-xl border border-glow/30 bg-glow/5 p-4 text-sm">
        <div className="text-glow font-medium mb-1">
          Your data stays with you.
        </div>
        <p className="text-muted-foreground">
          The whole app is one local SQLite database. No analytics, no
          telemetry, no third-party cloud. Back up to a single JSON file
          whenever you like from Account → Backup.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onSkip}
          disabled={skipping}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          I&apos;ll explore on my own
        </button>
        <Button onClick={onNext}>Continue →</Button>
      </div>
    </section>
  );
}

function PickSkill({
  templates,
  alreadyHasSkill,
  pickedIds,
  picking,
  onPick,
  onBack,
  onNext,
}: {
  templates: TemplateSummary[];
  alreadyHasSkill: boolean;
  pickedIds: Set<string>;
  picking: string | null;
  onPick: (t: TemplateSummary) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <section className="space-y-5">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">
          Pick a starter skill
        </h2>
        <p className="text-sm text-muted-foreground">
          One-click activate any of these. They come pre-loaded with
          subskills, milestones, and achievements — change anything later.
          Optional, but a fully-empty dashboard is no fun.
        </p>
      </div>

      {alreadyHasSkill && (
        <p className="text-xs text-center text-muted-foreground/70 italic">
          You already have skills set up. Picking more is fine — or skip
          ahead.
        </p>
      )}

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {templates.map((t) => {
          const isPicked = pickedIds.has(t.id);
          const isBusy = picking === t.id;
          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => onPick(t)}
                disabled={isPicked || isBusy}
                className={`group w-full text-left rounded-lg border p-3 flex items-start gap-3 transition-colors min-h-[5.5rem] ${
                  isPicked
                    ? "border-glow bg-glow/10"
                    : "border-border bg-card hover:border-glow/50"
                }`}
              >
                <span className="text-2xl shrink-0">{t.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold">{t.name}</span>
                    {isPicked && (
                      <span className="text-[10px] font-mono text-glow shrink-0">
                        ✓ added
                      </span>
                    )}
                    {isBusy && (
                      <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                        …
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">
                    {t.description}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onNext}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Skip — none for now
          </button>
          <Button onClick={onNext}>Continue →</Button>
        </div>
      </div>
    </section>
  );
}

function Finish({
  bookGoal,
  setBookGoal,
  hasPickedSkill,
  onBack,
  onFinish,
  finishing,
}: {
  bookGoal: string;
  setBookGoal: (s: string) => void;
  hasPickedSkill: boolean;
  onBack: () => void;
  onFinish: () => void;
  finishing: boolean;
}) {
  return (
    <section className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">A few last bits</h2>
        <p className="text-sm text-muted-foreground">
          All optional, all changeable from Account later.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-2">
        <Label className="text-xs">Yearly book goal</Label>
        <p className="text-[11px] text-muted-foreground/80">
          How many books you&apos;d like to finish this year. Shown in your
          status bar and on the books page.
        </p>
        <Input
          type="number"
          min={0}
          max={500}
          value={bookGoal}
          onChange={(e) => setBookGoal(e.target.value)}
          placeholder="e.g. 12"
          className="max-w-[140px]"
        />
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          What&apos;s next
        </div>
        <ul className="text-sm space-y-2">
          <li className="flex items-start gap-2">
            <span>📍</span>
            <span>
              <span className="text-foreground">Pin a place</span> — your
              home, or somewhere you visited recently. /places.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span>🫂</span>
            <span>
              <span className="text-foreground">Add a friend</span> — set a
              cadence and the app will remind you to reach out. /friends.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span>🔄</span>
            <span>
              <span className="text-foreground">Add a habit</span> — daily,
              flexible, or irregular. Streaks start with day 1. /habits.
            </span>
          </li>
          {!hasPickedSkill && (
            <li className="flex items-start gap-2">
              <span>⚔️</span>
              <span>
                <span className="text-foreground">Try a skill template</span>{" "}
                — go back a step or visit /skills anytime.
              </span>
            </li>
          )}
        </ul>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={onBack} disabled={finishing}>
          ← Back
        </Button>
        <Button onClick={onFinish} disabled={finishing}>
          {finishing ? "Saving…" : "Take me to the dashboard →"}
        </Button>
      </div>
    </section>
  );
}

function ConceptCard({
  icon,
  title,
  body,
}: {
  icon: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-1.5">
      <div className="flex items-baseline gap-2">
        <span className="text-2xl leading-none">{icon}</span>
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}
