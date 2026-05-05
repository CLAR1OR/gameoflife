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

  math: [
    {
      name: "Math practice — concept and problems",
      description:
        "Math is built by reproducing concepts from scratch and solving problems just past your edge. Volume of unfamiliar problems beats hours of re-reading worked solutions.",
      blocks: [
        {
          name: "Mental arithmetic warm-up",
          focus: "warmup",
          weight: 5,
          minLevel: 1,
          notes:
            "Three minutes: estimate large products, square two-digit numbers, do a percent in your head. Wakes up the symbolic-fluency muscle most people skip.",
        },
        {
          name: "Concept of the day — reproduce from blank page",
          focus: "theory",
          weight: 15,
          minLevel: 1,
          notes:
            "Read one definition or theorem. Close the book. Re-derive or restate it on a blank sheet, with an example. If you can't, re-read and try again. The blank-page test is the only one that counts.",
        },
        {
          name: "Worked-example reproduction",
          focus: "technique",
          weight: 20,
          minLevel: 1,
          notes:
            "Read a fully-worked example, close the book, redo from scratch. Don't peek. If you stall, glance for the smallest hint, then close again. This pattern — masking and reconstructing — is what builds problem-solving instincts.",
        },
        {
          name: "Problem set — edge of competence",
          focus: "repertoire",
          weight: 30,
          minLevel: 1,
          notes:
            "3-5 problems just past what you can do without thinking. If you finish all 5 easily, the set was too easy. If you finish 0, scale back. The sweet spot is 50-70%.",
        },
        {
          name: "Interleaved review",
          focus: "review",
          weight: 10,
          minLevel: 1,
          notes:
            "One problem each from two older topics. Mixing topics breaks pattern-matching and forces real recognition. This is where retention is made.",
        },
        {
          name: "Clean-write a proof",
          focus: "repertoire",
          weight: 15,
          minLevel: 3,
          notes:
            "Take one of today's problems and write its solution as if for a textbook — complete sentences, named lemmas, no hand-waving. Mathematical writing is a skill of its own.",
        },
        {
          name: "Feynman explain",
          focus: "improv",
          weight: 5,
          minLevel: 4,
          notes:
            "Out loud, no notes, explain today's concept to an imaginary smart 12-year-old. Where you get vague is where you don't actually understand. Loop back to that spot tomorrow.",
        },
      ],
    },
  ],

  spanish: [
    {
      name: "Daily Spanish practice",
      description:
        "Heavy on comprehensible input (the strongest evidence-based driver of acquisition) plus targeted output. Conversation and native content unlock as comprehension stabilises.",
      blocks: [
        {
          name: "Pronunciation shadowing",
          focus: "warmup",
          weight: 10,
          minLevel: 1,
          notes:
            "Five minutes shadowing native audio. Repeat each phrase out loud the moment you hear it. Don't translate — imitate. Stress, vowel quality, and rolled R live here.",
        },
        {
          name: "Vocabulary SRS",
          focus: "technique",
          weight: 15,
          minLevel: 1,
          notes:
            "Anki / Memrise / your tool of choice. Reviews first; new cards only after. If reviews are buried, do reviews only.",
        },
        {
          name: "Comprehensible input",
          focus: "sight-read",
          weight: 30,
          minLevel: 1,
          notes:
            "20-30 minutes of input you can mostly follow — Dreaming Spanish, podcasts at your level, graded reader. The acquisition research is consistent: this is where fluency comes from. Don't look up every word.",
        },
        {
          name: "Grammar focus",
          focus: "technique",
          weight: 15,
          minLevel: 1,
          notes:
            "One structure (subjunctive triggers, ser/estar, por/para). Read the rule, do 10 targeted drills, write 3 sentences using it. Don't over-study grammar; you're feeding examples to a system that learns patterns.",
        },
        {
          name: "Output — write or speak",
          focus: "repertoire",
          weight: 15,
          minLevel: 1,
          notes:
            "Short paragraph or 60-second voice memo using today's focus. Don't translate from English. Think simply in Spanish — better short and correct than long and broken.",
        },
        {
          name: "Native content stretch",
          focus: "sight-read",
          weight: 10,
          minLevel: 3,
          notes:
            "5-10 min of un-leveled native content — TV, news, full-speed podcast. No subtitles. Catch the gist. This is the bridge from B1 to B2.",
        },
        {
          name: "Live conversation",
          focus: "improv",
          weight: 5,
          minLevel: 4,
          notes:
            "Real human, real time. iTalki, language exchange, intercambio. Pre-write one topic so you have something to start with. The hard part is the first sentence.",
        },
      ],
    },
  ],

  french: [
    {
      name: "Daily French practice",
      description:
        "French rewards extra time on pronunciation (silent letters, liaison, nasals) and listening — most learners can read long before they can hear or be heard. Live conversation unlocks once your ear catches up.",
      blocks: [
        {
          name: "Phonetics drill",
          focus: "warmup",
          weight: 15,
          minLevel: 1,
          notes:
            "Nasals (in/an/on/un), the French R, liaison patterns. Use minimal-pair audio or a phonetics drill app. The accent issue is upstream of everything else — fix it early.",
        },
        {
          name: "Vocabulary SRS",
          focus: "technique",
          weight: 15,
          minLevel: 1,
          notes:
            "Reviews first, then new words. Tag gendered nouns with colour or sentence — French gender is best learned in context, not as a rule.",
        },
        {
          name: "Listening — slow and natural",
          focus: "sight-read",
          weight: 25,
          minLevel: 1,
          notes:
            "Inner French / News in Slow French / France Inter. Listen actively, then re-listen with the transcript. Do this every day; French ears are made by hours not flashcards.",
        },
        {
          name: "Reading — primary text",
          focus: "sight-read",
          weight: 15,
          minLevel: 2,
          notes:
            "Real prose at your level. A short story, a journalism piece. Note 5 nice expressions in a notebook for later mining.",
        },
        {
          name: "Grammar focus",
          focus: "technique",
          weight: 10,
          minLevel: 1,
          notes:
            "One topic per session — subjunctive, pronouns y/en, agreement of past participles. Don't try to master French grammar; expose yourself to enough patterns that the right form starts to feel right.",
        },
        {
          name: "Output — write & re-read aloud",
          focus: "repertoire",
          weight: 15,
          minLevel: 1,
          notes:
            "Write a paragraph using today's focus. Then read it aloud — your mouth catches mistakes your eyes miss. Bonus: record yourself and listen back next session.",
        },
        {
          name: "Live conversation",
          focus: "improv",
          weight: 5,
          minLevel: 4,
          notes:
            "Tutor, exchange partner, café in the wild. Prep one topic. Don't apologise for your French — they hear it as effort, not weakness.",
        },
      ],
    },
  ],

  singing: [
    {
      name: "Voice training session",
      description:
        "Voice is a body skill — the warm-up isn't optional. Heavier work and recording-based feedback unlock as your fundamentals settle. Always end with rest, not another run.",
      blocks: [
        {
          name: "Body & breath",
          focus: "warmup",
          weight: 10,
          minLevel: 1,
          notes:
            "Posture check, shoulder rolls, diaphragmatic breathing on a hiss. Five minutes. Singing tension is mostly body tension — fix the body and half your problems leave.",
        },
        {
          name: "Vocal warm-up",
          focus: "warmup",
          weight: 15,
          minLevel: 1,
          notes:
            "Lip trills, straw phonation (SOVT), sirens, ascending/descending 5-note scales. Start mid-range, go gentle. Don't push range until the voice is awake.",
        },
        {
          name: "Technique focus",
          focus: "technique",
          weight: 25,
          minLevel: 1,
          notes:
            "One target per session: register transitions (passaggio), agility (runs), support, vibrato, vowel modification. Five minutes of focused work beats thirty of unfocused singing.",
        },
        {
          name: "Repertoire — phrasing",
          focus: "repertoire",
          weight: 20,
          minLevel: 1,
          notes:
            "One song, working a single phrase: where does the breath go, where's the dynamic peak, what consonants need help. Sing the phrase 5+ times, deliberately differently each time.",
        },
        {
          name: "Sight-singing",
          focus: "sight-read",
          weight: 10,
          minLevel: 2,
          notes:
            "Solfege a melody you've never seen. Don't aim for performance — aim for the right pitches and rhythm. Five minutes; it compounds.",
        },
        {
          name: "Performance recording",
          focus: "repertoire",
          weight: 15,
          minLevel: 3,
          notes:
            "Sing a full song with phone recording. Listen back honestly — what surprises you, what tracks the score, what doesn't. The recording is the teacher.",
        },
        {
          name: "Cool-down & rest",
          focus: "review",
          weight: 5,
          minLevel: 1,
          notes:
            "Gentle descending sirens, a glass of water, voice rest. Don't talk loudly for an hour. Voice care is a skill; over-singing is the rookie mistake.",
        },
      ],
    },
  ],

  "music-theory": [
    {
      name: "Music theory practice",
      description:
        "Theory is built from drills (fluency), analysis (insight), and writing (proof of understanding). Counterpoint and composition unlock once your ear and pen are quick.",
      blocks: [
        {
          name: "Sight & ear drill",
          focus: "technique",
          weight: 20,
          minLevel: 1,
          notes:
            "Intervals, chord qualities, scales — by sight and by ear, both directions. Tenuto / Teoria / EarMaster work. Five minutes of speed beats an hour of slow review.",
        },
        {
          name: "Score analysis",
          focus: "sight-read",
          weight: 25,
          minLevel: 1,
          notes:
            "Pull up a piece. Roman-numeral every chord, mark cadences, note the form. One Bach chorale or pop song per session. The point is to translate sound to function.",
        },
        {
          name: "Aural skills",
          focus: "technique",
          weight: 15,
          minLevel: 2,
          notes:
            "Sing what you see; dictate what you hear. Solfege a melody, then transcribe a 4-bar phrase by ear. Aural skills are the bottleneck most theorists hit at level 3.",
        },
        {
          name: "Voice-leading exercise",
          focus: "technique",
          weight: 15,
          minLevel: 3,
          notes:
            "Species counterpoint, four-voice realisation of a figured bass, or chorale-style harmonisation. The rules teach the ear what good motion sounds like.",
        },
        {
          name: "Composition fragment",
          focus: "repertoire",
          weight: 15,
          minLevel: 1,
          notes:
            "Write something tiny that uses today's concept — an 8-bar progression, a melody over a Roman-numeral skeleton, a modulation. Save it. Steal from yourself later.",
        },
        {
          name: "Reading — text or score",
          focus: "theory",
          weight: 5,
          minLevel: 1,
          notes:
            "5-10 minutes of theory text or annotated score. One concept, well understood, beats five concepts skimmed.",
        },
        {
          name: "Improvise the concept",
          focus: "improv",
          weight: 5,
          minLevel: 4,
          notes:
            "At an instrument or with your voice, improvise using today's concept. If you've worked Neapolitan chords, find one in your own playing. Theory becomes intuition this way.",
        },
      ],
    },
  ],

  archery: [
    {
      name: "Archery practice session",
      description:
        "Archery is a form sport — at every level, perfect repetitive shots at close range beats hero shots at long range. Distance and scoring unlock as form stabilises.",
      blocks: [
        {
          name: "Body warm-up",
          focus: "warmup",
          weight: 10,
          minLevel: 1,
          notes:
            "Shoulder mobility, scapular activation, light cardio. Then a stretch band — pull through your shot cycle 10x with no arrow. Cold archers shoot hurt archers.",
        },
        {
          name: "Blank-bale shooting",
          focus: "technique",
          weight: 30,
          minLevel: 1,
          notes:
            "Eyes closed or open, 3-5m from a target you don't aim at. Focus only on the shot cycle: stance, draw, anchor, transfer, release, follow-through. 20-30 reps. This is where form is built.",
        },
        {
          name: "Aim drill — short distance",
          focus: "technique",
          weight: 20,
          minLevel: 1,
          notes:
            "10-18m at a target. End-of-arrow groups, not hits. Goal: 6 arrows that land in a fist-sized cluster. Centring comes after grouping; don't reverse them.",
        },
        {
          name: "Distance work",
          focus: "repertoire",
          weight: 15,
          minLevel: 2,
          notes:
            "Step back. 30m, 50m, 70m as you progress. Same form, longer aiming window. The temptation to muscle through is the moment your form falls apart.",
        },
        {
          name: "Scoring round",
          focus: "repertoire",
          weight: 15,
          minLevel: 3,
          notes:
            "Score an end (or full round) under pressure — count aloud, set a target. Pressure exposes which form points need more blank-bale time.",
        },
        {
          name: "Equipment & journal",
          focus: "review",
          weight: 5,
          minLevel: 1,
          notes:
            "Wax string, check nocking-point, inspect arrows. Then journal: what felt off, what improved, where to focus next session. Equipment problems hide as form problems.",
        },
        {
          name: "Mental rehearsal",
          focus: "theory",
          weight: 5,
          minLevel: 2,
          notes:
            "Five minutes of visualised shots — feel the draw, the anchor, the release, hear the thump. Visualisation has solid evidence in target sports; don't skip it.",
        },
      ],
    },
  ],

  philosophy: [
    {
      name: "Daily philosophy practice",
      description:
        "Philosophy is reading slowly with a pen, reconstructing arguments, and writing your own. Speed-reading is its enemy. Discussion and original essay-writing unlock as your reading muscle builds.",
      blocks: [
        {
          name: "Spaced re-read",
          focus: "review",
          weight: 10,
          minLevel: 1,
          notes:
            "Open last week's notes. Re-read 2-3 highlighted passages and your margin notes. Five minutes; it stitches old material into long-term memory.",
        },
        {
          name: "Primary text — slow read",
          focus: "sight-read",
          weight: 25,
          minLevel: 1,
          notes:
            "5-10 pages, no more. Pen in hand. Underline, write questions in margins. If you'd 'read' more in less time, you didn't read it. Slowness is the practice.",
        },
        {
          name: "Argument map",
          focus: "technique",
          weight: 20,
          minLevel: 1,
          notes:
            "Pick one paragraph. Number the premises, identify the conclusion, mark the inference type. If you can't, you didn't understand it — go back. This is the skill behind everything else.",
        },
        {
          name: "Steelman & critique",
          focus: "repertoire",
          weight: 20,
          minLevel: 1,
          notes:
            "Write 200 words steelmanning today's view (the strongest case for it), then 200 critiquing it. Doing both prevents tribalism and builds real clarity.",
        },
        {
          name: "Cross-tradition link",
          focus: "theory",
          weight: 10,
          minLevel: 2,
          notes:
            "How does today's concept echo or contradict something from another tradition you've studied — Eastern, analytic, continental, scientific? Five minutes of connection-making is where insight lives.",
        },
        {
          name: "Socratic dialogue",
          focus: "improv",
          weight: 10,
          minLevel: 3,
          notes:
            "On paper or with a friend: you take one side, an interlocutor (real or imagined) the other. Push each other to define terms. Don't win — clarify.",
        },
        {
          name: "Original paragraph",
          focus: "repertoire",
          weight: 5,
          minLevel: 4,
          notes:
            "Write one paragraph of your own philosophy using today's concept. Take a position, defend it, anticipate one objection. This is the long game — these compound into essays.",
        },
      ],
    },
  ],

  electronics: [
    {
      name: "Electronics bench session",
      description:
        "Theory + breadboard + measure + debug. Soldering and original design unlock once you can predict and verify circuits reliably.",
      blocks: [
        {
          name: "Theory refresh",
          focus: "warmup",
          weight: 10,
          minLevel: 1,
          notes:
            "Re-derive Ohm's, KVL, KCL on a quick circuit on paper. Compute a divider, an RC time constant, an op-amp gain. Five minutes; the math should be at your fingertips.",
        },
        {
          name: "Build from a schematic",
          focus: "technique",
          weight: 20,
          minLevel: 1,
          notes:
            "Pick a small schematic (blink LED, transistor amp, 555 timer) and build it on a breadboard from scratch. No following along — translate the schematic yourself.",
        },
        {
          name: "Predict-then-measure",
          focus: "technique",
          weight: 20,
          minLevel: 1,
          notes:
            "Before probing: write down what you expect at each test point — voltage, current, frequency. Then measure. The gap between prediction and reality is the lesson.",
        },
        {
          name: "Debug a fault",
          focus: "sight-read",
          weight: 20,
          minLevel: 2,
          notes:
            "Take a working circuit, sabotage it with a wrong-value resistor or open joint, then debug it as if you didn't know. Most engineering hours are spent debugging — train it on purpose.",
        },
        {
          name: "Solder practice",
          focus: "repertoire",
          weight: 15,
          minLevel: 2,
          notes:
            "A header, a small kit, a PCB. Aim for shiny conical joints, no cold solder, no bridges. Practice lead-free if your real work uses it; the technique is different.",
        },
        {
          name: "Datasheet study",
          focus: "theory",
          weight: 10,
          minLevel: 1,
          notes:
            "Pick a chip you used today. Read one section of its datasheet — absolute maximums, the I/V curve, a typical-application diagram. Datasheet fluency separates hobbyists from engineers.",
        },
        {
          name: "Design something",
          focus: "improv",
          weight: 5,
          minLevel: 4,
          notes:
            "Specify a small goal — 'flash an LED at 1Hz', 'amplify a microphone' — and design the circuit on paper before touching a breadboard. Build it next session.",
        },
      ],
    },
  ],

  woodworking: [
    {
      name: "Woodworking shop session",
      description:
        "Sharp tools and accurate layout do most of the work. Joinery and project execution unlock as your fundamentals tighten. Everything starts with safety and ends with cleanup.",
      blocks: [
        {
          name: "Sharpen & maintain",
          focus: "warmup",
          weight: 15,
          minLevel: 1,
          notes:
            "Hone your chisel, plane iron, marking knife. Wax saw plates, oil moving parts. A dull tool ruins more boards than a slow craftsman ever will. Five minutes saves an hour.",
        },
        {
          name: "Layout & marking",
          focus: "technique",
          weight: 15,
          minLevel: 1,
          notes:
            "Square reference faces, mark with knife not pencil, transfer with the same setup. Practice on scrap. Accurate joinery is 80% accurate marking.",
        },
        {
          name: "Joinery drill",
          focus: "technique",
          weight: 25,
          minLevel: 1,
          notes:
            "Pick ONE joint — dovetail, mortise & tenon, half-lap — and cut it on scrap until it's clean and snug. Reps build the muscle memory; one project doesn't.",
        },
        {
          name: "Stock prep",
          focus: "repertoire",
          weight: 15,
          minLevel: 2,
          notes:
            "Take rough lumber to flat-square-and-parallel. Hand or machine. The first joint of every project depends on this — and most failures trace back to a board that wasn't true.",
        },
        {
          name: "Project work",
          focus: "repertoire",
          weight: 20,
          minLevel: 1,
          notes:
            "Time on your current project. Pick one milestone. Don't try to skip steps — the boring middle is where finished pieces are made.",
        },
        {
          name: "Finishing or design study",
          focus: "theory",
          weight: 5,
          minLevel: 2,
          notes:
            "Sand to grit, apply finish coat — or sketch your next project, study a piece you admire, plan a cut list. Alternate sessions.",
        },
        {
          name: "Cleanup & sharpen back",
          focus: "review",
          weight: 5,
          minLevel: 1,
          notes:
            "Sweep the shavings, return tools, hone what dulled. The discipline of leaving the bench better than you found it is part of the craft.",
        },
      ],
    },
  ],

  reading: [
    {
      name: "Deep reading practice",
      description:
        "Reading better isn't reading faster. It's previewing, marking, summarising, and connecting. Synthesis-writing unlocks once you can produce a clean summary on demand.",
      blocks: [
        {
          name: "Preview & question",
          focus: "warmup",
          weight: 5,
          minLevel: 1,
          notes:
            "Skim TOC, headings, first sentences. Write the one question you want this section to answer. Reading with a question in mind doubles retention.",
        },
        {
          name: "Active reading",
          focus: "sight-read",
          weight: 35,
          minLevel: 1,
          notes:
            "Book in hand, pen in the other. Underline what's surprising or important — not everything. Note in the margin in your own words. If a passage stops you, slow down further; that's where the value is.",
        },
        {
          name: "One-paragraph summary",
          focus: "technique",
          weight: 15,
          minLevel: 1,
          notes:
            "Close the book. Write a 100-word summary of what you just read in your own voice. If you can't, you didn't read it actively — return to the marks.",
        },
        {
          name: "Spaced highlight review",
          focus: "review",
          weight: 10,
          minLevel: 1,
          notes:
            "Pull up Readwise / your highlight collection. Re-read 5-10 old highlights. The point isn't to remember them all — it's to remind your reading-self what tends to matter.",
        },
        {
          name: "Re-read a hard passage",
          focus: "repertoire",
          weight: 10,
          minLevel: 2,
          notes:
            "One paragraph or page that didn't quite land. Read it slowly twice more. Look up references. Most of the value of a great book is hidden in the bits you skipped.",
        },
        {
          name: "Connection / mind-map",
          focus: "theory",
          weight: 10,
          minLevel: 3,
          notes:
            "How does today's reading connect to another book or idea you've studied? Sketch the link in a notes app or notebook. This is how a reading life becomes a thinking life.",
        },
        {
          name: "Write a 200-word response",
          focus: "repertoire",
          weight: 15,
          minLevel: 4,
          notes:
            "Not a summary — your reaction. What did you disagree with, what stuck, what would you do differently than the author? Becomes the seed of essays and recommendations later.",
        },
      ],
    },
  ],

  memory: [
    {
      name: "Memory training session",
      description:
        "Memory athletics is built from encoding speed, palace fluency, and long-term recall. Disciplines (cards, numbers, names) get harder by adding time pressure. Real-life application unlocks as your palaces stabilise.",
      blocks: [
        {
          name: "Palace warm-up",
          focus: "warmup",
          weight: 10,
          minLevel: 1,
          notes:
            "Walk an existing memory palace mentally end to end. Notice any loci that feel hazy. Five minutes; familiarity with your palaces is the foundation of everything.",
        },
        {
          name: "Encoding drill",
          focus: "technique",
          weight: 25,
          minLevel: 1,
          notes:
            "Pick one discipline — cards, binary, numbers, names. Use your PAO / Major / shadow system. 5-10 minutes of focused encoding without time pressure. Build the images, don't yet sprint.",
        },
        {
          name: "Speed drill",
          focus: "technique",
          weight: 20,
          minLevel: 2,
          notes:
            "Set a stopwatch. Memorise X items in Y minutes — push your time slowly. Speed and accuracy trade off; alternate sessions favouring each.",
        },
        {
          name: "Long-term recall test",
          focus: "review",
          weight: 15,
          minLevel: 1,
          notes:
            "Recite a palace from a week ago, then a month ago. Patch the loci that fade. Long-term storage is where most amateurs lose to competitors.",
        },
        {
          name: "Build a new palace",
          focus: "theory",
          weight: 10,
          minLevel: 2,
          notes:
            "Pick a familiar place — childhood home, a museum, a videogame map. Lay 20+ loci in a fixed order. Test it the next day. New palaces are inventory.",
        },
        {
          name: "Practical use",
          focus: "repertoire",
          weight: 15,
          minLevel: 3,
          notes:
            "Memorise a real list — speech outline, vocab batch, deck of names at a meetup, grocery list. The palace is not for shows; use it.",
        },
        {
          name: "Full-discipline competition",
          focus: "improv",
          weight: 5,
          minLevel: 4,
          notes:
            "Run a full-time event under competition rules — speed cards, names, numbers. Rest, then score. The data is what to train next session.",
        },
      ],
    },
  ],

  "world-history": [
    {
      name: "History reading & synthesis",
      description:
        "Build a chronological skeleton, fill it with primary sources, then connect across periods. Argument-writing unlocks once you can summarise and compare reliably.",
      blocks: [
        {
          name: "Timeline review (SRS)",
          focus: "warmup",
          weight: 10,
          minLevel: 1,
          notes:
            "Spaced repetition on dates, dynasties, key figures. The skeleton matters: without dates anchored, every story floats. Five minutes; it compounds.",
        },
        {
          name: "Primary or secondary read",
          focus: "sight-read",
          weight: 30,
          minLevel: 1,
          notes:
            "10-20 pages on the period in focus. If you can stomach it, mix one secondary chapter with one primary excerpt — letters, treaties, chronicles. Primary sources are where it stops feeling like trivia.",
        },
        {
          name: "Connect to other periods",
          focus: "technique",
          weight: 15,
          minLevel: 1,
          notes:
            "How does today's reading rhyme or contrast with another era? Trade collapse, succession crises, religious reforms, technological diffusion — patterns repeat. Note one connection.",
        },
        {
          name: "100-word synthesis",
          focus: "repertoire",
          weight: 15,
          minLevel: 1,
          notes:
            "Close the book. Write a 100-word account of today's topic in your own words, including dates and one source. The word-count constraint forces understanding.",
        },
        {
          name: "Map work",
          focus: "technique",
          weight: 10,
          minLevel: 2,
          notes:
            "Blank map of the region in question. Draw borders, key cities, trade routes, river systems. Geography drives everything in pre-modern history; you can't skip it.",
        },
        {
          name: "Comparative essay seed",
          focus: "theory",
          weight: 10,
          minLevel: 3,
          notes:
            "Compare two civilisations / two sources / two perspectives on the same event. Five minutes of bullet-pointed parallels and divergences. Becomes essay material later.",
        },
        {
          name: "Counterfactual or thesis",
          focus: "improv",
          weight: 10,
          minLevel: 4,
          notes:
            "Stake a claim. 'If X hadn't happened…' or 'The most overrated cause of Y is…'. Defend it in 250 words against an imagined critic. History trains judgement; this is how.",
        },
      ],
    },
  ],

  biology: [
    {
      name: "Biology study & observe",
      description:
        "Biology is a science of patterns and cases. Drill terminology, but spend real time observing — fieldwork or a microscope teaches what textbooks can't.",
      blocks: [
        {
          name: "Terminology / SRS",
          focus: "warmup",
          weight: 10,
          minLevel: 1,
          notes:
            "Anki on anatomy / taxonomy / vocabulary. Reviews first. Biology has more named things than any other natural science; spaced review is the only sane route.",
        },
        {
          name: "Active textbook reading",
          focus: "sight-read",
          weight: 20,
          minLevel: 1,
          notes:
            "One section, with diagrams. Cover labels and re-name them, redraw the pathway from memory. Diagrams are pre-digested ideas — don't just look at them.",
        },
        {
          name: "Mechanism reproduction",
          focus: "technique",
          weight: 15,
          minLevel: 1,
          notes:
            "Pick a single mechanism — Krebs cycle, action potential, transcription, glomerular filtration. Redraw on a blank page with arrows and substrates. Where you blur is where you don't know it yet.",
        },
        {
          name: "Field or microscope observation",
          focus: "repertoire",
          weight: 25,
          minLevel: 1,
          notes:
            "Step away from the page. Sketch a leaf you can name and three you can't. Slide work, dissection, identification in the wild. Direct observation is what makes a naturalist out of a student.",
        },
        {
          name: "Problem set",
          focus: "technique",
          weight: 15,
          minLevel: 2,
          notes:
            "Genetics crosses, ecology calculations, biochem-pathway problems. Quantitative biology is where most students fall off; train it deliberately.",
        },
        {
          name: "Read a paper or news",
          focus: "theory",
          weight: 10,
          minLevel: 2,
          notes:
            "A short paper, a Quanta article, a podcast. Connect today's textbook content to actual research. Biology moves fast; what's in textbooks is years behind.",
        },
        {
          name: "Teach back",
          focus: "improv",
          weight: 5,
          minLevel: 3,
          notes:
            "Out loud, no notes — explain today's mechanism to an imaginary smart friend. Where you reach for a buzzword is where you need to study more.",
        },
      ],
    },
  ],

  physics: [
    {
      name: "Physics — problems & intuition",
      description:
        "Physics is built by deriving equations from scratch and solving problems. Reading without working examples is theatre. Conceptual intuition unlocks once your math is fast.",
      blocks: [
        {
          name: "Math warm-up",
          focus: "warmup",
          weight: 10,
          minLevel: 1,
          notes:
            "Quick calculus / linear algebra problem. Compute a derivative, integrate by parts, evaluate a determinant. The math has to be invisible to think clearly about the physics.",
        },
        {
          name: "Derive from first principles",
          focus: "technique",
          weight: 20,
          minLevel: 1,
          notes:
            "Pick an equation in today's topic. Derive it on a blank page. Don't memorise final forms; remember the path that produces them. This is where physical intuition is built.",
        },
        {
          name: "Worked-example reproduction",
          focus: "technique",
          weight: 15,
          minLevel: 1,
          notes:
            "Read a fully-worked example, close the book, redo from scratch. Where you stall, peek minimally, then close again. Repeat tomorrow with the same example until it's effortless.",
        },
        {
          name: "Problem set — at the edge",
          focus: "repertoire",
          weight: 30,
          minLevel: 1,
          notes:
            "3-5 problems just above what you can do without thinking. Don't peek at the solution before serious effort. The struggle is the learning.",
        },
        {
          name: "Conceptual question",
          focus: "theory",
          weight: 10,
          minLevel: 2,
          notes:
            "Sit with a Feynman-style 'why' question — why is the sky blue, why does a top precess, why doesn't quantum tunnelling violate energy conservation. Five minutes of explaining out loud is worth an hour of solving.",
        },
        {
          name: "Read a real paper or text",
          focus: "sight-read",
          weight: 10,
          minLevel: 3,
          notes:
            "A short section of a textbook above your level, or a famous paper (Einstein 1905, Feynman lecture). Don't expect to follow every step. Watch the moves expert physicists make.",
        },
        {
          name: "Teach back",
          focus: "improv",
          weight: 5,
          minLevel: 4,
          notes:
            "Explain today's concept to a non-physicist. No equations, no jargon. If you can't, you don't really understand it yet — and that's worth knowing.",
        },
      ],
    },
  ],

  chemistry: [
    {
      name: "Chemistry — mechanism & lab",
      description:
        "Chemistry rewards mechanism fluency, problem volume, and careful lab work. Original synthesis and instrumental analysis unlock as your foundation gets reliable.",
      blocks: [
        {
          name: "Reaction-mechanism warm-up",
          focus: "warmup",
          weight: 10,
          minLevel: 1,
          notes:
            "Push three arrows on a known mechanism — SN1, SN2, E1, addition, etc. The arrow-pushing language has to be fluent before nothing else really clicks.",
        },
        {
          name: "Concept reproduction",
          focus: "theory",
          weight: 15,
          minLevel: 1,
          notes:
            "One concept — orbital hybridisation, equilibrium, Le Chatelier, acid-base. Re-derive or re-explain on a blank page with a diagram and an example.",
        },
        {
          name: "Problem set",
          focus: "technique",
          weight: 30,
          minLevel: 1,
          notes:
            "Stoichiometry, equilibrium calcs, organic synthesis routes — whatever today's topic is. Volume matters; chem problem-solving is muscle memory plus heuristics.",
        },
        {
          name: "Lab / kitchen chemistry",
          focus: "repertoire",
          weight: 20,
          minLevel: 1,
          notes:
            "Hands on something real — titration, recrystallisation, simple distillation, even cooking-as-chem (caramelisation, fermentation). Reading without doing leaves intuition flat.",
        },
        {
          name: "Spectra / analytical practice",
          focus: "technique",
          weight: 10,
          minLevel: 2,
          notes:
            "Read an NMR / IR / mass spec problem. Identify the unknown. Spectroscopy is the bridge from organic problems to real-lab thinking.",
        },
        {
          name: "Read paper or text section",
          focus: "sight-read",
          weight: 10,
          minLevel: 3,
          notes:
            "A short section of a textbook above your level, or a recent JACS paper's abstract + figure. Watch how professional chemists describe what they did.",
        },
        {
          name: "Design a synthesis",
          focus: "improv",
          weight: 5,
          minLevel: 4,
          notes:
            "Pick a small target molecule. Plan a route on paper using reactions you know. Tomorrow, look up a published route and compare. This is how organic chemists are made.",
        },
      ],
    },
  ],

  astronomy: [
    {
      name: "Astronomy session",
      description:
        "Half desk study, half sky time. Telescope work and photographic projects unlock once your sky fluency catches up to your reading.",
      blocks: [
        {
          name: "Sky-tonight check",
          focus: "warmup",
          weight: 10,
          minLevel: 1,
          notes:
            "Open Stellarium or your sky-app. What's up tonight? Moon phase, visible planets, ISS pass, current constellations. Five minutes; orients the rest of the practice.",
        },
        {
          name: "Constellation drill",
          focus: "technique",
          weight: 15,
          minLevel: 1,
          notes:
            "Learn or re-find one constellation per session — myth, brightest stars, deep-sky targets within. Build a mental star atlas. The naked-eye sky is the foundation; don't skip past it for the gear.",
        },
        {
          name: "Concept reading",
          focus: "sight-read",
          weight: 20,
          minLevel: 1,
          notes:
            "Stellar evolution, distance ladder, cosmology, planetary atmospheres — one topic per session. Astronomy has surprisingly heavy physics; alternate concept and observation sessions.",
        },
        {
          name: "Observation session",
          focus: "repertoire",
          weight: 25,
          minLevel: 1,
          notes:
            "Outside, even briefly. Naked eye → binoculars → scope. Sketch what you see at the eyepiece. Skill at observing is built on hours under sky, not pages.",
        },
        {
          name: "Astrophotography or imaging",
          focus: "repertoire",
          weight: 15,
          minLevel: 3,
          notes:
            "Phone holder + telescope, DSLR + tracker, full astrophoto rig — whatever you have. One target tonight. Stacking, processing, end product. A long road, but addictive.",
        },
        {
          name: "Calculation drill",
          focus: "technique",
          weight: 10,
          minLevel: 2,
          notes:
            "Practical numbers — angular size, magnitude vs distance, orbital period, escape velocity. Do them on paper. Astronomy that doesn't go through math stays vibey.",
        },
        {
          name: "Read a recent paper",
          focus: "theory",
          weight: 5,
          minLevel: 4,
          notes:
            "A NASA press release, a Quanta article, an arXiv abstract. Field is moving fast — JWST, TESS, gravitational waves. Stay current.",
        },
      ],
    },
  ],

  "home-repair": [
    {
      name: "Home repair practice",
      description:
        "Real homeowner skill is part diagnosis, part technique, part project execution. Bigger projects unlock as your toolkit and confidence grow. Always finish with cleanup.",
      blocks: [
        {
          name: "Tool & supply check",
          focus: "warmup",
          weight: 10,
          minLevel: 1,
          notes:
            "Inspect today's tools, restock consumables (bits, screws, blades, tape), spot anything broken or missing. A short ritual that prevents two-trip-to-the-hardware-store sessions.",
        },
        {
          name: "Skill drill on scrap",
          focus: "technique",
          weight: 20,
          minLevel: 1,
          notes:
            "Pick one technique — drilling clean holes, painting cut-in, finding studs, soldering copper, sweating PEX, hanging drywall, mudding a seam. Do it on scrap until it's repeatable. Don't rehearse on the actual wall.",
        },
        {
          name: "Active repair",
          focus: "repertoire",
          weight: 30,
          minLevel: 1,
          notes:
            "Pick one item off the home to-do list. Squeaky hinge, leaky tap, paint touch-up, broken latch. Start small. Ten finished tiny repairs beat one ambitious half-done remodel.",
        },
        {
          name: "Diagnostic walk-through",
          focus: "sight-read",
          weight: 15,
          minLevel: 2,
          notes:
            "Slowly walk one room or system (plumbing, electrical, exterior). Find one issue you didn't know existed. Notice — don't fix yet. Catalogue is half the job.",
        },
        {
          name: "How-to study",
          focus: "theory",
          weight: 10,
          minLevel: 1,
          notes:
            "Read or watch a focused how-to on a technique you'll need next. Take notes, write a parts list. Better to spend 10 minutes here than 60 unfucking a botch.",
        },
        {
          name: "Plan a bigger project",
          focus: "theory",
          weight: 10,
          minLevel: 2,
          notes:
            "Sketch a project — a built-in, a deck repair, replacing a fixture. Materials, tools, steps, time estimate. Most amateur disasters are unplanned ones.",
        },
        {
          name: "Help someone else",
          focus: "improv",
          weight: 5,
          minLevel: 4,
          notes:
            "Help a friend, family, or neighbour with a repair. Different house, different problems, different tools. Generalises your skill faster than ten projects in your own home.",
        },
      ],
    },
  ],

  conversation: [
    {
      name: "Conversation practice",
      description:
        "Conversation is a craft — questions, listening, stories, recovery. Hard mode (strangers, conflict, group dynamics) unlocks as your fundamentals stabilise. Always reflect after.",
      blocks: [
        {
          name: "Body & voice prep",
          focus: "warmup",
          weight: 5,
          minLevel: 1,
          notes:
            "Posture, breath, smile in the mirror. A few minutes of warming the voice (lip trill, humming). The body sets the tone before the words do.",
        },
        {
          name: "Question crafting",
          focus: "technique",
          weight: 10,
          minLevel: 1,
          notes:
            "Write 3 great open-ended questions you could ask anyone — about their work, their week, their excitement, their worry. Practice making them specific. 'What are you working on?' beats 'how are you?'",
        },
        {
          name: "Active-listening drill",
          focus: "technique",
          weight: 15,
          minLevel: 1,
          notes:
            "In a real conversation today, deliberately paraphrase what someone said before you reply. Just once. Notice their reaction. The whole skill is making people feel heard.",
        },
        {
          name: "Real conversation focus",
          focus: "repertoire",
          weight: 25,
          minLevel: 1,
          notes:
            "15-30 min with a friend, family, or colleague — applying today's craft point (one of: open-ended Qs, paraphrasing, asking 'tell me more', sharing first to invite reciprocity). One focus is enough.",
        },
        {
          name: "Story refinement",
          focus: "technique",
          weight: 15,
          minLevel: 2,
          notes:
            "Take a personal anecdote you tell often. Polish it: what's the hook, where's the tension, what's the punch line, what does it land on? Cut filler. Stories are conversational currency.",
        },
        {
          name: "Hard mode — stranger",
          focus: "repertoire",
          weight: 15,
          minLevel: 3,
          notes:
            "One stranger, one real interaction. Barista, gym person, neighbour. Two-question minimum. Don't aim for charm — aim for genuine curiosity. The skill compounds.",
        },
        {
          name: "Reflection",
          focus: "review",
          weight: 15,
          minLevel: 1,
          notes:
            "End of day — note one moment that felt good, one that felt off, one specific thing to try tomorrow. The patterns over weeks are where real social skill is built.",
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
