"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckInButton } from "@/components/friends/check-in-button";
import {
  updateFriend,
  deleteFriend,
  archiveFriend,
  setFriendCurrentResidence,
  deleteInteraction,
} from "@/modules/friends/actions";
import {
  searchPlaces,
  addPlaceFromGeocode,
} from "@/modules/places/actions";
import type { GeocodeResult } from "@/lib/geocode";
import type {
  Friend,
  FriendInteraction,
  FriendResidence,
} from "@/modules/friends/queries";
import type { Place } from "@/modules/places/queries";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

function formatBirthday(iso: string): string {
  // Accept "YYYY-MM-DD" or "--MM-DD" (year unknown).
  const noYear = iso.startsWith("--");
  const parts = iso.replace(/^--/, "").split("-");
  const y = noYear ? null : Number(parts[0]);
  const m = Number(parts[noYear ? 0 : 1]);
  const d = Number(parts[noYear ? 1 : 2]);
  if (!m || !d) return iso;
  const date = new Date(2000, m - 1, d);
  const md = date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
  });
  return y ? `${md}, ${y}` : md;
}

const KIND_ICON: Record<FriendInteraction["kind"], string> = {
  message: "💬",
  call: "📞",
  meet: "🤝",
  letter: "💌",
  event: "🎉",
  trip: "✈️",
  other: "·",
};

