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
  createFriend,
  uploadFriendPhoto,
} from "@/modules/friends/actions";
import {
  searchPlaces,
  addPlaceFromGeocode,
} from "@/modules/places/actions";
import type { GeocodeResult } from "@/lib/geocode";
import type { Place } from "@/modules/places/types";
import {
  MILESTONE_PACKS,
  type MilestonePackKey,
} from "@/modules/friends/milestone-templates";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function AddFriendDialog({
  open,
  onOpenChange,
  knownPlaces,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  knownPlaces: Pick<Place, "id" | "name" | "countryName">[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [residenceId, setResidenceId] = useState<string>("");
  const [howWeMet, setHowWeMet] = useState("");
  const [cadenceDays, setCadenceDays] = useState("");
  const [birthday, setBirthday] = useState("");
  const [metAt, setMetAt] = useState("");
  const [milestonePack, setMilestonePack] =
    useState<MilestonePackKey>("friend");
  const [notes, setNotes] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Inline place-search if user wants to add a new residence right here.
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeResults, setPlaceResults] = useState<GeocodeResult[]>([]);
  const [placeSearching, setPlaceSearching] = useState(false);

  async function runPlaceSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = placeQuery.trim();
    if (!q) return;
    setPlaceSearching(true);
    try {
      const rows = await searchPlaces(q);
      setPlaceResults(rows);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Search failed");
    }
    setPlaceSearching(false);
  }

  async function pickGeocoded(g: GeocodeResult) {
    setBusy(true);
    try {
      const p = await addPlaceFromGeocode(g);
      setResidenceId(p.id);
      setPlaceResults([]);
      setPlaceQuery("");
      router.refresh();
      toast.success(`Added "${p.name}" — selected as residence.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      const cad = cadenceDays.trim() ? Number(cadenceDays) : null;
      const created = await createFriend({
        name,
        nickname: nickname || null,
        currentResidenceId: residenceId || null,
        howWeMet: howWeMet || null,
        birthday: birthday || null,
        metAt: metAt || null,
        milestonePack,
        notes: notes || null,
        contactCadenceDays:
          cad !== null && Number.isFinite(cad) && cad > 0 ? Math.round(cad) : null,
      });
      if (photoFile) {
        const fd = new FormData();
        fd.append("photo", photoFile);
        try {
          await uploadFriendPhoto(created.id, fd);
        } catch (e) {
          // Friend was created; photo failed. Don't block.
          toast.error(
            "Friend added but photo upload failed: " +
              (e instanceof Error ? e.message : "unknown error")
          );
        }
      }
      toast.success(`Added ${name.trim()}`);
      setName("");
      setNickname("");
      setResidenceId("");
      setHowWeMet("");
      setCadenceDays("");
      setBirthday("");
      setMetAt("");
      setMilestonePack("friend");
      setNotes("");
      setPhotoFile(null);
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
      onOpenChange(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add a friend</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex items-start gap-3">
              <label className="cursor-pointer shrink-0">
                {photoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoPreview}
                    alt=""
                    className="h-16 w-16 rounded-full object-cover border border-glow-purple/50"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full border-2 border-dashed border-border bg-muted/40 flex items-center justify-center text-[10px] font-mono text-muted-foreground hover:border-glow-purple/50 transition-colors">
                    + photo
                  </div>
                )}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    if (photoPreview) URL.revokeObjectURL(photoPreview);
                    setPhotoFile(f);
                    setPhotoPreview(URL.createObjectURL(f));
                  }}
                  className="hidden"
                />
              </label>
              <div className="flex-1 space-y-1">
                <Label>Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Anna Müller"
                  required
                  autoFocus
                />
                {photoFile && (
                  <button
                    type="button"
                    onClick={() => {
                      if (photoPreview) URL.revokeObjectURL(photoPreview);
                      setPhotoFile(null);
                      setPhotoPreview(null);
                    }}
                    className="text-[10px] font-mono text-muted-foreground hover:text-destructive"
                  >
                    remove photo
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <Label>Nickname (optional)</Label>
              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Annie"
              />
            </div>

            <div className="space-y-1">
              <Label>Current residence</Label>
              <select
                value={residenceId}
                onChange={(e) => setResidenceId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">— none —</option>
                {knownPlaces.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.countryName ? ` · ${p.countryName}` : ""}
                  </option>
                ))}
              </select>
              <div className="rounded-md border border-border/60 bg-muted/20 p-2 mt-1 space-y-1.5">
                <div className="text-[10px] font-mono text-muted-foreground">
                  …or add a new place:
                </div>
                <div className="flex gap-1">
                  <Input
                    value={placeQuery}
                    onChange={(e) => setPlaceQuery(e.target.value)}
                    placeholder="Search a city, country…"
                    className="h-8 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        runPlaceSearch(e as unknown as React.FormEvent);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={runPlaceSearch}
                    disabled={placeSearching || !placeQuery.trim()}
                    className="h-8 text-xs"
                  >
                    {placeSearching ? "…" : "🔍"}
                  </Button>
                </div>
                {placeResults.map((r) => {
                  const k = `${r.lat},${r.lng}`;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => pickGeocoded(r)}
                      className="w-full text-left rounded-md border border-border bg-card/40 hover:border-glow/40 transition-colors px-2 py-1 text-xs flex justify-between items-center"
                    >
                      <span className="line-clamp-1">{r.name}</span>
                      <span className="text-glow shrink-0 ml-2">+ Add</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Birthday</Label>
                <Input
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Cadence (days)</Label>
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={cadenceDays}
                  onChange={(e) => setCadenceDays(e.target.value)}
                  placeholder="e.g. 30"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>When we met</Label>
              <Input
                type="date"
                value={metAt}
                onChange={(e) => setMetAt(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground/70">
                Drives the auto &quot;1 / 5 / 10 years known&quot; milestones.
                Pick Jan 1 if you only remember the year.
              </p>
            </div>

            <div className="space-y-1">
              <Label>Milestone pack</Label>
              <div className="flex items-center gap-1 flex-wrap">
                {MILESTONE_PACKS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setMilestonePack(p.key)}
                    className={`text-xs font-mono px-2.5 py-1 rounded-full border transition-colors ${
                      milestonePack === p.key
                        ? "border-glow text-glow bg-glow/10"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                    title={p.description}
                  >
                    {p.icon} {p.name}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground/70">
                Seeds the friendship-milestone checklist on the friend page.
                Switch later anytime.
              </p>
            </div>

            <div className="space-y-1">
              <Label>How we met (optional)</Label>
              <Input
                value={howWeMet}
                onChange={(e) => setHowWeMet(e.target.value)}
                placeholder="University, Berlin 2018"
              />
            </div>

            <div className="space-y-1">
              <Label>Notes</Label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything you want to remember — favourites, kids' names, in-jokes…"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy || !name.trim()}>
              {busy ? "…" : "Add friend"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
