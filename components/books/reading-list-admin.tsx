"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  addBookToReadingList,
  removeBookFromReadingList,
  searchMyBooks,
  updateReadingList,
  deleteReadingList,
} from "@/modules/books/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const LIST_ICON_OPTIONS = [
  "📚", "📖", "🎯", "⭐", "🏆", "🌟", "🔥", "💎",
  "🗺️", "🧭", "🎓", "🧠", "✨", "🗡️", "🛡️", "🏛️",
];

type Match = {
  id: string;
  title: string;
  authors: string;
  coverUrl: string | null;
  status: string;
  rating: number | null;
  year: number | null;
};

export function ReadingListAdmin({
  listId,
  listName,
  listDescription,
  listIcon,
  isTemplate,
  bookIdsInList,
}: {
  listId: string;
  listName: string;
  listDescription: string | null;
  listIcon: string;
  isTemplate: boolean;
  bookIdsInList: string[];
}) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Match[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

  const [editName, setEditName] = useState(listName);
  const [editDesc, setEditDesc] = useState(listDescription ?? "");
  const [editIcon, setEditIcon] = useState(listIcon);
  const [saving, setSaving] = useState(false);

  async function runSearch(q: string) {
    setQuery(q);
    const trimmed = q.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const rows = await searchMyBooks(trimmed, "");
      setResults(
        rows.filter((r) => !bookIdsInList.includes(r.id))
      );
    } catch {
      setResults([]);
    }
    setSearching(false);
  }

  async function handleAdd(bookId: string) {
    setAdding(bookId);
    try {
      await addBookToReadingList(listId, bookId);
      toast.success("Book added");
      setResults((prev) => prev.filter((r) => r.id !== bookId));
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setAdding(null);
  }

  async function handleSaveEdit() {
    const name = editName.trim();
    if (!name) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      await updateReadingList(listId, {
        name,
        description: editDesc.trim() || null,
        icon: editIcon,
      });
      toast.success("List updated");
      setEditOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setSaving(false);
  }

  async function handleDeleteList() {
    if (
      !confirm(
        `Delete list "${listName}"? Books stay in your library.`
      )
    )
      return;
    try {
      await deleteReadingList(listId);
      toast.success("List deleted");
      router.push("/books/challenges");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" onClick={() => setAddOpen(true)}>
        + Add book
      </Button>
      {!isTemplate && (
        <>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditOpen(true)}
          >
            ✎ Edit list
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDeleteList}
            className="text-destructive hover:text-destructive"
          >
            Delete list
          </Button>
        </>
      )}

      {/* Add-book dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:!max-w-md">
          <DialogHeader>
            <DialogTitle>Add book to &ldquo;{listName}&rdquo;</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              autoFocus
              placeholder="Search your library by title or author…"
              value={query}
              onChange={(e) => runSearch(e.target.value)}
            />
            <div className="max-h-[50vh] overflow-y-auto space-y-1.5">
              {searching && (
                <p className="text-xs text-muted-foreground">Searching…</p>
              )}
              {!searching && query.trim() && results.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No matches — add books to your library first from the Books
                  page.
                </p>
              )}
              {results.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleAdd(r.id)}
                  disabled={adding === r.id}
                  className="flex w-full gap-2 items-start rounded-md border border-border bg-card p-2 text-left hover:border-glow/40 transition-colors disabled:opacity-50"
                >
                  {r.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.coverUrl}
                      alt=""
                      className="h-12 w-8 object-cover rounded shrink-0 border border-border"
                    />
                  ) : (
                    <div className="h-12 w-8 flex items-center justify-center bg-muted/30 rounded shrink-0 text-xs">
                      📖
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium line-clamp-1">
                      {r.title}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {r.authors}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-glow shrink-0 self-center">
                    {adding === r.id ? "…" : "+ Add"}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit-list dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:!max-w-md">
          <DialogHeader>
            <DialogTitle>Edit list</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-list-name">Name</Label>
              <Input
                id="edit-list-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-list-desc">Description</Label>
              <textarea
                id="edit-list-desc"
                rows={2}
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
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
                    onClick={() => setEditIcon(emoji)}
                    className={`flex h-9 w-9 items-center justify-center rounded-md text-lg transition-colors ${
                      editIcon === emoji
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
              onClick={() => setEditOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function RemoveFromListButton({
  listId,
  bookId,
}: {
  listId: string;
  bookId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    if (!confirm("Remove this book from the list? (stays in library)")) return;
    setLoading(true);
    try {
      await removeBookFromReadingList(listId, bookId);
      toast.success("Removed");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={loading}
      className="absolute top-1 left-1 z-10 h-5 w-5 rounded-full bg-black/70 text-white/80 hover:bg-destructive text-[10px] leading-none flex items-center justify-center shadow-md"
      title="Remove from list"
    >
      ✕
    </button>
  );
}