export function FriendDetailView({
  friend,
  residences,
  interactions,
  knownPlaces,
}: {
  friend: Friend;
  residences: (FriendResidence & {
    place: { name: string; countryName: string | null };
  })[];
  interactions: FriendInteraction[];
  knownPlaces: Pick<Place, "id" | "name" | "countryName">[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(friend.name);
  const [nickname, setNickname] = useState(friend.nickname ?? "");
  const [howWeMet, setHowWeMet] = useState(friend.howWeMet ?? "");
  const [notes, setNotes] = useState(friend.notes ?? "");
  const [cadence, setCadence] = useState(
    friend.contactCadenceDays?.toString() ?? ""
  );
  const [birthday, setBirthday] = useState(friend.birthday ?? "");
  const [phone, setPhone] = useState(friend.phone ?? "");
  const [email, setEmail] = useState(friend.email ?? "");
  const [busy, setBusy] = useState(false);

  const [residenceQuery, setResidenceQuery] = useState("");
  const [residenceResults, setResidenceResults] = useState<GeocodeResult[]>([]);
  const [residenceSearching, setResidenceSearching] = useState(false);
  const [residencePickerOpen, setResidencePickerOpen] = useState(false);

  const initials = friend.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  async function handleSave() {
    setBusy(true);
    try {
      const cad = cadence.trim() ? Number(cadence) : null;
      await updateFriend(friend.id, {
        name,
        nickname: nickname || null,
        howWeMet: howWeMet || null,
        notes: notes || null,
        birthday: birthday || null,
        phone: phone || null,
        email: email || null,
        contactCadenceDays:
          cad !== null && Number.isFinite(cad) && cad > 0 ? Math.round(cad) : null,
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
    if (
      !confirm(
        `Delete ${friend.name}? All interactions and residence history will be lost. (Use Archive to keep the record but hide it.)`
      )
    )
      return;
    try {
      await deleteFriend(friend.id);
      toast.success("Deleted");
      router.push("/friends");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  async function handleArchive() {
    if (!confirm(`Archive ${friend.name}? They won't appear in lists.`)) return;
    try {
      await archiveFriend(friend.id);
      toast.success("Archived");
      router.push("/friends");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  async function handlePickResidence(placeId: string) {
    setBusy(true);
    try {
      await setFriendCurrentResidence(friend.id, placeId);
      toast.success("Residence updated");
      setResidencePickerOpen(false);
      setResidenceResults([]);
      setResidenceQuery("");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }

  async function handleAddNewPlace(g: GeocodeResult) {
    setBusy(true);
    try {
      const p = await addPlaceFromGeocode(g);
      await setFriendCurrentResidence(friend.id, p.id);
      toast.success(`Moved to ${p.name}`);
      setResidencePickerOpen(false);
      setResidenceResults([]);
      setResidenceQuery("");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }

  async function runResidenceSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = residenceQuery.trim();
    if (!q) return;
    setResidenceSearching(true);
    try {
      const rows = await searchPlaces(q);
      setResidenceResults(rows);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setResidenceSearching(false);
  }

  async function handleDeleteInteraction(id: string) {
    if (!confirm("Delete this interaction?")) return;
    try {
      await deleteInteraction(id);
      toast.success("Deleted");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  const currentResidence = residences.find((r) => r.isCurrent);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/friends"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Back to friends
        </Link>
      </div>

      <div className="flex items-start gap-4 flex-wrap">
        {friend.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={friend.photoUrl}
            alt=""
            className="h-20 w-20 rounded-full object-cover border border-border"
          />
        ) : (
          <div className="h-20 w-20 rounded-full border border-border bg-muted/40 flex items-center justify-center text-2xl font-bold text-glow-purple shrink-0">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-2xl font-bold"
              />
              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Nickname"
                className="text-sm"
              />
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold leading-tight">
                {friend.name}
                {friend.nickname && (
                  <span className="text-muted-foreground/60 ml-2 text-lg font-normal">
                    “{friend.nickname}”
                  </span>
                )}
              </h1>
              <div className="flex flex-wrap gap-2 mt-2 text-xs">
                {currentResidence && (
                  <Badge variant="outline" className="font-mono">
                    📍 {currentResidence.place.name}
                    {currentResidence.place.countryName
                      ? ` · ${currentResidence.place.countryName}`
                      : ""}
                  </Badge>
                )}
                {friend.contactCadenceDays && (
                  <Badge variant="outline" className="font-mono">
                    🔔 every {friend.contactCadenceDays}d
                  </Badge>
                )}
                {friend.birthday && (
                  <Badge variant="outline" className="font-mono">
                    🎂 {formatBirthday(friend.birthday)}
                  </Badge>
                )}
                {friend.phone && (
                  <a
                    href={`tel:${friend.phone}`}
                    className="inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-[10px] font-mono hover:border-glow/40 transition-colors"
                  >
                    📞 {friend.phone}
                  </a>
                )}
                {friend.email && (
                  <a
                    href={`mailto:${friend.email}`}
                    className="inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-[10px] font-mono hover:border-glow/40 transition-colors"
                  >
                    ✉️ {friend.email}
                  </a>
                )}
              </div>
            </>
          )}
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
                onClick={handleArchive}
                className="text-muted-foreground"
              >
                Archive
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

      <div>
        <CheckInButton friendId={friend.id} />
      </div>

      {editing && (
        <div className="rounded-md border border-border/60 bg-card/40 p-3 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[10px]">Birthday</Label>
              <Input
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Cadence (days)</Label>
              <Input
                type="number"
                min={1}
                max={365}
                value={cadence}
                onChange={(e) => setCadence(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[10px]">Phone</Label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px]">How we met</Label>
            <Input
              value={howWeMet}
              onChange={(e) => setHowWeMet(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px]">Notes</Label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything you want to remember — favourites, kids' names, in-jokes…"
              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs resize-y"
            />
          </div>
        </div>
      )}

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono uppercase tracking-wider text-glow-purple">
            🏠 Residences
          </h2>
          <button
            type="button"
            onClick={() => setResidencePickerOpen((s) => !s)}
            className="text-[11px] font-mono text-muted-foreground hover:text-foreground"
          >
            {residencePickerOpen ? "cancel" : "+ Move / set residence"}
          </button>
        </div>

        {residencePickerOpen && (
          <div className="rounded-md border border-glow-purple/30 bg-glow-purple/5 p-3 space-y-2">
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) handlePickResidence(e.target.value);
              }}
              className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
            >
              <option value="">— pick from existing places —</option>
              {knownPlaces.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.countryName ? ` · ${p.countryName}` : ""}
                </option>
              ))}
            </select>
            <form onSubmit={runResidenceSearch} className="flex gap-1">
              <Input
                value={residenceQuery}
                onChange={(e) => setResidenceQuery(e.target.value)}
                placeholder="…or search a new city"
                className="h-8 text-xs"
              />
              <Button
                type="submit"
                size="sm"
                disabled={residenceSearching || !residenceQuery.trim()}
                className="h-8 text-xs"
              >
                {residenceSearching ? "…" : "🔍"}
              </Button>
            </form>
            {residenceResults.map((r) => (
              <button
                key={`${r.lat},${r.lng}`}
                type="button"
                onClick={() => handleAddNewPlace(r)}
                className="w-full text-left rounded-md border border-border bg-card/40 hover:border-glow/40 transition-colors px-2 py-1 text-xs flex justify-between items-center"
              >
                <span className="line-clamp-1">{r.name}</span>
                <span className="text-glow shrink-0 ml-2">+ Use</span>
              </button>
            ))}
          </div>
        )}

        {residences.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No residences logged yet.
          </p>
        ) : (
          <ul className="space-y-1">
            {residences.map((r) => (
              <li
                key={r.id}
                className={`rounded-md border px-3 py-2 text-xs ${
                  r.isCurrent
                    ? "border-glow-purple/40 bg-glow-purple/5"
                    : "border-border/60 bg-card/40 opacity-70"
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium">
                    {r.place.name}
                    {r.place.countryName ? ` · ${r.place.countryName}` : ""}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {r.isCurrent ? "current" : `${r.startedOn ?? "?"} → ${r.endedOn ?? "?"}`}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-xs font-mono uppercase tracking-wider text-glow">
          📅 Interactions ({interactions.length})
        </h2>
        {interactions.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No interactions logged yet — use the &ldquo;Check in&rdquo; button
            above.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {interactions.map((i) => (
              <li
                key={i.id}
                className="rounded-md border border-border/60 bg-card/40 px-3 py-2 flex items-start gap-3 group"
              >
                <span className="text-base shrink-0">{KIND_ICON[i.kind]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-medium capitalize">
                      {i.kind}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {i.occurredOn}
                    </span>
                  </div>
                  {i.notes && (
                    <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap">
                      {i.notes}
                    </p>
                  )}
                </div>
                {i.xpAwarded > 0 && (
                  <span className="text-[10px] font-mono text-xp shrink-0">
                    +{i.xpAwarded} XP
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleDeleteInteraction(i.id)}
                  className="text-[10px] text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {(friend.howWeMet || friend.notes || editing) && !editing && (
        <section className="space-y-3">
          {friend.howWeMet && (
            <div>
              <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
                How we met
              </h2>
              <p className="text-sm whitespace-pre-wrap">{friend.howWeMet}</p>
            </div>
          )}
          {friend.notes && (
            <div>
              <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
                Notes
              </h2>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {friend.notes}
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
