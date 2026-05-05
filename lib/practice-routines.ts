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

  guitar: [
    {
      name: "Daily guitar practice",
      description:
        "Warm-up → technique → reading → focused work on a piece → run-through → ear → jam. Strength/rhythm work and improv unlock at higher levels.",
      blocks: [
        {
          name: "Warm-up",
          focus: "warmup",
          weight: 10,
          minLevel: 1,
          notes:
            "Chromatic 1-2-3-4 patterns, finger independence, slow alternate picking. Five minutes — wake the hands up, don't grind.",
        },
        {
          name: "Technique",
          focus: "technique",
          weight: 25,
          minLevel: 1,
          notes:
            "One scale (major/minor/pentatonic) + one arpeggio shape with a metronome. Tempo you can play cleanly, then push 2-4 BPM next session. Add modes and 3-note-per-string shapes as you progress.",
        },
        {
          name: "Sight-reading / chord charts",
          focus: "sight-read",
          weight: 15,
          minLevel: 2,
          notes:
            "Open a fakebook or new lead sheet. Read it cold, no stopping, comp through it once. Tabs count, but standard notation is the bigger win.",
        },
        {
          name: "Slow practice (hardest passages)",
          focus: "repertoire",
          weight: 25,
          minLevel: 1,
          notes:
            "Take the 4-8 hardest bars of your current piece. Slow enough to play them perfectly, hands together. Speed is a side effect of accuracy.",
        },
        {
          name: "Run-through",
          focus: "repertoire",
          weight: 15,
          minLevel: 3,
          notes:
            "Play the whole current piece at performance tempo, no stopping. Mark stumbles — those become tomorrow's slow practice.",
        },
        {
          name: "Ear training",
          focus: "theory",
          weight: 5,
          minLevel: 1,
          notes:
            "Transcribe four bars of a song you love. Or work through interval / chord-quality drills with an ear app for five minutes.",
        },
        {
          name: "Jam / improv",
          focus: "improv",
          weight: 5,
          minLevel: 4,
          notes:
            "Pick a backing track in today's key. Play loose. No grades, no judgement — the reward block.",
        },
      ],
    },
  ],

  cooking: [
    {
      name: "Cooking lab session",
      description:
        "Drill prep skills, then build a meal you actually eat. Run-throughs and freestyle cooking unlock as your fundamentals get reliable.",
      blocks: [
        {
          name: "Knife & prep warm-up",
          focus: "warmup",
          weight: 10,
          minLevel: 1,
          notes:
            "Five minutes on a single cut: dice an onion, julienne a carrot, fillet a fish. Same shape, even size. Speed comes after.",
        },
        {
          name: "Technique drill",
          focus: "technique",
          weight: 25,
          minLevel: 1,
          notes:
            "Pick ONE technique to grind: making a roux, tempering eggs, deglazing, whipping a meringue, tempering chocolate. Repeat until it's boring, then once more.",
        },
        {
          name: "Sight-read a new recipe",
          focus: "sight-read",
          weight: 15,
          minLevel: 2,
          notes:
            "An unfamiliar recipe — ideally a cuisine you don't know. Mise-en-place, follow the steps exactly. The skill is reading, planning, and executing under unfamiliar conditions.",
        },
        {
          name: "Repeat-and-refine",
          focus: "repertoire",
          weight: 25,
          minLevel: 1,
          notes:
            "Cook a dish you've made before but want to nail. Note what changed since last time, what went better, what to fix next.",
        },
        {
          name: "Plate a real meal",
          focus: "repertoire",
          weight: 15,
          minLevel: 3,
          notes:
            "End-to-end: plan, cook, plate, eat (or feed someone). Use what you drilled. This is the run-through — chaos and timing under real conditions.",
        },
        {
          name: "Theory & taste",
          focus: "theory",
          weight: 5,
          minLevel: 1,
          notes:
            "Read a chapter of a cookbook or food-science article. Or taste-test: same ingredient, different prep methods, side by side.",
        },
        {
          name: "Freestyle / fridge raid",
          focus: "improv",
          weight: 5,
          minLevel: 4,
          notes:
            "Cook from what's in the fridge, no recipe. Constrained creativity — invents the dishes that become your repertoire.",
        },
      ],
    },
  ],

  russian: [
    {
      name: "Daily Russian practice",
      description:
        "Pronunciation, vocab, grammar, reading, listening, output. Listening and live conversation unlock as your foundation gets solid.",
      blocks: [
        {
          name: "Pronunciation shadowing",
          focus: "warmup",
          weight: 10,
          minLevel: 1,
          notes:
            "Five minutes shadowing native audio — repeat each phrase out loud as soon as you hear it. Targets stress, intonation, soft consonants. Don't translate, just imitate.",
        },
        {
          name: "Vocabulary drill (SRS)",
          focus: "technique",
          weight: 20,
          minLevel: 1,
          notes:
            "Anki / Memrise / your flashcard tool of choice. Clear today's reviews, then learn 5-10 new words. If reviews are buried, do reviews only — new words can wait.",
        },
        {
          name: "Reading a leveled text",
          focus: "sight-read",
          weight: 15,
          minLevel: 2,
          notes:
            "A short text at your current level — read aloud, then re-read for comprehension. Look up at most 3 words; let the rest stay fuzzy. Volume beats intensity here.",
        },
        {
          name: "Grammar focus",
          focus: "technique",
          weight: 20,
          minLevel: 1,
          notes:
            "Pick one structure (e.g. perfective vs imperfective verbs of motion). Read the rule, do 10-15 targeted exercises, write 3 sentences using it.",
        },
        {
          name: "Output: write or speak",
          focus: "repertoire",
          weight: 15,
          minLevel: 1,
          notes:
            "Write a short paragraph or record a 60-second voice note using today's grammar focus and at least 3 new words. Don't translate from English — think in Russian, even if simply.",
        },
        {
          name: "Native-content listening",
          focus: "sight-read",
          weight: 10,
          minLevel: 3,
          notes:
            "A 5-10 minute clip of a podcast / show / YouTube video at speed. No subtitles. Get the gist, not every word. This is where comprehension finally sticks.",
        },
        {
          name: "Live conversation",
          focus: "improv",
          weight: 10,
          minLevel: 4,
          notes:
            "Live with a tutor, partner, or language-exchange. Prep one topic so you have something to say. The hard part is starting; the easy part is finding it was useful.",
        },
      ],
    },
  ],

  survival: [
    {
      name: "Wilderness practice session",
      description:
        "Mental review → drill one skill repetitively → rehearse a scenario → real-environment practice → full-loop test. Outdoor + multi-skill drills unlock as fundamentals solidify.",
      blocks: [
        {
          name: "Skills review",
          focus: "warmup",
          weight: 10,
          minLevel: 1,
          notes:
            "Mental walk-through: a knot you tied last week, the rule of threes, the steps for a fire. Five minutes of recall — it's how skills survive without practice.",
        },
        {
          name: "One-skill drill",
          focus: "technique",
          weight: 30,
          minLevel: 1,
          notes:
            "Pick ONE skill and grind it. Bowline x 20, fire by friction until it lights, water purification with three different methods. Repetition is the moat.",
        },
        {
          name: "New scenario rehearsal",
          focus: "sight-read",
          weight: 20,
          minLevel: 2,
          notes:
            "Set a constraint: build a shelter with only what's in arm's reach; navigate without a compass; cook without matches. Limits force adaptation.",
        },
        {
          name: "Real-environment practice",
          focus: "repertoire",
          weight: 25,
          minLevel: 1,
          notes:
            "Take it outside. Not the garage, not the backyard if you can help it. Wet, cold, tired — that's where the lessons live. Even 30 minutes counts.",
        },
        {
          name: "Full-loop drill",
          focus: "repertoire",
          weight: 10,
          minLevel: 3,
          notes:
            "Multi-skill mini-mission: navigate to a point, light a fire, signal, return. Time yourself. Find the bottlenecks.",
        },
        {
          name: "Study & gear check",
          focus: "theory",
          weight: 5,
          minLevel: 1,
          notes:
            "Read a chapter on wilderness medicine, edible plants, or weather. Or audit your kit: what's missing, what's broken, what's overkill.",
        },
      ],
    },
  ],

  writing: [
    {
      name: "Daily writing practice",
      description:
        "Free-write → read → draft → revise → craft drill → reflect. Heavier revision and craft analysis unlock once you can produce volume.",
      blocks: [
        {
          name: "Free-write",
          focus: "warmup",
          weight: 10,
          minLevel: 1,
          notes:
            "Five minutes, no stopping, no editing, no rereading. Pen across the page. The point is to find the on-switch, not to write something good.",
        },
        {
          name: "Read like a writer",
          focus: "sight-read",
          weight: 15,
          minLevel: 1,
          notes:
            "One short essay or chapter by someone you want to write like. Mark the moves: how do they open, where does the sentence rhythm shift, what verbs do they avoid? Two great paragraphs > a thousand words you skim.",
        },
        {
          name: "Drafting",
          focus: "repertoire",
          weight: 30,
          minLevel: 1,
          notes:
            "Fresh prose on the current piece. Word-count goal optional, but butt-in-chair time isn't. New ground, ugly is fine. Editing has its own block.",
        },
        {
          name: "Revision",
          focus: "repertoire",
          weight: 25,
          minLevel: 2,
          notes:
            "Yesterday's draft. Cut, tighten, swap weak verbs, kill modifiers. Read it aloud — your ear is honest in a way your eye isn't.",
        },
        {
          name: "Craft drill",
          focus: "technique",
          weight: 15,
          minLevel: 1,
          notes:
            "Imitate a paragraph by an author you love, sentence by sentence. Or write a paragraph under a constraint: no adverbs, only one-syllable words, second person. Constraints teach moves.",
        },
        {
          name: "Reflective journaling",
          focus: "theory",
          weight: 5,
          minLevel: 3,
          notes:
            "What's working? What feels off? What did you avoid today? Five minutes. The patterns are the lesson, not the entry.",
        },
      ],
    },
  ],

  bjj: [
    {
      name: "BJJ training session",
      description:
        "Mobility → drills → positional rolling → open rolling → review. Live rolling and harder positional work unlock as your base improves.",
      blocks: [
        {
          name: "Mobility warm-up",
          focus: "warmup",
          weight: 10,
          minLevel: 1,
          notes:
            "Shrimps, bridges, hip escapes, technical stand-ups. Solo, with intention — these are technique, not cardio. 5-8 minutes is plenty.",
        },
        {
          name: "Technique drilling",
          focus: "technique",
          weight: 30,
          minLevel: 1,
          notes:
            "Pick ONE technique (or chain of two). With a partner or solo on a heavy bag / dummy. 5+ slow reps each side, then build up speed. Quality reps, not heroic ones.",
        },
        {
          name: "Positional rolling",
          focus: "sight-read",
          weight: 20,
          minLevel: 2,
          notes:
            "Live but constrained — escape mount only, pass guard only, finish from back only. Reset every 90s. Limits force you to use today's drill instead of your A-game.",
        },
        {
          name: "Open rolling",
          focus: "repertoire",
          weight: 25,
          minLevel: 3,
          notes:
            "Real rolls. Pick partners across the spectrum: someone better, someone same level, someone smaller. Survive, then play.",
        },
        {
          name: "Video review",
          focus: "theory",
          weight: 10,
          minLevel: 1,
          notes:
            "Five minutes watching a roll (yours or a black belt's). Pick ONE thing — a frame, a head position, a grip — and look only for that. Your eye gets trained, not just your body.",
        },
        {
          name: "Conditioning finisher",
          focus: "review",
          weight: 5,
          minLevel: 1,
          notes:
            "Short metcon: 3 rounds shrimps + technical stand-ups + push-ups. Done is better than savage. Cool down properly.",
        },
      ],
    },
  ],

  fitness: [
    {
      name: "Strength & conditioning session",
      description:
        "Warm-up → main lifts → accessories → conditioning → mobility. Conditioning and accessory volume unlock once your main lifts have a base.",
      blocks: [
        {
          name: "Dynamic warm-up",
          focus: "warmup",
          weight: 10,
          minLevel: 1,
          notes:
            "Mobility for hips, shoulders, ankles. Light cardio to raise core temp. End with a few empty-bar / bodyweight reps of today's main lift pattern. Don't skip this.",
        },
        {
          name: "Main lift",
          focus: "technique",
          weight: 35,
          minLevel: 1,
          notes:
            "One big compound: squat, bench, deadlift, press, or row. Work sets at a deliberate RPE — leave 1-2 reps in the tank. Form audit every set. Beat yesterday by a rep or 2.5 kg, not 10 kg.",
        },
        {
          name: "Accessories",
          focus: "technique",
          weight: 25,
          minLevel: 2,
          notes:
            "2-3 accessory exercises targeting weak points or anti-patterns: rows after bench, posterior chain after squat, pulling after pressing. 3x8-12, controlled tempo.",
        },
        {
          name: "Conditioning",
          focus: "repertoire",
          weight: 15,
          minLevel: 3,
          notes:
            "Short metcon, intervals, or steady cardio — 8-15 min. Pick the modality you avoid most often. Your recovery between sets and your appearance both depend on this block.",
        },
        {
          name: "Mobility cool-down",
          focus: "review",
          weight: 10,
          minLevel: 1,
          notes:
            "Static stretching for whatever you trained. Long holds, slow breathing. Five minutes pays interest tomorrow.",
        },
        {
          name: "Recovery work",
          focus: "theory",
          weight: 5,
          minLevel: 1,
          notes:
            "Foam roll a sticky area, do a few breathing rounds, log how the session felt. The session ends here, not at the last rep.",
        },
      ],
    },
  ],

  meditation: [
    {
      name: "Daily meditation practice",
      description:
        "Posture → anchored attention → open awareness → loving-kindness → reflection → off-cushion. Open awareness and compassion practices unlock as concentration steadies.",
      blocks: [
        {
          name: "Posture & breath check-in",
          focus: "warmup",
          weight: 10,
          minLevel: 1,
          notes:
            "Settle the body. Spine tall, shoulders soft, eyes half-closed or shut. Three full breaths. Notice how the body is right now without trying to fix it.",
        },
        {
          name: "Anchored attention",
          focus: "technique",
          weight: 30,
          minLevel: 1,
          notes:
            "Attention on the breath at the nostrils or belly. When the mind wanders, notice gently and return. The whole skill is the noticing — not the not-wandering.",
        },
        {
          name: "Open awareness / noting",
          focus: "sight-read",
          weight: 20,
          minLevel: 2,
          notes:
            "Drop the anchor. Whatever arises — sound, body sensation, thought — note it lightly (\"hearing\", \"thinking\", \"tingling\") and let it pass. Don't pursue, don't push away.",
        },
        {
          name: "Loving-kindness",
          focus: "repertoire",
          weight: 15,
          minLevel: 3,
          notes:
            "Phrases for yourself, then a friend, a neutral person, a difficult person, all beings. Don't force feeling — the intention is the practice. Two minutes per category.",
        },
        {
          name: "Reflection",
          focus: "theory",
          weight: 15,
          minLevel: 1,
          notes:
            "Before getting up: what arose today, what was difficult, what was easeful. Note it briefly — written or mental. Patterns over weeks are where insight lives.",
        },
        {
          name: "Off-cushion micro-practice",
          focus: "improv",
          weight: 10,
          minLevel: 4,
          notes:
            "Pick one mundane act today — drinking coffee, walking to the door, washing your hands — and do it with full attention. The cushion is the lab; off-cushion is the lived skill.",
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
