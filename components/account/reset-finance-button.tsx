"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
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
import { resetFinanceData } from "@/modules/finance/actions";

const CONFIRM_WORD = "RESET";

export function ResetFinanceButton() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    if (input.trim().toUpperCase() !== CONFIRM_WORD) {
      toast.error(`Type "${CONFIRM_WORD}" to confirm`);
      return;
    }
    startTransition(async () => {
      try {
        await resetFinanceData();
        toast.success("Finance data reset");
        setOpen(false);
        setInput("");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Reset failed");
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-red-300"
      >
        Reset finance data…
      </Button>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setInput("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset all finance data?</DialogTitle>
            <DialogDescription>
              This deletes all accounts, transactions, recurring rules and
              net-worth snapshots. Your manual net-worth fallback will be set
              to zero. This cannot be undone. Earned XP stays.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="confirm-input">
              Type <span className="font-mono text-destructive">{CONFIRM_WORD}</span> to confirm
            </Label>
            <Input
              id="confirm-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={CONFIRM_WORD}
              autoFocus
              autoComplete="off"
              className="font-mono"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                setInput("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={pending || input.trim().toUpperCase() !== CONFIRM_WORD}
              className="bg-destructive/20 text-red-300 hover:bg-destructive/30 border border-destructive/40"
            >
              {pending ? "Resetting…" : "Reset everything"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
