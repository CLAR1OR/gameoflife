import fs from "node:fs";
import path from "node:path";

/**
 * Server-side helpers for the skill-cover-pack system.
 *
 * Layout on disk:
 *   /public/skill-covers/
 *     default/
 *       guitar.png
 *       memory.png
 *       ...
 *     <another-pack>/
 *       guitar.jpg
 *       ...
 *
 * A pack is a subdirectory. Each image inside is keyed by its filename
 * stem; templates declare a `coverKey` that matches the stem. Users can
 * drop new pictures into a pack folder at any time — no registration
 * needed.
 */

const PACKS_ROOT = path.join(process.cwd(), "public", "skill-covers");
const ALLOWED_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "gif", "avif"]);

export type PackManifest = {
  /** Pack name (folder name under /skill-covers/). */
  name: string;
  /** Map from filename stem → extension (e.g. {"guitar": "png"}). */
  images: Map<string, string>;
};

/** True iff `s` is a filename component we'd be happy serving from
 *  /public — alphanumerics, dashes, underscores, dots. */
function isSafeName(s: string): boolean {
  return /^[a-z0-9._-]+$/i.test(s);
}

function readPackManifest(name: string): PackManifest | null {
  if (!isSafeName(name)) return null;
  const dir = path.join(PACKS_ROOT, name);
  let entries: string[];
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return null;
  }
  const images = new Map<string, string>();
  for (const entry of entries) {
    const ext = entry.split(".").pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.has(ext)) continue;
    const stem = entry.slice(0, entry.length - ext.length - 1);
    if (!stem || images.has(stem)) continue;
    images.set(stem, ext);
  }
  return { name, images };
}

/** Returns every pack found under /public/skill-covers/, sorted with
 *  "default" first then alphabetically. Cheap enough to call on every
 *  account/skills render — the filesystem read is a single readdir. */
export function listSkillCoverPacks(): PackManifest[] {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(PACKS_ROOT, { withFileTypes: true });
  } catch {
    return [];
  }
  const packs: PackManifest[] = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const m = readPackManifest(e.name);
    if (m) packs.push(m);
  }
  packs.sort((a, b) => {
    if (a.name === "default") return -1;
    if (b.name === "default") return 1;
    return a.name.localeCompare(b.name);
  });
  return packs;
}

export function getSkillCoverPack(name: string): PackManifest | null {
  return readPackManifest(name);
}

/** Build the CSS background string for one category, given the active
 *  pack manifest. Order of precedence:
 *    1. Per-skill user upload — `coverImage` starting with `/skills/`
 *    2. Active pack image — if `coverKey` is set and present in the pack
 *    3. Fallback `coverImage` (gradient, or anything else stored)
 *  Returns null if nothing renders. */
export function resolveSkillCover(
  category: { coverImage: string | null; coverKey: string | null },
  pack: PackManifest | null
): string | null {
  const ci = category.coverImage ?? null;
  if (ci && /^\/skills\//.test(ci)) {
    return `url('${ci}') center/cover`;
  }
  if (category.coverKey && pack) {
    const ext = pack.images.get(category.coverKey);
    if (ext) {
      return `url('/skill-covers/${pack.name}/${category.coverKey}.${ext}') center/cover`;
    }
  }
  return ci ?? null;
}

/** Sync helper used by server pages — reads the pack manifest and maps
 *  each category to a `resolvedCover` string. Pass that down to client
 *  components instead of letting them re-resolve. */
export function resolveCoversForCategories<
  T extends { coverImage: string | null; coverKey: string | null },
>(categories: T[], packName: string): (T & { resolvedCover: string | null })[] {
  const pack = getSkillCoverPack(packName);
  return categories.map((c) => ({
    ...c,
    resolvedCover: resolveSkillCover(c, pack),
  }));
}
