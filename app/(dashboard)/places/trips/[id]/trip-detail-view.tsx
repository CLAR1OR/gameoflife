"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { updateTrip, deleteTrip } from "@/modules/places/actions";
import { toast } from "sonner";
import type { Place, PlaceVisit, Trip } from "@/modules/places/queries";

export function TripDetailView({
  trip,
  visits,
}: {
  trip: Trip;
  visits: { visit: PlaceVisit; place: Place }[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(trip.name);
  const [desc, setDesc] = useState(trip.description ?? "");
  const [start, setStart] = useState(trip.startedOn ?? "");
  const [end, setEnd] = useState(trip.endedOn ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await updateTrip(trip.id, {
        name,
        description: desc || null,
        startedOn: start || null,
        endedOn: end || null,
      });
      toast.success("Trip updated");
      setEditing(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }

  async function handleDelete() {
    if (
      !confirm(
        `Delete trip "${trip.name}"? Visits will be unlinked but kept.`
      )
    )
      return;
    try {
      await deleteTrip(trip.id);
      toast.success("Trip deleted");
      router.push("/places/trips");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  // Group visits by month within the trip for a tidy timeline.
  const groups = new Map<string, typeof visits>();
  const groupOrder: string[] = [];
  for (const v of visits) {
    const key = v.visit.startedOn.slice(0, 7); // YYYY-MM
    if (!groups.has(key)) {
      groups.set(key, []);
      groupOrder.push(key);
    }
    groups.get(key)!.push(v);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex-1 min-w-0 space-y-2">
          {editing ? (
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-2xl font-bold"
            />
          ) : (
            <h1 className="text-3xl font-bold leading-tight">{trip.name}</h1>
          )}
          <div className="flex flex-wrap gap-2 text-xs">
            {(trip.startedOn || trip.endedOn) && (
              <Badge variant="outline" className="font-mono">
                {[trip.startedOn, trip.endedOn].filter(Boolean).join(" → ")}
              </Badge>
            )}
            <Badge variant="outline" className="font-mono">
              {visits.length} visit{visits.length === 1 ? "" : "s"}
            </Badge>
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          {editing ? (
            <>
              <Button size="sm" onClick={save} disabled={busy}>
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                className="text-destructive"
              >
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {editing && (
        <div className="rounded-md border border-border/60 bg-card/40 p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px]">Start</Label>
              <Input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-[10px]">End</Label>
              <Input
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
          <div>
            <Label className="text-[10px]">Description</Label>
            <textarea
              rows={3}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs resize-y"
            />
          </div>
        </div>
      )}

      {!editing && trip.description && (
        <p className="text-sm whitespace-pre-wrap leading-relaxed">
          {trip.description}
        </p>
      )}

      <section className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-wider text-glow">
          📅 Visits in chronological order
        </h2>
        {visits.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No visits assigned to this trip yet. From any visit on a place
            page, set the &ldquo;Trip&rdquo; field to this one to add it.
          </p>
        ) : (
          <div className="space-y-4">
            {groupOrder.map((key) => {
              const items = groups.get(key)!;
              const [y, m] = key.split("-").map(Number);
              const label = new Date(y, (m ?? 1) - 1, 1).toLocaleDateString(
                undefined,
                { month: "long", year: "numeric" }
              );
              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      {label}
                    </h3>
                    <div className="flex-1 h-px bg-border/40" />
                    <span className="text-[10px] font-mono text-muted-foreground/60">
                      {items.length} visit{items.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {items.map((v) => (
                      <li
                        key={v.visit.id}
                        className="rounded-md border border-border/60 bg-card/40 px-3 py-2"
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <Link
                            href={`/places/${v.place.id}`}
                            className="text-sm font-medium hover:text-glow transition-colors line-clamp-1"
                          >
                            {v.place.name}
                          </Link>
                          <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                            {v.visit.startedOn}
                            {v.visit.endedOn ? ` → ${v.visit.endedOn}` : ""}
                          </span>
                        </div>
                        {v.visit.notes && (
                          <p className="text-xs text-muted-foreground italic mt-1 line-clamp-2">
                            &ldquo;{v.visit.notes}&rdquo;
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
