"use client";

import Link from "next/link";
import type { FriendCardData } from "@/modules/friends/queries";

/**
 * Gallery view: square photo tiles, name overlaid on the bottom. Friends
 * without an uploaded photo render as initials in a coloured tile so the
 * grid stays visually balanced. Clicking a tile opens the friend detail
 * page.
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

              {/* Bottom name strip */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-2 pt-6">
                <div className="text-sm font-medium text-white line-clamp-1 leading-tight">
                  {f.name}
                </div>
                {f.currentPlace && (
                  <div className="text-[10px] font-mono text-white/70 line-clamp-1 mt-0.5">
                    📍 {f.currentPlace.name}
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
