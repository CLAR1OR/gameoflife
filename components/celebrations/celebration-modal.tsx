"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  getAchievementsForCelebration,
  type CelebrationPayload,
} from "@/modules/celebrations/actions";

const CONFETTI_EMOJI = ["✨", "🎉", "⭐", "🏆", "💫", "🌟", "🎊", "💎"];

type ConfettiBit = {
  id: number;
  emoji: string;
  left: number; // %
  delay: number; // s
  duration: number; // s
  size: number; // rem
  drift: number; // px
};

function makeConfetti(n = 36): ConfettiBit[] {
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    emoji:
      CONFETTI_EMOJI[Math.floor(Math.random() * CONFETTI_EMOJI.length)],
    left: Math.random() * 100,
    delay: Math.random() * 0.8,
    duration: 2.4 + Math.random() * 1.6,
    size: 0.9 + Math.random() * 1.4,
    drift: (Math.random() - 0.5) * 80,
  }));
}

export function CelebrationModal() {
  const [queue, setQueue] = useState<CelebrationPayload[]>([]);
  const [current, setCurrent] = useState<CelebrationPayload | null>(null);
  const [confetti, setConfetti] = useState<ConfettiBit[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Listen for celebration events
  useEffect(() => {
    async function onCelebrate(e: Event) {
      const detail = (e as CustomEvent<{ names: string[] }>).detail;
      if (!detail?.names?.length) return;
      try {
        const data = await getAchievementsForCelebration(detail.names);
        if (data.length > 0) {
          setQueue((q) => [...q, ...data]);
        }
      } catch {
        // non-fatal — silent
      }
    }
    window.addEventListener("celebrate-achievements", onCelebrate);
    return () =>
      window.removeEventListener("celebrate-achievements", onCelebrate);
  }, []);

  // Promote next queued item into `current` whenever current clears
  useEffect(() => {
    if (current || queue.length === 0) return;
    const [next, ...rest] = queue;
    setCurrent(next);
    setQueue(rest);
    setConfetti(makeConfetti());
  }, [current, queue]);

  function dismiss() {
    setCurrent(null);
    setConfetti([]);
  }

  // ESC / click-backdrop to dismiss
  useEffect(() => {
    if (!current) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        dismiss();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current]);

  if (!mounted || !current) return null;

  const isLevelAchievement = current.triggerType === "account_level";

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Achievement unlocked"
    >
      <style>{`
        @keyframes celebrate-fall {
          0% {
            transform: translate(0, -10vh) rotate(0deg);
            opacity: 0;
          }
          10% { opacity: 1; }
          100% {
            transform: translate(var(--drift), 110vh) rotate(720deg);
            opacity: 0;
          }
        }
        @keyframes celebrate-pop {
          0% { transform: scale(0.5); opacity: 0; }
          40% { transform: scale(1.1); opacity: 1; }
          60% { transform: scale(0.97); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes celebrate-shimmer {
          0%, 100% { filter: drop-shadow(0 0 22px rgba(252, 211, 77, 0.9)) drop-shadow(0 0 40px rgba(250, 204, 21, 0.5)); }
          50% { filter: drop-shadow(0 0 36px rgba(252, 211, 77, 1)) drop-shadow(0 0 60px rgba(250, 204, 21, 0.8)); }
        }
      `}</style>

      {/* Backdrop */}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Close celebration"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm cursor-default"
      />

      {/* Confetti layer */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {confetti.map((c) => (
          <span
            key={c.id}
            className="absolute"
            style={{
              left: `${c.left}%`,
              top: 0,
              fontSize: `${c.size}rem`,
              animation: `celebrate-fall ${c.duration}s ease-in ${c.delay}s forwards`,
              // @ts-expect-error CSS custom property
              "--drift": `${c.drift}px`,
            }}
          >
            {c.emoji}
          </span>
        ))}
      </div>

      {/* Card */}
      <div
        className="relative z-10 rounded-3xl border-2 border-yellow-400/60 bg-card/95 shadow-2xl shadow-yellow-500/20 p-8 max-w-md mx-4 text-center"
        style={{ animation: "celebrate-pop 0.6s cubic-bezier(.2,1.1,.6,1)" }}
      >
        <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-yellow-400/90 mb-3">
          {isLevelAchievement ? "Level milestone" : "Achievement unlocked"}
        </div>
        <div
          className="text-8xl mb-4 leading-none"
          style={{ animation: "celebrate-shimmer 2s ease-in-out infinite" }}
        >
          {current.icon}
        </div>
        <h2 className="text-2xl font-bold text-yellow-300 mb-2">
          {current.name}
        </h2>
        {current.description && (
          <p className="text-sm text-muted-foreground max-w-[28ch] mx-auto">
            {current.description}
          </p>
        )}
        {queue.length > 0 && (
          <div className="mt-4 text-[11px] font-mono text-muted-foreground">
            +{queue.length} more queued
          </div>
        )}
        <Button
          size="sm"
          onClick={dismiss}
          className="mt-6 bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-300 border border-yellow-400/40"
        >
          Continue
        </Button>
      </div>
    </div>,
    document.body
  );
}
