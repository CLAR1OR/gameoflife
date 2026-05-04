"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { celebrate } from "@/lib/celebrate";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  previewCsvImport,
  commitCsvImport,
} from "@/modules/finance/actions";
import type { CsvPreview } from "@/modules/finance/actions";
import { formatMoney } from "@/lib/money";
import type { FinanceAccount } from "@/modules/finance/queries";
import { listBankOptions } from "@/lib/finance-banks";

const BANK_OPTIONS = listBankOptions();

type Props = {
  accounts: FinanceAccount[];
  currency: string;
};

export function CsvImportButton({ accounts, currency }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={accounts.length === 0}
        className="text-xs font-mono px-3 py-1.5 rounded-md border border-border hover:border-glow/40 hover:text-foreground transition-colors disabled:opacity-50"
      >
        ⇪ Import CSV
      </button>
      {open && (
        <CsvImportDialog
          accounts={accounts}
          currency={currency}
          open={open}
          onOpenChange={setOpen}
        />
      )}
    </>
  );
}

function CsvImportDialog({
  accounts,
  currency,
  open,
  onOpenChange,
}: {
  accounts: FinanceAccount[];
  currency: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id ?? "");
  const [bankKey, setBankKey] = useState<string>("auto");
  const [csvText, setCsvText] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [preview, setPreview] = useState<CsvPreview | null>(null);
  const [previewing, startPreview] = useTransition();
  const [committing, startCommit] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(f: File) {
    const text = await f.text();
    setCsvText(text);
    setFileName(f.name);
    setPreview(null);
  }

  function handlePreview() {
    if (!accountId) {
      toast.error("Pick an account");
      return;
    }
    if (!csvText.trim()) {
      toast.error("Choose a CSV file first");
      return;
    }
    startPreview(async () => {
      try {
        const result = await previewCsvImport(accountId, csvText, bankKey);
        setPreview(result);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Preview failed");
      }
    });
  }

  function handleCommit() {
    if (!preview || preview.newCount === 0) return;
    startCommit(async () => {
      try {
        const { inserted, skipped, xpAwarded, newAchievements } =
          await commitCsvImport(accountId, csvText, bankKey);
        toast.success(
          `Imported ${inserted} transaction${inserted === 1 ? "" : "s"}` +
            (skipped > 0 ? ` · skipped ${skipped} duplicate${skipped === 1 ? "" : "s"}` : "") +
            (xpAwarded ? ` · +${xpAwarded} XP` : "")
        );
        if (newAchievements.length > 0) {
          celebrate(newAchievements);
        }
        onOpenChange(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Import failed");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import CSV</DialogTitle>
          <DialogDescription>
            Import transactions from your bank&apos;s CSV export. Duplicates are detected by
            date + amount + description and skipped automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="csv-account">Account</Label>
              <select
                id="csv-account"
                value={accountId}
                onChange={(e) => {
                  setAccountId(e.target.value);
                  setPreview(null);
                }}
                className="w-full h-9 rounded-md border bg-background px-3 text-sm"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} · {formatMoney(a.balance, currency)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="csv-bank">Bank format</Label>
              <select
                id="csv-bank"
                value={bankKey}
                onChange={(e) => {
                  setBankKey(e.target.value);
                  setPreview(null);
                }}
                className="w-full h-9 rounded-md border bg-background px-3 text-sm"
              >
                {BANK_OPTIONS.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="csv-file">CSV file</Label>
              <input
                id="csv-file"
                ref={fileRef}
                type="file"
                accept=".csv,text/csv,text/plain"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
                className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-muted file:text-foreground hover:file:bg-accent file:cursor-pointer"
              />
              {fileName && (
                <p className="text-[11px] font-mono text-muted-foreground truncate">
                  {fileName}
                </p>
              )}
            </div>
          </div>

          {!preview ? (
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handlePreview}
                disabled={previewing || !csvText.trim()}
              >
                {previewing ? "Parsing…" : "Preview"}
              </Button>
            </div>
          ) : (
            <PreviewPanel preview={preview} currency={currency} />
          )}
        </div>

        {preview && (
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPreview(null)}
            >
              Re-parse
            </Button>
            <Button
              type="button"
              disabled={committing || preview.newCount === 0}
              onClick={handleCommit}
            >
              {committing
                ? "Importing…"
                : preview.newCount === 0
                  ? "Nothing to import"
                  : `Import ${preview.newCount} new transaction${preview.newCount === 1 ? "" : "s"}`}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PreviewPanel({
  preview,
  currency,
}: {
  preview: CsvPreview;
  currency: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap text-xs font-mono">
        <Badge tone="muted">Format: {preview.detectedFormat}</Badge>
        <Badge tone="glow">{preview.newCount} new</Badge>
        <Badge tone="muted">{preview.duplicateCount} already imported</Badge>
        {preview.errors.length > 0 && (
          <Badge tone="red">{preview.errors.length} parse errors</Badge>
        )}
        <span className="ml-auto text-muted-foreground">
          + {formatMoney(preview.totalIncome, currency)} · − {formatMoney(preview.totalExpense, currency)}
        </span>
      </div>

      {preview.errors.length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer text-destructive font-mono">
            Parse errors ({preview.errors.length})
          </summary>
          <ul className="mt-2 space-y-1 text-[11px] font-mono text-red-300 max-h-32 overflow-auto">
            {preview.errors.slice(0, 20).map((e, i) => (
              <li key={i}>
                line {e.line}: {e.reason}
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="rounded-lg border bg-background max-h-[50vh] overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-muted/40 backdrop-blur-sm">
            <tr className="text-left text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              <th className="p-2 w-20">Date</th>
              <th className="p-2">Description</th>
              <th className="p-2 w-24 text-right">Amount</th>
              <th className="p-2 w-20 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {preview.rows.map((r, i) => (
              <tr
                key={r.importHash + "-" + i}
                className={`border-t border-border/40 ${r.duplicate ? "opacity-50" : ""}`}
              >
                <td className="p-2 font-mono text-[11px]">{r.occurredOn}</td>
                <td className="p-2 truncate max-w-[300px]" title={r.description}>
                  <div className="truncate">{r.category}</div>
                  {r.note && r.note !== r.category && (
                    <div className="text-[10px] text-muted-foreground truncate">
                      {r.note}
                    </div>
                  )}
                </td>
                <td
                  className={`p-2 text-right font-mono font-bold ${
                    r.amount >= 0 ? "text-glow" : "text-destructive"
                  }`}
                >
                  {formatMoney(r.amount, currency, { sign: "always" })}
                </td>
                <td className="p-2 text-center">
                  {r.duplicate ? (
                    <Badge tone="muted">skip</Badge>
                  ) : (
                    <Badge tone="glow">new</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "glow" | "muted" | "red";
}) {
  const cls =
    tone === "glow"
      ? "border-glow/50 text-glow bg-glow/10"
      : tone === "red"
        ? "border-destructive/50 text-destructive bg-destructive/10"
        : "border-border text-muted-foreground bg-muted/30";
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider ${cls}`}
    >
      {children}
    </span>
  );
}
