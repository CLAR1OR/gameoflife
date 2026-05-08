import type { FriendTag } from "@/modules/friends/queries";

const COLOR_CLASSES: Record<string, string> = {
  glow: "border-glow/40 text-glow bg-glow/10",
  "glow-purple": "border-glow-purple/40 text-glow-purple bg-glow-purple/10",
  xp: "border-xp/40 text-xp bg-xp/10",
  warning: "border-warning/40 text-warning bg-warning/10",
  destructive:
    "border-destructive/40 text-destructive bg-destructive/10",
  muted: "border-border text-muted-foreground bg-muted/30",
};

export const TAG_COLOR_OPTIONS = [
  { value: "glow", label: "Green" },
  { value: "glow-purple", label: "Purple" },
  { value: "xp", label: "Gold" },
  { value: "warning", label: "Amber" },
  { value: "destructive", label: "Red" },
  { value: "muted", label: "Neutral" },
];

export function classesForColor(color: string | null | undefined): string {
  return COLOR_CLASSES[color ?? "glow"] ?? COLOR_CLASSES.glow;
}

export function TagChip({
  tag,
  size = "sm",
  onClick,
  selected = false,
}: {
  tag: FriendTag;
  size?: "sm" | "xs";
  onClick?: () => void;
  selected?: boolean;
}) {
  const cls = classesForColor(tag.color);
  const sizeCls =
    size === "xs"
      ? "text-[9px] px-1.5 py-0"
      : "text-[10px] px-2 py-0.5";
  const Tag = onClick ? "button" : "span";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full border font-mono uppercase tracking-wider ${cls} ${sizeCls} ${
        onClick ? "cursor-pointer hover:opacity-80" : ""
      } ${selected ? "ring-1 ring-current" : ""}`}
    >
      {tag.name}
    </Tag>
  );
}
