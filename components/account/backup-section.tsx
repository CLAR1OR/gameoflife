"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { exportBackup, importBackup } from "@/modules/backup/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

function downloadJson(filename: string, content: unknown) {
  const blob = new Blob([JSON.stringify(content, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function filenameForToday(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `gameoflife-backup-${y}-${m}-${day}.json`;
}

export function BackupSection({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleExport() {
    setExporting(true);
    try {
      const backup = await exportBackup();
      downloadJson(filenameForToday(), backup);
      toast.success("Backup downloaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    }
    setExporting(false);
  }

  async function handleImport() {
    if (!file) {
      toast.error("Choose a backup file first");
      return;
    }
    if (confirmText.trim().toLowerCase() !== userEmail.trim().toLowerCase()) {
      toast.error("Type your email to confirm the wipe");
      return;
    }
    setImporting(true);
    try {
      const text = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error("File is not valid JSON");
      }
      await importBackup(parsed);
      toast.success("Restore complete — reloading");
      setFile(null);
      setConfirmText("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      // Full reload so every page re-fetches with the new data.
      setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
      setImporting(false);
      return;
    }
    router.refresh();
  }

  return (
    <div className="rounded-xl border bg-card divide-y divide-border/60">
      {/* Export row */}
      <div className="flex items-center justify-between gap-4 flex-wrap p-5">
        <div>
          <div className="text-sm font-medium">Export data</div>
          <div className="text-xs text-muted-foreground mt-0.5 max-w-lg">
            Downloads everything — skills, milestones, habits, quests, books,
            finance, achievements — as a single JSON file you can keep as a
            backup or bring with you when migrating.
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? "Exporting…" : "↓ Download backup"}
        </Button>
      </div>

      {/* Import row */}
      <div className="p-5 space-y-3">
        <div>
          <div className="text-sm font-medium">Import / restore</div>
          <div className="text-xs text-muted-foreground mt-0.5 max-w-lg">
            Restore from a backup file. This <span className="text-destructive font-medium">replaces</span>{" "}
            everything in your current account — skills, habits, books,
            finance, achievements. Your login (email &amp; password) stays.
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="backup-file" className="text-xs">
            Backup JSON
          </Label>
          <Input
            id="backup-file"
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            disabled={importing}
            className="text-xs"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="backup-confirm" className="text-xs">
            Type your email{" "}
            <span className="font-mono text-muted-foreground">
              ({userEmail})
            </span>{" "}
            to confirm the wipe
          </Label>
          <Input
            id="backup-confirm"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={userEmail}
            disabled={importing}
            className="font-mono text-xs"
          />
        </div>

        <Button
          size="sm"
          variant="destructive"
          onClick={handleImport}
          disabled={
            importing ||
            !file ||
            confirmText.trim().toLowerCase() !== userEmail.trim().toLowerCase()
          }
        >
          {importing ? "Restoring…" : "Restore from backup (wipes current data)"}
        </Button>
      </div>
    </div>
  );
}
