"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { createTrip } from "@/modules/places/actions";
import { toast } from "sonner";
import { countryFlag } from "@/lib/country-flag";
import type { TripWithStats } from "@/modules/places/types";

export function TripsView({ trips }: { trips: TripWithStats[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await createTrip({
        name,
        description: desc || null,
        startedOn: start || null,
        endedOn: end || null,
      });
      toast.success("Trip created");
      setName("");
      setStart("");
      setEnd("");
      setDesc("");
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Trips</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Group visits into trips — &ldquo;Italy 2024&rdquo;,
            &ldquo;Honeymoon&rdquo;, &ldquo;Pacific Coast Highway&rdquo; — to
            see them as a whole.
          </p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          + New trip
        </Button>
      </div>

      {trips.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/20 p-8 text-center">
          <div className="text-5xl mb-2">🧳</div>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            No trips yet. Create one and assign visits to it from any place
            page (the &ldquo;Trip&rdquo; field on each visit).
          </p>
          <div className="mt-4">
            <Button onClick={() => setOpen(true)}>+ New trip</Button>
          </div>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {trips.map((t) => (
            <li key={t.id}>
              <Link
                href={`/places/trips/${t.id}`}
                className="block rounded-xl border border-border bg-card p-4 hover:border-glow/40 transition-colors space-y-2"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="text-lg font-bold leading-tight line-clamp-1">
                    {t.name}
                  </h2>
                  {(t.startedOn || t.endedOn) && (
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                      {[t.startedOn, t.endedOn].filter(Boolean).join(" → ")}
                    </span>
                  )}
                </div>
                {t.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {t.description}
                  </p>
                )}
                <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground flex-wrap">
                  <span className="text-glow">
                    {t.visitsCount} visit{t.visitsCount === 1 ? "" : "s"}
                  </span>
                  <span>·</span>
                  <span>
                    {t.placesCount} place{t.placesCount === 1 ? "" : "s"}
                  </span>
                  <span className="ml-2 flex gap-0.5 text-base">
                    {t.countryCodes.slice(0, 8).map((c) => (
                      <span key={c} title={c}>
                        {countryFlag(c)}
                      </span>
                    ))}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>New trip</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Italy, June 2024"
                  required
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>Start</Label>
                  <Input
                    type="date"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>End</Label>
                  <Input
                    type="date"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Description (optional)</Label>
                <textarea
                  rows={2}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={busy || !name.trim()}>
                {busy ? "…" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
