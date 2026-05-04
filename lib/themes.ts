export type ThemeId = "forest" | "sunset" | "arctic";

export const DEFAULT_THEME: ThemeId = "forest";

export type ThemeMeta = {
  id: ThemeId;
  name: string;
  tagline: string;
  /** Three swatches shown in the picker preview (background, accent, warm). */
  swatches: { bg: string; accent: string; warm: string };
  mode: "dark" | "light";
};

/**
 * Theme metadata for the picker UI. The actual color tokens live in
 * globals.css under :root[data-theme="..."] selectors so a single
 * data-theme attribute swap rebrands the entire app.
 */
export const THEMES: ThemeMeta[] = [
  {
    id: "forest",
    name: "Forest",
    tagline: "The default. Cool dark green & purple — RPG terminal energy.",
    swatches: { bg: "#0a0b14", accent: "#00ff88", warm: "#facc15" },
    mode: "dark",
  },
  {
    id: "sunset",
    name: "Sunset",
    tagline: "Warm dark — coral, amber, and dusk teal. Cozier vibes.",
    swatches: { bg: "#1a0d09", accent: "#fb923c", warm: "#fbbf24" },
    mode: "dark",
  },
  {
    id: "arctic",
    name: "Arctic",
    tagline: "Light slate with cyan, violet & rose. Daylight mode.",
    swatches: { bg: "#f1f5f9", accent: "#0891b2", warm: "#ea580c" },
    mode: "light",
  },
];

export function getThemeMeta(id: string): ThemeMeta {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export function isValidTheme(id: string): id is ThemeId {
  return THEMES.some((t) => t.id === id);
}
