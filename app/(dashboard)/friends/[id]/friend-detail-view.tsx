"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckInButton } from "@/components/friends/check-in-button";
import { FriendPhotoUpload } from "@/components/friends/friend-photo-upload";
import { FriendTagsButton } from "@/components/friends/friend-tags-button";
import { FriendContactsSection } from "@/components/friends/friend-contacts-section";
import { FriendEventsSection } from "@/components/friends/friend-events-section";
import { FriendInlineTextSection } from "@/components/friends/friend-inline-text-section";
import { FriendInteractionsSection } from "@/components/friends/friend-interactions-section";
import { FriendMilestonesSection } from "@/components/friends/friend-milestones-section";
import { YearHeatmap } from "@/components/habits/year-heatmap";
import {
  friendStageFromCount,
  nextFriendStage,
} from "@/modules/friends/milestone-templates";
import { TagChip } from "@/components/friends/tag-chip";
import {
  updateFriend,
  deleteFriend,
  archiveFriend,
  setFriendCurrentResidence,
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
} from "@/modules/friends/types";
import type {
  FriendTag,
  FriendContact,
  FriendEvent,
  FriendMilestone,
} from "@/modules/friends/types";
import type { Place } from "@/modules/places/types";
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

export function FriendDetailView({
  friend,
  residences,
  interactions,
  knownPlaces,
  friendTags,
  allTags,
  contacts,
  events,
  milestones,
  interactionCounts,
}: {
  friend: Friend;
  residences: (FriendResidence & {
    place: { name: string; countryName: string | null };
  })[];
  interactions: FriendInteraction[];
  knownPlaces: Pick<Place, "id" | "name" | "countryName">[];
  friendTags: FriendTag[];
  allTags: FriendTag[];
  contacts: FriendContact[];
  events: FriendEvent[];
  milestones: FriendMilestone[];
  /** YYYY-MM-DD → interaction count for this friend, past ~year. */
  interactionCounts: Record<string, number>;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(friend.name);
  const [nickname, setNickname] = useState(friend.nickname ?? "");
  const [cadence, setCadence] = useState(
    friend.contactCadenceDays?.toString() ?? ""
  );
  const [birthday, setBirthday] = useState(friend.birthday ?? "");
  const [metAt, setMetAt] = useState(friend.metAt ?? "");
  const [busy, setBusy] = useState(false);

  const [residenceQuery, setResidenceQuery] = useState("");
  const [residenceResults, setResidenceResults] = useState<GeocodeResult[]>([]);
  const [residenceSearching, setResidenceSearching] = useState(false);
  const [residencePickerOpen, setResidencePickerOpen] = useState(false);

  async function handleSave() {
    setBusy(true);
    try {
      const cad = cadence.trim() ? Number(cadence) : null;
      await updateFriend(friend.id, {
        name,
        nickname: nickname || null,
        birthday: birthday || null,
        metAt: metAt || null,
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

      <FriendHeroCard
        friend={friend}
        friendTags={friendTags}
        allTags={allTags}
        currentResidence={currentResidence}
        milestones={milestones}
        interactions={interactions}
        editing={editing}
        busy={busy}
        name={name}
        nickname={nickname}
        onChangeName={setName}
        onChangeNickname={setNickname}
        onSave={handleSave}
        onCancelEdit={() => setEditing(false)}
        onStartEdit={() => setEditing(true)}
        onArchive={handleArchive}
        onDelete={handleDelete}
      />

      <FriendMilestonesSection
        friendId={friend.id}
        milestones={milestones}
        pack={friend.milestonePack}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <FriendContactsSection friendId={friend.id} contacts={contacts} />

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
          <div className="space-y-1">
            <Label className="text-[10px]">When we met</Label>
            <Input
              type="date"
              value={metAt}
              onChange={(e) => setMetAt(e.target.value)}
              className="h-8 text-xs"
            />
            <p className="text-[10px] text-muted-foreground/60">
              Drives the auto &quot;1 / 5 / 10 years known&quot; milestones.
            </p>
          </div>
        </div>
      )}

      <FriendEventsSection friendId={friend.id} events={events} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <FriendInlineTextSection
          friendId={friend.id}
          field="notes"
          label="📝 Notes"
          initialValue={friend.notes ?? null}
          rows={6}
          placeholder="Anything you want to remember — favourites, kids' names, in-jokes…"
        />
        <FriendInlineTextSection
          friendId={friend.id}
          field="howWeMet"
          label="🤝 How we met"
          initialValue={friend.howWeMet ?? null}
          rows={6}
          placeholder="Where, when, the story…"
        />
      </div>

      <FriendInteractionsSection interactions={interactions} />

      {/* Per-friend interaction heatmap — when YOU saw THIS person. */}
      {interactions.length > 0 && (
        <YearHeatmap
          counts={interactionCounts}
          accent="glow-purple"
          title={`🫂 Interactions with ${friend.nickname || friend.name.split(" ")[0]}`}
          unit="interactions"
        />
      )}
    </div>
  );
}

/** Just the 5-stat grid — used inside the hero card. */
function AtAGlanceStats({
  friend,
  interactions,
  milestones,
}: {
  friend: Friend;
  interactions: FriendInteraction[];
  milestones: FriendMilestone[];
}) {
  const completed = milestones.filter((m) => m.completed).length;
  const total = milestones.length;
  const stage = friendStageFromCount(completed);
  const next = nextFriendStage(stage);

  const placesSet = new Set<string>();
  for (const i of interactions) if (i.placeId) placesSet.add(i.placeId);
  const placesMet = placesSet.size;

  const yearsKnown = yearsKnownFromMetAt(friend.metAt);
  const lastSeenISO = mostRecentInteraction(interactions);
  const daysSince = lastSeenISO ? daysSinceISO(lastSeenISO) : null;
  const cadence = friend.contactCadenceDays;

  let lastSeenColor: string | undefined;
  let lastSeenSub: string | null =
    placesMet > 0
      ? `met in ${placesMet} place${placesMet === 1 ? "" : "s"}`
      : null;
  if (cadence) {
    if (daysSince == null) {
      lastSeenColor = "text-destructive";
      lastSeenSub = `overdue · every ${cadence}d`;
    } else if (daysSince <= cadence) {
      lastSeenColor = "text-glow";
      lastSeenSub = `on track · every ${cadence}d`;
    } else if (daysSince <= cadence * 1.5) {
      lastSeenColor = "text-xp";
      lastSeenSub = `due · every ${cadence}d`;
    } else {
      lastSeenColor = "text-destructive";
      lastSeenSub = `overdue · every ${cadence}d`;
    }
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-3">
      <Stat
        label="Stage"
        value={
          <span className="text-base">
            {stage.icon} <span className="font-semibold">{stage.name}</span>
          </span>
        }
        sub={
          next
            ? `${Math.max(0, next.min - completed)} more to ${next.name}`
            : "Top tier"
        }
      />
      <Stat
        label="Milestones"
        value={`${completed}/${total}`}
        sub={total > 0 ? `${Math.round((completed / total) * 100)}%` : null}
      />
      <Stat
        label="Known"
        value={
          yearsKnown == null
            ? "—"
            : yearsKnown < 1
              ? "< 1 year"
              : `${Math.floor(yearsKnown)} year${
                  Math.floor(yearsKnown) === 1 ? "" : "s"
                }`
        }
        sub={friend.metAt ?? "—"}
      />
      <Stat
        label="Interactions"
        value={interactions.length.toString()}
        sub={interactions.length === 0 ? "none yet" : "logged"}
      />
      <Stat
        label="Last seen"
        value={
          <span className={lastSeenColor}>
            {daysSince == null
              ? "never"
              : daysSince === 0
                ? "today"
                : `${daysSince}d ago`}
          </span>
        }
        sub={lastSeenSub}
      />
    </div>
  );
}

/** Hero card on the friend detail page — photo + name + meta + tags +
 *  action buttons, divided from the at-a-glance stats grid below it,
 *  with a check-in CTA bar at the bottom. Border + soft background tint
 *  pick up the friend's current stage so the card visually reflects
 *  the friendship's status. */
function FriendHeroCard({
  friend,
  friendTags,
  allTags,
  currentResidence,
  milestones,
  interactions,
  editing,
  busy,
  name,
  nickname,
  onChangeName,
  onChangeNickname,
  onSave,
  onCancelEdit,
  onStartEdit,
  onArchive,
  onDelete,
}: {
  friend: Friend;
  friendTags: FriendTag[];
  allTags: FriendTag[];
  currentResidence:
    | (FriendResidence & { place: { name: string; countryName: string | null } })
    | undefined;
  milestones: FriendMilestone[];
  interactions: FriendInteraction[];
  editing: boolean;
  busy: boolean;
  name: string;
  nickname: string;
  onChangeName: (v: string) => void;
  onChangeNickname: (v: string) => void;
  onSave: () => void;
  onCancelEdit: () => void;
  onStartEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const initials = friend.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const completed = milestones.filter((m) => m.completed).length;
  const stage = friendStageFromCount(completed);
  const heroBorder = stageColorClasses(stage.color);

  return (
    <section
      className={`rounded-2xl border overflow-hidden ${heroBorder}`}
    >
      {/* Top: photo + name + meta + tags + actions */}
      <div className="p-5 sm:p-6 flex items-start gap-4 flex-wrap">
        <FriendPhotoUpload friendId={friend.id} hasPhoto={!!friend.photoUrl}>
          {friend.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={friend.photoUrl}
              alt=""
              className="h-24 w-24 sm:h-28 sm:w-28 rounded-full object-cover border border-border shrink-0"
            />
          ) : (
            <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full border border-border bg-muted/40 flex items-center justify-center text-2xl font-bold text-glow-purple shrink-0">
              {initials}
            </div>
          )}
        </FriendPhotoUpload>
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-2">
              <Input
                value={name}
                onChange={(e) => onChangeName(e.target.value)}
                className="text-2xl font-bold"
              />
              <Input
                value={nickname}
                onChange={(e) => onChangeNickname(e.target.value)}
                placeholder="Nickname"
                className="text-sm"
              />
            </div>
          ) : (
            <>
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
                {friend.name}
                {friend.nickname && (
                  <span className="text-muted-foreground/60 ml-2 text-lg font-normal">
                    “{friend.nickname}”
                  </span>
                )}
              </h1>
              <div className="flex flex-wrap gap-1.5 mt-2 text-xs">
                {currentResidence && (
                  <Badge variant="outline" className="font-mono">
                    📍 {currentResidence.place.name}
                    {currentResidence.place.countryName
                      ? ` · ${currentResidence.place.countryName}`
                      : ""}
                  </Badge>
                )}
                {friend.birthday && (
                  <Badge variant="outline" className="font-mono">
                    🎂 {formatBirthday(friend.birthday)}
                  </Badge>
                )}
                {friend.contactCadenceDays && (
                  <Badge variant="outline" className="font-mono">
                    🔔 every {friend.contactCadenceDays}d
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {friendTags.map((t) => (
                  <TagChip key={t.id} tag={t} />
                ))}
                <FriendTagsButton
                  friendId={friend.id}
                  friendTags={friendTags}
                  allTags={allTags}
                />
              </div>
            </>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          {editing ? (
            <>
              <Button size="sm" onClick={onSave} disabled={busy}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={onCancelEdit}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="ghost" onClick={onStartEdit}>
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onArchive}
                className="text-muted-foreground"
              >
                Archive
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onDelete}
                className="text-destructive"
              >
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* At-a-glance band */}
      <div className="border-t border-border/40 px-5 sm:px-6 py-4 bg-muted/20">
        <AtAGlanceStats
          friend={friend}
          interactions={interactions}
          milestones={milestones}
        />
      </div>

      {/* Check-in CTA */}
      <div className="border-t border-border/40 p-3 bg-card flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[11px] font-mono text-muted-foreground">
          Log a quick check-in to mark contact + earn XP
        </span>
        <CheckInButton friendId={friend.id} />
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-wider opacity-70">
        {label}
      </div>
      <div className="text-sm font-mono mt-0.5 tabular-nums">{value}</div>
      {sub && (
        <div className="text-[10px] font-mono opacity-60 mt-0.5">{sub}</div>
      )}
    </div>
  );
}

function yearsKnownFromMetAt(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const m = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(iso);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = m[2] ? Number(m[2]) - 1 : 0;
  const d = m[3] ? Number(m[3]) : 1;
  const then = new Date(y, mo, d);
  const ms = Date.now() - then.getTime();
  if (ms < 0) return 0;
  return ms / (1000 * 60 * 60 * 24 * 365.25);
}

function mostRecentInteraction(
  interactions: FriendInteraction[]
): string | null {
  let max: string | null = null;
  for (const i of interactions) {
    if (max == null || i.occurredOn > max) max = i.occurredOn;
  }
  return max;
}

function daysSinceISO(iso: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const then = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const ms = Date.now() - then.getTime();
  if (ms < 0) return 0;
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function stageColorClasses(color: string): string {
  switch (color) {
    case "glow":
      return "border-glow/40 bg-glow/5";
    case "glow-purple":
      return "border-glow-purple/40 bg-glow-purple/5";
    case "xp":
      return "border-xp/40 bg-xp/5";
    default:
      return "border-border bg-card/40";
  }
}
