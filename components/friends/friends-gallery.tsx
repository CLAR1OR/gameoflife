"use client";

import Link from "next/link";
import { TagChip } from "./tag-chip";
import type { FriendCardData } from "@/modules/friends/types";

/**
 * Gallery view: square photo tiles, name overlaid on the bottom. Friends
 * without an uploaded photo render as initials in a coloured tile so the
 * grid stays visually balanced. Clicking a tile opens the friend detail
 * page; hovering reveals days-since-contact + tag chips for context.
 */
export function FriendsGallery({ friends }: { friends: FriendCardData[] }) {
  return (
    <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {friends.map((f) => {
        const initials = f.name
          .split(/\s+/)
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);
        const overdue = f.daysUntilDue !== null && f.daysUntilDue < 0;
        const contactLabel = formatContactLabel(f);
        return (
          <li key={f.id}>
            <Link
              href={`/friends/${f.id}`}
              className="group relative block aspect-square rounded-xl overflow-hidden border border-border hover:border-glow-purple/60 transition-all"
              title={f.name}
            >
              {f.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={f.photoUrl}
                  alt={f.name}
                  className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-[1.04]"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-glow-purple/15 text-4xl font-bold text-glow-purple">
                  {initials}
                </div>
              )}

              {/* Bottom name strip — visible at rest, fades on hover so the
                  hover overlay below is fully readable. */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-2 pt-6 transition-opacity group-hover:opacity-0">
                <div className="text-sm font-medium text-white line-clamp-1 leading-tight">
                  {f.name}
                </div>
                {f.currentPlace && (
                  <div className="text-[10px] font-mono text-white/70 line-clamp-1 mt-0.5">
                    📍 {f.currentPlace.name}
                  </div>
                )}
              </div>

              {/* Hover overlay — full-card content: name, place, contact
                  cadence, tags. */}
              <div className="absolute inset-0 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 touch:opacity-100 transition-opacity bg-gradient-to-t from-black/95 via-black/75 to-black/30">
                <div className="text-sm font-semibold text-white leading-tight line-clamp-2">
                  {f.name}
                </div>
                {f.currentPlace && (
                  <div className="text-[10px] font-mono text-white/70 line-clamp-1 mt-0.5">
                    📍 {f.currentPlace.name}
                  </div>
                )}
                {contactLabel && (
                  <div
                    className={`text-[10px] font-mono mt-1 tabular-nums ${
                      overdue ? "text-destructive" : "text-white/80"
                    }`}
                  >
                    {contactLabel}
                  </div>
                )}
                {f.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {f.tags.slice(0, 3).map((t) => (
                      <TagChip key={t.id} tag={t} />
                    ))}
                    {f.tags.length > 3 && (
                      <span className="text-[9px] font-mono text-white/60">
                        +{f.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Overdue dot */}
              {overdue && (
                <span
                  className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-destructive shadow-[0_0_6px_rgba(239,68,68,0.8)] animate-pulse"
                  title={`${Math.abs(f.daysUntilDue!)}d overdue`}
                />
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function formatContactLabel(f: FriendCardData): string | null {
  if (f.daysSinceContact == null && f.daysUntilDue == null) return null;
  const since =
    f.daysSinceContact == null
      ? null
      : f.daysSinceContact === 0
        ? "today"
        : `${f.daysSinceContact}d ago`;
  if (f.daysUntilDue == null) {
    return since ? `🕒 last seen ${since}` : null;
  }
  if (f.daysUntilDue < 0) {
    return `⚠ ${Math.abs(f.daysUntilDue)}d overdue${
      since ? ` · last seen ${since}` : ""
    }`;
  }
  if (f.daysUntilDue === 0) {
    return `🕒 due today${since ? ` · last ${since}` : ""}`;
  }
  return `🕒 due in ${f.daysUntilDue}d${since ? ` · last ${since}` : ""}`;
}
