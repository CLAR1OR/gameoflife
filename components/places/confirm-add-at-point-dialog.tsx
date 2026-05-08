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
import {
  lookupCoords,
  createPlace,
  logVisit,
} from "@/modules/places/actions";
import type { GeocodeResult } from "@/lib/geocode";
import { toast } from "sonner";

/**
 * Pops up after the user clicks the map in "pick mode" — reverse-geocodes
 * the point, lets them name it / drop a pin / log a visit at the same time.
 */
export function ConfirmAddAtPointDialog({
  coords,
  onClose,
}: {
  coords: { lat: number; lng: number } | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [resolving, setResolving] = useState(false);
  const [resolved, setResolved] = useState<GeocodeResult | null>(null);
  const [name, setName] = useState("");
  const [logVisitToo, setLogVisitToo] = useState(true);
  const [visitDate, setVisitDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [busy, setBusy] = useState(false);

  // Reverse-geocode the moment we get coords.
  useEffect(() => {
    if (!coords) {
      setResolved(null);
      setName("");
      return;
    }
    let cancelled = false;
    setResolving(true);
    setResolved(null);
    setName("");
    (async () => {
      try {
        const r = await lookupCoords(coords.lat, coords.lng);
        if (cancelled) return;
        setResolved(r);
        setName(r?.name ?? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
      } catch {
        if (!cancelled) {
          setResolved(null);
          setName(`${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
        }
      }
      if (!cancelled) setResolving(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [coords]);

  async function handleSubmit() {
    if (!coords || !name.trim()) return;
    setBusy(true);
    try {
      const place = await createPlace({
        name,
        type: resolved?.kind ?? "spot",
        countryCode: resolved?.countryCode ?? null,
        countryName: resolved?.countryName ?? null,
        region: resolved?.region ?? null,
        lat: coords.lat,
        lng: coords.lng,
      });
      if (logVisitToo && visitDate) {
        await logVisit({ placeId: place.id, startedOn: visitDate });
      }
      toast.success(`Added "${place.name}"`);
      onClose();
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }

  return (
    <Dialog open={!!coords} onOpenChange={(o) => (o ? null : onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Drop a pin here</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {coords && (
            <div className="text-[11px] font-mono text-muted-foreground">
              {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              {resolving && <span className="ml-2 text-glow">resolving…</span>}
              {!resolving && resolved && (
                <span className="ml-2 text-glow">
                  ✓ {resolved.kind}
                  {resolved.countryCode ? ` · ${resolved.countryCode}` : ""}
                </span>
              )}
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-xs">Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="What's this place called?"
              disabled={resolving}
              autoFocus
            />
          </div>

          {resolved && (
            <div className="text-[11px] text-muted-foreground line-clamp-2">
              Resolved as: <span className="text-foreground">{resolved.name}</span>
            </div>
          )}

          <div className="rounded-md border border-border/60 bg-muted/20 p-3 space-y-2">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={logVisitToo}
                onChange={(e) => setLogVisitToo(e.target.checked)}
                className="h-3.5 w-3.5"
              />
              <span>Log a visit at the same time</span>
            </label>
            {logVisitToo && (
              <Input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="h-8 text-xs"
              />
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={busy || resolving || !name.trim()}
          >
            {busy ? "…" : "Add place"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
