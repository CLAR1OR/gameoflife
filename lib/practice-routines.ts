/**
 * Pre-built deliberate-practice routines per skill template. When the user
 * activates a skill template, any matching routine is cloned into the
 * `practice_routine` / `practice_block` tables so they can be edited freely
 * without affecting the seed.
 *
 * Block weights are relative — they're rescaled at render time against the
 * total weight of the *unlocked* blocks for the user's current category
 * level, then mapped onto the chosen session length.
 */

export type PracticeFocus =
  | "warmup"
  | "technique"
  | "repertoire"
  | "sight-read"
  | "theory"
  | "improv"
  | "review"
  | "general";

export type RoutineBlockTemplate = {
  name: string;
  focus: PracticeFocus;
  weight: number;
  minLevel: number;
  notes: string;
};

export type RoutineTemplate = {
  name: string;
  description: string;
  blocks: RoutineBlockTemplate[];
};

/**
 * Routines keyed by skill-template id. A template id may have multiple
 * routines (e.g. a "performance prep" routine alongside the daily one).
 */
export const PRACTICE_ROUTINES: Record<string, RoutineTemplate[]> = {
  piano: [
    {
      name: "Daily piano practice",
      description:
        "Balanced session covering warm-up, technique, sight-reading, repertoire and a touch of theory. Blocks unlock as you level up — beginners stick to fundamentals, advanced players add run-throughs and improv.",
      blocks: [
        {
          name: "Warm-up",
          focus: "warmup",
          weight: 10,
          minLevel: 1,
          notes:
            "Five minutes of long-tone scales, slow Hanon, or simple arpeggios. Loose wrists, even tone. The point is to wake up the hands, not to grind.",
        },
        {
          name: "Technique",
          focus: "technique",
          weight: 25,
          minLevel: 1,
          notes:
            "Pick one scale and one arpeggio. Metronome at a tempo you can play cleanly, then push it up by 2-4 BPM each session. As you progress, add inversions, contrary motion, and the harmonic + melodic minor variants.",
        },
        {
          name: "Sight-reading",
          focus: "sight-read",
          weight: 15,
          minLevel: 2,
          notes:
            "A piece you've never seen before, one level below your current repertoire. Don't stop, don't fix mistakes — keep the pulse. Closing the book at the end is a win even if it sounded rough.",
        },
        {
          name: "Slow practice (hardest passages)",
          focus: "repertoire",
          weight: 25,
          minLevel: 1,
          notes:
            "Take the 4-8 hardest bars of your current piece. Hands separately, then together, at a tempo where you make zero mistakes. If you make a mistake, slow down further. This is where real progress happens.",
        },
        {
          name: "Performance run-through",
          focus: "repertoire",
          weight: 15,
          minLevel: 3,
          notes:
            "Play the entire current piece at full performance tempo, no stopping. Mark spots where you stumbled — those become tomorrow's slow practice. One run is enough.",
        },
        {
          name: "Ear training & theory",
          focus: "theory",
          weight: 5,
          minLevel: 1,
          notes:
            "Identify intervals by ear, transcribe a short melody you like, or read through a Bach chorale and analyse the harmony. Five minutes; it compounds.",
        },
        {
          name: "Improv / free play",
          focus: "improv",
          weight: 5,
          minLevel: 4,
          notes:
            "Free-play in a key from today's session. No goals, no judgement — this is the reward block. Don't skip it.",
        },
      ],
    },
  ],
};

/** Look up routines for a given skill-template id. */
export function getPracticeRoutinesForTemplate(
  templateId: string
): RoutineTemplate[] {
  return PRACTICE_ROUTINES[templateId] ?? [];
}

/** Convenience: human-friendly label for a focus tag. */
export const FOCUS_LABEL: Record<PracticeFocus, string> = {
  warmup: "Warm-up",
  technique: "Technique",
  repertoire: "Repertoire",
  "sight-read": "Sight-read",
  theory: "Theory",
  improv: "Improv",
  review: "Review",
  general: "General",
};

export const FOCUS_OPTIONS: { value: PracticeFocus; label: string }[] = [
  { value: "warmup", label: "Warm-up" },
  { value: "technique", label: "Technique" },
  { value: "repertoire", label: "Repertoire" },
  { value: "sight-read", label: "Sight-read" },
  { value: "theory", label: "Theory" },
  { value: "improv", label: "Improv" },
  { value: "review", label: "Review" },
  { value: "general", label: "General" },
];
