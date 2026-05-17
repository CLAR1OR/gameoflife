"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setSkillCoverPack } from "@/modules/settings/actions";
import { toast } from "sonner";

export type PackOption = {
  name: string;
  imageCount: number;
  /** Up to a handful of relative URLs from this pack — used for the
   *  preview strip on each option. */
  sampleUrls: string[];
};

export function SkillCoverPackPicker({
  packs,
  initial,
}: {
  packs: PackOption[];
  initial: string;
}) {
  const [active, setActive] = useState(initial);
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function pick(name: string) {
    if (name === active) return;
    setBusy(true);
    try {
      await setSkillCoverPack(name);
      setActive(name);
      toast.success(`Cover pack: ${name}`);
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }

  if (packs.length === 0) {
    return (
      <p className="text-xs text-muted-foreground/70">
        No cover packs found. Drop image files into
        <code className="ml-1 px-1 rounded bg-muted text-foreground">
          public/skill-covers/&lt;pack-name&gt;/
        </code>{" "}
        and reload — files keyed by template name (e.g.{" "}
        <code className="px-1 rounded bg-muted text-foreground">
          guitar.png
        </code>
        ) override the default art.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {packs.map((p) => {
        const isActive = p.name === active;
        return (
          <button
            key={p.name}
            type="button"
            onClick={() => pick(p.name)}
            disabled={busy || isActive}
            className={`group w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
              isActive
                ? "border-glow bg-glow/5"
                : "border-border bg-card hover:border-glow/40"
            }`}
          >
            <div className="flex gap-1 shrink-0">
              {p.sampleUrls.length > 0 ? (
                p.sampleUrls.slice(0, 4).map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={url}
                    src={url}
                    alt=""
                    className="h-12 w-12 rounded-md object-cover border border-border/60"
                  />
                ))
              ) : (
                <div className="h-12 w-32 rounded-md border border-dashed border-border/60 flex items-center justify-center text-[10px] font-mono text-muted-foreground">
                  empty
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium flex items-baseline gap-2">
                <span>{p.name}</span>
                {isActive && (
                  <span className="text-[10px] font-mono text-glow">
                    ✓ active
                  </span>
                )}
              </div>
              <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                {p.imageCount} image{p.imageCount === 1 ? "" : "s"}
              </div>
            </div>
          </button>
        );
      })}

      <p className="text-[11px] text-muted-foreground/70 pt-1">
        💡 Add your own pack: create a folder at{" "}
        <code className="px-1 rounded bg-muted text-foreground">
          public/skill-covers/&lt;name&gt;/
        </code>
        , drop in any images (matched by filename stem to template cover
        keys), then reload the page.
      </p>
    </div>
  );
}
