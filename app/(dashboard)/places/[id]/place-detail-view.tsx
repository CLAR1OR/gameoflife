"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { WorldMapClient, type MapPin } from "@/components/map/world-map-client";
import {
  logVisit,
  deleteVisit,
  deletePlace,
  updatePlace,
} from "@/modules/places/actions";
import type { Place, PlaceVisit } from "@/modules/places/queries";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function PlaceDetailView({
  place,
  visits,
}: {
  place: Place;
  visits: PlaceVisit[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(place.name);
  const [notes, setNotes] = useState(place.notes ?? "");
  const [busy, setBusy] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [visitDate, setVisitDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [visitNotes, setVisitNotes] = useState("");

  const pins: MapPin[] =
    place.lat != null && place.lng != null
      ? [
          {
            id: place.id,
            kind: "place",
            name: place.name,
            subtitle: [place.countryName, place.region]
              .filter(Boolean)
              .join(" · "),
            lat: place.lat,
            lng: place.lng,
          },
        ]
      : [];

  async function handleSave() {
    setBusy(true);
    try {
      await updatePlace(place.id, { name, notes });
      toast.success("Updated");
      setEditing(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete "${place.name}"? All visits will be lost.`)) return;
    try {
      await deletePlace(place.id);
      toast.success("Deleted");
      router.push("/places");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  async function handleLogVisit() {
    setBusy(true);
    try {
      await logVisit({
        placeId: place.id,
        startedOn: visitDate,
        notes: visitNotes,
      });
      toast.success("Visit logged");
      setLogOpen(false);
      setVisitNotes("");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }

  async function handleDeleteVisit(id: string) {
    if (!confirm("Delete this visit entry?")) return;
    try {
      await deleteVisit(id);
      toast.success("Visit deleted");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/places"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Back to places
        </Link>
      </div>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex-1 min-w-0">
          {editing ? (
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-2xl font-bold"
            />
          ) : (
            <h1 className="text-3xl font-bold leading-tight">{place.name}</h1>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline" className="text-[10px] font-mono">
              {place.type}
            </Badge>
            {place.countryName && (
              <Badge variant="outline" className="text-[10px] font-mono">
                {place.countryCode} · {place.countryName}
              </Badge>
            )}
            {place.region && (
              <Badge
                variant="outline"
                className="text-[10px] font-mono text-muted-foreground"
              >
                {place.region}
              </Badge>
            )}
            {place.lat != null && place.lng != null && (
              <Badge
                variant="outline"
                className="text-[10px] font-mono text-muted-foreground"
              >
                {place.lat.toFixed(2)}, {place.lng.toFixed(2)}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          {editing ? (
            <>
              <Button size="sm" onClick={handleSave} disabled={busy}>
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditing(false);
                  setName(place.name);
                  setNotes(place.notes ?? "");
                }}
                disabled={busy}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" onClick={() => setLogOpen((s) => !s)}>
                + Log visit
              </Button>
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

      {pins.length > 0 && <WorldMapClient pins={pins} height={300} />}

      {logOpen && (
        <div className="rounded-md border border-glow/40 bg-glow/5 p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px]">Date</Label>
              <Input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
          <textarea
            rows={2}
            value={visitNotes}
            onChange={(e) => setVisitNotes(e.target.value)}
            placeholder="Notes (optional)…"
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs resize-y"
          />
          <div className="flex justify-end gap-1">
            <Button size="sm" variant="ghost" onClick={() => setLogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleLogVisit} disabled={busy}>
              {busy ? "…" : "Log"}
            </Button>
          </div>
        </div>
      )}

      <section className="space-y-2">
        <h2 className="text-xs font-mono uppercase tracking-wider text-glow">
          📅 Visits ({visits.length})
        </h2>
        {visits.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No visits logged yet.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {visits.map((v) => (
              <li
                key={v.id}
                className="rounded-md border border-border/60 bg-card/40 px-3 py-2 flex items-start gap-3 group"
              >
                <span className="text-xs font-mono text-muted-foreground shrink-0 w-24">
                  {v.startedOn}
                  {v.endedOn ? ` → ${v.endedOn}` : ""}
                </span>
                <div className="flex-1 min-w-0">
                  {v.notes ? (
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap">
                      {v.notes}
                    </p>
                  ) : (
                    <span className="text-xs text-muted-foreground/60 italic">
                      no notes
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteVisit(v.id)}
                  className="text-[10px] text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {(editing || place.notes) && (
        <section className="space-y-2">
          <h2 className="text-xs font-mono uppercase tracking-wider text-glow">
            📝 Notes
          </h2>
          {editing ? (
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
            />
          ) : (
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {place.notes}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
