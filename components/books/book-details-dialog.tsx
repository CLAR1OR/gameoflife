"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateBook,
  deleteBook,
  logReread,
  deleteBookRead,
  getBookLinkOptions,
  getBookReadHistory,
  type BookLinkOptions,
} from "@/modules/books/actions";
import { toast } from "sonner";
import type { Book, BookRead } from "@/modules/books/types";
import { CoverPicker } from "./cover-picker";
import { LinkBookPicker } from "./link-book-picker";

function StatusButton({
  value,
  current,
  onSelect,
  label,
  emoji,
  accent,
}: {
  value: "want" | "reading" | "read";
  current: string;
  onSelect: (v: "want" | "reading" | "read") => void;
  label: string;
  emoji: string;
  accent: string;
}) {
  const selected = value === current;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`flex-1 rounded-md border px-3 py-2 text-sm transition-colors ${
        selected
          ? `${accent} border-current`
          : "border-border bg-muted/40 hover:bg-accent"
      }`}
    >
      <div className="flex items-center gap-1.5 justify-center">
        <span>{emoji}</span>
        <span>{label}</span>
      </div>
    </button>
  );
}

function dateToInput(d: Date | number | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "number" ? new Date(d * 1000) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function inputToDate(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 12, 0, 0);
}

function formatReadDate(d: Date | number | null): string {
  if (!d) return "—";
  const date = typeof d === "number" ? new Date(d * 1000) : d;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function BookDetailsDialog({
  book,
  open,
  onOpenChange,
}: {
  book: Book;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [status, setStatusRaw] = useState(book.status);
  const [rating, setRating] = useState<number | null>(book.rating);
  const [notes, setNotes] = useState(book.notes ?? "");
  const [startedAt, setStartedAt] = useState(dateToInput(book.startedAt));
  const [finishedAt, setFinishedAt] = useState(dateToInput(book.finishedAt));
  const [coverUrl, setCoverUrl] = useState<string | null>(book.coverUrl);
  const [skillId, setSkillId] = useState<string | null>(book.skillId);
  const [questId, setQuestId] = useState<string | null>(book.questId);
  const [pickingCover, setPickingCover] = useState(false);
  const [linking, setLinking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [linkOptions, setLinkOptions] = useState<BookLinkOptions | null>(null);
  const [history, setHistory] = useState<BookRead[]>([]);
  const [rereadOpen, setRereadOpen] = useState(false);
  const [rereadFinished, setRereadFinished] = useState(dateToInput(new Date()));
  const [rereadRating, setRereadRating] = useState<number | null>(null);
  const [rereadNotes, setRereadNotes] = useState("");

  useEffect(() => {
    setStatusRaw(book.status);
    setRating(book.rating);
    setNotes(book.notes ?? "");
    setStartedAt(dateToInput(book.startedAt));
    setFinishedAt(dateToInput(book.finishedAt));
    setCoverUrl(book.coverUrl);
    setSkillId(book.skillId);
    setQuestId(book.questId);
    setPickingCover(false);
    setLinking(false);
    setRereadOpen(false);
    setRereadFinished(dateToInput(new Date()));
    setRereadRating(null);
    setRereadNotes("");
  }, [book, open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const [opts, hist] = await Promise.all([
          getBookLinkOptions(),
          getBookReadHistory(book.id),
        ]);
        if (!cancelled) {
          setLinkOptions(opts);
          setHistory(hist);
        }
      } catch {
        // non-fatal
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, book.id]);

  function setStatus(next: "want" | "reading" | "read") {
    const today = dateToInput(new Date());
    if (next === "reading" && !startedAt) setStartedAt(today);
    if (next === "read") {
      if (!startedAt) setStartedAt(today);
      if (!finishedAt) setFinishedAt(today);
    }
    setStatusRaw(next);
  }

  async function handleSave() {
    setLoading(true);
    try {
      await updateBook(book.id, {
        status,
        rating,
        notes: notes.trim() || null,
        startedAt: inputToDate(startedAt),
        finishedAt: inputToDate(finishedAt),
        coverUrl,
        skillId,
        questId,
      });
      toast.success("Book updated");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setLoading(false);
  }

  async function handleDelete() {
    if (!confirm(`Remove "${book.title}" from your library?`)) return;
    setLoading(true);
    try {
      await deleteBook(book.id);
      toast.success("Removed");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setLoading(false);
  }

  async function handleLogReread() {
    setLoading(true);
    try {
      await logReread(book.id, {
        finishedAt: inputToDate(rereadFinished) ?? new Date(),
        rating: rereadRating,
        notes: rereadNotes.trim() || null,
      });
      toast.success("Reread logged");
      const hist = await getBookReadHistory(book.id);
      setHistory(hist);
      setRereadOpen(false);
      setRereadRating(null);
      setRereadNotes("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setLoading(false);
  }

  async function handleDeleteRead(readId: string) {
    if (!confirm("Delete this read entry?")) return;
    setLoading(true);
    try {
      await deleteBookRead(readId);
      toast.success("Read entry deleted");
      const hist = await getBookReadHistory(book.id);
      setHistory(hist);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:!max-w-lg">
        <DialogHeader>
          <div className="flex gap-4">
            <div className="relative w-24 h-36 shrink-0">
              {coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverUrl}
                  alt={book.title}
                  className="w-24 h-36 object-cover rounded-md border border-border"
                />
              ) : (
                <div className="w-24 h-36 flex items-center justify-center bg-muted/30 rounded-md border border-border text-3xl">
                  📖
                </div>
              )}
              <button
                type="button"
                onClick={() => setPickingCover((s) => !s)}
                className="absolute bottom-1 left-1 right-1 text-[10px] font-mono bg-black/70 text-white/90 hover:bg-black/90 rounded px-1 py-0.5 transition-colors"
              >
                {pickingCover ? "close" : "change cover"}
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg leading-tight">
                {book.title}
              </DialogTitle>
              <DialogDescription className="text-sm mt-1">
                {book.authors}
              </DialogDescription>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {book.year && (
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {book.year}
                  </Badge>
                )}
                {book.pages && (
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {book.pages} pp
                  </Badge>
                )}
                {book.isbn && (
                  <Badge variant="outline" className="text-[10px] font-mono">
                    ISBN {book.isbn}
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-2 items-center">
                <Link
                  href={`/books/${book.id}`}
                  className="text-[11px] text-glow hover:text-glow/80 transition-colors inline-flex items-center gap-1"
                  onClick={() => onOpenChange(false)}
                >
                  ↗ Open full page
                </Link>
                <button
                  type="button"
                  onClick={() => setLinking((s) => !s)}
                  className="text-[11px] text-muted-foreground hover:text-glow transition-colors inline-flex items-center gap-1"
                >
                  🔗 {linking ? "Close" : "Already read this under another entry?"}
                </button>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
          {pickingCover && (
            <CoverPicker
              defaultQuery={`${book.title} ${book.authors}`}
              currentUrl={coverUrl}
              onPick={(url) => {
                setCoverUrl(url);
                setPickingCover(false);
              }}
              onCancel={() => setPickingCover(false)}
            />
          )}

          {linking && (
            <LinkBookPicker
              currentBookId={book.id}
              currentTitle={book.title}
              currentAuthors={book.authors}
              onDone={() => {
                setLinking(false);
                onOpenChange(false);
              }}
              onCancel={() => setLinking(false)}
            />
          )}

          <div className="space-y-2">
            <Label>Status</Label>
            <div className="flex gap-2">
              <StatusButton
                value="want"
                current={status}
                onSelect={setStatus}
                label="Want to Read"
                emoji="📖"
                accent="bg-muted text-foreground"
              />
              <StatusButton
                value="reading"
                current={status}
                onSelect={setStatus}
                label="Reading"
                emoji="📗"
                accent="bg-glow/20 text-glow"
              />
              <StatusButton
                value="read"
                current={status}
                onSelect={setStatus}
                label="Read"
                emoji="✓"
                accent="bg-xp/20 text-xp"
              />
            </div>
          </div>

          {status === "read" && (
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(rating === n ? null : n)}
                    className={`h-8 w-8 rounded-md text-lg transition-colors ${
                      rating != null && n <= rating
                        ? "text-yellow-400"
                        : "text-muted-foreground/30 hover:text-muted-foreground"
                    }`}
                  >
                    ★
                  </button>
                ))}
                {rating && (
                  <button
                    type="button"
                    onClick={() => setRating(null)}
                    className="ml-2 text-xs text-muted-foreground hover:text-foreground self-center"
                  >
                    clear
                  </button>
                )}
              </div>
            </div>
          )}

          {(status === "reading" || status === "read") && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="book-started">Started</Label>
                <Input
                  id="book-started"
                  type="date"
                  value={startedAt}
                  onChange={(e) => setStartedAt(e.target.value)}
                />
              </div>
              {status === "read" && (
                <div className="space-y-2">
                  <Label htmlFor="book-finished">Finished</Label>
                  <Input
                    id="book-finished"
                    type="date"
                    value={finishedAt}
                    onChange={(e) => setFinishedAt(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          {/* Skill & quest linking */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="book-skill">Link to skill (optional)</Label>
              <select
                id="book-skill"
                value={skillId ?? ""}
                onChange={(e) => setSkillId(e.target.value || null)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">— Not linked —</option>
                {(linkOptions?.subskillGroups ?? []).map((g) => (
                  <optgroup
                    key={g.categoryId}
                    label={`${g.categoryIcon ?? ""} ${g.categoryName}`}
                  >
                    {g.subskills.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {status === "read" && skillId && (
                <p className="text-[10px] text-muted-foreground">
                  Each read grants +25 XP to this subskill.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="book-quest">Link to quest (optional)</Label>
              <select
                id="book-quest"
                value={questId ?? ""}
                onChange={(e) => setQuestId(e.target.value || null)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">— Not linked —</option>
                {(linkOptions?.activeQuests ?? []).map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.type === "main" ? "⚔" : "•"} {q.name}
                  </option>
                ))}
              </select>
              {status !== "read" && questId && (
                <p className="text-[10px] text-muted-foreground">
                  Quest auto-completes when this book is marked read.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="book-notes">Notes</Label>
            <textarea
              id="book-notes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Your thoughts on this book…"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Read history */}
          {history.length > 0 && (
            <div className="space-y-2 border-t border-border/60 pt-3">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                  Read {history.length}× —{" "}
                  {history.length === 1 ? "first read" : "latest first"}
                </Label>
                {status === "read" && (
                  <button
                    type="button"
                    onClick={() => setRereadOpen((s) => !s)}
                    className="text-[11px] text-glow hover:text-glow/80"
                  >
                    {rereadOpen ? "cancel" : "+ Log another read"}
                  </button>
                )}
              </div>

              {rereadOpen && (
                <div className="rounded-md border border-border bg-muted/20 p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px]">Finished on</Label>
                      <Input
                        type="date"
                        value={rereadFinished}
                        onChange={(e) => setRereadFinished(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-[10px]">Rating</Label>
                      <div className="flex gap-0.5 mt-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() =>
                              setRereadRating(rereadRating === n ? null : n)
                            }
                            className={`h-6 w-6 text-base transition-colors ${
                              rereadRating != null && n <= rereadRating
                                ? "text-yellow-400"
                                : "text-muted-foreground/30 hover:text-muted-foreground"
                            }`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <textarea
                    rows={2}
                    value={rereadNotes}
                    onChange={(e) => setRereadNotes(e.target.value)}
                    placeholder="Notes from this read…"
                    className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs placeholder:text-muted-foreground"
                  />
                  <Button
                    size="sm"
                    onClick={handleLogReread}
                    disabled={loading}
                    className="w-full"
                  >
                    Log read
                  </Button>
                </div>
              )}

              <ul className="space-y-1.5">
                {history.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-start gap-2 rounded-md border border-border/60 bg-card/40 p-2 text-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-muted-foreground">
                          {formatReadDate(r.finishedAt)}
                        </span>
                        {r.rating && (
                          <span className="text-yellow-400 text-[10px]">
                            {"★".repeat(r.rating)}
                          </span>
                        )}
                      </div>
                      {r.notes && (
                        <p className="text-muted-foreground italic mt-0.5 line-clamp-3">
                          &ldquo;{r.notes}&rdquo;
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteRead(r.id)}
                      disabled={loading}
                      className="text-[10px] text-muted-foreground/60 hover:text-destructive"
                      title="Delete this read"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter className="!justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={loading}
            className="text-destructive hover:text-destructive"
          >
            Remove
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
