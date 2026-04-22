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
import { importGoodreadsCsv } from "@/modules/books/actions";
import { toast } from "sonner";

export function CsvImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    try {
      const text = await file.text();
      const result = await importGoodreadsCsv(text);
      toast.success(
        `Imported ${result.imported} book${result.imported === 1 ? "" : "s"}`,
        {
          description:
            result.skipped > 0
              ? `${result.skipped} skipped (already in library)`
              : undefined,
        }
      );
      setFile(null);
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import from Goodreads</DialogTitle>
          <DialogDescription>
            Export your Goodreads library as CSV (My Books → Import/Export →
            Export Library), then drop the file here.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3">
          <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/20 p-8 cursor-pointer hover:border-glow/40 hover:bg-glow/5 transition-colors">
            <span className="text-3xl">📥</span>
            <span className="text-sm font-medium">
              {file ? file.name : "Click to choose a CSV file"}
            </span>
            {file && (
              <span className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
              </span>
            )}
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setFile(f);
              }}
            />
          </label>
          <p className="text-xs text-muted-foreground">
            The import dedupes by title against your existing library. Ratings,
            dates, and shelf status (read / currently-reading / to-read) all
            come across.
          </p>
        </div>

        <DialogFooter>
          <Button onClick={handleImport} disabled={!file || loading}>
            {loading ? "Importing…" : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
