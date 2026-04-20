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
import { updateNetWorth } from "@/modules/settings/actions";
import { toast } from "sonner";

export function NetWorthRow({ initial }: { initial: number }) {
  const [value, setValue] = useState(initial);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(String(initial));
  const [loading, setLoading] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseInt(input.replace(/[^0-9-]/g, ""), 10);
    if (!Number.isFinite(parsed)) {
      toast.error("Please enter a valid number");
      return;
    }
    setLoading(true);
    try {
      const { netWorth } = await updateNetWorth(parsed);
      setValue(netWorth);
      setOpen(false);
      toast.success("Net worth updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setLoading(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setInput(String(value));
          setOpen(true);
        }}
        className="group flex items-center gap-2 rounded-lg border border-border/50 bg-background/60 hover:bg-accent px-3 py-2 transition-colors"
        title="Click to edit net worth"
      >
        <span className="text-xl">💰</span>
        <span className="font-mono text-lg font-bold text-yellow-400">
          {value.toLocaleString()}
        </span>
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity">
          edit
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>Net Worth</DialogTitle>
              <DialogDescription>
                For now this is a manual number. A full finances module will
                replace this later.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-4">
              <Label htmlFor="net-worth">Amount</Label>
              <div className="flex items-center gap-2">
                <span className="text-2xl">💰</span>
                <Input
                  id="net-worth"
                  inputMode="numeric"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
