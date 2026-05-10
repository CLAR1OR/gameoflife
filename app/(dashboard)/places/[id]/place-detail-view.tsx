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
  setVisitTrip,
} from "@/modules/places/actions";
import type {
  Place,
  PlaceVisit,
  TripWithStats,
} from "@/modules/places/queries";
import { PlacePhotoUpload } from "@/components/places/place-photo-upload";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function PlaceDetailView({
  place,
  visits,
  trips,
}: {
  place: Place;
  visits: PlaceVisit[];
  trips: TripWithStats[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(place.name);
  const [notes, setNotes] = useState(place.notes ?? "");
  const [isHike, setIsHike] = useState(place.type === "hike");
  const [hikeKm, setHikeKm] = useState(place.distanceKm?.toString() ?? "");
  const [hikeElev, setHikeElev] = useState(
    place.elevationM?.toString() ?? ""
  );
  const [busy, setBusy] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [visitDate, setVisitDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [visitNotes, setVisitNotes] = useState("");
  const [visitRating, setVisitRating] = useState<number | null>(null);
  const [visitTripId, setVisitTripIdState] = useState<string>("");
  // Hike upgrade in the log-visit form: only relevant if the place isn't
  // a hike yet — lets the user promote it inline + log the visit in one go.
  const [promoteToHike, setPromoteToHike] = useState(false);
  const [visitHikeKm, setVisitHikeKm] = useState("");
  const [visitHikeElev, setVisitHikeElev] = useState("");

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
      const km = hikeKm.trim() ? Number(hikeKm) : null;
      const elev = hikeElev.trim() ? Number(hikeElev) : null;
      await updatePlace(place.id, {
        name,
        notes,
        // Toggle "hike" type if the user opted in/out, otherwise leave the
        // type alone (don't clobber e.g. a "city" classification).
        type: isHike ? "hike" : place.type === "hike" ? "spot" : place.type,
        distanceKm: isHike
          ? Number.isFinite(km)
            ? (km as number)
            : null
          : null,
        elevationM: isHike
          ? Number.isFinite(elev)
            ? Math.round(elev as number)
            : null
          : null,
      });
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
      // If the user opted to promote this place to a hike on the visit
      // form, update the place first so achievements + stats pick up the
      // change atomically with the new visit.
      if (promoteToHike && place.type !== "hike") {
        const km = visitHikeKm.trim() ? Number(visitHikeKm) : null;
        const elev = visitHikeElev.trim() ? Number(visitHikeElev) : null;
        await updatePlace(place.id, {
          type: "hike",
          distanceKm: Number.isFinite(km) ? (km as number) : null,
          elevationM: Number.isFinite(elev)
            ? Math.round(elev as number)
            : null,
        });
      }
      await logVisit({
        placeId: place.id,
        startedOn: visitDate,
        notes: visitNotes,
        rating: visitRating,
        tripId: visitTripId || null,
      });
      toast.success(
        promoteToHike && place.type !== "hike"
          ? "Hike logged"
          : "Visit logged"
      );
      setLogOpen(false);
      setVisitNotes("");
      setVisitRating(null);
      setVisitTripIdState("");
      setPromoteToHike(false);
      setVisitHikeKm("");
      setVisitHikeElev("");
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

  async function handleVisitTripChange(visitId: string, tripId: string) {
    try {
      await setVisitTrip(visitId, tripId || null);
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
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <PlacePhotoUpload
            target="place"
            id={place.id}
            hasPhoto={!!place.coverImage}
          >
            {place.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={place.coverImage}
                alt=""
                className="w-32 h-24 object-cover rounded-md border border-border shrink-0"
              />
            ) : (
              <div className="w-32 h-24 flex items-center justify-center bg-muted/30 rounded-md border-2 border-dashed border-border text-2xl text-muted-foreground shrink-0">
                🗺️
              </div>
            )}
          </PlacePhotoUpload>

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
              <Badge
                variant="outline"
                className={`text-[10px] font-mono ${
                  place.type === "hike"
                    ? "border-glow/40 text-glow bg-glow/10"
                    : ""
                }`}
              >
                {place.type === "hike" ? "🥾 hike" : place.type}
              </Badge>
              {place.type === "hike" && place.distanceKm != null && (
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono border-glow/30 text-glow"
                >
                  📏 {place.distanceKm} km
                </Badge>
              )}
              {place.type === "hike" && place.elevationM != null && (
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono border-glow/30 text-glow"
                >
                  ⛰️ {place.elevationM.toLocaleString()} m
                </Badge>
              )}
              {place.type === "hike" && visits.length > 0 && (
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono border-xp/30 text-xp"
                >
                  🥇 hiked {visits.length}× ·{" "}
                  {place.distanceKm != null
                    ? `${(place.distanceKm * visits.length).toFixed(1)} km total`
                    : ""}
                </Badge>
              )}
              {place.countryName && place.countryCode ? (
                <Link href={`/places/country/${place.countryCode}`}>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono hover:border-glow/40 transition-colors cursor-pointer"
                  >
                    {place.countryCode} · {place.countryName}
                  </Badge>
                </Link>
              ) : place.countryName ? (
                <Badge variant="outline" className="text-[10px] font-mono">
                  {place.countryName}
                </Badge>
              ) : null}
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
            <div className="space-y-1">
              <Label className="text-[10px]">Trip (optional)</Label>
              <select
                value={visitTripId}
                onChange={(e) => setVisitTripIdState(e.target.value)}
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
                  onClick={() =>
                    setVisitRating(visitRating === n ? null : n)
                  }
                  className={`h-7 w-7 text-base transition-colors ${
                    visitRating != null && n <= visitRating
                      ? "text-xp"
                      : "text-muted-foreground/30 hover:text-muted-foreground"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <textarea
            rows={2}
            value={visitNotes}
            onChange={(e) => setVisitNotes(e.target.value)}
            placeholder="Notes (optional)…"
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs resize-y"
          />

          {place.type === "hike" ? (
            <div className="text-[11px] font-mono text-muted-foreground rounded border border-glow/20 bg-glow/5 px-2 py-1.5">
              🥾 This place is a hike
              {place.distanceKm != null && ` · ${place.distanceKm} km`}
              {place.elevationM != null &&
                ` · ${place.elevationM.toLocaleString()} m`}
              {" — counts toward your hike stats automatically."}
            </div>
          ) : (
            <div className="rounded-md border border-border/60 bg-muted/20 p-2 space-y-2">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={promoteToHike}
                  onChange={(e) => setPromoteToHike(e.target.checked)}
                  className="h-3.5 w-3.5"
                />
                <span>🥾 Mark as hike</span>
                <span className="text-[10px] text-muted-foreground/60">
                  promotes the place to a hike + counts km / elevation
                </span>
              </label>
              {promoteToHike && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px]">Distance (km)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={visitHikeKm}
                      onChange={(e) => setVisitHikeKm(e.target.value)}
                      placeholder="e.g. 12.5"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Elevation (m)</Label>
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      value={visitHikeElev}
                      onChange={(e) => setVisitHikeElev(e.target.value)}
                      placeholder="e.g. 850"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

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
                className="rounded-md border border-border/60 bg-card/40 px-3 py-2 group"
              >
                <div className="flex items-start gap-3">
                  <span className="text-xs font-mono text-muted-foreground shrink-0 w-24">
                    {v.startedOn}
                    {v.endedOn ? ` → ${v.endedOn}` : ""}
                  </span>
                  <PlacePhotoUpload
                    target="visit"
                    id={v.id}
                    hasPhoto={!!v.photoUrl}
                  >
                    {v.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={v.photoUrl}
                        alt=""
                        className="w-20 h-14 rounded object-cover border border-border shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-14 flex items-center justify-center bg-muted/20 rounded border border-dashed border-border text-xs text-muted-foreground shrink-0">
                        +
                      </div>
                    )}
                  </PlacePhotoUpload>
                  <div className="flex-1 min-w-0">
                    {v.rating != null && (
                      <div className="text-xp text-xs tracking-widest mb-0.5">
                        {"★".repeat(v.rating)}
                        <span className="text-muted-foreground/30">
                          {"★".repeat(5 - v.rating)}
                        </span>
                      </div>
                    )}
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
                  <select
                    value={v.tripId ?? ""}
                    onChange={(e) =>
                      handleVisitTripChange(v.id, e.target.value)
                    }
                    className="h-7 rounded-md border border-input bg-background px-1.5 text-[11px] shrink-0 max-w-[140px]"
                    title="Trip"
                  >
                    <option value="">no trip</option>
                    {trips.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleDeleteVisit(v.id)}
                    className="text-[10px] text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity self-start"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {editing && (
        <section className="space-y-2">
          <h2 className="text-xs font-mono uppercase tracking-wider text-glow">
            🥾 Hike
          </h2>
          <div className="rounded-md border border-border/60 bg-card/40 p-3 space-y-2">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={isHike}
                onChange={(e) => setIsHike(e.target.checked)}
                className="h-3.5 w-3.5"
              />
              <span>This place is a hike</span>
            </label>
            {isHike && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px]">Distance (km)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={hikeKm}
                    onChange={(e) => setHikeKm(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Elevation gain (m)</Label>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    value={hikeElev}
                    onChange={(e) => setHikeElev(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            )}
          </div>
        </section>
      )}

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
