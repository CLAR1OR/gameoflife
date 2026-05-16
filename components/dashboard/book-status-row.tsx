import Link from "next/link";

export function BookStatusRow({
  totalRead,
  yearRead,
  yearlyGoal,
}: {
  totalRead: number;
  yearRead: number;
  yearlyGoal: number;
}) {
  const hasGoal = yearlyGoal > 0;
  const pct = hasGoal ? Math.min(1, yearRead / yearlyGoal) : 0;
  const goalMet = hasGoal && yearRead >= yearlyGoal;

  const text = hasGoal ? `${yearRead}/${yearlyGoal}` : `${totalRead}`;
  const titleText = hasGoal
    ? goalMet
      ? `✓ Goal reached: ${yearRead} of ${yearlyGoal} this year`
      : `${yearRead} of ${yearlyGoal} read this year`
    : `${totalRead} book${totalRead === 1 ? "" : "s"} read`;

  const textColor = hasGoal
    ? goalMet
      ? "text-xp"
      : "text-emerald-400"
    : "text-emerald-400";

  return (
    <Link
      href="/books"
      className="group relative inline-flex items-center gap-2 rounded-md px-1 py-0.5 transition-colors hover:bg-accent/40"
      title={titleText}
    >
      <span className="text-xl leading-none">📚</span>
      <span
        className={`font-mono text-lg font-bold leading-none ${textColor} group-hover:opacity-90 transition-opacity`}
      >
        {text}
      </span>
      {hasGoal && !goalMet && (
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60 opacity-0 group-hover:opacity-100 touch:opacity-100 transition-opacity">
          {Math.round(pct * 100)}%
        </span>
      )}
    </Link>
  );
}
