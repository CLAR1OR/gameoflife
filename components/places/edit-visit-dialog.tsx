"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateVisit } from "@/modules/places/actions";
import type { PlaceVisit, TripWithStats } from "@/modules/places/types";
import { toast } from "sonner";

export function EditVisitDialog({
  visit,
  trips,
  onClose,
}: {
  visit: PlaceVisit | null;
  trips: TripWithStats[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [startedOn, setStartedOn] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [tripId, setTripId] = useState("");
  const [isHike, setIsHike] = useState(false);
  const [km, setKm] = useState("");
  const [elev, setElev] = useState("");

  useEffect(() => {
    if (!visit) return;
    setStartedOn(visit.startedOn);
    setRating(visit.rating);
    setNotes(visit.notes ?? "");
    setTripId(visit.tripId ?? "");
    setIsHike(visit.isHike);
    setKm(visit.distanceKm?.toString() ?? "");
    setElev(visit.elevationM?.toString() ?? "");
  }, [visit]);

  async function handleSave() {
    if (!visit) return;
    setBusy(true);
    try {
      const kmNum = km.trim() ? Number(km) : null;
      const elevNum = elev.trim() ? Number(elev) : null;
      await updateVisit(visit.id, {
        startedOn,
        rating,
        notes,
        tripId: tripId || null,
        isHike,
        distanceKm:
          isHike && kmNum !== null && Number.isFinite(kmNum)
            ? (kmNum as number)
            : null,
        elevationM:
          isHike && elevNum !== null && Number.isFinite(elevNum)
            ? Math.round(elevNum as number)
            : null,
      });
      toast.success("Visit updated");
      onClose();
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }

  return (
    <Dialog open={!!visit} onOpenChange={(o) => (o ? null : onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit visit</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px]">Date</Label>
              <Input
                type="date"
                value={startedOn}
                onChange={(e) => setStartedOn(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Trip</Label>
              <select
                value={tripId}
                onChange={(e) => setTripId(e.target.value)}
                className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
              >
                <option value="">— none —</option>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label className="text-[10px]">Rating</Label>
            <div className="flex gap-0.5 mt-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(rating === n ? null : n)}
                  className={`h-7 w-7 text-base transition-colors ${
                    rating != null && n <= rating
                      ? "text-xp"
                      : "text-muted-foreground/30 hover:text-muted-foreground"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-[10px]">Notes</Label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs resize-y"
            />
          </div>

          <div className="rounded-md border border-border/60 bg-muted/20 p-3 space-y-2">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={isHike}
                onChange={(e) => setIsHike(e.target.checked)}
                className="h-3.5 w-3.5"
              />
              <span>🥾 This visit is a hike</span>
            </label>
            {isHike && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px]">Distance (km)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={km}
                    onChange={(e) => setKm(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Elevation (m)</Label>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    value={elev}
                    onChange={(e) => setElev(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={busy || !startedOn}>
            {busy ? "…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
