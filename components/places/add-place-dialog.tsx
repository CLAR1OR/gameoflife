"use client";

import { useState } from "react";
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
  searchPlaces,
  addPlaceFromGeocode,
  logVisit,
} from "@/modules/places/actions";
import type { GeocodeResult } from "@/lib/geocode";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const KIND_LABEL: Record<GeocodeResult["kind"], string> = {
  spot: "Spot",
  city: "City",
  region: "Region",
  country: "Country",
};

export function AddPlaceDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [logVisitToo, setLogVisitToo] = useState(true);
  const [visitDate, setVisitDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    try {
      const rows = await searchPlaces(q);
      setResults(rows);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Search failed");
    }
    setSearching(false);
  }

  async function pick(g: GeocodeResult) {
    const key = `${g.lat},${g.lng}`;
    setAdding(key);
    try {
      const place = await addPlaceFromGeocode(g);
      if (logVisitToo && visitDate) {
        await logVisit({ placeId: place.id, startedOn: visitDate });
      }
      toast.success(`Added "${place.name}"`);
      onOpenChange(false);
      setQuery("");
      setResults([]);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setAdding(null);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:!max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a place</DialogTitle>
        </DialogHeader>
        <form onSubmit={runSearch} className="flex gap-2">
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a city, country, or landmark…"
            className="flex-1"
          />
          <Button type="submit" disabled={searching || !query.trim()}>
            {searching ? "…" : "Search"}
          </Button>
        </form>

        <div className="space-y-2 max-h-[40vh] overflow-y-auto">
          {!searching && query && results.length === 0 && (
            <p className="text-xs text-muted-foreground py-3">
              No matches. Try a more specific or differently-spelled query.
            </p>
          )}
          {results.map((r) => {
            const key = `${r.lat},${r.lng}`;
            return (
              <button
                key={key}
                type="button"
                onClick={() => pick(r)}
                disabled={adding !== null}
                className="w-full text-left rounded-md border border-border bg-card/40 hover:border-glow/40 transition-colors p-2 flex items-center gap-2"
              >
                <span className="text-xs font-mono uppercase tracking-wider text-glow shrink-0 w-14">
                  {KIND_LABEL[r.kind]}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium line-clamp-1">
                    {r.name}
                  </div>
                  {r.countryName && (
                    <div className="text-[10px] font-mono text-muted-foreground">
                      {r.countryCode} · {r.lat.toFixed(2)}, {r.lng.toFixed(2)}
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-mono text-glow shrink-0">
                  {adding === key ? "…" : "+ Add"}
                </span>
              </button>
            );
          })}
        </div>

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
            <div className="space-y-1">
              <Label className="text-[10px]">Visit date</Label>
              <Input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
