"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { logXpSession } from "@/modules/skills/actions";
import { toast } from "sonner";
import type { Skill } from "@/modules/skills/types";

export function LogSessionDialog({
  open,
  onOpenChange,
  skill,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skill: Skill;
}) {
  const [xp, setXp] = useState("25");
  const [duration, setDuration] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const xpAmount = parseInt(xp);
    if (isNaN(xpAmount) || xpAmount <= 0) return;

    setLoading(true);
    const result = await logXpSession({
      skillId: skill.id,
      xpGained: xpAmount,
      duration: duration ? parseInt(duration) : undefined,
      note: note.trim() || undefined,
    });

    if (result.leveledUp) {
      toast.success(`Level up! ${skill.name} is now level ${result.newLevel}!`, {
        description: `${result.newXp} XP total`,
        duration: 5000,
      });
    } else {
      toast.success(`+${xpAmount} XP for ${skill.name}`, {
        description: `${result.newXp} XP total`,
      });
    }

    if (result.unlocked.length > 0) {
      toast.info(`Unlocked: ${result.unlocked.join(", ")}!`, {
        duration: 5000,
      });
    }

    setLoading(false);
    setXp("25");
    setDuration("");
    setNote("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Log XP for {skill.name}</DialogTitle>
            <DialogDescription>
              Record a practice or learning session.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="xp-amount">XP Gained</Label>
              <Input
                id="xp-amount"
                type="number"
                min="1"
                max="1000"
                value={xp}
                onChange={(e) => setXp(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Quick guide: 10 = quick review, 25 = focused session, 50 = deep
                work, 100 = major milestone
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration in minutes (optional)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                placeholder="e.g., 30"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Input
                id="note"
                placeholder="What did you practice?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Logging..." : "Log Session"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
