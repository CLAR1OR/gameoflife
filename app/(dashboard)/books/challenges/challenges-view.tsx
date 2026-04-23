"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  activateReadingListTemplate,
  createReadingList,
  deleteReadingList,
} from "@/modules/books/actions";
import { toast } from "sonner";
import type { ReadingListWithProgress } from "@/modules/books/types";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const LIST_ICON_OPTIONS = [
  "📚", "📖", "🎯", "⭐", "🏆", "🌟", "🔥", "💎",
  "🗺️", "🧭", "🎓", "🧠", "✨", "🗡️", "🛡️", "🏛️",
];

type TemplateForView = {
  id: string;
  name: string;
  description: string;
  icon: string;
  books: { title: string; authors: string }[];
  sampleCovers: (string | null)[];
  isActivated: boolean;
};

function CoverStack({ covers }: { covers: (string | null)[] }) {
  const visible = covers.filter((c): c is string => !!c).slice(0, 4);
  if (visible.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 w-full bg-muted/30 rounded-md text-3xl opacity-50">
        📚
      </div>
    );
  }
  return (
    <div className="flex -space-x-6 justify-center h-24">
      {visible.map((c, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={c}
          alt=""
          className="h-24 w-16 object-cover rounded border-2 border-background shadow-lg"
          style={{ zIndex: 10 - i, transform: `rotate(${(i - 1.5) * 4}deg)` }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
          }}
        />
      ))}
    </div>
  );
}

export function ChallengesView({
  lists,
  templates,
}: {
  lists: ReadingListWithProgress[];
  templates: TemplateForView[];
}) {
  const [activating, setActivating] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newIcon, setNewIcon] = useState("📚");
  const [creating, setCreating] = useState(false);
  const available = templates.filter((t) => !t.isActivated);

  async function handleCreateList() {
    const name = newName.trim();
    if (!name) {
      toast.error("Name is required");
      return;
    }
    setCreating(true);
    try {
      await createReadingList({
        name,
        description: newDesc.trim() || undefined,
        icon: newIcon,
      });
      toast.success("List created");
      setNewOpen(false);
      setNewName("");
      setNewDesc("");
      setNewIcon("📚");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setCreating(false);
  }

  async function handleActivate(id: string) {
    setActivating(id);
    try {
      await activateReadingListTemplate(id);
      toast.success("Challenge accepted! Books added to your library.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setActivating(null);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remove "${name}"? The books stay in your library.`)) return;
    try {
      await deleteReadingList(id);
      toast.success("Challenge removed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Reading Challenges
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Curated reading lists. Finish every book to unlock the challenge.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setNewOpen(true)}>
            + New list
          </Button>
          <Link href="/books">
            <Button variant="outline" size="sm">
              ← Back to library
            </Button>
          </Link>
        </div>
      </div>

      {/* Active challenges */}
      {lists.length > 0 && (
        <section>
          <h2 className="text-xs font-mono uppercase tracking-wider text-glow mb-3">
            ⚔️ Your Challenges ({lists.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {lists.map((l) => (
              <div
                key={l.id}
                className="group rounded-xl border border-glow/30 bg-card p-4 transition-colors hover:border-glow/60"
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-3xl">{l.icon}</span>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/books/challenges/${l.id}`}
                      className="font-semibold hover:text-glow transition-colors line-clamp-1"
                    >
                      {l.name}
                    </Link>
                    {l.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {l.description}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(l.id, l.name)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted-foreground hover:text-destructive"
                  >
                    remove
                  </button>
                </div>
                <div className="mb-3">
                  <CoverStack covers={l.sampleCovers} />
                </div>
                <div className="flex items-center justify-between mb-1 text-[11px] font-mono">
                  <span className="text-glow">
                    {l.read}/{l.total} read
                  </span>
                  <span className="text-muted-foreground">
                    {l.pct.toFixed(0)}%
                  </span>
                </div>
                <Progress value={l.pct} className="h-1.5 xp-bar" />
                <div className="mt-3">
                  <Link href={`/books/challenges/${l.id}`}>
                    <Button size="sm" variant="outline" className="w-full">
                      Open
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Available templates */}
      {available.length > 0 && (
        <section>
          <h2 className="text-xs font-mono uppercase tracking-wider text-glow-purple mb-3">
            📜 Available Challenges
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {available.map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-dashed border-glow-purple/30 bg-card p-4 transition-colors hover:border-glow-purple/60"
              >
                <div className="flex items-start gap-2 mb-3">
                  <span className="text-2xl">{t.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm line-clamp-1">
                      {t.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {t.description}
                    </p>
                  </div>
                </div>
                <div className="mb-3">
                  <CoverStack covers={t.sampleCovers} />
                </div>
                <div className="flex items-center justify-between mb-3">
                  <Badge
                    variant="outline"
                    className="border-glow-purple/30 text-glow-purple text-[10px] font-mono"
                  >
                    {t.books.length} books
                  </Badge>
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => handleActivate(t.id)}
                  disabled={activating === t.id}
                >
                  {activating === t.id
                    ? "Adding…"
                    : "Accept challenge"}
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {lists.length === 0 && available.length === 0 && (
        <div className="rounded-xl border border-dashed bg-muted/20 p-10 text-center">
          <div className="text-6xl mb-3">🎯</div>
          <p className="text-sm text-muted-foreground">
            All templated challenges are active. Create a custom one with
            &ldquo;+ New list&rdquo;.
          </p>
        </div>
      )}

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="sm:!max-w-md">
          <DialogHeader>
            <DialogTitle>New reading list</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="list-name">Name</Label>
              <Input
                id="list-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Booker Prize Winners"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="list-desc">Description (optional)</Label>
              <textarea
                id="list-desc"
                rows={2}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="What this list is about…"
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="grid grid-cols-8 gap-1">
                {LIST_ICON_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setNewIcon(emoji)}
                    className={`flex h-9 w-9 items-center justify-center rounded-md text-lg transition-colors ${
                      newIcon === emoji
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-accent"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setNewOpen(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateList} disabled={creating}>
              {creating ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
