export type MilestoneTemplate = {
  name: string;
  xpReward: number;
};

export type SubskillTemplate = {
  name: string;
  description?: string;
  milestones: MilestoneTemplate[];
  prerequisiteNames?: string[];
};

export type TemplateAchievement = {
  name: string;
  description?: string;
  icon: string;
  trigger:
    | { type: "subskill_mastered"; subskillName: string }
    | { type: "stage_reached"; stage: number }
    | { type: "all_mastered" };
};

/** Generic fallback gradient used as `coverImage` when a template has a
 *  cover-pack key but the active pack hasn't supplied an image for it. */
export const DEFAULT_COVER_GRADIENT =
  "linear-gradient(135deg, #0a0b14 0%, #1a1b35 50%, #2d2f5f 100%)";

export type SkillTemplate = {
  id: string;
  name: string;
  description: string;
  icon: string;
  /** CSS background string used when no pack image is available. */
  coverImage: string;
  /** Filename stem (no extension) for the cover-pack lookup.
   *  /public/skill-covers/<activePack>/<coverKey>.<ext> takes precedence
   *  over `coverImage` at render time. Omit for templates that should
   *  stay gradient-only. */
  coverKey?: string;
  subskills: SubskillTemplate[];
  achievements?: TemplateAchievement[];
};

export const SKILL_TEMPLATES: SkillTemplate[] = [
  {
    id: "cooking",
    name: "Cooking",
    description: "From kitchen basics to confident home cook",
    coverImage: DEFAULT_COVER_GRADIENT,
    coverKey: "cooking",
    icon: "🍳",
    subskills: [
      {
        name: "Kitchen Basics",
        description: "Fundamental techniques and safety",
        milestones: [
          { name: "Learn to properly hold a knife", xpReward: 15 },
          { name: "Dice an onion without crying (much)", xpReward: 15 },
          { name: "Boil pasta al dente", xpReward: 10 },
          { name: "Make a simple salad dressing from scratch", xpReward: 15 },
          { name: "Cook rice without burning it", xpReward: 15 },
          { name: "Fry an egg (sunny side up + scrambled)", xpReward: 20 },
        ],
      },
      {
        name: "Simple Meals",
        description: "Easy recipes you can cook on a weeknight",
        prerequisiteNames: ["Kitchen Basics"],
        milestones: [
          { name: "Cook a pasta with homemade sauce", xpReward: 25 },
          { name: "Make a stir-fry from scratch", xpReward: 25 },
          { name: "Cook a simple soup (e.g., tomato or potato)", xpReward: 25 },
          { name: "Make a complete breakfast (eggs, toast, sides)", xpReward: 20 },
          { name: "Prepare a one-pot meal", xpReward: 25 },
          { name: "Cook 5 different weeknight dinners from memory", xpReward: 50 },
        ],
      },
      {
        name: "Baking Basics",
        description: "Simple baked goods and oven skills",
        prerequisiteNames: ["Kitchen Basics"],
        milestones: [
          { name: "Bake a batch of cookies from scratch", xpReward: 25 },
          { name: "Make a simple cake (e.g., banana bread)", xpReward: 30 },
          { name: "Bake homemade bread (any kind)", xpReward: 40 },
          { name: "Make a pie or tart with handmade crust", xpReward: 40 },
          { name: "Bake something as a gift for someone", xpReward: 25 },
        ],
      },
      {
        name: "Sauces & Seasonings",
        description: "Level up flavor in everything you cook",
        prerequisiteNames: ["Simple Meals"],
        milestones: [
          { name: "Make a roux-based sauce (bechamel or gravy)", xpReward: 30 },
          { name: "Prepare a vinaigrette with 3 variations", xpReward: 20 },
          { name: "Make a curry paste or spice blend from scratch", xpReward: 35 },
          { name: "Learn to balance salt, acid, fat, and heat in a dish", xpReward: 40 },
          { name: "Create your own signature sauce", xpReward: 50 },
        ],
      },
      {
        name: "Meal Planning",
        description: "Plan ahead, waste less, eat better",
        prerequisiteNames: ["Simple Meals"],
        milestones: [
          { name: "Plan and cook meals for a full week", xpReward: 40 },
          { name: "Meal prep on Sunday for the work week", xpReward: 35 },
          { name: "Use leftovers creatively for a new meal", xpReward: 25 },
          { name: "Cook a 3-course dinner for guests", xpReward: 50 },
          { name: "Stay within a grocery budget for a month", xpReward: 40 },
        ],
      },
      {
        name: "World Cuisines",
        description: "Explore cooking traditions from around the globe",
        prerequisiteNames: ["Sauces & Seasonings"],
        milestones: [
          { name: "Cook an Italian dish (beyond pasta)", xpReward: 30 },
          { name: "Cook an Asian dish (Thai, Japanese, Chinese, etc.)", xpReward: 30 },
          { name: "Cook a Mexican or Latin American dish", xpReward: 30 },
          { name: "Cook a Middle Eastern or Indian dish", xpReward: 30 },
          { name: "Host a themed dinner from a specific cuisine", xpReward: 50 },
          { name: "Cook dishes from 5 different countries", xpReward: 50 },
        ],
      },
      {
        name: "Advanced Techniques",
        description: "Restaurant-level skills for the ambitious cook",
        prerequisiteNames: ["Sauces & Seasonings", "Baking Basics"],
        milestones: [
          { name: "Deglaze a pan and build a pan sauce", xpReward: 30 },
          { name: "Make fresh pasta from scratch", xpReward: 40 },
          { name: "Successfully braise a tough cut of meat", xpReward: 40 },
          { name: "Make a souffl�� that doesn't collapse", xpReward: 50 },
          { name: "Ferment or pickle something", xpReward: 35 },
          { name: "Cook a full multi-course dinner solo", xpReward: 75 },
        ],
      },
    ],
    achievements: [
      { name: "First Steps", description: "Nailed the fundamentals", icon: "🔪", trigger: { type: "subskill_mastered", subskillName: "Kitchen Basics" } },
      { name: "Home Cook", description: "You can feed yourself properly", icon: "🍝", trigger: { type: "subskill_mastered", subskillName: "Simple Meals" } },
      { name: "Master of Flavor", description: "Salt, acid, fat, and heat are your friends", icon: "🧂", trigger: { type: "subskill_mastered", subskillName: "Sauces & Seasonings" } },
      { name: "Halfway Home", description: "Reached Journeyman — no more recipes needed", icon: "⚔️", trigger: { type: "stage_reached", stage: 3 } },
      { name: "Kitchen Legend", description: "Mastered every branch of cooking", icon: "👑", trigger: { type: "all_mastered" } },
    ],
  },
  {
    id: "russian",
    name: "Russian Language",
    description: "From the first Cyrillic letter to reading Dostoevsky in the original",
    icon: "🇷🇺",
    coverImage: DEFAULT_COVER_GRADIENT,
    coverKey: "russian",
    subskills: [
      // =====================
      // ROOT
      // =====================
      {
        name: "Cyrillic & First Steps",
        description: "The alphabet, your first 100 words, and your first full sentence",
        milestones: [
          { name: "Learn all 33 Cyrillic letters (print) — read them on sight", xpReward: 75 },
          { name: "Read 10 basic Russian words aloud correctly", xpReward: 50 },
          { name: "Learn the 100 most frequent words", xpReward: 75 },
          { name: "Learn 20 essential phrases (greetings, politeness, asking for help)", xpReward: 75 },
          { name: "Hold a 30-second self-introduction in Russian", xpReward: 100 },
          { name: "Distinguish hard and soft consonants by ear", xpReward: 75 },
          { name: "Complete a beginner course module (Pimsleur, Assimil, or equivalent)", xpReward: 125 },
        ],
      },

      // =====================
      // MECHANICS
      // =====================
      {
        name: "Pronunciation & Sounds",
        description: "Sound Russian, not like a foreigner reading Cyrillic out loud",
        prerequisiteNames: ["Cyrillic & First Steps"],
        milestones: [
          { name: "Roll a proper Russian р (trill) on demand", xpReward: 100 },
          { name: "Master vowel reduction (unstressed о → а, е → и)", xpReward: 100 },
          { name: "Pronounce all hard/soft consonant pairs accurately", xpReward: 100 },
          { name: "Correctly stress 100 common words (no more guessing)", xpReward: 75 },
          { name: "Mimic a native speaker on 10 common sentences convincingly", xpReward: 100 },
          { name: "Record a paragraph and get native approval on 3+ full sentences", xpReward: 125 },
        ],
      },
      {
        name: "Handwriting",
        description: "Cyrillic print and cursive — because Russians actually use cursive",
        prerequisiteNames: ["Cyrillic & First Steps"],
        milestones: [
          { name: "Write all 33 letters in print from memory", xpReward: 50 },
          { name: "Practice each letter 20 times in cursive", xpReward: 100 },
          { name: "Copy a full printed page into cursive", xpReward: 100 },
          { name: "Keep a handwritten journal for a week", xpReward: 100 },
          { name: "Write a handwritten letter to a friend (or language partner)", xpReward: 100 },
          { name: "Maintain a handwritten journal for a full month", xpReward: 125 },
        ],
      },
      {
        name: "Touch Typing",
        description: "ЙЦУКЕН layout mastery",
        prerequisiteNames: ["Cyrillic & First Steps"],
        milestones: [
          { name: "Learn the ЙЦУКЕН keyboard layout", xpReward: 75 },
          { name: "Type at 20 WPM in Russian without looking", xpReward: 75 },
          { name: "Reach 40 WPM", xpReward: 100 },
          { name: "Reach 60 WPM", xpReward: 125 },
          { name: "Type a 500-word essay in Russian at >40 WPM", xpReward: 100 },
          { name: "Type a 1000-word text with <5 errors", xpReward: 100 },
        ],
      },

      // =====================
      // LANGUAGE SYSTEM
      // =====================
      {
        name: "Core Vocabulary",
        description: "Build the words — one tier at a time",
        prerequisiteNames: ["Cyrillic & First Steps"],
        milestones: [
          { name: "Learn the 500 most common Russian words", xpReward: 75 },
          { name: "Complete a beginner Anki deck (or equivalent SRS)", xpReward: 100 },
          { name: "Reach 1,000 words known", xpReward: 100 },
          { name: "Reach 2,500 words known", xpReward: 125 },
          { name: "Reach 5,000 words known", xpReward: 150 },
          { name: "Reach 10,000 words known (advanced-reader territory)", xpReward: 150 },
        ],
      },
      {
        name: "Grammar Foundations",
        description: "The six cases, verb conjugation, and aspect — the real hard part",
        prerequisiteNames: ["Cyrillic & First Steps"],
        milestones: [
          { name: "Learn all 6 cases for singular nouns", xpReward: 100 },
          { name: "Learn all 6 cases for plural nouns", xpReward: 100 },
          { name: "Conjugate 20 common verbs in present, past, and future", xpReward: 100 },
          { name: "Use verb aspect (perfective/imperfective) correctly in real sentences", xpReward: 150 },
          { name: "Master pronouns and adjective-noun agreement", xpReward: 100 },
          { name: "Complete a grammar reference book (e.g. Wade, or The New Penguin Russian Course)", xpReward: 150 },
          { name: "Pass a B1-level grammar assessment", xpReward: 75 },
        ],
      },
      {
        name: "Advanced Grammar",
        description: "Verbs of motion, participles, gerunds — the stuff that separates B1 from C1",
        prerequisiteNames: ["Grammar Foundations", "Input — Beginner (A1–B1)"],
        milestones: [
          { name: "Master verbs of motion with prefixes (пойти/прийти/уйти/войти…)", xpReward: 150 },
          { name: "Use participles (active & passive) correctly in writing", xpReward: 125 },
          { name: "Use gerunds (деепричастия) naturally", xpReward: 100 },
          { name: "Handle subordinate clauses and reported speech fluently", xpReward: 125 },
          { name: "Write a 200-word text with zero case errors", xpReward: 125 },
          { name: "Pass a C1-level grammar assessment", xpReward: 150 },
        ],
      },

      // =====================
      // INPUT
      // =====================
      {
        name: "Input — Beginner (A1–B1)",
        description: "Comprehensible input from first video to conversational podcasts",
        prerequisiteNames: ["Pronunciation & Sounds"],
        milestones: [
          { name: "Watch your first 10 A1 CI videos", xpReward: 50 },
          { name: "Complete an A1 CI playlist", xpReward: 75 },
          { name: "Understand 70% of an A2 video without subtitles", xpReward: 100 },
          { name: "Follow a slow podcast episode aimed at learners", xpReward: 100 },
          { name: "Understand a Russian vlogger's casual video", xpReward: 125 },
          { name: "Follow a B1 podcast on a familiar topic", xpReward: 125 },
          { name: "Accumulate 50+ cumulative hours of Russian input", xpReward: 125 },
        ],
      },
      {
        name: "Input — Advanced (B2–C1)",
        description: "Native media at native speed — shows, news, cinema, debates",
        prerequisiteNames: ["Input — Beginner (A1–B1)"],
        milestones: [
          { name: "Watch a full episode of a Russian sitcom (e.g. Кухня)", xpReward: 100 },
          { name: "Understand a Russian news segment at normal speed", xpReward: 125 },
          { name: "Finish a native-speaker podcast episode", xpReward: 125 },
          { name: "Watch a Russian film without subtitles", xpReward: 125 },
          { name: "Understand a Russian stand-up comedy bit", xpReward: 125 },
          { name: "Follow a debate or interview on a complex topic (politics, science)", xpReward: 150 },
          { name: "Reach 300+ cumulative hours of Russian input", xpReward: 150 },
        ],
      },

      // =====================
      // READING
      // =====================
      {
        name: "Reading — Graded & Contemporary",
        description: "From comics to contemporary novels — build the reading muscle",
        prerequisiteNames: ["Core Vocabulary", "Input — Beginner (A1–B1)"],
        milestones: [
          { name: "Read your first Russian comic strip", xpReward: 50 },
          { name: "Finish an A1/A2 graded reader", xpReward: 75 },
          { name: "Read a Russian children's book (e.g. Чебурашка)", xpReward: 75 },
          { name: "Finish a B1-level short-story collection for learners", xpReward: 100 },
          { name: "Finish a contemporary Russian novel or novella (100–200 pp)", xpReward: 125 },
          { name: "Read a non-fiction book in Russian", xpReward: 125 },
          { name: "Read a full book cover-to-cover without using a dictionary", xpReward: 150 },
        ],
      },
      {
        name: "Reading — Classics",
        description: "19th-century literature in the original — the reason many start Russian",
        prerequisiteNames: ["Reading — Graded & Contemporary", "Input — Advanced (B2–C1)", "Advanced Grammar"],
        milestones: [
          { name: "Read a Chekhov short story in the original", xpReward: 100 },
          { name: "Finish A Hero of Our Time (Lermontov)", xpReward: 125 },
          { name: "Read a Turgenev or Gogol novel", xpReward: 125 },
          { name: "Read Pushkin poetry with real comprehension", xpReward: 125 },
          { name: "Finish a Dostoevsky novel", xpReward: 150 },
          { name: "Finish a Tolstoy work (War and Peace or Anna Karenina)", xpReward: 150 },
        ],
      },

      // =====================
      // OUTPUT
      // =====================
      {
        name: "Speaking & Conversation",
        description: "Actually talk to people — the whole point",
        prerequisiteNames: ["Pronunciation & Sounds", "Grammar Foundations", "Input — Beginner (A1–B1)"],
        milestones: [
          { name: "Hold a 2-minute conversation with a tutor on a familiar topic", xpReward: 75 },
          { name: "Navigate a real task in Russian (order food, ask directions)", xpReward: 100 },
          { name: "Complete 20 hours of 1-on-1 tutoring (iTalki or equivalent)", xpReward: 125 },
          { name: "Tell a 5-minute story in past tense without breaking down", xpReward: 125 },
          { name: "Hold a 30-minute conversation with a native speaker", xpReward: 125 },
          { name: "Debate or explain a complex topic spontaneously", xpReward: 150 },
        ],
      },
      {
        name: "Writing & Composition",
        description: "From first paragraph to publishable essay",
        prerequisiteNames: ["Grammar Foundations", "Core Vocabulary"],
        milestones: [
          { name: "Write a 100-word paragraph about your day", xpReward: 75 },
          { name: "Journal in Russian for 30 consecutive days", xpReward: 125 },
          { name: "Write a 500-word personal essay", xpReward: 100 },
          { name: "Write a 1000-word essay on a topic you care about", xpReward: 125 },
          { name: "Have a piece corrected by a native with <10 serious errors", xpReward: 125 },
          { name: "Publish something in Russian (blog post, email thread, social)", xpReward: 100 },
        ],
      },

      // =====================
      // CAPSTONE
      // =====================
      {
        name: "Immersion & Culture",
        description: "Live in the language — not just study it",
        prerequisiteNames: ["Input — Advanced (B2–C1)", "Reading — Classics", "Speaking & Conversation"],
        milestones: [
          { name: "Spend a week thinking (and dreaming) in Russian", xpReward: 100 },
          { name: "Watch a Russian film and discuss it with a native afterwards", xpReward: 100 },
          { name: "Read a Russian news source daily for a month", xpReward: 125 },
          { name: "Make a Russian-speaking friend and keep regular contact", xpReward: 125 },
          { name: "Travel to or live in a Russian-speaking region for 1+ week", xpReward: 150 },
          { name: "Take a C1/C2 exam (TORFL) — or self-assess honestly at C1+", xpReward: 150 },
        ],
      },
    ],
    achievements: [
      { name: "Read Cyrillic", description: "The alphabet no longer looks like symbols", icon: "🔤", trigger: { type: "subskill_mastered", subskillName: "Cyrillic & First Steps" } },
      { name: "Native Ear", description: "Your pronunciation passes the native-speaker ear test", icon: "👂", trigger: { type: "subskill_mastered", subskillName: "Pronunciation & Sounds" } },
      { name: "Case-Hardened", description: "Verbs of motion and participles no longer scare you", icon: "⚙️", trigger: { type: "subskill_mastered", subskillName: "Advanced Grammar" } },
      { name: "Fluent Listener", description: "Native media at native speed — no subtitles", icon: "🎧", trigger: { type: "subskill_mastered", subskillName: "Input — Advanced (B2–C1)" } },
      { name: "Conversationalist", description: "You hold real conversations, not just survive them", icon: "💬", trigger: { type: "subskill_mastered", subskillName: "Speaking & Conversation" } },
      { name: "Read the Classics", description: "Finished Dostoevsky and Tolstoy in the original", icon: "📖", trigger: { type: "subskill_mastered", subskillName: "Reading — Classics" } },
      { name: "Polyglot Path", description: "Reached Journeyman — real life in Russian is possible", icon: "⚔️", trigger: { type: "stage_reached", stage: 3 } },
      { name: "Native-like", description: "Mastered every branch of the language", icon: "👑", trigger: { type: "all_mastered" } },
    ],
  },
  {
    id: "piano",
  name: "Piano",
  description: "From first chords to advanced concert repertoire",
  icon: "🎹",
  coverImage: DEFAULT_COVER_GRADIENT,
    coverKey: "piano",
  subskills: [
    // =====================
    // FOUNDATIONS
    // =====================
    {
      name: "Fundamentals & Posture",
      description: "Sit right, know the keyboard, hear basic rhythm",
      milestones: [
        { name: "Sit with correct posture for a full 15-minute session", xpReward: 50 },
        { name: "Name every key on the 88-key piano without hesitation", xpReward: 75 },
        { name: "Play a chromatic scale across the whole keyboard", xpReward: 75 },
        { name: "Count and clap basic rhythms (whole, half, quarter, eighth)", xpReward: 75 },
        { name: "Play in 5-finger position with curved fingers (both hands)", xpReward: 75 },
        { name: "Record yourself playing a simple melody (e.g., Hot Cross Buns)", xpReward: 125 },
        { name: "Complete 10 practice sessions of 30+ minutes", xpReward: 125 },
      ],
    },

    // =====================
    // READING & THEORY BRANCH
    // =====================
    {
      name: "Reading Music",
      description: "Fluency with both clefs and sight-reading",
      prerequisiteNames: ["Fundamentals & Posture"],
      milestones: [
        { name: "Name all treble-clef notes without pausing", xpReward: 100 },
        { name: "Name all bass-clef notes without pausing", xpReward: 100 },
        { name: "Identify every major and minor key signature", xpReward: 100 },
        { name: "Sight-read a simple 8-bar piece at tempo", xpReward: 100 },
        { name: "Sight-read a new Grade 1 piece cleanly", xpReward: 100 },
        { name: "Sight-read a Grade 2 piece at a musical tempo", xpReward: 100 },
      ],
    },
    {
      name: "Music Theory",
      description: "Intervals, chords, and progressions",
      prerequisiteNames: ["Reading Music"],
      milestones: [
        { name: "Identify every interval (by sight and on the keyboard)", xpReward: 100 },
        { name: "Build any major or minor triad in any key", xpReward: 100 },
        { name: "Play all inversions of a triad fluently", xpReward: 100 },
        { name: "Play I–IV–V–I in all 12 major keys", xpReward: 100 },
        { name: "Play maj7, min7, and dom7 chords in all 12 keys", xpReward: 100 },
        { name: "Harmonize a simple melody using your own chord choices", xpReward: 100 },
      ],
    },
    {
      name: "Ear Training & Improvisation",
      description: "Play what you hear, make up what you don't",
      prerequisiteNames: ["Music Theory"],
      milestones: [
        { name: "Identify all intervals by ear (ascending + descending)", xpReward: 75 },
        { name: "Play 'Happy Birthday' by ear in any key", xpReward: 75 },
        { name: "Identify chord qualities by ear (maj, min, dim, aug)", xpReward: 100 },
        { name: "Improvise over a 12-bar blues for 2 minutes", xpReward: 100 },
        { name: "Play a pop song from memory after a few listens", xpReward: 125 },
        { name: "Improvise one chorus over a jazz-standard progression", xpReward: 125 },
      ],
    },

    // =====================
    // TECHNIQUE BRANCH
    // =====================
    {
      name: "Scales & Arpeggios",
      description: "The physical foundation — all 12 keys under your fingers",
      prerequisiteNames: ["Fundamentals & Posture"],
      milestones: [
        { name: "Play C major scale, 2 octaves, hands together", xpReward: 50 },
        { name: "Play all 12 major scales (one octave, hands separately)", xpReward: 100 },
        { name: "Play all 12 major scales, 2 octaves hands together, 80 BPM", xpReward: 100 },
        { name: "Play all 12 natural minor scales", xpReward: 100 },
        { name: "Play major arpeggios in all 12 keys", xpReward: 100 },
        { name: "Complete Hanon exercises 1–10 (hands together)", xpReward: 75 },
        { name: "Play all scales cleanly at 120 BPM with metronome", xpReward: 75 },
      ],
    },
    {
      name: "Advanced Technique",
      description: "Octaves, trills, speed, voicing",
      prerequisiteNames: ["Scales & Arpeggios"],
      milestones: [
        { name: "Play an octave scale hands together (2 octaves)", xpReward: 100 },
        { name: "Hold a controlled trill for 8 continuous seconds", xpReward: 100 },
        { name: "Play 16th notes at 120 BPM cleanly (repeated notes)", xpReward: 100 },
        { name: "Complete Hanon exercises 1–20", xpReward: 100 },
        { name: "Play chromatic thirds smoothly in both hands", xpReward: 100 },
        { name: "Learn a Czerny Op. 299 study to tempo", xpReward: 100 },
      ],
    },

    // =====================
    // REPERTOIRE LADDER
    // =====================
    {
      name: "Beginner Repertoire",
      description: "Your first memorized pieces",
      prerequisiteNames: ["Reading Music"],
      milestones: [
        { name: "Learn 'Twinkle Twinkle Little Star' by heart", xpReward: 75 },
        { name: "Learn 'Ode to Joy' (simple version) by heart", xpReward: 75 },
        { name: "Learn a traditional folk tune by heart", xpReward: 75 },
        { name: "Learn 3 easy contemporary songs", xpReward: 125 },
        { name: "Play a pop song with chords (any hand arrangement)", xpReward: 100 },
        { name: "Keep 5 beginner pieces memorized and performance-ready", xpReward: 150 },
      ],
    },
    {
      name: "Grade 1-2 Repertoire",
      description: "Your first 'real' classical pieces",
      prerequisiteNames: ["Beginner Repertoire"],
      milestones: [
        { name: "Learn a piece from Bach's Anna Magdalena Notebook", xpReward: 100 },
        { name: "Learn a Burgmüller etude (Op. 100)", xpReward: 100 },
        { name: "Learn a piece from Schumann's Album for the Young", xpReward: 100 },
        { name: "Memorize a complete Grade 1–2 piece", xpReward: 100 },
        { name: "Play a Grade 2 piece with proper dynamics and expression", xpReward: 100 },
        { name: "Have 3 Grade 1–2 pieces polished and memorized", xpReward: 100 },
      ],
    },
    {
      name: "Grade 3-5 Repertoire",
      description: "Bach Inventions, Mozart sonatinas, Chopin waltzes",
      prerequisiteNames: ["Grade 1-2 Repertoire", "Music Theory"],
      milestones: [
        { name: "Learn a Bach Two-Part Invention", xpReward: 125 },
        { name: "Learn one movement of a Clementi Sonatina", xpReward: 100 },
        { name: "Learn a Chopin waltz (e.g., Op. 69 No. 2)", xpReward: 125 },
        { name: "Memorize a full Grade 4–5 piece", xpReward: 100 },
        { name: "Play a Mozart sonata first movement", xpReward: 100 },
        { name: "Have 3 Grade 3–5 pieces polished and memorized", xpReward: 50 },
      ],
    },
    {
      name: "Grade 6-8 Repertoire",
      description: "Chopin Nocturnes, WTC Preludes & Fugues, Beethoven sonata movements",
      prerequisiteNames: ["Grade 3-5 Repertoire", "Advanced Technique"],
      milestones: [
        { name: "Learn a complete Chopin Nocturne", xpReward: 125 },
        { name: "Learn a Bach Prelude and Fugue from the WTC", xpReward: 125 },
        { name: "Learn a movement of a Beethoven sonata", xpReward: 125 },
        { name: "Memorize a complete Grade 7 piece", xpReward: 100 },
        { name: "Record a polished performance of a Grade 8 piece", xpReward: 75 },
        { name: "Perform a Grade 8 piece for someone in person", xpReward: 50 },
      ],
    },
    {
      name: "Advanced Repertoire",
      description: "Diploma-level: Chopin etudes, Liszt, Rachmaninoff",
      prerequisiteNames: ["Grade 6-8 Repertoire"],
      milestones: [
        { name: "Learn a Chopin etude (Op. 10 or Op. 25)", xpReward: 150 },
        { name: "Learn a Liszt piece (Consolation, Liebestraum, etc.)", xpReward: 125 },
        { name: "Learn a Rachmaninoff prelude", xpReward: 125 },
        { name: "Play a complete Beethoven sonata from memory", xpReward: 125 },
        { name: "Record a diploma-level (ARCT / LRSM) performance", xpReward: 75 },
      ],
    },

    // =====================
    // PERFORMANCE
    // =====================
    {
      name: "Performance",
      description: "Playing for others — the real test",
      prerequisiteNames: ["Grade 3-5 Repertoire"],
      milestones: [
        { name: "Play a full piece for a friend or family member", xpReward: 75 },
        { name: "Record and share a performance online", xpReward: 100 },
        { name: "Keep 3 pieces memorized simultaneously without forgetting", xpReward: 100 },
        { name: "Perform at an open mic or recital", xpReward: 150 },
        { name: "Maintain a 30-minute recital-ready repertoire", xpReward: 125 },
        { name: "Perform a 10-minute program from memory in public", xpReward: 50 },
      ],
    },
  ],
  achievements: [
    { name: "First Pieces", description: "Built a memorized beginner repertoire", icon: "🎶", trigger: { type: "subskill_mastered", subskillName: "Beginner Repertoire" } },
    { name: "Sight Reader", description: "Sheet music reads itself now", icon: "📜", trigger: { type: "subskill_mastered", subskillName: "Reading Music" } },
    { name: "Scale Master", description: "All 12 keys under your fingers", icon: "🎼", trigger: { type: "subskill_mastered", subskillName: "Scales & Arpeggios" } },
    { name: "Concert Ready", description: "Chopin Nocturnes and Bach Preludes polished", icon: "🎹", trigger: { type: "subskill_mastered", subskillName: "Grade 6-8 Repertoire" } },
    { name: "Stage Performer", description: "Played a recital from memory", icon: "🎭", trigger: { type: "subskill_mastered", subskillName: "Performance" } },
    { name: "Virtuoso", description: "Mastered every branch of piano", icon: "👑", trigger: { type: "all_mastered" } },
  ],
  },
  {
    id: "guitar",
    name: "Guitar",
    description: "From first chords to full songs, solos, and jamming",
    icon: "🎸",
    coverImage: DEFAULT_COVER_GRADIENT,
    coverKey: "guitar",
    subskills: [
      // =====================
      // FOUNDATIONS
      // =====================
      {
        name: "Fundamentals & Posture",
        description: "Tuning, holding, and getting clean notes out",
        milestones: [
          { name: "Tune the guitar by ear and with a tuner", xpReward: 75 },
          { name: "Hold the guitar correctly sitting and standing", xpReward: 50 },
          { name: "Name every string (EADGBE) and locate them", xpReward: 50 },
          { name: "Do 10 minutes of finger exercises daily for a week", xpReward: 100 },
          { name: "Play single notes cleanly (no buzzing) on all 6 strings", xpReward: 100 },
          { name: "Move cleanly between notes on adjacent strings", xpReward: 100 },
          { name: "Complete 10 practice sessions of 30+ minutes", xpReward: 125 },
        ],
      },

      // =====================
      // CHORDS BRANCH
      // =====================
      {
        name: "Open Chords",
        description: "The first 8 essential chord shapes",
        prerequisiteNames: ["Fundamentals & Posture"],
        milestones: [
          { name: "Play G, C, and D cleanly", xpReward: 75 },
          { name: "Play Em and Am cleanly", xpReward: 50 },
          { name: "Play E, A, and Dm cleanly", xpReward: 75 },
          { name: "Switch between G-C-D smoothly at 60 BPM", xpReward: 100 },
          { name: "Switch between any two open chords in under 2 seconds", xpReward: 100 },
          { name: "Play an F chord (mini or full) cleanly", xpReward: 100 },
          { name: "Memorize all 8 essential open-chord shapes", xpReward: 100 },
        ],
      },
      {
        name: "Barre Chords",
        description: "E-shape, A-shape, and moving chord shapes",
        prerequisiteNames: ["Open Chords", "Rhythm & Strumming"],
        milestones: [
          { name: "Play an F barre chord (E-shape) cleanly", xpReward: 100 },
          { name: "Play major barre chords along the 6th string", xpReward: 100 },
          { name: "Play minor barre chords (E-shape)", xpReward: 100 },
          { name: "Play A-shape barre chords (major and minor)", xpReward: 100 },
          { name: "Switch between open and barre chords in a song", xpReward: 100 },
          { name: "Play a complete song using only barre chords", xpReward: 100 },
        ],
      },

      // =====================
      // RHYTHM + FINGERPICKING
      // =====================
      {
        name: "Rhythm & Strumming",
        description: "Strumming patterns, timing, feel",
        prerequisiteNames: ["Fundamentals & Posture"],
        milestones: [
          { name: "Strum downstrokes in 4/4 time to a metronome", xpReward: 75 },
          { name: "Play a consistent down-up strumming pattern", xpReward: 75 },
          { name: "Learn 3 common strumming patterns by name", xpReward: 100 },
          { name: "Strum with clean palm muting", xpReward: 100 },
          { name: "Strum in 3/4 and 6/8 time", xpReward: 75 },
          { name: "Strum along with an original recording at tempo", xpReward: 100 },
          { name: "Play syncopated 16th-note strumming patterns", xpReward: 75 },
        ],
      },
      {
        name: "Fingerpicking",
        description: "PIMA patterns, Travis picking, arpeggios",
        prerequisiteNames: ["Open Chords"],
        milestones: [
          { name: "Play alternating bass on an open chord", xpReward: 75 },
          { name: "Play a clean PIMA arpeggiated pattern", xpReward: 100 },
          { name: "Play Travis picking on a G chord", xpReward: 100 },
          { name: "Fingerpick through a full chord progression", xpReward: 100 },
          { name: "Learn a fingerpicking arrangement (e.g., 'Dust in the Wind')", xpReward: 125 },
          { name: "Play a simple classical guitar piece", xpReward: 100 },
        ],
      },

      // =====================
      // FRETBOARD + THEORY
      // =====================
      {
        name: "Fretboard Knowledge",
        description: "Know where every note lives",
        prerequisiteNames: ["Fundamentals & Posture"],
        milestones: [
          { name: "Name all notes on the 6th string (low E)", xpReward: 75 },
          { name: "Name all notes on the 5th string (A)", xpReward: 75 },
          { name: "Name all natural notes across all 6 strings", xpReward: 125 },
          { name: "Identify octave patterns across the fretboard", xpReward: 100 },
          { name: "Find any note anywhere in under 3 seconds", xpReward: 125 },
          { name: "Map the CAGED system across the fretboard", xpReward: 100 },
        ],
      },
      {
        name: "Scales & Theory",
        description: "Pentatonic, modes, and chord tones",
        prerequisiteNames: ["Fretboard Knowledge"],
        milestones: [
          { name: "Play the minor pentatonic scale in position 1", xpReward: 75 },
          { name: "Play minor pentatonic in all 5 CAGED positions", xpReward: 125 },
          { name: "Play the major scale in one position cleanly", xpReward: 75 },
          { name: "Learn the 7 modes (Ionian, Dorian, Phrygian, etc.)", xpReward: 125 },
          { name: "Play blues scale in 5 positions", xpReward: 100 },
          { name: "Target chord tones while soloing over a progression", xpReward: 100 },
        ],
      },
      {
        name: "Lead Technique",
        description: "Bends, vibrato, slides, and licks",
        prerequisiteNames: ["Scales & Theory"],
        milestones: [
          { name: "Bend a string to pitch (full and half bend)", xpReward: 100 },
          { name: "Execute clean vibrato on a held note", xpReward: 100 },
          { name: "Play hammer-ons and pull-offs cleanly", xpReward: 100 },
          { name: "Slide between notes smoothly", xpReward: 75 },
          { name: "Learn a classic guitar lick (e.g., B.B. King box)", xpReward: 100 },
          { name: "Play a full guitar solo note-for-note", xpReward: 125 },
        ],
      },

      // =====================
      // REPERTOIRE LADDER
      // =====================
      {
        name: "Beginner Songs",
        description: "Your first 'I know a song!' moments",
        prerequisiteNames: ["Open Chords", "Rhythm & Strumming"],
        milestones: [
          { name: "Learn 'Wonderwall' (or any 4-chord song)", xpReward: 75 },
          { name: "Learn 'Horse With No Name' (or any 2-chord song)", xpReward: 75 },
          { name: "Learn a full song using open chords from memory", xpReward: 100 },
          { name: "Play along with the original recording at tempo", xpReward: 100 },
          { name: "Learn 3 complete songs by heart", xpReward: 100 },
          { name: "Build a set of 5 songs you can play on demand", xpReward: 150 },
        ],
      },
      {
        name: "Intermediate Songs",
        description: "Barre chords, riffs, and dynamics",
        prerequisiteNames: ["Beginner Songs", "Barre Chords"],
        milestones: [
          { name: "Learn a song with barre chords throughout", xpReward: 100 },
          { name: "Learn a song with a recognizable intro riff", xpReward: 125 },
          { name: "Learn a song with a fingerpicking section", xpReward: 100 },
          { name: "Play a full song with palm muting", xpReward: 100 },
          { name: "Memorize a complete intermediate song", xpReward: 100 },
          { name: "Have 3 intermediate songs polished and ready", xpReward: 75 },
        ],
      },
      {
        name: "Advanced Songs & Solos",
        description: "Full arrangements with lead and rhythm",
        prerequisiteNames: ["Intermediate Songs", "Lead Technique"],
        milestones: [
          { name: "Learn a classic solo (e.g., 'Comfortably Numb', 'Stairway')", xpReward: 150 },
          { name: "Learn a fingerstyle arrangement (Tommy Emmanuel-style)", xpReward: 125 },
          { name: "Play a song with both rhythm and lead parts", xpReward: 125 },
          { name: "Nail a technically demanding piece at tempo", xpReward: 100 },
          { name: "Record a polished performance of an advanced piece", xpReward: 100 },
        ],
      },

      // =====================
      // PERFORMANCE
      // =====================
      {
        name: "Performance & Jamming",
        description: "Playing with other people and for other people",
        prerequisiteNames: ["Intermediate Songs"],
        milestones: [
          { name: "Play a song for a friend or family member", xpReward: 75 },
          { name: "Jam over a blues progression with a backing track", xpReward: 100 },
          { name: "Record and share a performance online", xpReward: 100 },
          { name: "Jam with another musician in person", xpReward: 125 },
          { name: "Perform at an open mic", xpReward: 125 },
          { name: "Maintain a 30-minute live-ready set", xpReward: 75 },
        ],
      },
    ],
    achievements: [
      { name: "Got the Basics", description: "Open chords are second nature", icon: "🎸", trigger: { type: "subskill_mastered", subskillName: "Open Chords" } },
      { name: "Lead Guitarist", description: "Bends, vibrato, and licks — all yours", icon: "🎵", trigger: { type: "subskill_mastered", subskillName: "Lead Technique" } },
      { name: "Song Catalog", description: "You have a repertoire", icon: "📻", trigger: { type: "subskill_mastered", subskillName: "Intermediate Songs" } },
      { name: "Shred Master", description: "Full songs with both rhythm and lead parts", icon: "🔥", trigger: { type: "subskill_mastered", subskillName: "Advanced Songs & Solos" } },
      { name: "On Stage", description: "Performed live for real people", icon: "🎤", trigger: { type: "subskill_mastered", subskillName: "Performance & Jamming" } },
      { name: "Guitar Hero", description: "Mastered every branch of guitar", icon: "👑", trigger: { type: "all_mastered" } },
    ],
  },
  {
    id: "survival",
    name: "Survival Skills",
    description: "Be the person who stays calm and capable when things go wrong",
    icon: "🏕️",
    coverImage: DEFAULT_COVER_GRADIENT,
    coverKey: "survival",
    subskills: [
      // =====================
      // ROOT: PRIORITIES & MINDSET
      // =====================
      {
        name: "Priorities & Mindset",
        description: "The framework that decides what to do first",
        milestones: [
          { name: "Memorize the Rule of 3s (air, shelter, water, food)", xpReward: 75 },
          { name: "Take a gear + fitness + mental readiness inventory", xpReward: 75 },
          { name: "Practice STOP (Stop, Think, Observe, Plan) in a scenario", xpReward: 100 },
          { name: "Spend 24 hours solo in nature with minimal gear", xpReward: 150 },
          { name: "Study 3 real survival case studies and extract lessons", xpReward: 100 },
          { name: "Keep a survival skills logbook for 1 month", xpReward: 100 },
        ],
      },

      // =====================
      // CORE SKILLS (parallel tracks from Mindset)
      // =====================
      {
        name: "Shelter Building",
        description: "Stay warm and dry with what you have",
        prerequisiteNames: ["Priorities & Mindset"],
        milestones: [
          { name: "Build a debris hut that sheds rain", xpReward: 100 },
          { name: "Build a lean-to from natural materials", xpReward: 100 },
          { name: "Pitch a tarp 3 different ways (A-frame, lean-to, diamond)", xpReward: 100 },
          { name: "Sleep a full night in a self-built shelter", xpReward: 150 },
          { name: "Build (or plan-test) a snow shelter (quinzee or trench)", xpReward: 75 },
          { name: "Build a ventilated emergency shelter in under 30 minutes", xpReward: 75 },
        ],
      },
      {
        name: "Water Procurement",
        description: "Find, filter, and purify water in the field",
        prerequisiteNames: ["Priorities & Mindset"],
        milestones: [
          { name: "Identify 3 safe water sources in the wild", xpReward: 75 },
          { name: "Boil water correctly to purify (1+ min rolling boil)", xpReward: 75 },
          { name: "Use a pump or gravity water filter end-to-end", xpReward: 75 },
          { name: "Purify water with chemical tablets", xpReward: 75 },
          { name: "Build a solar still or transpiration bag", xpReward: 100 },
          { name: "Find water in a dry environment using terrain cues", xpReward: 100 },
          { name: "Carry and manage 2L of water over a full-day hike", xpReward: 100 },
        ],
      },
      {
        name: "Fire Craft",
        description: "Reliable fire in any conditions",
        prerequisiteNames: ["Priorities & Mindset"],
        milestones: [
          { name: "Build a fire with matches in wet conditions", xpReward: 75 },
          { name: "Build a fire 3 times with a ferro rod", xpReward: 100 },
          { name: "Make tinder from natural materials (birch bark, fatwood, cattail)", xpReward: 100 },
          { name: "Build a one-match fire successfully", xpReward: 75 },
          { name: "Start a fire with friction (bow-drill or hand-drill)", xpReward: 150 },
          { name: "Maintain a fire for 6+ hours with active wood management", xpReward: 100 },
        ],
      },
      {
        name: "Navigation",
        description: "Always know where you are and where you're going",
        prerequisiteNames: ["Priorities & Mindset"],
        milestones: [
          { name: "Read a topographic map fluently", xpReward: 75 },
          { name: "Take and follow a compass bearing over 500m", xpReward: 100 },
          { name: "Triangulate your position on a map", xpReward: 100 },
          { name: "Navigate a 5km off-trail route with map and compass only", xpReward: 125 },
          { name: "Find north using the sun (stick method) and stars (Polaris)", xpReward: 100 },
          { name: "Navigate 2km at night successfully", xpReward: 100 },
        ],
      },
      {
        name: "Knots & Cordage",
        description: "Rope skills and making cord from plants",
        prerequisiteNames: ["Priorities & Mindset"],
        milestones: [
          { name: "Tie 5 essential knots by heart (bowline, clove hitch, taut-line, figure-8, sheet bend)", xpReward: 100 },
          { name: "Tie 10 knots from memory, each in under 10 seconds", xpReward: 100 },
          { name: "Make cordage from plant fibers (nettle, yucca, or bark)", xpReward: 125 },
          { name: "Do 3 useful lashings (square, diagonal, shear)", xpReward: 100 },
          { name: "Complete a practical rope project (gear line, shelter frame)", xpReward: 75 },
          { name: "Tie your key knots reliably in the dark", xpReward: 100 },
        ],
      },
      {
        name: "Wilderness First Aid",
        description: "Treat injuries and illness without a hospital nearby",
        prerequisiteNames: ["Priorities & Mindset"],
        milestones: [
          { name: "Complete a basic first aid course (official or equivalent)", xpReward: 150 },
          { name: "Assemble a personal first aid kit you carry on every trip", xpReward: 75 },
          { name: "Treat simulated wounds (bleeding, bandaging, splinting)", xpReward: 100 },
          { name: "Recognize and respond to hypothermia and heatstroke", xpReward: 100 },
          { name: "Manage a blister, sprain, and minor burn in the field", xpReward: 75 },
          { name: "Complete a Wilderness First Aid or WFR course", xpReward: 100 },
        ],
      },
      {
        name: "Bushcraft & Tools",
        description: "Knife work, sharpening, and making tools from wood",
        prerequisiteNames: ["Priorities & Mindset"],
        milestones: [
          { name: "Safely use and maintain a bushcraft knife", xpReward: 75 },
          { name: "Sharpen a knife to shaving-sharp edge", xpReward: 100 },
          { name: "Carve 3 useful tools from wood (spoon, pot hook, tent peg)", xpReward: 100 },
          { name: "Use an axe or saw safely to process firewood", xpReward: 100 },
          { name: "Make a functional primitive tool (digging stick, walking staff)", xpReward: 75 },
          { name: "Field-repair a piece of your gear", xpReward: 75 },
          { name: "Complete a full bushcraft craft project (wooden mug, fire kit)", xpReward: 75 },
        ],
      },

      // =====================
      // INTERMEDIATE / INTEGRATED
      // =====================
      {
        name: "Signaling & Rescue",
        description: "Get found when something goes wrong",
        prerequisiteNames: ["Priorities & Mindset", "Wilderness First Aid"],
        milestones: [
          { name: "Carry a whistle and know the SOS pattern", xpReward: 50 },
          { name: "Use a signal mirror to hit a distant target", xpReward: 75 },
          { name: "Build a smoke or signal fire visible from the air", xpReward: 100 },
          { name: "Lay ground-to-air signals with natural materials", xpReward: 100 },
          { name: "Use a PLB or satellite messenger correctly", xpReward: 100 },
          { name: "File a detailed trip plan before 3 separate trips", xpReward: 75 },
          { name: "Run a self-rescue decision-making scenario", xpReward: 100 },
        ],
      },
      {
        name: "Foraging & Plant ID",
        description: "Safely identify and harvest wild food",
        prerequisiteNames: ["Navigation", "Bushcraft & Tools"],
        milestones: [
          { name: "Identify 10 edible wild plants in your region", xpReward: 125 },
          { name: "Identify 5 dangerous lookalikes and poisonous plants", xpReward: 100 },
          { name: "Understand the Universal Edibility Test (and its limits)", xpReward: 75 },
          { name: "Harvest and eat a full foraged meal (plants only)", xpReward: 150 },
          { name: "Identify 5 medicinal plants and their uses", xpReward: 75 },
          { name: "Build a field guide of 30+ entries for your local area", xpReward: 75 },
        ],
      },
      {
        name: "Hunting, Fishing & Trapping",
        description: "Wild-source protein responsibly",
        prerequisiteNames: ["Knots & Cordage", "Foraging & Plant ID"],
        milestones: [
          { name: "Catch a fish with a handline or rod in the wild", xpReward: 100 },
          { name: "Set a legal small-game snare or trap", xpReward: 100 },
          { name: "Clean and prepare a fish from catch to pan", xpReward: 100 },
          { name: "Hunt or trap small game legally (or complete a course)", xpReward: 125 },
          { name: "Learn 3 primitive fishing or trapping techniques", xpReward: 75 },
          { name: "Cook a meal you sourced yourself (any wild protein)", xpReward: 100 },
        ],
      },

      // =====================
      // CAPSTONE
      // =====================
      {
        name: "Wilderness Travel",
        description: "Multi-day trips combining every skill",
        prerequisiteNames: [
          "Shelter Building",
          "Water Procurement",
          "Fire Craft",
          "Navigation",
        ],
        milestones: [
          { name: "Plan and complete a day hike with map and compass", xpReward: 75 },
          { name: "Complete an overnight backpacking trip", xpReward: 100 },
          { name: "Complete a 3-day solo wilderness trip", xpReward: 150 },
          { name: "Navigate a full off-trail route over 10km", xpReward: 100 },
          { name: "Cross varied terrain safely (water, rocks, snow)", xpReward: 75 },
          { name: "Manage gear and logistics over a 5+ day trip", xpReward: 100 },
        ],
      },
    ],
    achievements: [
      { name: "Firestarter", description: "Reliable fire in any conditions", icon: "🔥", trigger: { type: "subskill_mastered", subskillName: "Fire Craft" } },
      { name: "Pathfinder", description: "You'll never be truly lost", icon: "🧭", trigger: { type: "subskill_mastered", subskillName: "Navigation" } },
      { name: "Field Medic", description: "You can handle injuries in the backcountry", icon: "🩹", trigger: { type: "subskill_mastered", subskillName: "Wilderness First Aid" } },
      { name: "Self-Reliant", description: "Completed multi-day wilderness trips", icon: "🏕️", trigger: { type: "subskill_mastered", subskillName: "Wilderness Travel" } },
      { name: "Halfway Wild", description: "Journeyman of the outdoors", icon: "⚔️", trigger: { type: "stage_reached", stage: 3 } },
      { name: "Mountain Man", description: "Mastered every branch of survival", icon: "👑", trigger: { type: "all_mastered" } },
    ],
  },
  {
    id: "writing",
    name: "Writing",
    description: "From daily practice to publishing finished work that reaches readers",
    icon: "✍️",
    coverImage: DEFAULT_COVER_GRADIENT,
    coverKey: "writing",
    subskills: [
      // =====================
      // ROOT: HABIT
      // =====================
      {
        name: "Writing Habit",
        description: "Put words down consistently — nothing happens without this",
        milestones: [
          { name: "Write 500 words in a single sitting", xpReward: 50 },
          { name: "Write every day for 7 days in a row", xpReward: 75 },
          { name: "Keep a writing journal for 30 days", xpReward: 100 },
          { name: "Write 10,000 words total (any form)", xpReward: 100 },
          { name: "Write every day for 30 days straight", xpReward: 125 },
          { name: "Establish a consistent writing time and place (4-week streak)", xpReward: 75 },
          { name: "Reach 100,000 words written across any projects", xpReward: 75 },
        ],
      },

      // =====================
      // CRAFT BRANCH
      // =====================
      {
        name: "Craft Fundamentals",
        description: "Sentence-level control, style, and technique",
        prerequisiteNames: ["Writing Habit"],
        milestones: [
          { name: "Read a craft book end-to-end (e.g., 'On Writing', 'Bird by Bird')", xpReward: 100 },
          { name: "Rewrite a paragraph 5 different ways to study rhythm", xpReward: 75 },
          { name: "Eliminate adverbs and filler words from a finished piece", xpReward: 75 },
          { name: "Practice showing vs. telling — rewrite 10 passages", xpReward: 100 },
          { name: "Learn and apply active voice deliberately across a piece", xpReward: 75 },
          { name: "Study and imitate 3 writers' styles in short exercises", xpReward: 100 },
          { name: "Complete a grammar or style course", xpReward: 75 },
        ],
      },
      {
        name: "Reading Like a Writer",
        description: "Read books as a craftsperson, not a consumer",
        prerequisiteNames: ["Writing Habit"],
        milestones: [
          { name: "Read 5 books in your target genre with craft notes", xpReward: 100 },
          { name: "Annotate a full book for craft choices", xpReward: 100 },
          { name: "Analyze a great essay paragraph-by-paragraph", xpReward: 75 },
          { name: "Read 20 craft essays or interviews with writers", xpReward: 75 },
          { name: "Keep a commonplace book of favorite passages", xpReward: 100 },
          { name: "Read 25 books across genres and forms in a year", xpReward: 150 },
        ],
      },
      {
        name: "Voice & Style",
        description: "Develop writing that sounds unmistakably like you",
        prerequisiteNames: ["Craft Fundamentals", "Reading Like a Writer"],
        milestones: [
          { name: "Write a personal essay that sounds like no one else", xpReward: 125 },
          { name: "Write the same piece in 3 deliberately different styles", xpReward: 100 },
          { name: "Identify the 5 writers who most shaped your voice", xpReward: 75 },
          { name: "Write 10 pieces without imitating any model", xpReward: 100 },
          { name: "Get feedback that specifically identifies your voice", xpReward: 100 },
          { name: "Maintain a recognizable voice across 10 published pieces", xpReward: 100 },
        ],
      },
      {
        name: "Editing & Revision",
        description: "Where good writing actually happens",
        prerequisiteNames: ["Craft Fundamentals"],
        milestones: [
          { name: "Revise a draft through at least 3 full passes", xpReward: 100 },
          { name: "Cut 20% from a finished piece without losing meaning", xpReward: 100 },
          { name: "Read your work aloud to catch awkwardness", xpReward: 75 },
          { name: "Apply structured revision (big picture → line edits)", xpReward: 100 },
          { name: "Edit someone else's draft substantively", xpReward: 100 },
          { name: "Complete a self-editing checklist on 5 separate pieces", xpReward: 125 },
        ],
      },

      // =====================
      // SHORT-FORM OUTPUTS
      // =====================
      {
        name: "Short Essays & Blog Posts",
        description: "Finish and polish essays in the 500–2000 word range",
        prerequisiteNames: ["Craft Fundamentals"],
        milestones: [
          { name: "Write a finished 500-word essay", xpReward: 75 },
          { name: "Write a 1500-word opinion piece", xpReward: 100 },
          { name: "Write 5 short essays on different topics", xpReward: 100 },
          { name: "Write a personal essay that moves someone to reply", xpReward: 100 },
          { name: "Write a thinkpiece that provokes genuine disagreement", xpReward: 100 },
          { name: "Complete 20 finished short essays", xpReward: 125 },
        ],
      },
      {
        name: "Short Stories",
        description: "Finish stories people want to finish reading",
        prerequisiteNames: ["Voice & Style"],
        milestones: [
          { name: "Finish a 1000-word flash-fiction story", xpReward: 75 },
          { name: "Write a 3000–5000 word short story", xpReward: 100 },
          { name: "Write stories in 3 different genres", xpReward: 125 },
          { name: "Write a story with a plot twist that lands on readers", xpReward: 100 },
          { name: "Develop a character readers remember after reading", xpReward: 100 },
          { name: "Complete 10 finished short stories", xpReward: 100 },
        ],
      },

      // =====================
      // LONG-FORM
      // =====================
      {
        name: "Long-Form Nonfiction",
        description: "Researched essays, features, journalism",
        prerequisiteNames: ["Short Essays & Blog Posts", "Editing & Revision"],
        milestones: [
          { name: "Write a 3000+ word essay with a clear argument", xpReward: 100 },
          { name: "Conduct original interviews for a piece", xpReward: 100 },
          { name: "Write a researched feature (5000+ words)", xpReward: 150 },
          { name: "Fact-check every claim in a non-trivial piece", xpReward: 100 },
          { name: "Pitch a publication with a long-form idea", xpReward: 75 },
          { name: "Take a long-form piece from research through to publication", xpReward: 75 },
        ],
      },
      {
        name: "Novella / Novel",
        description: "The big one — sustained fiction over 15k+ words",
        prerequisiteNames: ["Short Stories", "Editing & Revision"],
        milestones: [
          { name: "Outline a full novel (or write a strong synopsis)", xpReward: 75 },
          { name: "Write a 15,000-word novella draft", xpReward: 100 },
          { name: "Complete a first draft of 50,000+ words (NaNoWriMo length)", xpReward: 150 },
          { name: "Revise a novel-length manuscript fully", xpReward: 150 },
          { name: "Get a manuscript beta-read and address the feedback", xpReward: 75 },
          { name: "Finish a polished novel-length work ready for submission", xpReward: 50 },
        ],
      },

      // =====================
      // PUBLISHING + AUDIENCE
      // =====================
      {
        name: "Publishing Online",
        description: "Get finished writing into the world",
        prerequisiteNames: ["Editing & Revision"],
        milestones: [
          { name: "Publish your first piece online (blog, Medium, Substack)", xpReward: 100 },
          { name: "Build and own a writer's website or landing page", xpReward: 75 },
          { name: "Publish 10 pieces online", xpReward: 100 },
          { name: "Publish on 3 different platforms", xpReward: 75 },
          { name: "Have a piece shared or discussed by strangers", xpReward: 100 },
          { name: "Reach 1,000 total readers across your published work", xpReward: 75 },
          { name: "Maintain a consistent publishing cadence for 3 months", xpReward: 75 },
        ],
      },
      {
        name: "Newsletter & Audience",
        description: "Build a direct relationship with readers",
        prerequisiteNames: ["Publishing Online"],
        milestones: [
          { name: "Start a newsletter (Substack, Beehiiv, Ghost, etc.)", xpReward: 75 },
          { name: "Send 10 newsletter issues on schedule", xpReward: 100 },
          { name: "Reach 100 subscribers", xpReward: 100 },
          { name: "Reach 1,000 subscribers", xpReward: 150 },
          { name: "Sustain an open rate above 40%", xpReward: 75 },
          { name: "Keep a consistent delivery schedule for 3+ months", xpReward: 100 },
        ],
      },
      {
        name: "Writing Community & Feedback",
        description: "Writers you trade critique with, publications you submit to",
        prerequisiteNames: ["Publishing Online"],
        milestones: [
          { name: "Join a writing group or critique circle", xpReward: 75 },
          { name: "Give substantive feedback to 10 other writers", xpReward: 100 },
          { name: "Receive and incorporate feedback on 5 pieces", xpReward: 100 },
          { name: "Submit a piece to a literary magazine or publication", xpReward: 100 },
          { name: "Receive your first acceptance (paid or unpaid)", xpReward: 150 },
          { name: "Collaborate on a writing project with another writer", xpReward: 75 },
        ],
      },
    ],
    achievements: [
      { name: "Daily Writer", description: "Writing is a non-negotiable part of your day", icon: "✍️", trigger: { type: "subskill_mastered", subskillName: "Writing Habit" } },
      { name: "Own Voice", description: "Your writing sounds like no one else's", icon: "🎙️", trigger: { type: "subskill_mastered", subskillName: "Voice & Style" } },
      { name: "Short Story Author", description: "Finished 10 stories people want to read", icon: "📝", trigger: { type: "subskill_mastered", subskillName: "Short Stories" } },
      { name: "Novelist", description: "Completed a novel-length work", icon: "📚", trigger: { type: "subskill_mastered", subskillName: "Novella / Novel" } },
      { name: "Published", description: "Your work is out in the world", icon: "🗞️", trigger: { type: "subskill_mastered", subskillName: "Publishing Online" } },
      { name: "Man of Letters", description: "Mastered every branch of writing", icon: "👑", trigger: { type: "all_mastered" } },
    ],
  },
  {
    id: "bjj",
    name: "Brazilian Jiu-Jitsu",
    description: "From your first shrimp to receiving a black belt",
    icon: "🥋",
    coverImage: DEFAULT_COVER_GRADIENT,
    coverKey: "bjj",
    subskills: [
      // =====================
      // FOUNDATIONS (ROOT)
      // =====================
      {
        name: "Foundations & Movement",
        description: "Body mechanics, first 100 classes, the positional language",
        milestones: [
          { name: "Do 20 shrimps each direction consecutively", xpReward: 50 },
          { name: "Execute forward and backward rolls over each shoulder", xpReward: 75 },
          { name: "Perform a technical stand-up cleanly", xpReward: 75 },
          { name: "Break-fall safely from standing", xpReward: 75 },
          { name: "Name and demonstrate all 10 major positions (mount, side, back, guard, half, turtle, north-south, knee-on-belly, 50/50, standing)", xpReward: 100 },
          { name: "Explain the position hierarchy and why it matters", xpReward: 75 },
          { name: "Attend 10 fundamentals classes", xpReward: 100 },
          { name: "Attend 50 classes", xpReward: 125 },
          { name: "Attend 100 classes", xpReward: 150 },
        ],
      },

      // =====================
      // SURVIVAL + TOP FUNDAMENTALS
      // =====================
      {
        name: "Escapes & Defense",
        description: "Get out of everywhere bad — the core skill that keeps you on the mats",
        prerequisiteNames: ["Foundations & Movement"],
        milestones: [
          { name: "Execute the upa (bridge-and-roll) mount escape 10 times live", xpReward: 75 },
          { name: "Execute the elbow-knee mount escape 10 times live", xpReward: 75 },
          { name: "Recover guard from side control 10 times live", xpReward: 100 },
          { name: "Escape back control (handfight, peel grips, get hooks out)", xpReward: 100 },
          { name: "Escape turtle to guard or standing", xpReward: 100 },
          { name: "Survive 5 minutes under a much heavier training partner", xpReward: 100 },
          { name: "Survive a round with a purple+ belt without being submitted", xpReward: 125 },
        ],
      },
      {
        name: "Takedowns",
        description: "Get the fight to the ground on your terms",
        prerequisiteNames: ["Foundations & Movement"],
        milestones: [
          { name: "Execute a clean single-leg takedown", xpReward: 100 },
          { name: "Execute a clean double-leg takedown", xpReward: 100 },
          { name: "Execute a judo throw (o-goshi, osoto-gari, or similar)", xpReward: 100 },
          { name: "Pull guard safely with a grip break and immediate control", xpReward: 75 },
          { name: "Defend 3 takedown attempts with sprawl or scramble", xpReward: 100 },
          { name: "Score a takedown on a resisting partner 5 separate times", xpReward: 125 },
          { name: "Attend or run a dedicated takedown / wrestling session", xpReward: 100 },
        ],
      },

      // =====================
      // GUARD FAMILY
      // =====================
      {
        name: "Closed Guard",
        description: "Posture breaks, basic attacks, and sweeps",
        prerequisiteNames: ["Foundations & Movement"],
        milestones: [
          { name: "Break posture from closed guard against resistance", xpReward: 75 },
          { name: "Finish a cross collar choke from closed guard", xpReward: 100 },
          { name: "Finish an armbar from closed guard", xpReward: 100 },
          { name: "Finish a triangle choke from closed guard", xpReward: 100 },
          { name: "Sweep with scissor, hip bump, AND flower sweep", xpReward: 125 },
          { name: "Chain 3 attacks together fluidly in closed guard", xpReward: 100 },
          { name: "Hold closed guard against a resisting partner for 2 minutes", xpReward: 75 },
        ],
      },
      {
        name: "Half Guard",
        description: "The most-played position in modern jiu-jitsu",
        prerequisiteNames: ["Closed Guard"],
        milestones: [
          { name: "Establish a proper knee-shield half guard", xpReward: 75 },
          { name: "Sweep with the underhook from half guard", xpReward: 100 },
          { name: "Sweep with the knee-shield (dogfight or kneetap)", xpReward: 100 },
          { name: "Recover full guard from half guard", xpReward: 100 },
          { name: "Play top half-guard and pass against resistance", xpReward: 125 },
          { name: "Use half guard as your home for a full round", xpReward: 100 },
        ],
      },
      {
        name: "Open Guards",
        description: "Butterfly, DLR, spider, lasso — the modern open-guard toolkit",
        prerequisiteNames: ["Closed Guard"],
        milestones: [
          { name: "Play butterfly guard and land a butterfly sweep", xpReward: 100 },
          { name: "Play De La Riva guard with grips and control", xpReward: 100 },
          { name: "Play spider guard with proper grip hierarchy", xpReward: 100 },
          { name: "Play lasso guard", xpReward: 100 },
          { name: "Play reverse De La Riva", xpReward: 100 },
          { name: "Chain fluidly between 2 open guards", xpReward: 125 },
          { name: "Sweep a resisting partner 5 times from an open guard", xpReward: 125 },
        ],
      },
      {
        name: "Modern Guards",
        description: "X-guard, deep half, K-guard — the upper-belt open game",
        prerequisiteNames: ["Open Guards"],
        milestones: [
          { name: "Enter and sweep from X-guard", xpReward: 125 },
          { name: "Enter and sweep from deep half", xpReward: 125 },
          { name: "Enter K-guard / shin-on-shin and hit a sweep", xpReward: 125 },
          { name: "Play single-leg X (SLX) and hit a sweep", xpReward: 125 },
          { name: "Enter inverted / inverted-half guard", xpReward: 100 },
          { name: "Chain 3 modern guards in one live round", xpReward: 150 },
        ],
      },
      {
        name: "Leg Lock System",
        description: "Ashi garami, heel hooks, the modern bottom game",
        prerequisiteNames: ["Open Guards"],
        milestones: [
          { name: "Enter inside-sankaku and outside-ashi with control", xpReward: 100 },
          { name: "Apply a clean straight ankle lock from ashi", xpReward: 100 },
          { name: "Apply a safe heel hook in controlled rolling (where rules allow)", xpReward: 150 },
          { name: "Apply a toe hold from ashi or 50/50", xpReward: 100 },
          { name: "Apply a knee bar", xpReward: 100 },
          { name: "Escape ashi garami and heel-hook attempts cleanly", xpReward: 125 },
          { name: "Attend a leglock seminar or complete a leglock instructional", xpReward: 125 },
        ],
      },

      // =====================
      // TOP GAME
      // =====================
      {
        name: "Guard Passing",
        description: "Systematic guard passing — standing, kneeling, pressure",
        prerequisiteNames: ["Foundations & Movement", "Escapes & Defense"],
        milestones: [
          { name: "Perform a toreando (bullfighter) pass against resistance", xpReward: 100 },
          { name: "Perform a knee-slice pass against resistance", xpReward: 100 },
          { name: "Perform a leg drag pass", xpReward: 100 },
          { name: "Perform a stack pass against closed guard", xpReward: 100 },
          { name: "Pass open guards (DLR, spider, lasso) against grips", xpReward: 125 },
          { name: "Use a long-step / backstep to counter guard retention", xpReward: 125 },
          { name: "Pass a resisting partner 10 separate times in live rolling", xpReward: 150 },
        ],
      },
      {
        name: "Pressure & Pinning",
        description: "Keep them where you put them — side, mount, back",
        prerequisiteNames: ["Guard Passing"],
        milestones: [
          { name: "Hold side control for 3 minutes against a resisting peer", xpReward: 100 },
          { name: "Hold mount for 2 minutes against a resisting peer", xpReward: 100 },
          { name: "Hold back control (seatbelt + hooks) for 2 minutes", xpReward: 100 },
          { name: "Establish and maintain knee-on-belly", xpReward: 100 },
          { name: "Use the mount hierarchy (S-mount, technical mount) to isolate an arm", xpReward: 125 },
          { name: "Transition between 4+ top positions without losing control", xpReward: 125 },
          { name: "Pin a heavier training partner for a full round", xpReward: 125 },
        ],
      },

      // =====================
      // FINISHES
      // =====================
      {
        name: "Foundational Submissions",
        description: "The staples — chokes and joint locks you finish live",
        prerequisiteNames: ["Closed Guard"],
        milestones: [
          { name: "Finish a rear naked choke from back control", xpReward: 100 },
          { name: "Finish an armbar from mount, guard, or back", xpReward: 100 },
          { name: "Finish a triangle choke in live rolling", xpReward: 100 },
          { name: "Finish a kimura from a live position", xpReward: 100 },
          { name: "Finish an americana from side control or mount", xpReward: 75 },
          { name: "Finish a guillotine from any position", xpReward: 100 },
          { name: "Finish an arm triangle", xpReward: 100 },
          { name: "Tap 5 different partners with 5 different submissions", xpReward: 125 },
        ],
      },
      {
        name: "Advanced Submissions",
        description: "Back attacks, modern chains, low-percentage finishes",
        prerequisiteNames: ["Foundational Submissions"],
        milestones: [
          { name: "Finish a bow-and-arrow choke from back", xpReward: 100 },
          { name: "Finish a d'arce or anaconda choke", xpReward: 125 },
          { name: "Finish an omoplata (as both submission AND sweep)", xpReward: 100 },
          { name: "Finish a loop choke", xpReward: 100 },
          { name: "Finish a wristlock in a live round", xpReward: 100 },
          { name: "Finish a north-south choke", xpReward: 125 },
          { name: "Finish a baratoplata or tarikoplata", xpReward: 150 },
          { name: "Chain A → B → C → D submission attempts to a finish", xpReward: 125 },
        ],
      },

      // =====================
      // THEORY / RESEARCH
      // =====================
      {
        name: "Study & Instructionals",
        description: "Deep-dive the best instructionals — Danaher, Ryan, Garcia, Cornelius",
        prerequisiteNames: ["Foundations & Movement"],
        milestones: [
          { name: "Watch Danaher's Go Further Faster: Closed Guard (complete)", xpReward: 150 },
          { name: "Watch Danaher's Go Further Faster: Pins, Escapes & Turtle", xpReward: 150 },
          { name: "Watch Danaher's Go Further Faster: Triangles or Arm Bars", xpReward: 150 },
          { name: "Watch Danaher's Enter the System: Leglocks", xpReward: 150 },
          { name: "Watch a Gordon Ryan instructional end-to-end (passing, back system, etc.)", xpReward: 125 },
          { name: "Watch a Marcelo Garcia highlight + an MGinAction instructional", xpReward: 125 },
          { name: "Watch Keenan Cornelius's Lapel Encyclopedia (or another lapel series)", xpReward: 125 },
          { name: "Read 'Jiu-Jitsu University' by Saulo Ribeiro", xpReward: 125 },
          { name: "Read another classic (Mastering Jujitsu, Guerrilla Jiu-Jitsu, etc.)", xpReward: 100 },
          { name: "Complete 3 instructionals end-to-end with notes", xpReward: 150 },
        ],
      },
      {
        name: "Match Film & Analysis",
        description: "Study how the best actually do it, including your own rolls",
        prerequisiteNames: ["Study & Instructionals"],
        milestones: [
          { name: "Watch and break down 10 IBJJF World finals (gi and no-gi)", xpReward: 125 },
          { name: "Study 5 matches each from 3 different champions (e.g. Roger Gracie, Marcelo Garcia, Buchecha, Leandro Lo, Mikey Musumeci)", xpReward: 150 },
          { name: "Analyze 3 ADCC finals in detail (entries, scrambles, finishes)", xpReward: 125 },
          { name: "Film one of your own rolls and review it critically", xpReward: 100 },
          { name: "Film one of your own competition matches and review it", xpReward: 100 },
          { name: "Keep a training journal for 30 straight days", xpReward: 125 },
          { name: "Keep a training journal for 6 months", xpReward: 150 },
        ],
      },
      {
        name: "Personal Game Development",
        description: "Build your own A-game, document it, defend it",
        prerequisiteNames: ["Match Film & Analysis", "Open Guards", "Foundational Submissions"],
        milestones: [
          { name: "Pick and document your A-guard (top preference)", xpReward: 100 },
          { name: "Pick and document your A-passing strategy", xpReward: 100 },
          { name: "Pick and document your primary submission system", xpReward: 100 },
          { name: "Write your full A-game as a decision tree", xpReward: 125 },
          { name: "Get 5 finishes using only your documented A-game", xpReward: 125 },
          { name: "Lose a match using your A-game, then adapt and re-compete", xpReward: 125 },
          { name: "Teach your A-game to a training partner", xpReward: 125 },
        ],
      },

      // =====================
      // LIVE APPLICATION
      // =====================
      {
        name: "Rolling & Live Training",
        description: "Mat time is the teacher — accumulate it",
        prerequisiteNames: ["Escapes & Defense", "Closed Guard"],
        milestones: [
          { name: "Complete 50 rolls (5+ minute rounds)", xpReward: 100 },
          { name: "Complete 200 rolls", xpReward: 125 },
          { name: "Complete 500 rolls", xpReward: 150 },
          { name: "Complete 1,000 rolls", xpReward: 200 },
          { name: "Roll with every belt color above yours", xpReward: 100 },
          { name: "Do positional sparring from every bad position", xpReward: 100 },
          { name: "Roll a full class using only ONE technique", xpReward: 75 },
          { name: "Only-defense round against a higher belt — survive 5 minutes", xpReward: 100 },
          { name: "Log 500 mat hours", xpReward: 150 },
          { name: "Log 1,500 mat hours", xpReward: 200 },
        ],
      },
      {
        name: "Competition",
        description: "Real stakes, strangers, clock ticking",
        prerequisiteNames: ["Rolling & Live Training", "Foundational Submissions"],
        milestones: [
          { name: "Enter your first BJJ tournament", xpReward: 150 },
          { name: "Win a single match at any competition", xpReward: 125 },
          { name: "Compete 3 times in one year", xpReward: 125 },
          { name: "Earn a medal (bronze, silver, or gold)", xpReward: 150 },
          { name: "Compete in both gi AND no-gi", xpReward: 125 },
          { name: "Win a division at a serious tournament (IBJJF open, AJP, etc.)", xpReward: 200 },
          { name: "Recover mentally from a loss and win your next competition", xpReward: 150 },
          { name: "Compete 10 times total", xpReward: 200 },
        ],
      },

      // =====================
      // OFF-THE-MAT
      // =====================
      {
        name: "Strength, Conditioning & Recovery",
        description: "Train your body to survive the next 10 years on the mat",
        prerequisiteNames: ["Foundations & Movement"],
        milestones: [
          { name: "Run a dedicated strength program for 8 weeks", xpReward: 100 },
          { name: "Build grip strength (dead hangs 60s, farmer carries)", xpReward: 100 },
          { name: "Maintain a mobility routine 3×/week for 4 weeks", xpReward: 100 },
          { name: "Learn 3 injury-prevention drills (neck, shoulder, knee)", xpReward: 75 },
          { name: "Sleep 7+ hours nightly for 30 consecutive training days", xpReward: 100 },
          { name: "Manage weight for a competition class honestly", xpReward: 100 },
          { name: "Recover fully from an injury and return to the mat stronger", xpReward: 125 },
        ],
      },

      // =====================
      // TEACHING
      // =====================
      {
        name: "Teaching & Legacy",
        description: "Passing it on — the mark of advanced belts",
        prerequisiteNames: ["Blue Belt"],
        milestones: [
          { name: "Demonstrate a technique for the class", xpReward: 75 },
          { name: "Help a brand-new beginner for a full class", xpReward: 75 },
          { name: "Lead a warm-up", xpReward: 75 },
          { name: "Co-teach a full class", xpReward: 125 },
          { name: "Teach your first private lesson", xpReward: 150 },
          { name: "Write or film a technique explainer for others", xpReward: 125 },
          { name: "Help a training partner earn their next belt", xpReward: 200 },
        ],
      },

      // =====================
      // BELT PROGRESSIONS (spine)
      // =====================
      {
        name: "Blue Belt",
        description: "The first real belt — basics locked in, real survival on the mat",
        prerequisiteNames: ["Escapes & Defense", "Closed Guard", "Foundational Submissions"],
        milestones: [
          { name: "Train consistently (3+ sessions/week) for 6 straight months", xpReward: 150 },
          { name: "Know every core position cold and transition between them live", xpReward: 125 },
          { name: "Submit a resisting partner with 3 different submissions in live rolling", xpReward: 150 },
          { name: "Pass a guard in live rolling 10 separate times", xpReward: 125 },
          { name: "Escape mount, side control, AND back control live", xpReward: 125 },
          { name: "Roll respectfully with brand-new white belts and upper belts alike", xpReward: 75 },
          { name: "Receive your blue belt", xpReward: 300 },
        ],
      },
      {
        name: "Purple Belt",
        description: "The true intermediate — a game of your own is emerging",
        prerequisiteNames: [
          "Blue Belt",
          "Open Guards",
          "Guard Passing",
          "Rolling & Live Training",
          "Competition",
        ],
        milestones: [
          { name: "Log 500+ mat hours", xpReward: 150 },
          { name: "Compete in at least 3 tournaments as a blue belt", xpReward: 125 },
          { name: "Develop a signature guard that's distinctly yours", xpReward: 150 },
          { name: "Submit blue belts reliably with multiple systems", xpReward: 150 },
          { name: "Roll actively with purple belts and hold your own", xpReward: 125 },
          { name: "Help at least one white belt earn their blue", xpReward: 125 },
          { name: "Receive your purple belt", xpReward: 400 },
        ],
      },
      {
        name: "Brown Belt",
        description: "Specialization + responsibility — you're part of the upper belts",
        prerequisiteNames: [
          "Purple Belt",
          "Advanced Submissions",
          "Pressure & Pinning",
          "Modern Guards",
          "Personal Game Development",
          "Teaching & Legacy",
        ],
        milestones: [
          { name: "Log 1,500+ mat hours", xpReward: 175 },
          { name: "Have both a complete A-guard AND a complete A-passing system", xpReward: 150 },
          { name: "Teach a technique regularly in class", xpReward: 150 },
          { name: "Compete at an advanced / open class level", xpReward: 150 },
          { name: "Help multiple lower belts earn their next stripe or belt", xpReward: 150 },
          { name: "Handle purple belts consistently in rolling", xpReward: 150 },
          { name: "Receive your brown belt", xpReward: 500 },
        ],
      },
      {
        name: "Black Belt",
        description: "A decade-plus of the art — mastery, teaching, and legacy",
        prerequisiteNames: [
          "Brown Belt",
          "Leg Lock System",
          "Match Film & Analysis",
          "Strength, Conditioning & Recovery",
        ],
        milestones: [
          { name: "Log 3,000+ mat hours", xpReward: 200 },
          { name: "Coach or assist-coach consistently for 1+ year", xpReward: 175 },
          { name: "Develop or refine a signature technique or variation of your own", xpReward: 175 },
          { name: "Compete at brown-belt level in a major tournament", xpReward: 150 },
          { name: "Mentor a student from white to purple belt (or longer)", xpReward: 200 },
          { name: "Give a paid private lesson", xpReward: 150 },
          { name: "Attend a week-long camp or train abroad", xpReward: 150 },
          { name: "Receive your black belt", xpReward: 600 },
        ],
      },
    ],
    achievements: [
      { name: "First Tap", description: "Finished 5 partners with 5 different submissions", icon: "✋", trigger: { type: "subskill_mastered", subskillName: "Foundational Submissions" } },
      { name: "Blue Belt", description: "The first real belt", icon: "🔵", trigger: { type: "subskill_mastered", subskillName: "Blue Belt" } },
      { name: "The Passer", description: "Nobody stays in guard against you", icon: "⚡", trigger: { type: "subskill_mastered", subskillName: "Guard Passing" } },
      { name: "Guard Master", description: "Modern guards are home", icon: "🛡️", trigger: { type: "subskill_mastered", subskillName: "Modern Guards" } },
      { name: "Leg Hunter", description: "Ashi is a position, not a surprise", icon: "🦵", trigger: { type: "subskill_mastered", subskillName: "Leg Lock System" } },
      { name: "The Student", description: "Deep-studied the masters' match film", icon: "🎓", trigger: { type: "subskill_mastered", subskillName: "Match Film & Analysis" } },
      { name: "Purple Belt", description: "A game of your own", icon: "🟣", trigger: { type: "subskill_mastered", subskillName: "Purple Belt" } },
      { name: "Competitor", description: "Medaled at a serious tournament", icon: "🏆", trigger: { type: "subskill_mastered", subskillName: "Competition" } },
      { name: "The Professor", description: "Teaching is now part of your practice", icon: "🧑‍🏫", trigger: { type: "subskill_mastered", subskillName: "Teaching & Legacy" } },
      { name: "Brown Belt", description: "Part of the upper belts", icon: "🟤", trigger: { type: "subskill_mastered", subskillName: "Brown Belt" } },
      { name: "Journeyman of the Art", description: "Reached Journeyman stage", icon: "⚔️", trigger: { type: "stage_reached", stage: 3 } },
      { name: "Black Belt", description: "A decade-plus on the mat", icon: "⚫", trigger: { type: "subskill_mastered", subskillName: "Black Belt" } },
      { name: "Grandmaster", description: "Mastered every branch of the art", icon: "👑", trigger: { type: "all_mastered" } },
    ],
  },
  {
    id: "fitness",
    name: "Fitness",
    description: "From first push-up to peak physical condition",
    icon: "💪",
    coverImage: "linear-gradient(135deg, #0a0a0a 0%, #450a0a 45%, #dc2626 100%)",
    subskills: [
      // =====================
      // ROOT
      // =====================
      {
        name: "Foundations & Form",
        description: "Consistency, basic movement, and tracking",
        milestones: [
          { name: "Learn proper breathing and bracing", xpReward: 75 },
          { name: "Hold a perfect plank for 60 seconds", xpReward: 75 },
          { name: "Complete a full-body dynamic warm-up routine", xpReward: 75 },
          { name: "Establish a 3+ sessions/week schedule for 4 weeks", xpReward: 100 },
          { name: "Track your workouts for 30 consecutive days", xpReward: 100 },
          { name: "Complete a baseline fitness assessment (measurements, tests)", xpReward: 75 },
          { name: "Complete 20 workouts of any kind", xpReward: 100 },
        ],
      },

      // =====================
      // KNOWLEDGE BRANCH
      // =====================
      {
        name: "Theoretical Foundations",
        description: "The science behind training — know why, not just how",
        prerequisiteNames: ["Foundations & Form"],
        milestones: [
          { name: "Read a foundational book (e.g. Starting Strength, Science of Strength Training)", xpReward: 125 },
          { name: "Learn the difference between strength, hypertrophy, and endurance adaptations", xpReward: 75 },
          { name: "Understand progressive overload and how to program it", xpReward: 100 },
          { name: "Learn how to read a training program and modify it", xpReward: 75 },
          { name: "Know the major muscle groups and their functions", xpReward: 100 },
          { name: "Understand biomechanics of the main compound lifts", xpReward: 125 },
        ],
      },
      {
        name: "Nutrition & Recovery",
        description: "Training only works if you fuel and recover",
        prerequisiteNames: ["Theoretical Foundations"],
        milestones: [
          { name: "Track your food for 2 weeks to know your baseline", xpReward: 100 },
          { name: "Hit a specific macro split for 4 weeks", xpReward: 100 },
          { name: "Sleep 7-9 hours consistently for 30 days", xpReward: 100 },
          { name: "Prep meals in advance for 4 weeks straight", xpReward: 75 },
          { name: "Complete a successful body recomposition (measurable)", xpReward: 150 },
          { name: "Integrate recovery practices (foam rolling, mobility, deloads)", xpReward: 75 },
        ],
      },

      // =====================
      // STRENGTH BRANCH
      // =====================
      {
        name: "Strength Training Fundamentals",
        description: "The barbell big four plus accessories",
        prerequisiteNames: ["Foundations & Form"],
        milestones: [
          { name: "Squat with good form (bodyweight, then loaded)", xpReward: 100 },
          { name: "Deadlift with good form", xpReward: 100 },
          { name: "Bench press with good form", xpReward: 100 },
          { name: "Overhead press with good form", xpReward: 75 },
          { name: "Bent-over or Pendlay row with good form", xpReward: 75 },
          { name: "Complete a 5x5 program for 8 weeks", xpReward: 100 },
          { name: "Hit beginner strength standards (BW squat, 1.5x BW DL, 0.75x BW bench)", xpReward: 50 },
        ],
      },
      {
        name: "Calisthenics & Bodyweight",
        description: "Master your own body — anywhere, anytime",
        prerequisiteNames: ["Foundations & Form"],
        milestones: [
          { name: "Do 20 consecutive push-ups", xpReward: 75 },
          { name: "Do 10 strict pull-ups", xpReward: 100 },
          { name: "Do 20 bodyweight squats without rest", xpReward: 50 },
          { name: "Do 20 dips on parallel bars", xpReward: 75 },
          { name: "Pistol squats — 5 clean reps each leg", xpReward: 100 },
          { name: "Hold a wall-supported handstand for 30 seconds", xpReward: 100 },
          { name: "Achieve a muscle-up OR L-sit hold", xpReward: 100 },
        ],
      },
      {
        name: "Advanced Lifting",
        description: "Intermediate-to-advanced strength, programming, competition",
        prerequisiteNames: ["Strength Training Fundamentals", "Theoretical Foundations"],
        milestones: [
          { name: "Hit intermediate standards (1x BW OHP, 1.5x BW bench, 2x BW DL, 1.5x BW squat)", xpReward: 150 },
          { name: "Run a periodized program (5/3/1, Texas Method, Sheiko, etc.)", xpReward: 100 },
          { name: "Video-record and analyze your heavy lifts", xpReward: 75 },
          { name: "Train Olympic lifts OR advanced powerlifting accessories", xpReward: 100 },
          { name: "Compete in a local powerlifting or weightlifting meet", xpReward: 100 },
          { name: "Hit an advanced strength standard in any lift (2x BW bench, 3x BW DL, etc.)", xpReward: 75 },
        ],
      },

      // =====================
      // CARDIO BRANCH
      // =====================
      {
        name: "Cardio Base",
        description: "Aerobic capacity and heart health",
        prerequisiteNames: ["Foundations & Form"],
        milestones: [
          { name: "Build up to 30 minutes of continuous easy aerobic exercise", xpReward: 100 },
          { name: "Know your max heart rate and training zones", xpReward: 75 },
          { name: "Complete 12 cardio sessions in 4 weeks", xpReward: 100 },
          { name: "Maintain a resting heart rate under 70 bpm", xpReward: 100 },
          { name: "Hold zone 2 heart rate for 45 minutes", xpReward: 125 },
          { name: "Complete a VO2 max test or estimate", xpReward: 100 },
        ],
      },
      {
        name: "Running",
        description: "From couch-to-5K to longer events",
        prerequisiteNames: ["Cardio Base"],
        milestones: [
          { name: "Run 1 km without stopping", xpReward: 50 },
          { name: "Run 5 km continuously", xpReward: 100 },
          { name: "Run 10 km continuously", xpReward: 100 },
          { name: "Run a sub-30 minute 5K", xpReward: 100 },
          { name: "Complete a half marathon (21.1 km)", xpReward: 125 },
          { name: "Run a full marathon OR sub-25 min 5K", xpReward: 100 },
          { name: "Integrate proper running form cues consistently", xpReward: 25 },
        ],
      },
      {
        name: "Swimming",
        description: "All four strokes and real distance",
        prerequisiteNames: ["Cardio Base"],
        milestones: [
          { name: "Swim 100m freestyle continuously", xpReward: 100 },
          { name: "Swim 500m continuously (any stroke)", xpReward: 100 },
          { name: "Learn bilateral breathing in freestyle", xpReward: 75 },
          { name: "Swim all 4 strokes proficiently (free, back, breast, butterfly)", xpReward: 100 },
          { name: "Swim 1500m continuously", xpReward: 125 },
          { name: "Swim a timed mile in under 40 minutes", xpReward: 100 },
        ],
      },
      {
        name: "Conditioning",
        description: "HIIT, metcon, and multi-modal work",
        prerequisiteNames: ["Calisthenics & Bodyweight", "Cardio Base"],
        milestones: [
          { name: "Complete 10 HIIT sessions", xpReward: 100 },
          { name: "Do a CrossFit benchmark WOD (Cindy, Fran, Murph)", xpReward: 125 },
          { name: "Do 100 burpees for time (under 10 minutes)", xpReward: 100 },
          { name: "Row 2km in under 8:00 minutes", xpReward: 100 },
          { name: "Complete a multi-modal endurance event (duathlon, obstacle race)", xpReward: 75 },
          { name: "Maintain a 3x/week conditioning schedule for 8 weeks", xpReward: 100 },
        ],
      },

      // =====================
      // MOBILITY
      // =====================
      {
        name: "Mobility & Flexibility",
        description: "Move well, age well",
        prerequisiteNames: ["Foundations & Form"],
        milestones: [
          { name: "Establish a daily 10-min mobility routine for 30 days", xpReward: 100 },
          { name: "Touch your toes (hamstring flexibility)", xpReward: 75 },
          { name: "Hit full squat depth with proper ankle + hip mobility", xpReward: 100 },
          { name: "Hold a bridge or wheel pose", xpReward: 100 },
          { name: "Achieve a front split OR full shoulder flexibility", xpReward: 125 },
          { name: "Complete 10 yoga sessions", xpReward: 100 },
        ],
      },

      // =====================
      // CAPSTONE
      // =====================
      {
        name: "Physical Goals & Performance",
        description: "Set ambitious goals and hit them",
        prerequisiteNames: ["Advanced Lifting", "Nutrition & Recovery"],
        milestones: [
          { name: "Set a specific, measurable 6-month physique or performance goal", xpReward: 75 },
          { name: "Track and hit a 3-month intermediate goal", xpReward: 100 },
          { name: "Complete a physique transformation with before/after photos", xpReward: 100 },
          { name: "Complete a major endurance event OR strength PR", xpReward: 125 },
          { name: "Achieve a visible aesthetic goal (abs, physique comp shape)", xpReward: 100 },
          { name: "Maintain peak condition for 3+ months", xpReward: 100 },
        ],
      },
    ],
    achievements: [
      { name: "Iron Paradise", description: "Mastered the barbell fundamentals", icon: "🏋️", trigger: { type: "subskill_mastered", subskillName: "Strength Training Fundamentals" } },
      { name: "Marathon Runner", description: "Completed 42.2km or a sub-25 5K", icon: "🏃", trigger: { type: "subskill_mastered", subskillName: "Running" } },
      { name: "Fish", description: "All four strokes, real distance, no stopping", icon: "🏊", trigger: { type: "subskill_mastered", subskillName: "Swimming" } },
      { name: "Bendy", description: "Your body does what you ask it to", icon: "🧘", trigger: { type: "subskill_mastered", subskillName: "Mobility & Flexibility" } },
      { name: "Powerlifter", description: "Hit advanced strength standards", icon: "🦾", trigger: { type: "subskill_mastered", subskillName: "Advanced Lifting" } },
      { name: "The Machine", description: "Reached Journeyman — strong, fit, consistent", icon: "⚔️", trigger: { type: "stage_reached", stage: 3 } },
      { name: "Peak Human", description: "Mastered every branch of fitness", icon: "👑", trigger: { type: "all_mastered" } },
    ],
  },
  {
    id: "meditation",
    name: "Meditation",
    description: "From first mindful breath to steady presence in daily life",
    icon: "🧘",
    coverImage: DEFAULT_COVER_GRADIENT,
    coverKey: "meditation",
    subskills: [
      // =====================
      // ROOT
      // =====================
      {
        name: "Foundations & First Breath",
        description: "Establish the habit and learn what practice actually is",
        milestones: [
          { name: "Sit for 5 minutes without distraction", xpReward: 50 },
          { name: "Complete 7 consecutive days of meditation", xpReward: 75 },
          { name: "Read one foundational book (e.g. Mindfulness in Plain English, The Mind Illuminated)", xpReward: 125 },
          { name: "Try 3 different styles (breath, body scan, guided)", xpReward: 75 },
          { name: "Establish a dedicated meditation space or cushion setup", xpReward: 50 },
          { name: "Log 20 total sessions of any length", xpReward: 100 },
        ],
      },

      // =====================
      // ATTENTION BRANCH
      // =====================
      {
        name: "Breath & Body Awareness",
        description: "Anchor attention in the body and breath",
        prerequisiteNames: ["Foundations & First Breath"],
        milestones: [
          { name: "Hold attention on the breath for 10 minutes without losing it", xpReward: 100 },
          { name: "Complete a 30-minute body scan from head to toe", xpReward: 100 },
          { name: "Notice subtle sensations (warmth, tingling, pulse) during sitting", xpReward: 75 },
          { name: "Sit through physical discomfort without shifting for 20 minutes", xpReward: 100 },
          { name: "Complete 30 sessions of 15+ minutes", xpReward: 125 },
        ],
      },
      {
        name: "Concentration (Samatha)",
        description: "Build stable, unified attention",
        prerequisiteNames: ["Breath & Body Awareness"],
        milestones: [
          { name: "Count 10 breaths without losing count, 10 times in a row", xpReward: 100 },
          { name: "Sit for 45 minutes continuously", xpReward: 125 },
          { name: "Experience access concentration (piti/sukha signs)", xpReward: 150 },
          { name: "Hold single-pointed attention for 20 minutes", xpReward: 150 },
          { name: "Complete 50 concentration-focused sessions", xpReward: 125 },
        ],
      },

      // =====================
      // WISDOM BRANCH
      // =====================
      {
        name: "Mindfulness of Thoughts",
        description: "Observe the mind without being pulled by it",
        prerequisiteNames: ["Breath & Body Awareness"],
        milestones: [
          { name: "Notice a thought arising and label it without following it", xpReward: 75 },
          { name: "Sit with a difficult emotion for a full session", xpReward: 125 },
          { name: "Recognize and name 5 recurring mental patterns", xpReward: 100 },
          { name: "Do a full session in open awareness (no anchor)", xpReward: 100 },
          { name: "Read a book on cognitive patterns (e.g. Why Buddhism is True)", xpReward: 100 },
        ],
      },
      {
        name: "Insight (Vipassana)",
        description: "See the three characteristics directly",
        prerequisiteNames: ["Concentration (Samatha)", "Mindfulness of Thoughts"],
        milestones: [
          { name: "Practice noting (hearing, thinking, feeling) for a full session", xpReward: 100 },
          { name: "Observe impermanence, unsatisfactoriness, and not-self directly", xpReward: 150 },
          { name: "Sit a full vipassana session of 60+ minutes", xpReward: 125 },
          { name: "Read a deep practice text (e.g. Mastering the Core Teachings of the Buddha)", xpReward: 150 },
          { name: "Have a clear cessation or insight experience (documented)", xpReward: 150 },
        ],
      },

      // =====================
      // HEART BRANCH
      // =====================
      {
        name: "Loving-Kindness (Metta)",
        description: "Train warmth and goodwill as a practice",
        prerequisiteNames: ["Foundations & First Breath"],
        milestones: [
          { name: "Complete a full metta session (self → friend → neutral → difficult → all)", xpReward: 100 },
          { name: "Do metta daily for 14 days", xpReward: 100 },
          { name: "Send metta to someone you're in conflict with", xpReward: 125 },
          { name: "Feel genuine warmth arise during practice", xpReward: 75 },
          { name: "Complete 20 metta sessions", xpReward: 100 },
        ],
      },

      // =====================
      // APPLICATION BRANCH
      // =====================
      {
        name: "Daily Life Integration",
        description: "Bring practice off the cushion and into the day",
        prerequisiteNames: ["Mindfulness of Thoughts"],
        milestones: [
          { name: "Practice mindful eating for a full meal", xpReward: 50 },
          { name: "Complete 7 days of mindful transitions (walking, doorways)", xpReward: 75 },
          { name: "Respond mindfully to a stressful situation in real time", xpReward: 125 },
          { name: "Do a digital-free half-day with present-moment awareness", xpReward: 75 },
          { name: "Maintain a 30-day unbroken daily practice streak", xpReward: 150 },
        ],
      },
      {
        name: "Retreat & Deepening",
        description: "Step away from daily life and go deep",
        prerequisiteNames: ["Concentration (Samatha)"],
        milestones: [
          { name: "Complete a self-led day-long silent retreat at home", xpReward: 100 },
          { name: "Attend a 3-day group retreat", xpReward: 125 },
          { name: "Complete a 7-day silent retreat (vipassana, zen, or similar)", xpReward: 150 },
          { name: "Complete a 10-day Goenka or equivalent", xpReward: 150 },
          { name: "Establish a twice-a-year retreat rhythm", xpReward: 100 },
        ],
      },

      // =====================
      // CAPSTONE
      // =====================
      {
        name: "Teaching & Sharing",
        description: "Pass it on — practice deepens when you transmit it",
        prerequisiteNames: ["Insight (Vipassana)", "Daily Life Integration"],
        milestones: [
          { name: "Guide a friend through their first meditation", xpReward: 75 },
          { name: "Lead a group sit (5+ people)", xpReward: 100 },
          { name: "Write publicly about your practice (blog, journal shared)", xpReward: 75 },
          { name: "Mentor someone through their first 30-day streak", xpReward: 125 },
          { name: "Teach a short mindfulness workshop or course", xpReward: 150 },
        ],
      },
    ],
    achievements: [
      { name: "First Sit", description: "Established a real practice", icon: "🌱", trigger: { type: "subskill_mastered", subskillName: "Foundations & First Breath" } },
      { name: "Still Mind", description: "Reached access concentration", icon: "🕯️", trigger: { type: "subskill_mastered", subskillName: "Concentration (Samatha)" } },
      { name: "Open Heart", description: "Mastered loving-kindness", icon: "💗", trigger: { type: "subskill_mastered", subskillName: "Loving-Kindness (Metta)" } },
      { name: "Clear Seeing", description: "Direct insight into the three characteristics", icon: "👁️", trigger: { type: "subskill_mastered", subskillName: "Insight (Vipassana)" } },
      { name: "Off the Cushion", description: "Practice lives in daily life", icon: "🌿", trigger: { type: "subskill_mastered", subskillName: "Daily Life Integration" } },
      { name: "Journeyman Meditator", description: "Reached Journeyman — steady, present, skillful", icon: "⚔️", trigger: { type: "stage_reached", stage: 3 } },
      { name: "Awakened", description: "Mastered every branch of practice", icon: "👑", trigger: { type: "all_mastered" } },
    ],
  },
  {
    id: "math",
    name: "Mathematics",
    description: "From arithmetic fluency to proving theorems that hold up",
    icon: "🧮",
    coverImage: DEFAULT_COVER_GRADIENT,
    coverKey: "math",
    subskills: [
      // =====================
      // ROOT
      // =====================
      {
        name: "Foundations & Numeracy",
        description: "Arithmetic fluency, notation, and problem-solving habits",
        milestones: [
          { name: "Do 2-digit × 2-digit multiplication mentally in under 10 seconds", xpReward: 75 },
          { name: "Estimate order of magnitude for real-world quantities (Fermi estimates)", xpReward: 50 },
          { name: "Convert fluently between fractions, decimals, and percentages", xpReward: 50 },
          { name: "Read and write standard notation (sets, sigma, function, quantifiers)", xpReward: 75 },
          { name: "Explain why long division and the standard algorithms actually work", xpReward: 75 },
          { name: "Read a foundational book (e.g. How to Solve It by Pólya)", xpReward: 125 },
          { name: "Solve 50 warm-up problems from a problem book", xpReward: 100 },
        ],
      },

      // =====================
      // CORE BRANCHES
      // =====================
      {
        name: "Algebra & Functions",
        description: "The language of math — symbols, structure, transformation",
        prerequisiteNames: ["Foundations & Numeracy"],
        milestones: [
          { name: "Solve linear systems by elimination and substitution", xpReward: 75 },
          { name: "Factor and complete the square for any quadratic", xpReward: 75 },
          { name: "Work fluently with exponents, logarithms, and radicals", xpReward: 100 },
          { name: "Understand functions: domain, range, composition, inverses", xpReward: 100 },
          { name: "Graph polynomials, rationals, exponentials, logs by hand", xpReward: 100 },
          { name: "Solve 100 word problems by translating them into equations", xpReward: 100 },
          { name: "Complete a full algebra text (e.g. Gelfand's Algebra)", xpReward: 150 },
        ],
      },
      {
        name: "Geometry & Trigonometry",
        description: "Space, shape, angle, measure",
        prerequisiteNames: ["Foundations & Numeracy"],
        milestones: [
          { name: "Prove the Pythagorean theorem two different ways", xpReward: 100 },
          { name: "Derive the sine and cosine angle-addition identities", xpReward: 100 },
          { name: "Solve 30 ruler-and-compass construction problems", xpReward: 100 },
          { name: "Understand radian measure and derive the unit circle from scratch", xpReward: 75 },
          { name: "Prove a theorem from Euclid's Elements (Book I)", xpReward: 125 },
          { name: "Read Euclid's Elements Book I cover to cover", xpReward: 125 },
        ],
      },

      // =====================
      // RIGOR
      // =====================
      {
        name: "Proofs & Mathematical Thinking",
        description: "Move from computing to proving",
        prerequisiteNames: ["Algebra & Functions"],
        milestones: [
          { name: "Write a valid proof by induction", xpReward: 75 },
          { name: "Write a valid proof by contradiction", xpReward: 75 },
          { name: "Prove √2 is irrational from scratch", xpReward: 100 },
          { name: "Master logical connectives, quantifiers, and negation rules", xpReward: 100 },
          { name: "Complete a proof-writing book (e.g. Velleman's How to Prove It)", xpReward: 150 },
          { name: "Solve 30 problems at AMC/AIME competition level", xpReward: 125 },
          { name: "Write a solution clean enough to be graded by a strict mentor", xpReward: 100 },
        ],
      },

      // =====================
      // CONTINUOUS BRANCH
      // =====================
      {
        name: "Calculus",
        description: "Change, accumulation, and limits — single and multi-variable",
        prerequisiteNames: ["Algebra & Functions", "Geometry & Trigonometry"],
        milestones: [
          { name: "Compute limits from the epsilon-delta definition", xpReward: 100 },
          { name: "Differentiate fluently using product, quotient, and chain rules", xpReward: 75 },
          { name: "Integrate by parts, substitution, and partial fractions", xpReward: 100 },
          { name: "Solve an optimization problem with full reasoning", xpReward: 75 },
          { name: "Derive Taylor series for common functions", xpReward: 100 },
          { name: "Work through a single-variable calc text (Spivak or Stewart)", xpReward: 150 },
          { name: "Extend to multivariable: gradients, Lagrange multipliers, div/curl", xpReward: 150 },
        ],
      },

      // =====================
      // STRUCTURE BRANCH
      // =====================
      {
        name: "Linear Algebra",
        description: "Structure in many dimensions",
        prerequisiteNames: ["Algebra & Functions"],
        milestones: [
          { name: "Compute determinants and matrix inverses by hand", xpReward: 75 },
          { name: "Diagonalize a 3×3 matrix and interpret eigenvectors geometrically", xpReward: 100 },
          { name: "Prove the rank-nullity theorem", xpReward: 100 },
          { name: "Understand vector spaces as a structure, not just Rⁿ", xpReward: 100 },
          { name: "Apply LA to a real problem (least-squares, PCA, graphics, or ML)", xpReward: 125 },
          { name: "Work through Axler's Linear Algebra Done Right", xpReward: 150 },
        ],
      },

      // =====================
      // UNCERTAINTY BRANCH
      // =====================
      {
        name: "Probability & Statistics",
        description: "Reason carefully under uncertainty",
        prerequisiteNames: ["Calculus"],
        milestones: [
          { name: "Compute expectations, variances, and covariances fluently", xpReward: 75 },
          { name: "Derive the central limit theorem intuitively", xpReward: 125 },
          { name: "Model a real situation with a well-chosen distribution", xpReward: 100 },
          { name: "Perform a hypothesis test and interpret p-values honestly", xpReward: 100 },
          { name: "Run a Bayesian update from prior to posterior and explain it", xpReward: 100 },
          { name: "Work through a probability text (e.g. Blitzstein's Intro to Probability)", xpReward: 150 },
        ],
      },

      // =====================
      // DEEP END
      // =====================
      {
        name: "Real Analysis & Abstract Algebra",
        description: "Rigorous foundations and abstract structure",
        prerequisiteNames: ["Proofs & Mathematical Thinking", "Calculus"],
        milestones: [
          { name: "Prove a sequence converges directly from the definition", xpReward: 100 },
          { name: "Prove a function is continuous from the epsilon-delta definition", xpReward: 100 },
          { name: "Understand open/closed sets, compactness, and completeness", xpReward: 125 },
          { name: "Prove Lagrange's theorem for finite groups", xpReward: 125 },
          { name: "Work through an analysis text (e.g. Abbott's Understanding Analysis)", xpReward: 150 },
          { name: "Solve a problem that requires constructing a clever counterexample", xpReward: 100 },
        ],
      },

      // =====================
      // CAPSTONE
      // =====================
      {
        name: "Research & Application",
        description: "Use math on real problems — and create new math",
        prerequisiteNames: ["Real Analysis & Abstract Algebra", "Probability & Statistics"],
        milestones: [
          { name: "Choose a real problem and formalize it mathematically", xpReward: 100 },
          { name: "Read a research paper end-to-end and reconstruct its main result", xpReward: 150 },
          { name: "Write original notes or a blog post proving something", xpReward: 100 },
          { name: "Implement a mathematical result in code and verify numerically", xpReward: 125 },
          { name: "Teach a concept to a beginner until they genuinely understand", xpReward: 125 },
          { name: "Solve an open textbook problem no one has handed you a solution to", xpReward: 150 },
        ],
      },
    ],
    achievements: [
      { name: "Numerate", description: "Fluent in the basics, ready for real math", icon: "🧮", trigger: { type: "subskill_mastered", subskillName: "Foundations & Numeracy" } },
      { name: "Rigor", description: "You can prove what you claim", icon: "📜", trigger: { type: "subskill_mastered", subskillName: "Proofs & Mathematical Thinking" } },
      { name: "Limits Tamed", description: "Mastered the calculus of change", icon: "🌀", trigger: { type: "subskill_mastered", subskillName: "Calculus" } },
      { name: "Probabilist", description: "Reasons honestly under uncertainty", icon: "🎲", trigger: { type: "subskill_mastered", subskillName: "Probability & Statistics" } },
      { name: "Analyst", description: "Comfortable in the abstract deep end", icon: "🔬", trigger: { type: "subskill_mastered", subskillName: "Real Analysis & Abstract Algebra" } },
      { name: "Journeyman Mathematician", description: "Reached Journeyman — sharp, rigorous, curious", icon: "⚔️", trigger: { type: "stage_reached", stage: 3 } },
      { name: "Mathematician", description: "Mastered every branch", icon: "👑", trigger: { type: "all_mastered" } },
    ],
  },
  {
    id: "spanish",
    name: "Spanish Language",
    description: "From first hola to reading Cervantes and arguing politics in Madrid",
    icon: "🇪🇸",
    coverImage: DEFAULT_COVER_GRADIENT,
    coverKey: "spanish",
    subskills: [
      // ROOT
      {
        name: "First Words & Sounds",
        description: "Pronunciation basics, the alphabet, your first 100 words and 10 sentences",
        milestones: [
          { name: "Read all 27 letters of the Spanish alphabet aloud (including ñ)", xpReward: 50 },
          { name: "Pronounce the 5 pure vowel sounds correctly (a, e, i, o, u)", xpReward: 75 },
          { name: "Learn the 100 most frequent words", xpReward: 75 },
          { name: "Pick a target dialect (Castilian, Mexican, Argentine…) and commit", xpReward: 50 },
          { name: "Hold a 30-second self-introduction in Spanish", xpReward: 100 },
          { name: "Learn 20 essential phrases (greetings, politeness, asking for help)", xpReward: 75 },
          { name: "Complete a beginner course module (Pimsleur, Assimil, Language Transfer)", xpReward: 125 },
        ],
      },

      // MECHANICS
      {
        name: "Pronunciation & Sounds",
        description: "Trilled rr, soft d, dialectal s/c — sound like a real speaker",
        prerequisiteNames: ["First Words & Sounds"],
        milestones: [
          { name: "Roll a clean Spanish rr trill on demand", xpReward: 100 },
          { name: "Distinguish r and rr in word pairs (pero/perro)", xpReward: 75 },
          { name: "Master the soft d (between vowels) and the soft b/v", xpReward: 100 },
          { name: "Pronounce the dialect-correct s/c/z (Castilian or seseo)", xpReward: 100 },
          { name: "Mimic a native speaker on 10 common sentences convincingly", xpReward: 100 },
          { name: "Record a paragraph and get native approval on 3+ full sentences", xpReward: 125 },
        ],
      },
      {
        name: "Touch Typing",
        description: "Spanish keyboard mastery — ñ, accents, ¿ and ¡",
        prerequisiteNames: ["First Words & Sounds"],
        milestones: [
          { name: "Configure a Spanish keyboard layout on every device you use", xpReward: 50 },
          { name: "Type accents and ñ without looking", xpReward: 75 },
          { name: "Reach 40 WPM in Spanish", xpReward: 100 },
          { name: "Reach 60 WPM", xpReward: 125 },
          { name: "Type a 1000-word essay with <5 errors", xpReward: 100 },
        ],
      },

      // LANGUAGE SYSTEM
      {
        name: "Core Vocabulary",
        description: "From 500 to 10,000 words",
        prerequisiteNames: ["First Words & Sounds"],
        milestones: [
          { name: "Learn the 500 most common Spanish words", xpReward: 75 },
          { name: "Complete a beginner Anki / SRS deck", xpReward: 100 },
          { name: "Reach 1,000 words known", xpReward: 100 },
          { name: "Reach 2,500 words known", xpReward: 125 },
          { name: "Reach 5,000 words known", xpReward: 150 },
          { name: "Reach 10,000 words known (advanced reader)", xpReward: 150 },
        ],
      },
      {
        name: "Grammar Foundations",
        description: "Verb conjugation, gender, ser vs estar — the real work",
        prerequisiteNames: ["First Words & Sounds"],
        milestones: [
          { name: "Conjugate the 30 most common verbs in present, preterite, imperfect", xpReward: 100 },
          { name: "Master ser vs estar in real sentences", xpReward: 125 },
          { name: "Master por vs para", xpReward: 100 },
          { name: "Use direct and indirect object pronouns correctly", xpReward: 125 },
          { name: "Use the subjunctive in basic contexts (querer que, ojalá)", xpReward: 150 },
          { name: "Complete a grammar reference book (e.g. A New Reference Grammar of Modern Spanish)", xpReward: 150 },
          { name: "Pass a B1-level grammar assessment", xpReward: 75 },
        ],
      },
      {
        name: "Advanced Grammar",
        description: "Subjunctive mastery, conditional perfect, complex syntax",
        prerequisiteNames: ["Grammar Foundations", "Input — Beginner (A1–B1)"],
        milestones: [
          { name: "Use the subjunctive fluently across all triggers", xpReward: 150 },
          { name: "Use the conditional and conditional perfect naturally", xpReward: 125 },
          { name: "Use compound tenses (haber + participio) in writing", xpReward: 125 },
          { name: "Handle reported speech and sequence of tenses", xpReward: 125 },
          { name: "Write a 200-word text with zero conjugation errors", xpReward: 125 },
          { name: "Pass a C1-level grammar assessment", xpReward: 150 },
        ],
      },

      // INPUT
      {
        name: "Input — Beginner (A1–B1)",
        description: "From comprehensible input videos to slow podcasts",
        prerequisiteNames: ["Pronunciation & Sounds"],
        milestones: [
          { name: "Watch your first 10 A1 CI videos (Dreaming Spanish or similar)", xpReward: 50 },
          { name: "Complete an A1 CI playlist", xpReward: 75 },
          { name: "Understand 70% of an A2 video without subtitles", xpReward: 100 },
          { name: "Follow a slow podcast for learners (Notes in Spanish, News in Slow)", xpReward: 100 },
          { name: "Understand a Spanish vlogger's casual video", xpReward: 125 },
          { name: "Follow a B1 podcast on a familiar topic", xpReward: 125 },
          { name: "Accumulate 100+ cumulative hours of Spanish input", xpReward: 125 },
        ],
      },
      {
        name: "Input — Advanced (B2–C1)",
        description: "Native media at native speed",
        prerequisiteNames: ["Input — Beginner (A1–B1)"],
        milestones: [
          { name: "Watch a full episode of a Spanish-language show (La Casa de Papel, Narcos, etc.)", xpReward: 100 },
          { name: "Understand a Spanish-language news segment at normal speed", xpReward: 125 },
          { name: "Finish a native podcast episode (Radio Ambulante, El Hilo)", xpReward: 125 },
          { name: "Watch a Spanish-language film without subtitles", xpReward: 125 },
          { name: "Understand a Spanish stand-up comedy bit", xpReward: 125 },
          { name: "Follow a debate or interview on a complex topic", xpReward: 150 },
          { name: "Reach 500+ cumulative hours of Spanish input", xpReward: 150 },
        ],
      },

      // READING
      {
        name: "Reading — Graded & Contemporary",
        description: "From comics to contemporary novels",
        prerequisiteNames: ["Core Vocabulary", "Input — Beginner (A1–B1)"],
        milestones: [
          { name: "Read your first comic in Spanish (Mafalda, Mortadelo y Filemón)", xpReward: 50 },
          { name: "Finish an A1/A2 graded reader", xpReward: 75 },
          { name: "Read a Spanish children's book (El Principito or similar)", xpReward: 75 },
          { name: "Finish a B1-level short-story collection", xpReward: 100 },
          { name: "Finish a contemporary novel (Zafón, Pérez-Reverte, Vargas Llosa)", xpReward: 125 },
          { name: "Read a non-fiction book in Spanish", xpReward: 125 },
          { name: "Read a full book without using a dictionary", xpReward: 150 },
        ],
      },
      {
        name: "Reading — Classics",
        description: "García Márquez, Borges, Cervantes — the canon in the original",
        prerequisiteNames: ["Reading — Graded & Contemporary", "Input — Advanced (B2–C1)", "Advanced Grammar"],
        milestones: [
          { name: "Read a Borges short story (e.g. El Aleph, Ficciones)", xpReward: 100 },
          { name: "Read a Cortázar short story", xpReward: 100 },
          { name: "Finish García Márquez's Cien años de soledad", xpReward: 150 },
          { name: "Finish a Vargas Llosa novel", xpReward: 125 },
          { name: "Read Federico García Lorca poetry with real comprehension", xpReward: 125 },
          { name: "Finish Don Quijote (Cervantes) — abridged or full", xpReward: 175 },
          { name: "Read a Latin American 'boom' novel (Cortázar, Fuentes, Donoso)", xpReward: 125 },
        ],
      },

      // OUTPUT
      {
        name: "Speaking & Conversation",
        description: "Talking to real people about real things",
        prerequisiteNames: ["Pronunciation & Sounds", "Grammar Foundations", "Input — Beginner (A1–B1)"],
        milestones: [
          { name: "Hold a 2-minute conversation with a tutor on a familiar topic", xpReward: 75 },
          { name: "Navigate a real-world task in Spanish (order food, ask directions)", xpReward: 100 },
          { name: "Complete 20 hours of 1-on-1 tutoring (iTalki or equivalent)", xpReward: 125 },
          { name: "Tell a 5-minute story in past tense without breaking down", xpReward: 125 },
          { name: "Hold a 30-minute conversation with a native speaker", xpReward: 125 },
          { name: "Debate or explain a complex topic spontaneously", xpReward: 150 },
        ],
      },
      {
        name: "Writing & Composition",
        description: "From first paragraph to publishable essay",
        prerequisiteNames: ["Grammar Foundations", "Core Vocabulary"],
        milestones: [
          { name: "Write a 100-word paragraph about your day", xpReward: 75 },
          { name: "Journal in Spanish for 30 consecutive days", xpReward: 125 },
          { name: "Write a 500-word personal essay", xpReward: 100 },
          { name: "Write a 1,000-word essay on a topic you care about", xpReward: 125 },
          { name: "Have a piece corrected by a native with <10 serious errors", xpReward: 125 },
          { name: "Publish something in Spanish (blog, social, email thread)", xpReward: 100 },
        ],
      },

      // CAPSTONE
      {
        name: "Immersion & Culture",
        description: "Live in the language, not just study it",
        prerequisiteNames: ["Input — Advanced (B2–C1)", "Reading — Classics", "Speaking & Conversation"],
        milestones: [
          { name: "Spend a week thinking and dreaming in Spanish", xpReward: 100 },
          { name: "Watch a Spanish-language film and discuss it with a native", xpReward: 100 },
          { name: "Read a Spanish-language news source daily for a month", xpReward: 125 },
          { name: "Make a Spanish-speaking friend and keep regular contact", xpReward: 125 },
          { name: "Travel to or live in a Spanish-speaking region for 1+ week", xpReward: 150 },
          { name: "Take a DELE C1 or C2 exam — or self-assess honestly at C1+", xpReward: 175 },
        ],
      },
    ],
    achievements: [
      { name: "Hola", description: "First steps taken — alphabet and 100 words", icon: "👋", trigger: { type: "subskill_mastered", subskillName: "First Words & Sounds" } },
      { name: "Native Ear", description: "Pronunciation passes the native test", icon: "👂", trigger: { type: "subskill_mastered", subskillName: "Pronunciation & Sounds" } },
      { name: "Subjunctive Slayer", description: "Advanced grammar conquered", icon: "⚙️", trigger: { type: "subskill_mastered", subskillName: "Advanced Grammar" } },
      { name: "Fluent Listener", description: "Native media at native speed", icon: "🎧", trigger: { type: "subskill_mastered", subskillName: "Input — Advanced (B2–C1)" } },
      { name: "Conversationalist", description: "Real conversations, not survival", icon: "💬", trigger: { type: "subskill_mastered", subskillName: "Speaking & Conversation" } },
      { name: "Cervantista", description: "Finished Don Quijote and the Latin American canon", icon: "📖", trigger: { type: "subskill_mastered", subskillName: "Reading — Classics" } },
      { name: "Polyglot Path", description: "Reached Journeyman — life in Spanish is possible", icon: "⚔️", trigger: { type: "stage_reached", stage: 3 } },
      { name: "Native-like", description: "Mastered every branch of the language", icon: "👑", trigger: { type: "all_mastered" } },
    ],
  },
  {
    id: "french",
    name: "French Language",
    description: "From bonjour to reading Camus and ordering wine in Paris like you live there",
    icon: "🇫🇷",
    coverImage: DEFAULT_COVER_GRADIENT,
    coverKey: "french",
    subskills: [
      {
        name: "First Words & Sounds",
        description: "Alphabet, the four nasal vowels, your first 100 words",
        milestones: [
          { name: "Read all 26 letters with French pronunciation", xpReward: 50 },
          { name: "Distinguish the four nasal vowels (an, en, in, on)", xpReward: 100 },
          { name: "Learn the 100 most frequent words", xpReward: 75 },
          { name: "Hold a 30-second self-introduction in French", xpReward: 100 },
          { name: "Learn 20 essential phrases (greetings, politeness, asking for help)", xpReward: 75 },
          { name: "Distinguish tu vs vous and use them correctly", xpReward: 75 },
          { name: "Complete a beginner course module (Pimsleur, Assimil, Coffee Break French)", xpReward: 125 },
        ],
      },

      {
        name: "Pronunciation & Liaisons",
        description: "Liaisons, silent letters, the French r — sound like you grew up there",
        prerequisiteNames: ["First Words & Sounds"],
        milestones: [
          { name: "Produce a clean uvular French r", xpReward: 125 },
          { name: "Master nasal vowels in real words", xpReward: 100 },
          { name: "Apply liaisons correctly (vous_êtes, les_amis)", xpReward: 125 },
          { name: "Recognize and read silent letters at word ends", xpReward: 75 },
          { name: "Distinguish u (sur) from ou (sous)", xpReward: 75 },
          { name: "Mimic a native speaker on 10 common sentences convincingly", xpReward: 100 },
          { name: "Record a paragraph and get native approval on 3+ full sentences", xpReward: 125 },
        ],
      },
      {
        name: "Touch Typing",
        description: "AZERTY layout — accents, cedilla, ligatures",
        prerequisiteNames: ["First Words & Sounds"],
        milestones: [
          { name: "Configure an AZERTY (or French international) keyboard", xpReward: 50 },
          { name: "Type all accents (é è ê ë à â ô ù û î) and ç without looking", xpReward: 100 },
          { name: "Reach 40 WPM in French", xpReward: 100 },
          { name: "Reach 60 WPM", xpReward: 125 },
          { name: "Type a 1000-word essay with <5 errors", xpReward: 100 },
        ],
      },

      {
        name: "Core Vocabulary",
        description: "From 500 to 10,000 words",
        prerequisiteNames: ["First Words & Sounds"],
        milestones: [
          { name: "Learn the 500 most common French words", xpReward: 75 },
          { name: "Complete a beginner Anki / SRS deck", xpReward: 100 },
          { name: "Reach 1,000 words known", xpReward: 100 },
          { name: "Reach 2,500 words known", xpReward: 125 },
          { name: "Reach 5,000 words known", xpReward: 150 },
          { name: "Reach 10,000 words known (advanced reader)", xpReward: 150 },
        ],
      },
      {
        name: "Grammar Foundations",
        description: "Genders, conjugation, passé composé vs imparfait — the core",
        prerequisiteNames: ["First Words & Sounds"],
        milestones: [
          { name: "Conjugate the 30 most common verbs in présent, passé composé, imparfait, futur", xpReward: 100 },
          { name: "Master noun gender for 1,000 most common nouns", xpReward: 125 },
          { name: "Use direct and indirect object pronouns correctly (le/la/lui/leur, en, y)", xpReward: 125 },
          { name: "Master the difference between passé composé and imparfait", xpReward: 125 },
          { name: "Use reflexive verbs naturally", xpReward: 100 },
          { name: "Complete a grammar reference (Bescherelle + a learner grammar)", xpReward: 150 },
          { name: "Pass a B1-level grammar assessment", xpReward: 75 },
        ],
      },
      {
        name: "Advanced Grammar",
        description: "Subjunctive, conditional, literary tenses, complex syntax",
        prerequisiteNames: ["Grammar Foundations", "Input — Beginner (A1–B1)"],
        milestones: [
          { name: "Use the subjunctive fluently after all common triggers (il faut que, bien que…)", xpReward: 150 },
          { name: "Use the conditional and conditional past naturally", xpReward: 125 },
          { name: "Recognize and read literary tenses (passé simple, passé antérieur)", xpReward: 125 },
          { name: "Handle relative pronouns (qui, que, dont, où, lequel) fluently", xpReward: 125 },
          { name: "Write a 200-word text with zero gender / agreement errors", xpReward: 125 },
          { name: "Pass a C1-level grammar assessment", xpReward: 150 },
        ],
      },

      {
        name: "Input — Beginner (A1–B1)",
        description: "From learner videos to French podcasts",
        prerequisiteNames: ["Pronunciation & Liaisons"],
        milestones: [
          { name: "Watch your first 10 A1 CI videos (Français Authentique, InnerFrench)", xpReward: 50 },
          { name: "Complete an A1 CI playlist", xpReward: 75 },
          { name: "Understand 70% of an A2 video without subtitles", xpReward: 100 },
          { name: "Follow a slow podcast for learners (News in Slow French, Coffee Break)", xpReward: 100 },
          { name: "Understand a French vlogger's casual video", xpReward: 125 },
          { name: "Follow a B1 podcast on a familiar topic", xpReward: 125 },
          { name: "Accumulate 100+ cumulative hours of French input", xpReward: 125 },
        ],
      },
      {
        name: "Input — Advanced (B2–C1)",
        description: "Native media at native speed — Lupin, France Culture, Ardisson",
        prerequisiteNames: ["Input — Beginner (A1–B1)"],
        milestones: [
          { name: "Watch a full episode of a French show (Lupin, Dix Pour Cent, Le Bureau des Légendes)", xpReward: 100 },
          { name: "Understand a French news segment at normal speed", xpReward: 125 },
          { name: "Finish a native podcast episode (Transfert, France Culture, Affaires Sensibles)", xpReward: 125 },
          { name: "Watch a French film without subtitles", xpReward: 125 },
          { name: "Understand a French stand-up bit (Gad Elmaleh, Florence Foresti)", xpReward: 125 },
          { name: "Follow a debate or interview on a complex topic", xpReward: 150 },
          { name: "Reach 500+ cumulative hours of French input", xpReward: 150 },
        ],
      },

      {
        name: "Reading — Graded & Contemporary",
        description: "From bandes dessinées to modern novels",
        prerequisiteNames: ["Core Vocabulary", "Input — Beginner (A1–B1)"],
        milestones: [
          { name: "Read your first BD (Astérix, Tintin, Lucky Luke)", xpReward: 75 },
          { name: "Finish an A1/A2 graded reader", xpReward: 75 },
          { name: "Read Le Petit Prince end-to-end", xpReward: 100 },
          { name: "Finish a B1-level short-story collection", xpReward: 100 },
          { name: "Finish a contemporary novel (Houellebecq, Despentes, Vuillard, Modiano)", xpReward: 125 },
          { name: "Read a non-fiction book in French", xpReward: 125 },
          { name: "Read a full book without using a dictionary", xpReward: 150 },
        ],
      },
      {
        name: "Reading — Classics",
        description: "Hugo, Camus, Proust, Voltaire — the canon",
        prerequisiteNames: ["Reading — Graded & Contemporary", "Input — Advanced (B2–C1)", "Advanced Grammar"],
        milestones: [
          { name: "Read Camus's L'Étranger in the original", xpReward: 125 },
          { name: "Read a Voltaire conte (Candide, Zadig)", xpReward: 125 },
          { name: "Read a Maupassant short-story collection", xpReward: 100 },
          { name: "Finish a Hugo novel (Notre-Dame de Paris or Les Misérables abridged)", xpReward: 175 },
          { name: "Read Baudelaire poetry with real comprehension", xpReward: 125 },
          { name: "Finish a volume of Proust's Recherche", xpReward: 200 },
          { name: "Read a Sartre or de Beauvoir essay/novel", xpReward: 125 },
        ],
      },

      {
        name: "Speaking & Conversation",
        description: "Real talk with real Francophones",
        prerequisiteNames: ["Pronunciation & Liaisons", "Grammar Foundations", "Input — Beginner (A1–B1)"],
        milestones: [
          { name: "Hold a 2-minute conversation with a tutor on a familiar topic", xpReward: 75 },
          { name: "Navigate a real-world task in French (order food, ask directions)", xpReward: 100 },
          { name: "Complete 20 hours of 1-on-1 tutoring (iTalki or equivalent)", xpReward: 125 },
          { name: "Tell a 5-minute story in passé composé/imparfait without breaking down", xpReward: 125 },
          { name: "Hold a 30-minute conversation with a native speaker", xpReward: 125 },
          { name: "Debate or explain a complex topic spontaneously", xpReward: 150 },
        ],
      },
      {
        name: "Writing & Composition",
        description: "From journal to dissertation",
        prerequisiteNames: ["Grammar Foundations", "Core Vocabulary"],
        milestones: [
          { name: "Write a 100-word paragraph about your day", xpReward: 75 },
          { name: "Journal in French for 30 consecutive days", xpReward: 125 },
          { name: "Write a 500-word personal essay", xpReward: 100 },
          { name: "Write a 1,000-word essay on a topic you care about", xpReward: 125 },
          { name: "Write in the formal French dissertation style (thèse-antithèse-synthèse)", xpReward: 150 },
          { name: "Have a piece corrected by a native with <10 serious errors", xpReward: 125 },
          { name: "Publish something in French (blog, social, email thread)", xpReward: 100 },
        ],
      },

      {
        name: "Immersion & Culture",
        description: "Live in the language",
        prerequisiteNames: ["Input — Advanced (B2–C1)", "Reading — Classics", "Speaking & Conversation"],
        milestones: [
          { name: "Spend a week thinking and dreaming in French", xpReward: 100 },
          { name: "Watch a French film and discuss it with a native afterwards", xpReward: 100 },
          { name: "Read Le Monde or Libération daily for a month", xpReward: 125 },
          { name: "Make a French-speaking friend and keep regular contact", xpReward: 125 },
          { name: "Travel to or live in a French-speaking region for 1+ week", xpReward: 150 },
          { name: "Take a DELF B2 / DALF C1/C2 — or self-assess honestly at C1+", xpReward: 175 },
        ],
      },
    ],
    achievements: [
      { name: "Bonjour", description: "First steps taken — alphabet, sounds, 100 words", icon: "👋", trigger: { type: "subskill_mastered", subskillName: "First Words & Sounds" } },
      { name: "Liaison Master", description: "Pronunciation passes the native test", icon: "👂", trigger: { type: "subskill_mastered", subskillName: "Pronunciation & Liaisons" } },
      { name: "Subjonctif Slayer", description: "Advanced grammar conquered", icon: "⚙️", trigger: { type: "subskill_mastered", subskillName: "Advanced Grammar" } },
      { name: "Fluent Listener", description: "Native French at native speed", icon: "🎧", trigger: { type: "subskill_mastered", subskillName: "Input — Advanced (B2–C1)" } },
      { name: "Conversationalist", description: "Real conversations with real Francophones", icon: "💬", trigger: { type: "subskill_mastered", subskillName: "Speaking & Conversation" } },
      { name: "Read the Canon", description: "Camus, Hugo, Proust — in the original", icon: "📖", trigger: { type: "subskill_mastered", subskillName: "Reading — Classics" } },
      { name: "Polyglot Path", description: "Reached Journeyman — life in French is possible", icon: "⚔️", trigger: { type: "stage_reached", stage: 3 } },
      { name: "Native-like", description: "Mastered every branch of the language", icon: "👑", trigger: { type: "all_mastered" } },
    ],
  },
  {
    id: "singing",
    name: "Singing",
    description: "From your first scale to performing repertoire that moves people",
    icon: "🎤",
    coverImage: DEFAULT_COVER_GRADIENT,
    coverKey: "singing",
    subskills: [
      {
        name: "Breath & Posture",
        description: "The foundation of every voice — diaphragm, alignment, support",
        milestones: [
          { name: "Sit/stand with proper alignment (open ribs, released jaw, free neck)", xpReward: 75 },
          { name: "Sustain a single tone for 20+ seconds on one breath", xpReward: 100 },
          { name: "Sustain a tone for 30+ seconds with steady volume", xpReward: 125 },
          { name: "Use diaphragmatic breath support consistently in singing", xpReward: 125 },
          { name: "Record a session: notice tension, release it, re-record", xpReward: 100 },
          { name: "Practice breath exercises daily for 30 days", xpReward: 100 },
        ],
      },

      {
        name: "Pitch & Ear Training",
        description: "Hear, match, hold",
        prerequisiteNames: ["Breath & Posture"],
        milestones: [
          { name: "Match any pitch played to you within 5 seconds, in tune", xpReward: 75 },
          { name: "Sing a clean major scale ascending and descending in 5 keys", xpReward: 100 },
          { name: "Sing all natural minor and harmonic minor scales", xpReward: 100 },
          { name: "Sing arpeggios (major and minor triads) in 12 keys", xpReward: 125 },
          { name: "Identify and sing the 7 diatonic intervals on demand", xpReward: 125 },
          { name: "Sing back a 4-bar phrase after one hearing", xpReward: 125 },
          { name: "Hold a harmony part against a recording for a full song", xpReward: 125 },
        ],
      },
      {
        name: "Vowels & Diction",
        description: "Pure vowels, clean consonants, intelligible across a hall",
        prerequisiteNames: ["Breath & Posture"],
        milestones: [
          { name: "Master the 5 pure Italian-style vowels (a, e, i, o, u)", xpReward: 100 },
          { name: "Modify vowels for high and low registers correctly", xpReward: 125 },
          { name: "Articulate consonants without breaking phonation", xpReward: 100 },
          { name: "Sing a song in a foreign language with correct IPA-level diction", xpReward: 125 },
          { name: "Record a song and have a native of the lyrics' language understand every word", xpReward: 125 },
        ],
      },
      {
        name: "Range Extension",
        description: "Three octaves, comfortably",
        prerequisiteNames: ["Pitch & Ear Training", "Vowels & Diction"],
        milestones: [
          { name: "Find your full speaking and singing range (write down the pitches)", xpReward: 50 },
          { name: "Add 3 semitones to your top end without strain", xpReward: 125 },
          { name: "Add 3 semitones to your bottom end with full tone", xpReward: 100 },
          { name: "Sing comfortably across two full octaves", xpReward: 150 },
          { name: "Sing across two-and-a-half octaves with consistent tone", xpReward: 175 },
          { name: "Sing across three octaves (or your stylistic max)", xpReward: 200 },
        ],
      },
      {
        name: "Registers & Mix",
        description: "Chest, head, mix, falsetto, whistle — own them all",
        prerequisiteNames: ["Range Extension"],
        milestones: [
          { name: "Sing cleanly in chest voice across your lower octave", xpReward: 100 },
          { name: "Sing cleanly in head voice across your upper octave", xpReward: 125 },
          { name: "Cross your bridge (passaggio) without a break", xpReward: 175 },
          { name: "Sing a phrase in mix voice", xpReward: 150 },
          { name: "Use falsetto stylistically and intentionally", xpReward: 100 },
          { name: "Belt a high note safely (within your healthy range)", xpReward: 150 },
        ],
      },
      {
        name: "Vibrato & Stylistic Control",
        description: "Make it move when you want it to, stop it when you don't",
        prerequisiteNames: ["Registers & Mix"],
        milestones: [
          { name: "Produce a natural vibrato on demand", xpReward: 125 },
          { name: "Sing a held note with NO vibrato (straight tone)", xpReward: 100 },
          { name: "Add tasteful melisma to a phrase", xpReward: 100 },
          { name: "Use dynamic shaping (crescendo / decrescendo) within a phrase", xpReward: 125 },
          { name: "Match the stylistic vibrato of a target genre (operatic / jazz / pop)", xpReward: 150 },
        ],
      },

      {
        name: "Music Theory for Singers",
        description: "Read what you sing, understand what's happening",
        prerequisiteNames: ["Pitch & Ear Training"],
        milestones: [
          { name: "Read treble clef fluently — single notes at sight", xpReward: 100 },
          { name: "Sight-sing a simple major-key melody", xpReward: 125 },
          { name: "Sight-sing a melody with chromaticism", xpReward: 150 },
          { name: "Identify chord changes by ear in a 4-chord pop song", xpReward: 100 },
          { name: "Transpose a song into 3 different keys", xpReward: 100 },
          { name: "Improvise a vocal line over a 12-bar blues", xpReward: 125 },
        ],
      },

      {
        name: "Repertoire — Folk & Standards",
        description: "Build a working set of 20+ songs you can sing on demand",
        prerequisiteNames: ["Vowels & Diction", "Pitch & Ear Training"],
        milestones: [
          { name: "Memorize 5 songs cold (lyrics, melody, rhythm)", xpReward: 100 },
          { name: "Memorize 10 songs", xpReward: 125 },
          { name: "Memorize 20 songs across 3 genres", xpReward: 150 },
          { name: "Sing a folk standard in its original language (e.g. Italian, Spanish, Yiddish)", xpReward: 125 },
          { name: "Sing a jazz standard with proper phrasing", xpReward: 125 },
        ],
      },
      {
        name: "Repertoire — Advanced",
        description: "Aria, art song, or technically demanding contemporary",
        prerequisiteNames: ["Repertoire — Folk & Standards", "Registers & Mix"],
        milestones: [
          { name: "Learn and perform a classical art song (lieder, mélodie, or aria)", xpReward: 150 },
          { name: "Learn and perform a musical-theatre piece beyond your comfort zone", xpReward: 150 },
          { name: "Learn and perform a song from a non-native culture (Japanese, Brazilian, etc.)", xpReward: 125 },
          { name: "Perform a song with complex meter (5/4, 7/8, etc.)", xpReward: 150 },
          { name: "Sing a contemporary song with extensive improvisation", xpReward: 150 },
        ],
      },

      {
        name: "Performance & Stage Presence",
        description: "What separates someone who sings from a singer",
        prerequisiteNames: ["Repertoire — Folk & Standards"],
        milestones: [
          { name: "Sing in front of one trusted person", xpReward: 75 },
          { name: "Sing at an open mic", xpReward: 125 },
          { name: "Sing in front of a small audience (10+ people)", xpReward: 125 },
          { name: "Sing with a band or accompanist on stage", xpReward: 150 },
          { name: "Perform a 30-minute set", xpReward: 175 },
          { name: "Get paid for a singing gig", xpReward: 200 },
        ],
      },

      {
        name: "Recording & Self-Critique",
        description: "Hearing yourself honestly is half the work",
        prerequisiteNames: ["Vowels & Diction"],
        milestones: [
          { name: "Record yourself singing on a phone, listen back without flinching", xpReward: 75 },
          { name: "Set up a basic home recording (mic, interface, DAW)", xpReward: 125 },
          { name: "Record a clean a-cappella take of one song", xpReward: 125 },
          { name: "Record a multi-track vocal arrangement", xpReward: 150 },
          { name: "Release a song publicly (SoundCloud, Bandcamp, YouTube)", xpReward: 175 },
        ],
      },

      {
        name: "Choir / Ensemble",
        description: "Singing WITH other people — a different skill entirely",
        prerequisiteNames: ["Pitch & Ear Training"],
        milestones: [
          { name: "Sing in a choir or vocal group for one rehearsal", xpReward: 100 },
          { name: "Hold your part against three other parts", xpReward: 125 },
          { name: "Sing in a 4+ part harmony piece", xpReward: 125 },
          { name: "Perform with a choir publicly", xpReward: 150 },
          { name: "Lead a section as a section leader", xpReward: 150 },
        ],
      },

      {
        name: "Vocal Health & Longevity",
        description: "Sing for 50 years, not 5",
        milestones: [
          { name: "Develop a daily warm-up routine (10+ minutes)", xpReward: 100 },
          { name: "Develop a cool-down after singing", xpReward: 75 },
          { name: "Recover fully from one cold/illness without losing technique", xpReward: 100 },
          { name: "Quit or never start vocal-damaging habits (smoking, screaming, dehydration)", xpReward: 100 },
          { name: "See a vocal coach or laryngologist for a full check-up", xpReward: 125 },
          { name: "Maintain consistent practice (4+ days/week) for 6 months", xpReward: 150 },
        ],
      },

      {
        name: "Mastery — A Voice of Your Own",
        description: "The capstone — a recognizable, expressive, durable voice",
        prerequisiteNames: ["Repertoire — Advanced", "Performance & Stage Presence", "Recording & Self-Critique", "Vibrato & Stylistic Control"],
        milestones: [
          { name: "Identify and articulate your own vocal style", xpReward: 150 },
          { name: "Get an unsolicited compliment on your singing from a stranger", xpReward: 100 },
          { name: "Record a project that reflects who you are as a singer (EP, album, set)", xpReward: 200 },
          { name: "Teach a beginner singer for one full lesson", xpReward: 150 },
          { name: "Sing in a way that moves another person to tears", xpReward: 200 },
        ],
      },
    ],
    achievements: [
      { name: "Found Your Voice", description: "Breath, alignment, and pitch are home", icon: "🌬️", trigger: { type: "subskill_mastered", subskillName: "Pitch & Ear Training" } },
      { name: "Three Octaves", description: "Range fully extended", icon: "📈", trigger: { type: "subskill_mastered", subskillName: "Range Extension" } },
      { name: "Bridge Crossed", description: "No break between registers", icon: "🌉", trigger: { type: "subskill_mastered", subskillName: "Registers & Mix" } },
      { name: "Repertoire", description: "20+ songs at the ready", icon: "📚", trigger: { type: "subskill_mastered", subskillName: "Repertoire — Folk & Standards" } },
      { name: "On Stage", description: "Performed in front of an audience", icon: "🎙️", trigger: { type: "subskill_mastered", subskillName: "Performance & Stage Presence" } },
      { name: "Recorded", description: "Released your voice into the world", icon: "💿", trigger: { type: "subskill_mastered", subskillName: "Recording & Self-Critique" } },
      { name: "Journeyman Singer", description: "Reached Journeyman — a real voice now", icon: "⚔️", trigger: { type: "stage_reached", stage: 3 } },
      { name: "A Voice of Your Own", description: "Mastered every branch — a singer for life", icon: "👑", trigger: { type: "all_mastered" } },
    ],
  },
  {
    id: "music-theory",
    name: "Music Theory",
    description: "From notes on a staff to writing a fugue and analyzing Coltrane",
    icon: "🎼",
    coverImage: DEFAULT_COVER_GRADIENT,
    coverKey: "musictheory",
    subskills: [
      {
        name: "Notation & Pitch",
        description: "The written language of Western music",
        milestones: [
          { name: "Read treble clef fluently", xpReward: 75 },
          { name: "Read bass clef fluently", xpReward: 100 },
          { name: "Read alto and tenor clefs (for viola, trombone, etc.)", xpReward: 100 },
          { name: "Identify all rhythmic note values and rests", xpReward: 75 },
          { name: "Notate any pitch on the grand staff with correct accidentals", xpReward: 100 },
          { name: "Sight-read a simple 4-bar melody on a single instrument or voice", xpReward: 125 },
        ],
      },
      {
        name: "Intervals & Scales",
        description: "Steps and skips — the building blocks",
        prerequisiteNames: ["Notation & Pitch"],
        milestones: [
          { name: "Identify all 13 intervals within an octave by ear", xpReward: 125 },
          { name: "Build all 13 intervals from any starting pitch on demand", xpReward: 100 },
          { name: "Construct major and minor scales in all 12 keys", xpReward: 125 },
          { name: "Construct all 7 diatonic modes (Ionian → Locrian)", xpReward: 125 },
          { name: "Construct harmonic minor and melodic minor scales", xpReward: 100 },
          { name: "Construct exotic scales (whole-tone, octatonic, pentatonic, blues)", xpReward: 100 },
          { name: "Identify any scale by ear from a short melodic snippet", xpReward: 125 },
        ],
      },
      {
        name: "Triads & Seventh Chords",
        description: "Three- and four-note chords — the harmonic vocabulary",
        prerequisiteNames: ["Intervals & Scales"],
        milestones: [
          { name: "Construct major, minor, augmented, and diminished triads in all keys", xpReward: 100 },
          { name: "Identify triad qualities by ear", xpReward: 100 },
          { name: "Construct all five seventh-chord types (Maj7, m7, dom7, m7b5, dim7)", xpReward: 125 },
          { name: "Identify seventh-chord qualities by ear", xpReward: 125 },
          { name: "Invert any triad and identify the inversion in notation", xpReward: 100 },
          { name: "Spell extended chords (9, 11, 13) and altered dominants", xpReward: 125 },
        ],
      },
      {
        name: "Diatonic Harmony",
        description: "I, ii, iii, IV, V, vi, vii° — the bones of tonal music",
        prerequisiteNames: ["Triads & Seventh Chords"],
        milestones: [
          { name: "Identify all 7 diatonic chords in any key", xpReward: 100 },
          { name: "Harmonize a simple major-key melody with primary chords (I, IV, V)", xpReward: 125 },
          { name: "Use secondary dominants (V/V, V/vi) correctly", xpReward: 125 },
          { name: "Cadence correctly (PAC, IAC, half, deceptive, plagal)", xpReward: 100 },
          { name: "Modulate to closely related keys (V, IV, vi, ii)", xpReward: 125 },
          { name: "Analyze a Bach chorale's harmony in Roman numerals", xpReward: 150 },
        ],
      },
      {
        name: "Voice Leading & Counterpoint",
        description: "Two or more independent melodic lines that fit together",
        prerequisiteNames: ["Diatonic Harmony"],
        milestones: [
          { name: "Apply standard voice-leading rules in a 4-voice texture (no parallel 5ths/8ves, etc.)", xpReward: 125 },
          { name: "Write a 1st species counterpoint exercise (note against note)", xpReward: 125 },
          { name: "Write a 2nd species counterpoint exercise", xpReward: 125 },
          { name: "Write a complete 5-species counterpoint exercise (Fux's tradition)", xpReward: 175 },
          { name: "Harmonize a chorale in 4 parts in Bach's style", xpReward: 200 },
          { name: "Write a 2-voice invention", xpReward: 200 },
        ],
      },

      {
        name: "Ear Training",
        description: "If you can't hear it, you don't know it",
        prerequisiteNames: ["Intervals & Scales"],
        milestones: [
          { name: "Identify all melodic intervals by ear at 90% accuracy", xpReward: 125 },
          { name: "Identify all chord qualities by ear (triads + 7ths)", xpReward: 125 },
          { name: "Take simple melodic dictation (4 bars, diatonic)", xpReward: 125 },
          { name: "Take chromatic melodic dictation", xpReward: 150 },
          { name: "Take 4-voice harmonic dictation (Bach-style)", xpReward: 175 },
          { name: "Identify modulations by ear in real time", xpReward: 150 },
          { name: "Transcribe a 1-minute piece by ear (melody + chords)", xpReward: 175 },
        ],
      },

      {
        name: "Form & Analysis",
        description: "The architectures of pieces — what shape are they?",
        prerequisiteNames: ["Diatonic Harmony"],
        milestones: [
          { name: "Identify and analyze binary, ternary, and rounded-binary forms", xpReward: 125 },
          { name: "Analyze a sonata-allegro form (exposition, development, recapitulation)", xpReward: 175 },
          { name: "Analyze a fugue (subject, answer, episodes, strettos)", xpReward: 175 },
          { name: "Analyze a 12-bar blues and identify variants", xpReward: 100 },
          { name: "Analyze a pop song (verse, chorus, bridge, prechorus, hooks)", xpReward: 100 },
          { name: "Analyze a theme-and-variations work", xpReward: 125 },
        ],
      },

      {
        name: "Modulation & Chromatic Harmony",
        description: "Moving between keys, borrowing chords, getting strange",
        prerequisiteNames: ["Diatonic Harmony"],
        milestones: [
          { name: "Modulate to distant keys (chromatic third relations, etc.)", xpReward: 150 },
          { name: "Use modal mixture (borrowed chords from parallel minor)", xpReward: 125 },
          { name: "Use the Neapolitan and augmented sixth chords", xpReward: 150 },
          { name: "Analyze chromatic 19th-century harmony (Wagner, Chopin)", xpReward: 175 },
          { name: "Compose a chromatic 16-bar passage that sounds intentional", xpReward: 175 },
        ],
      },

      {
        name: "Jazz & Modal Harmony",
        description: "Extended chords, ii-V-I, modal interchange — the 20th-century vocabulary",
        prerequisiteNames: ["Triads & Seventh Chords", "Diatonic Harmony"],
        milestones: [
          { name: "Spell ii-V-I progressions in all 12 keys", xpReward: 125 },
          { name: "Reharmonize a standard with tritone substitutions", xpReward: 150 },
          { name: "Use modal harmony (Dorian, Mixolydian, Phrygian) in a composition", xpReward: 125 },
          { name: "Analyze a complex jazz standard (e.g. Giant Steps, All The Things You Are)", xpReward: 175 },
          { name: "Improvise a chorus over a 12-bar blues using chord-scale theory", xpReward: 150 },
          { name: "Improvise over a Coltrane changes (Giant Steps cycle)", xpReward: 200 },
        ],
      },

      {
        name: "20th & 21st Century",
        description: "Atonality, set theory, serialism, minimalism, spectral",
        prerequisiteNames: ["Modulation & Chromatic Harmony", "Form & Analysis"],
        milestones: [
          { name: "Use pitch-class set theory to analyze an atonal passage", xpReward: 175 },
          { name: "Analyze a 12-tone row and a brief serial passage (Schoenberg, Webern)", xpReward: 175 },
          { name: "Analyze a minimalist piece (Reich, Glass)", xpReward: 125 },
          { name: "Recognize and analyze polyrhythms and complex meters", xpReward: 150 },
          { name: "Analyze a spectral or post-tonal contemporary work", xpReward: 175 },
        ],
      },

      {
        name: "Composition",
        description: "Make music, don't just analyze it",
        prerequisiteNames: ["Voice Leading & Counterpoint", "Form & Analysis"],
        milestones: [
          { name: "Compose an 8-bar melody with proper phrase structure", xpReward: 100 },
          { name: "Compose a 32-bar AABA song", xpReward: 125 },
          { name: "Compose a 2-voice invention in Bach's style", xpReward: 175 },
          { name: "Compose a complete song with verse/chorus/bridge", xpReward: 150 },
          { name: "Compose a piece in sonata-allegro form", xpReward: 200 },
          { name: "Compose a fugue", xpReward: 250 },
          { name: "Get a composition performed by other musicians", xpReward: 200 },
        ],
      },

      {
        name: "Mastery — Theory in Practice",
        description: "The capstone — theory that lives in the ear and in the page",
        prerequisiteNames: ["Composition", "Ear Training", "Jazz & Modal Harmony", "20th & 21st Century"],
        milestones: [
          { name: "Sight-sing a complex modulating melody on the first try", xpReward: 175 },
          { name: "Take complete melodic + harmonic dictation of a Bach chorale", xpReward: 200 },
          { name: "Improvise a full chorus on a difficult standard", xpReward: 175 },
          { name: "Teach diatonic harmony clearly to a complete beginner", xpReward: 150 },
          { name: "Publish or perform an original composition publicly", xpReward: 200 },
        ],
      },
    ],
    achievements: [
      { name: "Sight-Reader", description: "Notation is no longer mysterious", icon: "🎵", trigger: { type: "subskill_mastered", subskillName: "Notation & Pitch" } },
      { name: "Bach Approved", description: "Counterpoint and voice leading mastered", icon: "📜", trigger: { type: "subskill_mastered", subskillName: "Voice Leading & Counterpoint" } },
      { name: "Trained Ear", description: "Hears what's happening", icon: "👂", trigger: { type: "subskill_mastered", subskillName: "Ear Training" } },
      { name: "Coltrane Analyst", description: "Jazz harmony makes sense now", icon: "🎷", trigger: { type: "subskill_mastered", subskillName: "Jazz & Modal Harmony" } },
      { name: "Atonal", description: "20th-century language is intelligible", icon: "🌀", trigger: { type: "subskill_mastered", subskillName: "20th & 21st Century" } },
      { name: "Composer", description: "Wrote a fugue", icon: "✍️", trigger: { type: "subskill_mastered", subskillName: "Composition" } },
      { name: "Journeyman Theorist", description: "Reached Journeyman", icon: "⚔️", trigger: { type: "stage_reached", stage: 3 } },
      { name: "Master Theorist", description: "Mastered every branch", icon: "👑", trigger: { type: "all_mastered" } },
    ],
  },
  {
    id: "archery",
    name: "Archery",
    description: "From your first arrow to Olympic-class accuracy",
    icon: "🏹",
    coverImage: DEFAULT_COVER_GRADIENT,
    coverKey: "archery",
    subskills: [
      {
        name: "Equipment & Safety",
        description: "Know your bow, your range, and the rules that keep everyone alive",
        milestones: [
          { name: "Pass an archery range safety briefing", xpReward: 50 },
          { name: "Identify all parts of a bow and arrow correctly", xpReward: 75 },
          { name: "String and unstring a recurve bow safely", xpReward: 100 },
          { name: "Set up an arrow correctly (nock, vanes, fletching)", xpReward: 75 },
          { name: "Choose appropriate draw weight and arrow spine for yourself", xpReward: 100 },
          { name: "Maintain your equipment (waxing string, replacing nocks/vanes)", xpReward: 100 },
        ],
      },

      {
        name: "Stance & Form Fundamentals",
        description: "The 11-step shot — the same way every time",
        prerequisiteNames: ["Equipment & Safety"],
        milestones: [
          { name: "Establish a consistent stance (square or open)", xpReward: 75 },
          { name: "Learn and apply the full archery shot sequence (NTS or USA Archery)", xpReward: 150 },
          { name: "Maintain a relaxed bow grip throughout the shot", xpReward: 100 },
          { name: "Anchor consistently to the same anchor point every shot", xpReward: 125 },
          { name: "Hold your bow arm steady through follow-through", xpReward: 100 },
          { name: "Shoot 100 arrows with consistent form (video-confirmed)", xpReward: 150 },
        ],
      },
      {
        name: "Aim & Release",
        description: "Where the arrow goes — the precise mechanics of the moment",
        prerequisiteNames: ["Stance & Form Fundamentals"],
        milestones: [
          { name: "Aim using a sight (or instinctively, depending on style)", xpReward: 100 },
          { name: "Achieve a clean back-tension release", xpReward: 150 },
          { name: "Group 6 arrows within a 30cm circle at 18m", xpReward: 125 },
          { name: "Group 6 arrows within a 20cm circle at 18m", xpReward: 150 },
          { name: "Group 6 arrows within a 15cm circle at 18m", xpReward: 175 },
          { name: "Identify and correct your most common form fault", xpReward: 100 },
        ],
      },

      {
        name: "Recurve / Olympic Style",
        description: "The Olympic bow — sights, stabilizers, clicker",
        prerequisiteNames: ["Aim & Release"],
        milestones: [
          { name: "Tune a recurve bow (centershot, nocking point, tiller)", xpReward: 150 },
          { name: "Use a clicker consistently for 30 shots", xpReward: 125 },
          { name: "Sight in at 18m (indoor distance)", xpReward: 100 },
          { name: "Sight in at 50m, 70m (outdoor)", xpReward: 150 },
          { name: "Shoot a 600+ score on an indoor 18m round", xpReward: 175 },
          { name: "Shoot a 600+ score on a 70m WA round", xpReward: 200 },
        ],
      },
      {
        name: "Compound",
        description: "Cams, peep, release aid — modern technical archery",
        prerequisiteNames: ["Aim & Release"],
        milestones: [
          { name: "Set draw length and draw weight on a compound bow", xpReward: 100 },
          { name: "Use a peep sight and scope properly", xpReward: 100 },
          { name: "Use a back-tension release aid cleanly", xpReward: 150 },
          { name: "Tune a compound bow (cam timing, paper-tune)", xpReward: 175 },
          { name: "Shoot 280+ on an indoor 18m round", xpReward: 175 },
        ],
      },
      {
        name: "Traditional / Barebow",
        description: "Longbow, recurve barebow, instinctive shooting — no sights",
        prerequisiteNames: ["Aim & Release"],
        milestones: [
          { name: "Shoot 100 arrows instinctively (no sight, gap, or string-walking)", xpReward: 125 },
          { name: "Group cleanly at 18m without a sight", xpReward: 150 },
          { name: "Learn and apply string-walking or gap shooting", xpReward: 125 },
          { name: "Shoot a longbow or self-bow", xpReward: 125 },
          { name: "Hit a moving or pop-up target", xpReward: 150 },
        ],
      },

      {
        name: "Field & 3D Archery",
        description: "Outside the indoor lane — uphill, downhill, judging distance",
        prerequisiteNames: ["Recurve / Olympic Style", "Traditional / Barebow"],
        milestones: [
          { name: "Shoot a 3D foam-target round", xpReward: 125 },
          { name: "Shoot a field archery course (varying distances and angles)", xpReward: 150 },
          { name: "Estimate unknown distance to within 10% accuracy", xpReward: 150 },
          { name: "Compensate for uphill / downhill shots correctly", xpReward: 125 },
          { name: "Shoot in poor weather (wind, rain) and adjust", xpReward: 125 },
        ],
      },

      {
        name: "Tournament Competition",
        description: "Pressure, clocks, scorecards",
        prerequisiteNames: ["Recurve / Olympic Style", "Compound"],
        milestones: [
          { name: "Enter your first archery tournament (any level)", xpReward: 150 },
          { name: "Score 90% of your practice average in competition", xpReward: 125 },
          { name: "Enter and score a 70m / 18m WA-rated event", xpReward: 150 },
          { name: "Place top 50% in your division", xpReward: 125 },
          { name: "Win a medal at any tournament", xpReward: 175 },
          { name: "Qualify for a national or regional championship", xpReward: 200 },
        ],
      },

      {
        name: "Mental Game & Coaching",
        description: "Archery is mostly mental — and teaching cements your own knowledge",
        prerequisiteNames: ["Tournament Competition"],
        milestones: [
          { name: "Develop a pre-shot mental routine and use it consistently", xpReward: 125 },
          { name: "Recover mentally from a missed arrow within the same end", xpReward: 100 },
          { name: "Read a book on archery mental performance (e.g. With Winning in Mind)", xpReward: 100 },
          { name: "Shoot under genuine pressure (timed, money, stakes)", xpReward: 150 },
          { name: "Coach a beginner through their first end", xpReward: 125 },
          { name: "Help an intermediate archer fix a form fault", xpReward: 125 },
        ],
      },

      {
        name: "Mastery — Olympic-Class Accuracy",
        description: "The capstone — Olympic-tier scores and complete tuning autonomy",
        prerequisiteNames: ["Recurve / Olympic Style", "Field & 3D Archery", "Mental Game & Coaching"],
        milestones: [
          { name: "Shoot 1300+ on a 1440 round (recurve)", xpReward: 250 },
          { name: "Shoot 320+ on an indoor 18m WA round (recurve)", xpReward: 250 },
          { name: "Tune your bow from scratch without help (paper, walk-back, bareshaft)", xpReward: 200 },
          { name: "Shoot 10,000+ arrows of dedicated practice", xpReward: 200 },
          { name: "Compete at a national-level championship", xpReward: 250 },
        ],
      },
    ],
    achievements: [
      { name: "First Bullseye", description: "First X in the gold", icon: "🎯", trigger: { type: "subskill_mastered", subskillName: "Aim & Release" } },
      { name: "Olympic Form", description: "Recurve and the clicker mastered", icon: "🏹", trigger: { type: "subskill_mastered", subskillName: "Recurve / Olympic Style" } },
      { name: "Instinctive", description: "Hit it without a sight", icon: "👁️", trigger: { type: "subskill_mastered", subskillName: "Traditional / Barebow" } },
      { name: "In the Field", description: "Outside the lane, making the shot", icon: "🌲", trigger: { type: "subskill_mastered", subskillName: "Field & 3D Archery" } },
      { name: "Competitor", description: "Won a medal in tournament play", icon: "🏆", trigger: { type: "subskill_mastered", subskillName: "Tournament Competition" } },
      { name: "Journeyman Archer", description: "Reached Journeyman", icon: "⚔️", trigger: { type: "stage_reached", stage: 3 } },
      { name: "Robin Hood", description: "Mastered every branch — Olympic-class", icon: "👑", trigger: { type: "all_mastered" } },
    ],
  },
  {
    id: "philosophy",
    name: "Philosophy",
    description: "From Plato's cave to writing your own — the great conversation, joined",
    icon: "🤔",
    coverImage: DEFAULT_COVER_GRADIENT,
    coverKey: "philosophy",
    subskills: [
      {
        name: "Logic & Argumentation",
        description: "How arguments work — and how they fail",
        milestones: [
          { name: "Identify all standard logical fallacies (ad hominem, straw man, etc.) on sight", xpReward: 100 },
          { name: "Translate natural-language arguments into propositional logic", xpReward: 125 },
          { name: "Use truth tables to test argument validity", xpReward: 125 },
          { name: "Use first-order predicate logic (quantifiers, predicates)", xpReward: 150 },
          { name: "Read and follow a published philosophical paper's argument", xpReward: 150 },
          { name: "Reconstruct an opposing argument better than its proponent (steelman)", xpReward: 125 },
          { name: "Read a logic textbook end-to-end (e.g. Hurley, Copi, or Bergmann)", xpReward: 175 },
        ],
      },

      // ANCIENT BRANCH
      {
        name: "Ancient Greek Philosophy",
        description: "Pre-Socratics, Plato, Aristotle — where it all started",
        prerequisiteNames: ["Logic & Argumentation"],
        milestones: [
          { name: "Read at least 3 Pre-Socratic fragments (Heraclitus, Parmenides, Anaxagoras)", xpReward: 100 },
          { name: "Read Plato's Apology, Crito, Phaedo (the Socratic death trilogy)", xpReward: 150 },
          { name: "Read Plato's Republic", xpReward: 175 },
          { name: "Read Plato's Symposium and Phaedrus", xpReward: 125 },
          { name: "Read Aristotle's Nicomachean Ethics (a major book)", xpReward: 175 },
          { name: "Read selections from Aristotle's Metaphysics or Politics", xpReward: 150 },
          { name: "Write a 1000-word essay on a Greek philosophical question", xpReward: 150 },
        ],
      },
      {
        name: "Hellenistic & Roman",
        description: "Stoics, Epicureans, Skeptics — philosophy as a way of life",
        prerequisiteNames: ["Ancient Greek Philosophy"],
        milestones: [
          { name: "Read Epictetus's Enchiridion or Discourses", xpReward: 125 },
          { name: "Read Marcus Aurelius's Meditations", xpReward: 125 },
          { name: "Read Seneca's Letters to Lucilius (substantial selection)", xpReward: 150 },
          { name: "Read Lucretius's De Rerum Natura (or Epicurus's surviving letters)", xpReward: 150 },
          { name: "Read Sextus Empiricus on Skepticism", xpReward: 125 },
          { name: "Apply one Stoic practice daily for 30 days (premeditatio, journaling, etc.)", xpReward: 125 },
        ],
      },

      // MEDIEVAL BRANCH
      {
        name: "Medieval Philosophy",
        description: "Augustine, Aquinas, Maimonides — faith and reason",
        prerequisiteNames: ["Ancient Greek Philosophy"],
        milestones: [
          { name: "Read Augustine's Confessions", xpReward: 175 },
          { name: "Read selections from Aquinas's Summa Theologica (the Five Ways, etc.)", xpReward: 175 },
          { name: "Read Anselm's Proslogion (the Ontological Argument)", xpReward: 100 },
          { name: "Read Maimonides's Guide for the Perplexed (selections)", xpReward: 150 },
          { name: "Read Boethius's Consolation of Philosophy", xpReward: 125 },
        ],
      },

      // MODERN BRANCH
      {
        name: "Modern Philosophy (1600–1800)",
        description: "Descartes through Kant — the rationalists, empiricists, and the Critique",
        prerequisiteNames: ["Logic & Argumentation"],
        milestones: [
          { name: "Read Descartes's Meditations on First Philosophy", xpReward: 150 },
          { name: "Read Spinoza's Ethics (or substantial selections)", xpReward: 200 },
          { name: "Read Hume's An Enquiry Concerning Human Understanding", xpReward: 150 },
          { name: "Read Locke's Essay or Second Treatise (selections)", xpReward: 150 },
          { name: "Read Kant's Prolegomena (or selections from the Critique)", xpReward: 200 },
          { name: "Read Rousseau's Discourses or Social Contract", xpReward: 125 },
          { name: "Write a 2000-word essay on a modern philosophical question", xpReward: 175 },
        ],
      },
      {
        name: "19th Century",
        description: "Hegel, Marx, Kierkegaard, Nietzsche — the explosion",
        prerequisiteNames: ["Modern Philosophy (1600–1800)"],
        milestones: [
          { name: "Read Hegel's Phenomenology of Spirit (selections — Master/Slave dialectic)", xpReward: 200 },
          { name: "Read Marx & Engels's Communist Manifesto + Capital selections", xpReward: 175 },
          { name: "Read Kierkegaard's Fear and Trembling", xpReward: 150 },
          { name: "Read Nietzsche's Genealogy of Morals", xpReward: 175 },
          { name: "Read Nietzsche's Thus Spoke Zarathustra or Beyond Good and Evil", xpReward: 175 },
          { name: "Read Mill's On Liberty or Utilitarianism", xpReward: 125 },
          { name: "Read Schopenhauer's World as Will and Representation (selections)", xpReward: 175 },
        ],
      },

      // CONTINENTAL
      {
        name: "20th Century Continental",
        description: "Phenomenology, existentialism, structuralism, post-structuralism",
        prerequisiteNames: ["19th Century"],
        milestones: [
          { name: "Read Heidegger's Being and Time (selections — Division I)", xpReward: 200 },
          { name: "Read Sartre's Being and Nothingness (selections) or Existentialism Is a Humanism", xpReward: 175 },
          { name: "Read Beauvoir's The Second Sex (selections) or The Ethics of Ambiguity", xpReward: 150 },
          { name: "Read Camus's The Myth of Sisyphus", xpReward: 125 },
          { name: "Read Foucault's Discipline and Punish (or another major work)", xpReward: 175 },
          { name: "Read Derrida's Of Grammatology (selections) or Of Hospitality", xpReward: 175 },
          { name: "Read Husserl's Cartesian Meditations or Ideas (selections)", xpReward: 175 },
        ],
      },

      // ANALYTIC
      {
        name: "Analytic Philosophy",
        description: "Frege, Russell, Wittgenstein, Quine — the linguistic-logical tradition",
        prerequisiteNames: ["Logic & Argumentation"],
        milestones: [
          { name: "Read Frege's On Sense and Reference", xpReward: 150 },
          { name: "Read Russell's The Problems of Philosophy", xpReward: 125 },
          { name: "Read Wittgenstein's Tractatus Logico-Philosophicus", xpReward: 200 },
          { name: "Read Wittgenstein's Philosophical Investigations (selections)", xpReward: 200 },
          { name: "Read Quine's Two Dogmas of Empiricism", xpReward: 150 },
          { name: "Read Kripke's Naming and Necessity (selections)", xpReward: 175 },
          { name: "Read a contemporary analytic monograph end-to-end", xpReward: 200 },
        ],
      },

      // EASTERN
      {
        name: "Eastern Philosophy",
        description: "Buddhism, Confucianism, Taoism, Hindu — non-Western traditions in depth",
        milestones: [
          { name: "Read selections from the Pali Suttas (e.g. Majjhima Nikaya)", xpReward: 175 },
          { name: "Read the Bhagavad Gita", xpReward: 125 },
          { name: "Read Confucius's Analects", xpReward: 125 },
          { name: "Read the Tao Te Ching (Lao Tzu) and Zhuangzi (selections)", xpReward: 150 },
          { name: "Read Nāgārjuna's Mūlamadhyamakakārikā (selections)", xpReward: 200 },
          { name: "Read a Zen text (Dōgen's Shōbōgenzō selections, or a Zen mind primer)", xpReward: 150 },
          { name: "Read a comparative philosophy text (East-West)", xpReward: 125 },
        ],
      },

      // BRANCHES
      {
        name: "Ethics",
        description: "How should we live? — applied + theoretical",
        prerequisiteNames: ["Modern Philosophy (1600–1800)"],
        milestones: [
          { name: "Understand and articulate the differences between consequentialism, deontology, and virtue ethics", xpReward: 125 },
          { name: "Read MacIntyre's After Virtue", xpReward: 175 },
          { name: "Read Rawls's A Theory of Justice (substantial selections)", xpReward: 200 },
          { name: "Read Singer's Practical Ethics (or Animal Liberation)", xpReward: 125 },
          { name: "Read a meta-ethics text (Mackie's Inventing Right and Wrong, or Parfit)", xpReward: 175 },
          { name: "Apply ethical reasoning to a real personal decision and document it", xpReward: 100 },
        ],
      },
      {
        name: "Philosophy of Mind",
        description: "What is consciousness? Are you a brain in a vat?",
        prerequisiteNames: ["Analytic Philosophy"],
        milestones: [
          { name: "Read Nagel's What Is It Like to Be a Bat?", xpReward: 100 },
          { name: "Read Chalmers's The Conscious Mind (selections)", xpReward: 175 },
          { name: "Read Dennett's Consciousness Explained (selections)", xpReward: 175 },
          { name: "Understand and articulate physicalism vs dualism vs functionalism", xpReward: 125 },
          { name: "Read a contemporary phil-of-mind monograph (e.g. Block, Tye, Carruthers)", xpReward: 175 },
          { name: "Engage with the AI consciousness question — write a position paper", xpReward: 150 },
        ],
      },
      {
        name: "Philosophy of Science",
        description: "What makes science science? Falsification, paradigms, realism",
        prerequisiteNames: ["Analytic Philosophy"],
        milestones: [
          { name: "Read Popper's The Logic of Scientific Discovery (selections)", xpReward: 175 },
          { name: "Read Kuhn's The Structure of Scientific Revolutions", xpReward: 175 },
          { name: "Read Lakatos's Methodology of Scientific Research Programmes", xpReward: 150 },
          { name: "Read Feyerabend's Against Method", xpReward: 150 },
          { name: "Engage with scientific realism vs anti-realism (van Fraassen, etc.)", xpReward: 150 },
          { name: "Apply phil-of-science thinking to a contemporary scientific debate", xpReward: 125 },
        ],
      },

      // CAPSTONE
      {
        name: "Original Writing & Conversation",
        description: "Don't just read — join the conversation",
        prerequisiteNames: ["Ethics", "Philosophy of Mind", "20th Century Continental", "Eastern Philosophy"],
        milestones: [
          { name: "Write a 5000-word original philosophical essay", xpReward: 200 },
          { name: "Defend your view in a serious philosophical conversation (recorded or in person)", xpReward: 150 },
          { name: "Change your mind on a major question due to reading or argument", xpReward: 175 },
          { name: "Publish or share your philosophical writing publicly", xpReward: 175 },
          { name: "Lead a reading group through a major text", xpReward: 200 },
          { name: "Develop and write down your own philosophical position on 'how to live'", xpReward: 250 },
        ],
      },
    ],
    achievements: [
      { name: "Logician", description: "Arguments hold no surprises", icon: "🧠", trigger: { type: "subskill_mastered", subskillName: "Logic & Argumentation" } },
      { name: "Plato's Cave", description: "Read the foundational Greek texts", icon: "🏛️", trigger: { type: "subskill_mastered", subskillName: "Ancient Greek Philosophy" } },
      { name: "Critic of Pure Reason", description: "Modern philosophy through Kant — read", icon: "📜", trigger: { type: "subskill_mastered", subskillName: "Modern Philosophy (1600–1800)" } },
      { name: "Existential", description: "20th-century continental in your bones", icon: "🌌", trigger: { type: "subskill_mastered", subskillName: "20th Century Continental" } },
      { name: "Linguistic Turn", description: "Wittgenstein both early and late", icon: "🔍", trigger: { type: "subskill_mastered", subskillName: "Analytic Philosophy" } },
      { name: "East Meets West", description: "Buddhism, Taoism, Hindu philosophy — read deeply", icon: "☯️", trigger: { type: "subskill_mastered", subskillName: "Eastern Philosophy" } },
      { name: "Journeyman Philosopher", description: "Reached Journeyman", icon: "⚔️", trigger: { type: "stage_reached", stage: 3 } },
      { name: "Philosopher", description: "Mastered every branch — joined the conversation", icon: "👑", trigger: { type: "all_mastered" } },
    ],
  },
  {
    id: "electronics",
    name: "Electronics & Soldering",
    description: "From Ohm's Law to designing your own PCBs",
    icon: "🔧",
    coverImage: DEFAULT_COVER_GRADIENT,
    coverKey: "electronics",
    subskills: [
      {
        name: "Theory Foundations",
        description: "Voltage, current, resistance — the laws underneath everything",
        milestones: [
          { name: "Apply Ohm's Law to solve 10 practice problems", xpReward: 75 },
          { name: "Apply Kirchhoff's voltage and current laws correctly", xpReward: 100 },
          { name: "Calculate equivalent resistance for series and parallel networks", xpReward: 100 },
          { name: "Understand and use voltage dividers and current dividers", xpReward: 100 },
          { name: "Read a basic schematic and identify all component symbols", xpReward: 125 },
          { name: "Read a foundational text (Practical Electronics for Inventors, or Art of Electronics ch. 1)", xpReward: 150 },
        ],
      },

      {
        name: "Hand Tools & Soldering",
        description: "The skill that turns paper designs into real circuits",
        prerequisiteNames: ["Theory Foundations"],
        milestones: [
          { name: "Set up a soldering station correctly (temperature, tip, sponge, fume extraction)", xpReward: 75 },
          { name: "Solder 10 through-hole joints cleanly (shiny, conical, no cold joints)", xpReward: 100 },
          { name: "Solder a perfboard project end-to-end", xpReward: 125 },
          { name: "Use desoldering pump and braid to remove components cleanly", xpReward: 100 },
          { name: "Reflow a damaged joint correctly", xpReward: 100 },
          { name: "Solder a header onto a microcontroller board cleanly", xpReward: 100 },
        ],
      },

      {
        name: "Component Knowledge",
        description: "Resistors, capacitors, diodes, transistors — what they do and how to choose them",
        prerequisiteNames: ["Theory Foundations"],
        milestones: [
          { name: "Identify SMD and through-hole resistor values from markings", xpReward: 100 },
          { name: "Choose appropriate capacitor types for filtering, decoupling, timing", xpReward: 125 },
          { name: "Use diodes for rectification, protection, and as voltage references", xpReward: 100 },
          { name: "Use BJTs in switch and amplifier configurations", xpReward: 150 },
          { name: "Use MOSFETs as switches and amplifiers", xpReward: 150 },
          { name: "Use op-amps in inverting, non-inverting, and comparator configurations", xpReward: 150 },
          { name: "Read a real-world IC datasheet end-to-end", xpReward: 125 },
        ],
      },

      {
        name: "Breadboarding & Prototyping",
        description: "Build circuits before you commit to soldering",
        prerequisiteNames: ["Component Knowledge"],
        milestones: [
          { name: "Build and test a simple LED circuit on a breadboard", xpReward: 50 },
          { name: "Build a 555-timer astable circuit", xpReward: 100 },
          { name: "Build an op-amp audio amplifier circuit", xpReward: 125 },
          { name: "Build a power-supply circuit (linear regulator, transformer + bridge rectifier)", xpReward: 150 },
          { name: "Debug a non-working circuit with a multimeter", xpReward: 125 },
          { name: "Build 10 complete projects from schematics", xpReward: 175 },
        ],
      },

      {
        name: "Test & Measurement",
        description: "Multimeter, oscilloscope, logic analyzer — see what's actually happening",
        prerequisiteNames: ["Breadboarding & Prototyping"],
        milestones: [
          { name: "Use a multimeter for V, I, R, continuity, diode test", xpReward: 100 },
          { name: "Use an oscilloscope to measure signal frequency, period, amplitude", xpReward: 125 },
          { name: "Use the oscilloscope's trigger correctly", xpReward: 125 },
          { name: "Use a logic analyzer to debug a digital signal (I2C or SPI)", xpReward: 150 },
          { name: "Use a function generator to test a circuit's response", xpReward: 100 },
          { name: "Use a bench power supply with current limit set correctly", xpReward: 75 },
        ],
      },

      {
        name: "Microcontrollers — Arduino",
        description: "Make circuits that DO things",
        prerequisiteNames: ["Breadboarding & Prototyping"],
        milestones: [
          { name: "Blink an LED on an Arduino", xpReward: 50 },
          { name: "Read an analog sensor (potentiometer, photoresistor) and act on it", xpReward: 100 },
          { name: "Use I2C to talk to a sensor (e.g. BMP280, MPU6050)", xpReward: 150 },
          { name: "Use SPI to talk to a peripheral", xpReward: 125 },
          { name: "Use serial communication for debugging and data logging", xpReward: 100 },
          { name: "Build a complete project with a sensor, processing, and an output (display, motor, etc.)", xpReward: 175 },
          { name: "Move from Arduino IDE to a more serious environment (PlatformIO + bare-metal C, or ARM toolchain)", xpReward: 150 },
        ],
      },

      {
        name: "Single-Board Computers",
        description: "Raspberry Pi & friends — Linux meets electronics",
        prerequisiteNames: ["Microcontrollers — Arduino"],
        milestones: [
          { name: "Boot a Raspberry Pi from scratch (or another SBC)", xpReward: 75 },
          { name: "Control GPIO from Python or Bash", xpReward: 100 },
          { name: "Use a camera or audio input on the SBC", xpReward: 125 },
          { name: "Build a network-connected project (HTTP, MQTT, etc.)", xpReward: 150 },
          { name: "Use the SBC as a headless server (SSH, systemd service)", xpReward: 125 },
        ],
      },

      {
        name: "PCB Design",
        description: "From schematic to manufactured board",
        prerequisiteNames: ["Component Knowledge", "Test & Measurement"],
        milestones: [
          { name: "Install KiCad (or another PCB CAD) and complete the official tutorial", xpReward: 100 },
          { name: "Design a single-sided PCB for a simple analog circuit", xpReward: 150 },
          { name: "Design a 2-layer PCB with proper grounding and trace widths", xpReward: 175 },
          { name: "Order PCBs from a fab (JLCPCB, OSHPark, PCBWay)", xpReward: 100 },
          { name: "Bring up your own PCB and verify it works", xpReward: 200 },
          { name: "Design a 4-layer PCB with controlled impedance for high-speed signals", xpReward: 250 },
        ],
      },

      {
        name: "Surface-Mount (SMD) Soldering",
        description: "Tiny components, hot air, magnification — modern PCBs",
        prerequisiteNames: ["Hand Tools & Soldering"],
        milestones: [
          { name: "Hand-solder a 0805 SMD resistor or capacitor", xpReward: 100 },
          { name: "Hand-solder a 0603 component", xpReward: 125 },
          { name: "Hand-solder an SOIC-8 IC with no bridges", xpReward: 150 },
          { name: "Use solder paste, stencils, and a hot-air rework station", xpReward: 175 },
          { name: "Reflow an SMD board successfully", xpReward: 175 },
          { name: "Rework a damaged BGA or QFN package", xpReward: 250 },
        ],
      },

      {
        name: "Project Builds",
        description: "Real things that solve real problems",
        prerequisiteNames: ["Microcontrollers — Arduino", "PCB Design"],
        milestones: [
          { name: "Build a complete project from your own schematic and PCB", xpReward: 200 },
          { name: "Build a project that solves a real problem in your life", xpReward: 175 },
          { name: "Build a project with battery management and proper power budget", xpReward: 200 },
          { name: "Build a project with a custom enclosure (3D-printed or laser-cut)", xpReward: 175 },
          { name: "Document a project well enough that someone else could rebuild it", xpReward: 175 },
          { name: "Publish a project (GitHub, Hackaday, blog) and get feedback", xpReward: 200 },
        ],
      },

      {
        name: "Mastery — From Idea to Production",
        description: "Take an idea all the way to a finished product someone uses",
        prerequisiteNames: ["Project Builds", "Surface-Mount (SMD) Soldering", "Single-Board Computers"],
        milestones: [
          { name: "Read Horowitz & Hill's Art of Electronics (substantial portion)", xpReward: 250 },
          { name: "Design a circuit with proper EMC/EMI consideration", xpReward: 200 },
          { name: "Build a product with safety-critical considerations (mains voltage, batteries, RF)", xpReward: 200 },
          { name: "Build something used by people other than you", xpReward: 250 },
          { name: "Help someone else build their first project", xpReward: 150 },
        ],
      },
    ],
    achievements: [
      { name: "Ohm's Law", description: "The theory is now intuition", icon: "⚡", trigger: { type: "subskill_mastered", subskillName: "Theory Foundations" } },
      { name: "Iron in Hand", description: "Solder joints are clean and fast", icon: "🔥", trigger: { type: "subskill_mastered", subskillName: "Hand Tools & Soldering" } },
      { name: "Scope Vision", description: "You can SEE what circuits are doing", icon: "📈", trigger: { type: "subskill_mastered", subskillName: "Test & Measurement" } },
      { name: "Microcontroller Whisperer", description: "Sensors, displays, motors — all yours", icon: "🤖", trigger: { type: "subskill_mastered", subskillName: "Microcontrollers — Arduino" } },
      { name: "PCB Designer", description: "Made your own boards, fab'd, brought up", icon: "🟢", trigger: { type: "subskill_mastered", subskillName: "PCB Design" } },
      { name: "SMD Surgeon", description: "Reflow station + 0603 components, no problem", icon: "🔬", trigger: { type: "subskill_mastered", subskillName: "Surface-Mount (SMD) Soldering" } },
      { name: "Journeyman Electrician", description: "Reached Journeyman", icon: "⚔️", trigger: { type: "stage_reached", stage: 3 } },
      { name: "Hardware Hacker", description: "Mastered every branch — idea to production", icon: "👑", trigger: { type: "all_mastered" } },
    ],
  },
  {
    id: "woodworking",
    name: "Woodworking",
    description: "From workshop setup to a chair you'd hand down to a grandchild",
    icon: "🪚",
    coverImage: DEFAULT_COVER_GRADIENT,
    coverKey: "woodworking",
    subskills: [
      {
        name: "Workshop Setup & Safety",
        description: "A safe space to work — and the discipline to keep all 10 fingers",
        milestones: [
          { name: "Set up a dedicated work area with a real workbench and vise", xpReward: 100 },
          { name: "Acquire and use eye, ear, and lung PPE consistently", xpReward: 75 },
          { name: "Set up dust collection and ventilation appropriate to your tools", xpReward: 125 },
          { name: "Read and follow a comprehensive shop safety guide", xpReward: 75 },
          { name: "Maintain a clean shop and tool-storage system", xpReward: 100 },
          { name: "Identify and safely respond to all major workshop hazards", xpReward: 100 },
        ],
      },

      {
        name: "Hand Tools",
        description: "Saws, planes, chisels — the heart of fine woodworking",
        prerequisiteNames: ["Workshop Setup & Safety"],
        milestones: [
          { name: "Cross-cut and rip-cut accurately with a hand saw", xpReward: 100 },
          { name: "Tune a hand plane (sole flatness, blade sharpness, mouth) and produce thin shavings", xpReward: 150 },
          { name: "Pare and chop accurately with chisels", xpReward: 100 },
          { name: "Make a square reference edge with a hand plane", xpReward: 125 },
          { name: "Hand-saw to a marked line within 1mm consistently", xpReward: 125 },
          { name: "Build a small project entirely with hand tools", xpReward: 175 },
        ],
      },

      {
        name: "Power Tools",
        description: "Drills, sanders, routers, jigsaws — fast and accurate when used right",
        prerequisiteNames: ["Workshop Setup & Safety"],
        milestones: [
          { name: "Use a cordless drill / impact driver competently", xpReward: 50 },
          { name: "Use a router for edge profiles and dadoes", xpReward: 125 },
          { name: "Use a circular saw with a guide for accurate cuts", xpReward: 100 },
          { name: "Use a jigsaw for curved cuts", xpReward: 75 },
          { name: "Use a random-orbit sander through proper grit progression", xpReward: 100 },
          { name: "Use a track saw for sheet goods", xpReward: 125 },
        ],
      },
      {
        name: "Stationary Power Tools",
        description: "Table saw, band saw, jointer, planer, drill press — the shop fleet",
        prerequisiteNames: ["Power Tools"],
        milestones: [
          { name: "Set up and use a table saw safely (riving knife, push sticks, no kickback)", xpReward: 175 },
          { name: "Use a band saw for resawing and curve cutting", xpReward: 150 },
          { name: "Joint and plane rough lumber to S4S", xpReward: 175 },
          { name: "Use a drill press accurately for mortises and through-holes", xpReward: 100 },
          { name: "Use a router table for raised panels or dovetails", xpReward: 150 },
          { name: "Set up a miter saw for accurate compound cuts", xpReward: 100 },
        ],
      },

      {
        name: "Sharpening & Tool Maintenance",
        description: "Sharp tools make safe woodworkers",
        prerequisiteNames: ["Hand Tools"],
        milestones: [
          { name: "Sharpen a chisel to shaving-sharp edge", xpReward: 100 },
          { name: "Sharpen a plane iron flat and razor-edged", xpReward: 125 },
          { name: "Tune up a hand saw (set teeth, sharpen)", xpReward: 150 },
          { name: "Use a sharpening system consistently (waterstones, oil stones, scary sharp, or jig)", xpReward: 125 },
          { name: "Maintain power-tool blades and bits (clean, sharpen, replace)", xpReward: 100 },
        ],
      },

      {
        name: "Wood Knowledge",
        description: "Species, grain, movement, defects — the material itself",
        prerequisiteNames: ["Workshop Setup & Safety"],
        milestones: [
          { name: "Identify 10 common wood species by sight, smell, and weight", xpReward: 100 },
          { name: "Understand grain orientation and how to lay out parts for stability", xpReward: 125 },
          { name: "Understand wood movement (radial vs tangential vs longitudinal)", xpReward: 125 },
          { name: "Read a board for defects, tension, and best yield", xpReward: 100 },
          { name: "Source rough lumber from a real lumberyard (not big-box)", xpReward: 100 },
          { name: "Buy and process green wood (drying, stickering, milling)", xpReward: 175 },
        ],
      },

      {
        name: "Joinery",
        description: "How wood joins wood — the soul of a piece",
        prerequisiteNames: ["Hand Tools"],
        milestones: [
          { name: "Cut a clean butt joint and a glue-up that doesn't fail", xpReward: 75 },
          { name: "Cut a clean rabbet and dado", xpReward: 100 },
          { name: "Cut a hand-cut mortise-and-tenon joint that fits without slop", xpReward: 175 },
          { name: "Cut hand-cut through dovetails", xpReward: 200 },
          { name: "Cut hand-cut half-blind dovetails (drawer-front quality)", xpReward: 225 },
          { name: "Cut a sliding dovetail or finger joint", xpReward: 150 },
          { name: "Use traditional joinery in a piece (no metal fasteners)", xpReward: 200 },
        ],
      },

      {
        name: "Finishing",
        description: "What protects the wood and reveals its beauty",
        prerequisiteNames: ["Hand Tools"],
        milestones: [
          { name: "Sand a surface flawlessly through grit progression", xpReward: 100 },
          { name: "Apply a clear oil finish (tung, Danish, or linseed)", xpReward: 100 },
          { name: "Apply shellac with a brush or rubbing pad", xpReward: 150 },
          { name: "Apply a film finish (lacquer, polyurethane, or varnish) without runs", xpReward: 150 },
          { name: "Stain or dye wood evenly without blotching", xpReward: 125 },
          { name: "Use grain filler on open-pore woods (oak, walnut)", xpReward: 125 },
          { name: "Apply a French polish to a small piece", xpReward: 200 },
        ],
      },

      {
        name: "Design & Drafting",
        description: "Plan before you cut",
        prerequisiteNames: ["Wood Knowledge"],
        milestones: [
          { name: "Draw a full-scale plan of a piece by hand (orthographic + perspective)", xpReward: 125 },
          { name: "Use SketchUp, Fusion, or another CAD for a furniture design", xpReward: 150 },
          { name: "Build a prototype before the final piece", xpReward: 100 },
          { name: "Design a piece that matches your style (not a copy from a magazine)", xpReward: 175 },
          { name: "Calculate a cutting list and lumber requirements correctly from a plan", xpReward: 100 },
        ],
      },

      {
        name: "Furniture — Beginner Pieces",
        description: "First real things you'd put in a home",
        prerequisiteNames: ["Joinery", "Finishing"],
        milestones: [
          { name: "Build a small box with a hinged lid", xpReward: 100 },
          { name: "Build a simple bookshelf (with proper joinery, no L-brackets)", xpReward: 150 },
          { name: "Build a small side table", xpReward: 175 },
          { name: "Build a stool", xpReward: 175 },
          { name: "Build a cutting board with end-grain or pattern work", xpReward: 100 },
        ],
      },
      {
        name: "Furniture — Intermediate Pieces",
        description: "Pieces that test you",
        prerequisiteNames: ["Furniture — Beginner Pieces", "Stationary Power Tools"],
        milestones: [
          { name: "Build a chair (the hardest 'normal' piece)", xpReward: 250 },
          { name: "Build a dining table or workbench", xpReward: 225 },
          { name: "Build a chest of drawers (with proper drawer construction)", xpReward: 250 },
          { name: "Build a cabinet with doors that fit and stay aligned", xpReward: 225 },
          { name: "Build a piece with curved or bent components (steam-bent or laminated)", xpReward: 225 },
        ],
      },

      {
        name: "Carving & Turning",
        description: "Beyond flat — the lathe and the gouge",
        prerequisiteNames: ["Sharpening & Tool Maintenance"],
        milestones: [
          { name: "Carve a simple relief design with chisels and gouges", xpReward: 150 },
          { name: "Turn a basic spindle (chair leg, bowl spindle) on a lathe", xpReward: 175 },
          { name: "Turn a bowl from a green log", xpReward: 200 },
          { name: "Carve a spoon or kuksa from a single piece of wood", xpReward: 125 },
          { name: "Use a drawknife and spokeshave proficiently", xpReward: 125 },
        ],
      },

      {
        name: "Mastery — A Piece for the Generations",
        description: "The capstone — heirloom-quality work",
        prerequisiteNames: ["Furniture — Intermediate Pieces", "Design & Drafting", "Wood Knowledge"],
        milestones: [
          { name: "Read a foundational furniture-making text end-to-end (Hayward, Krenov, Roy Underhill)", xpReward: 200 },
          { name: "Design and build a piece entirely of your own design (no plans)", xpReward: 250 },
          { name: "Build something a customer pays for", xpReward: 250 },
          { name: "Build a piece that uses 5+ joinery techniques in one work", xpReward: 250 },
          { name: "Build something you'd hand down to a grandchild", xpReward: 300 },
          { name: "Teach someone else to build their first project", xpReward: 175 },
        ],
      },
    ],
    achievements: [
      { name: "Safe Shop", description: "All 10 fingers, every time", icon: "🦺", trigger: { type: "subskill_mastered", subskillName: "Workshop Setup & Safety" } },
      { name: "Sharp Edges", description: "Hand tools sing", icon: "🪒", trigger: { type: "subskill_mastered", subskillName: "Hand Tools" } },
      { name: "Joiner", description: "Wood meets wood — beautifully", icon: "🪵", trigger: { type: "subskill_mastered", subskillName: "Joinery" } },
      { name: "Finisher", description: "What you finish makes the piece", icon: "🎨", trigger: { type: "subskill_mastered", subskillName: "Finishing" } },
      { name: "First Real Piece", description: "Built furniture good enough to live with", icon: "🪑", trigger: { type: "subskill_mastered", subskillName: "Furniture — Beginner Pieces" } },
      { name: "The Chair", description: "Built the hardest normal piece", icon: "🏛️", trigger: { type: "subskill_mastered", subskillName: "Furniture — Intermediate Pieces" } },
      { name: "Journeyman Woodworker", description: "Reached Journeyman", icon: "⚔️", trigger: { type: "stage_reached", stage: 3 } },
      { name: "Master Craftsman", description: "Mastered every branch — a piece for the generations", icon: "👑", trigger: { type: "all_mastered" } },
    ],
  },
  {
    id: "reading",
    name: "Reading",
    description: "From sluggish reader to a real reading life — speed, depth, breadth, retention",
    icon: "📚",
    coverImage: DEFAULT_COVER_GRADIENT,
    coverKey: "reading",
    subskills: [
      {
        name: "Reading Habit",
        description: "Books actually read, every day, for life",
        milestones: [
          { name: "Read every day for 30 consecutive days (any amount)", xpReward: 75 },
          { name: "Read every day for 90 consecutive days", xpReward: 100 },
          { name: "Finish 12 books in one calendar year", xpReward: 125 },
          { name: "Finish 25 books in one year", xpReward: 150 },
          { name: "Finish 50 books in one year", xpReward: 175 },
          { name: "Read for 1 hour without checking your phone", xpReward: 100 },
          { name: "Build a personal library of 100+ owned books", xpReward: 100 },
        ],
      },

      {
        name: "Active Reading & Note-Taking",
        description: "Read like you mean it — marginalia, summaries, retention",
        prerequisiteNames: ["Reading Habit"],
        milestones: [
          { name: "Read with pen-in-hand: marginalia and underlines on every page", xpReward: 100 },
          { name: "Write a 1-page summary after every book for 10 books straight", xpReward: 125 },
          { name: "Build a Zettelkasten / Obsidian / commonplace book", xpReward: 125 },
          { name: "Re-read a book and write a deeper second-pass summary", xpReward: 100 },
          { name: "Read 'How to Read a Book' (Adler & Van Doren) and apply each level", xpReward: 150 },
          { name: "Maintain a reading journal for 6 months", xpReward: 150 },
        ],
      },

      {
        name: "Speed Reading",
        description: "Read faster without losing comprehension",
        prerequisiteNames: ["Reading Habit"],
        milestones: [
          { name: "Measure your baseline reading speed and comprehension (WPM + quiz)", xpReward: 50 },
          { name: "Eliminate sub-vocalization on simple texts", xpReward: 100 },
          { name: "Read at 400+ WPM with 70%+ comprehension on non-fiction", xpReward: 125 },
          { name: "Read at 600+ WPM with 70%+ comprehension on familiar material", xpReward: 150 },
          { name: "Skim a book in 30 minutes and explain its argument correctly", xpReward: 125 },
          { name: "Choose appropriately between skim, study, and slow-read for each book", xpReward: 100 },
        ],
      },

      {
        name: "Fiction — Modern Classics",
        description: "The 20th-century canon",
        prerequisiteNames: ["Reading Habit"],
        milestones: [
          { name: "Read a Hemingway, Fitzgerald, OR Steinbeck novel", xpReward: 100 },
          { name: "Read Orwell — both 1984 and Animal Farm", xpReward: 100 },
          { name: "Read a Faulkner or Nabokov novel", xpReward: 150 },
          { name: "Read a Toni Morrison novel", xpReward: 125 },
          { name: "Read a Borges or García Márquez collection / novel", xpReward: 125 },
          { name: "Read a Murakami novel", xpReward: 100 },
          { name: "Read a Cormac McCarthy novel", xpReward: 125 },
          { name: "Read a Kazuo Ishiguro novel", xpReward: 100 },
        ],
      },
      {
        name: "Fiction — The Western Canon",
        description: "The deep classics — what every literate person should sample",
        prerequisiteNames: ["Fiction — Modern Classics"],
        milestones: [
          { name: "Read Homer's Iliad OR Odyssey (any good translation)", xpReward: 175 },
          { name: "Read at least one Greek tragedy (Aeschylus, Sophocles, Euripides)", xpReward: 125 },
          { name: "Read Dante's Inferno", xpReward: 175 },
          { name: "Read at least one Shakespeare tragedy AND one comedy", xpReward: 150 },
          { name: "Read a Dostoevsky novel (Crime and Punishment, Brothers Karamazov)", xpReward: 200 },
          { name: "Read a Tolstoy novel (Anna Karenina or War and Peace)", xpReward: 250 },
          { name: "Read Don Quixote (abridged or full)", xpReward: 200 },
          { name: "Read Moby-Dick", xpReward: 200 },
        ],
      },
      {
        name: "Fiction — World Literature",
        description: "Beyond the Anglosphere — non-Western masterworks",
        prerequisiteNames: ["Fiction — Modern Classics"],
        milestones: [
          { name: "Read a Japanese classic (Tale of Genji, Kawabata, Mishima)", xpReward: 150 },
          { name: "Read a Chinese classic (Journey to the West, Dream of the Red Chamber, Lu Xun)", xpReward: 150 },
          { name: "Read an Indian classic (R.K. Narayan, Tagore, or the Mahabharata)", xpReward: 125 },
          { name: "Read an African novel (Achebe, Adichie, Ngũgĩ)", xpReward: 125 },
          { name: "Read a Latin American 'boom' novel (Cortázar, Vargas Llosa, Fuentes)", xpReward: 125 },
          { name: "Read a Middle Eastern classic (Mahfouz, Pamuk, Khaled Hosseini)", xpReward: 125 },
        ],
      },
      {
        name: "Poetry",
        description: "Slow down and listen",
        prerequisiteNames: ["Reading Habit"],
        milestones: [
          { name: "Read a complete collected works of one poet you like", xpReward: 125 },
          { name: "Memorize and recite a poem of 14+ lines", xpReward: 100 },
          { name: "Read poetry from 5 different centuries", xpReward: 125 },
          { name: "Read a long-form poem (Paradise Lost, The Wasteland, Song of Myself)", xpReward: 150 },
          { name: "Read poetry in translation alongside the original (any language)", xpReward: 125 },
        ],
      },

      {
        name: "Non-Fiction — Foundational",
        description: "The non-fiction shelf every serious reader should clear",
        prerequisiteNames: ["Active Reading & Note-Taking"],
        milestones: [
          { name: "Read a serious popular-science book (Sagan, Hofstadter, Dawkins)", xpReward: 125 },
          { name: "Read a foundational economics text (Smith's Wealth, Keynes, Hayek, or a serious primer)", xpReward: 150 },
          { name: "Read a serious history book (not pop)", xpReward: 125 },
          { name: "Read a foundational philosophy text (Plato, Aurelius, Nietzsche, or modern)", xpReward: 150 },
          { name: "Read a foundational biography (Plutarch, a Caro volume, Manchester)", xpReward: 150 },
          { name: "Read 'Thinking, Fast and Slow' by Kahneman", xpReward: 125 },
          { name: "Read 'The Beginning of Infinity' or 'Sapiens' or 'Guns, Germs, and Steel'", xpReward: 125 },
        ],
      },

      {
        name: "Reading in a Foreign Language",
        description: "Books in their original language",
        prerequisiteNames: ["Active Reading & Note-Taking"],
        milestones: [
          { name: "Finish a children's book in another language", xpReward: 100 },
          { name: "Finish a novel in another language with dictionary help", xpReward: 150 },
          { name: "Finish a novel in another language without a dictionary", xpReward: 175 },
          { name: "Read a serious non-fiction book in another language", xpReward: 200 },
          { name: "Read a classic in its original language (Russian, French, Spanish, Latin, etc.)", xpReward: 250 },
        ],
      },

      {
        name: "Reading in Public",
        description: "Discuss, share, and shape what you read",
        prerequisiteNames: ["Active Reading & Note-Taking", "Non-Fiction — Foundational"],
        milestones: [
          { name: "Join or start a book club", xpReward: 100 },
          { name: "Lead one book-club discussion", xpReward: 125 },
          { name: "Write and publish a book review (blog, Goodreads, anywhere)", xpReward: 100 },
          { name: "Recommend a book that becomes a friend's favorite", xpReward: 125 },
          { name: "Maintain a public reading list / blog for 1 year", xpReward: 175 },
          { name: "Give a talk or write a long-form essay synthesizing several books on a theme", xpReward: 200 },
        ],
      },

      {
        name: "Mastery — A Reading Life",
        description: "The capstone — reading is who you are now",
        prerequisiteNames: ["Fiction — The Western Canon", "Fiction — World Literature", "Non-Fiction — Foundational", "Reading in Public"],
        milestones: [
          { name: "Read 500 books total (lifetime count)", xpReward: 250 },
          { name: "Read 1,000 books total", xpReward: 300 },
          { name: "Re-read a book 10 years after first reading and notice you've changed", xpReward: 150 },
          { name: "Read a book 'over your head' that you genuinely don't understand, then read it again until you do", xpReward: 200 },
          { name: "Help someone fall in love with reading who didn't before", xpReward: 200 },
          { name: "Write your own personal reading list / canon", xpReward: 175 },
        ],
      },
    ],
    achievements: [
      { name: "Daily Reader", description: "90 days unbroken", icon: "📖", trigger: { type: "subskill_mastered", subskillName: "Reading Habit" } },
      { name: "Active Reader", description: "Read with pen and notebook in hand", icon: "✏️", trigger: { type: "subskill_mastered", subskillName: "Active Reading & Note-Taking" } },
      { name: "Speed", description: "400+ WPM, comprehension intact", icon: "⚡", trigger: { type: "subskill_mastered", subskillName: "Speed Reading" } },
      { name: "Canonist", description: "Sampled the Western canon", icon: "🏛️", trigger: { type: "subskill_mastered", subskillName: "Fiction — The Western Canon" } },
      { name: "World Reader", description: "Beyond the Anglosphere", icon: "🌍", trigger: { type: "subskill_mastered", subskillName: "Fiction — World Literature" } },
      { name: "Public Reader", description: "Reading shared with others", icon: "🗣️", trigger: { type: "subskill_mastered", subskillName: "Reading in Public" } },
      { name: "Journeyman Reader", description: "Reached Journeyman", icon: "⚔️", trigger: { type: "stage_reached", stage: 3 } },
      { name: "A Reading Life", description: "Mastered every branch — reading is who you are", icon: "👑", trigger: { type: "all_mastered" } },
    ],
  },
  {
    id: "memory",
    name: "Memory & Mnemonics",
    description: "From a normal memory to memory-athlete tools — and a richer mind for it",
    icon: "🧠",
    coverImage: DEFAULT_COVER_GRADIENT,
    coverKey: "memory",
    subskills: [
      {
        name: "Foundations",
        description: "How memory actually works — encoding, storage, retrieval",
        milestones: [
          { name: "Read 'Moonwalking with Einstein' (Joshua Foer)", xpReward: 100 },
          { name: "Read 'Make It Stick' (Brown, Roediger, McDaniel)", xpReward: 125 },
          { name: "Understand and articulate spaced repetition, interleaving, and retrieval practice", xpReward: 100 },
          { name: "Test your raw working-memory span (digit span, n-back baseline)", xpReward: 75 },
          { name: "Identify your strongest memory modality (visual / auditory / kinesthetic)", xpReward: 75 },
          { name: "Set up a daily memory practice routine", xpReward: 100 },
        ],
      },

      {
        name: "Method of Loci (Memory Palaces)",
        description: "The 2,500-year-old technique that still beats everything",
        prerequisiteNames: ["Foundations"],
        milestones: [
          { name: "Build your first memory palace from your home (10+ stations)", xpReward: 125 },
          { name: "Memorize a 20-item shopping list and recall it 24 hours later", xpReward: 100 },
          { name: "Memorize the order of a deck of 20 cards using a palace", xpReward: 150 },
          { name: "Memorize a full 52-card deck in under 10 minutes", xpReward: 200 },
          { name: "Build 5 distinct palaces in different locations", xpReward: 125 },
          { name: "Use a memory palace to memorize a speech of 1000+ words", xpReward: 175 },
          { name: "Use the same palace twice without 'ghost' interference", xpReward: 125 },
        ],
      },

      {
        name: "Number Memory",
        description: "Major system, PAO, deep number recall",
        prerequisiteNames: ["Method of Loci (Memory Palaces)"],
        milestones: [
          { name: "Learn the Major System (0–99 → consonants)", xpReward: 125 },
          { name: "Memorize a 20-digit number using the Major System", xpReward: 125 },
          { name: "Build a personal Person-Action-Object (PAO) system for 00-99", xpReward: 200 },
          { name: "Memorize a 50-digit number using PAO + palace", xpReward: 175 },
          { name: "Memorize a 100-digit number", xpReward: 200 },
          { name: "Memorize the first 100 digits of π using PAO + palace", xpReward: 200 },
          { name: "Memorize the first 500 digits of π", xpReward: 300 },
        ],
      },

      {
        name: "Card Memory",
        description: "Decks, deck order, dealer's tools",
        prerequisiteNames: ["Method of Loci (Memory Palaces)"],
        milestones: [
          { name: "Memorize a shuffled 52-card deck in 10 minutes", xpReward: 150 },
          { name: "Memorize a shuffled 52-card deck in 5 minutes", xpReward: 200 },
          { name: "Memorize a deck under 2 minutes", xpReward: 250 },
          { name: "Memorize a deck under 60 seconds", xpReward: 300 },
          { name: "Build a card image system (PAO for cards, or single images per card)", xpReward: 200 },
          { name: "Memorize 3 decks in a row in one session", xpReward: 250 },
        ],
      },

      {
        name: "Names & Faces",
        description: "The most useful real-world memory skill",
        prerequisiteNames: ["Foundations"],
        milestones: [
          { name: "Use a deliberate name-encoding strategy on 5 new people in a week", xpReward: 100 },
          { name: "Remember 20 people's names from a single event the next day", xpReward: 150 },
          { name: "Remember the names AND a personal detail for 50 people you've met", xpReward: 175 },
          { name: "Recall a name you haven't said in 6 months when you see the face again", xpReward: 100 },
        ],
      },

      {
        name: "Languages & Vocabulary",
        description: "Use mnemonics to actually retain words",
        prerequisiteNames: ["Method of Loci (Memory Palaces)"],
        milestones: [
          { name: "Use the keyword method to memorize 100 foreign words in a week", xpReward: 125 },
          { name: "Build a vocabulary palace for a target language (50+ words)", xpReward: 150 },
          { name: "Maintain Anki / SRS daily for 90 days", xpReward: 175 },
          { name: "Memorize all the irregular verbs of one language using mnemonics", xpReward: 175 },
          { name: "Reach 1,000+ word retention with mnemonic + SRS combo", xpReward: 200 },
        ],
      },

      {
        name: "Knowledge Domains",
        description: "Hold real knowledge, not just stunts",
        prerequisiteNames: ["Method of Loci (Memory Palaces)", "Number Memory"],
        milestones: [
          { name: "Memorize all the world's countries and capitals", xpReward: 175 },
          { name: "Memorize all 50 US states / German Länder / etc. with a key fact each", xpReward: 125 },
          { name: "Memorize the periodic table (symbols + atomic numbers)", xpReward: 200 },
          { name: "Memorize key dates of a major historical period (50+ dates)", xpReward: 175 },
          { name: "Memorize human anatomy (bones / muscles / cranial nerves)", xpReward: 200 },
          { name: "Memorize a long-form text (a sutra, a poem, a chapter)", xpReward: 200 },
        ],
      },

      {
        name: "Active Recall & Spaced Repetition",
        description: "Make memory work the way the science says",
        prerequisiteNames: ["Foundations"],
        milestones: [
          { name: "Build an Anki deck for one personal-knowledge domain (100+ cards)", xpReward: 100 },
          { name: "Maintain a daily Anki review streak for 30 days", xpReward: 125 },
          { name: "Maintain Anki for 1 year", xpReward: 200 },
          { name: "Use the Feynman technique to lock in a complex topic", xpReward: 100 },
          { name: "Cramming-free: pass an exam using only spaced repetition", xpReward: 150 },
        ],
      },

      {
        name: "Competition / Athletic Memory",
        description: "If you really want to push it",
        prerequisiteNames: ["Card Memory", "Number Memory"],
        milestones: [
          { name: "Train for and complete a USA Memory / WMSC sample event", xpReward: 175 },
          { name: "Compete in a memory tournament", xpReward: 250 },
          { name: "Earn a Memory Master / Grand Master title (or local equivalent)", xpReward: 350 },
        ],
      },

      {
        name: "Mastery — A Trained Mind",
        description: "Memory that's a tool you use, not a stunt",
        prerequisiteNames: ["Knowledge Domains", "Names & Faces", "Active Recall & Spaced Repetition"],
        milestones: [
          { name: "Use mnemonics fluidly in real life — at parties, in lectures, while reading", xpReward: 175 },
          { name: "Teach the basics of memory technique to someone in 30 minutes", xpReward: 150 },
          { name: "Memorize and recall a 30-minute speech without notes", xpReward: 200 },
          { name: "Recall something from 10 years ago because of a palace you built then", xpReward: 175 },
          { name: "Write your own short guide to memory technique", xpReward: 200 },
        ],
      },
    ],
    achievements: [
      { name: "Trained Encoder", description: "The science is in your bones", icon: "🧠", trigger: { type: "subskill_mastered", subskillName: "Foundations" } },
      { name: "Palace Built", description: "Method of Loci is yours", icon: "🏰", trigger: { type: "subskill_mastered", subskillName: "Method of Loci (Memory Palaces)" } },
      { name: "Card Counter", description: "A deck in under 60 seconds", icon: "🎴", trigger: { type: "subskill_mastered", subskillName: "Card Memory" } },
      { name: "Pi Recall", description: "Hundreds of digits, on demand", icon: "🥧", trigger: { type: "subskill_mastered", subskillName: "Number Memory" } },
      { name: "First-Name Basis", description: "Names stick now", icon: "👋", trigger: { type: "subskill_mastered", subskillName: "Names & Faces" } },
      { name: "Memory Athlete", description: "Competed at memory tournament level", icon: "🏆", trigger: { type: "subskill_mastered", subskillName: "Competition / Athletic Memory" } },
      { name: "Journeyman Mnemonist", description: "Reached Journeyman", icon: "⚔️", trigger: { type: "stage_reached", stage: 3 } },
      { name: "Trained Mind", description: "Mastered every branch", icon: "👑", trigger: { type: "all_mastered" } },
    ],
  },
  {
    id: "world-history",
    name: "World History",
    description: "From Sumer to last year — a coherent picture of the human story",
    icon: "📜",
    coverImage: DEFAULT_COVER_GRADIENT,
    coverKey: "worldhistory",
    subskills: [
      {
        name: "Historical Thinking",
        description: "How historians actually work — sources, bias, interpretation",
        milestones: [
          { name: "Read a primer on historiography (Carr's What Is History? or similar)", xpReward: 125 },
          { name: "Distinguish primary, secondary, and tertiary sources in any topic", xpReward: 75 },
          { name: "Identify nationalist, Whiggish, and presentist biases in a history book", xpReward: 100 },
          { name: "Read two opposing accounts of the same event and reconcile them", xpReward: 125 },
          { name: "Build a personal timeline / chronology system you actually use", xpReward: 100 },
          { name: "Memorize an outline of major eras and centuries (using mnemonics)", xpReward: 150 },
        ],
      },

      {
        name: "Prehistory & Early Civilizations",
        description: "Hunter-gatherers → Bronze Age",
        prerequisiteNames: ["Historical Thinking"],
        milestones: [
          { name: "Read a prehistory overview (Sapiens, or a more rigorous text)", xpReward: 125 },
          { name: "Learn the major hominid species and the out-of-Africa story", xpReward: 100 },
          { name: "Understand the Neolithic Revolution and its consequences", xpReward: 100 },
          { name: "Learn the Sumerian, Akkadian, and Babylonian civilizations in outline", xpReward: 125 },
          { name: "Learn ancient Egypt's three Kingdoms in outline", xpReward: 125 },
          { name: "Learn the Indus Valley civilization", xpReward: 100 },
          { name: "Learn ancient China through the Shang and Zhou dynasties", xpReward: 125 },
        ],
      },

      {
        name: "Classical Antiquity",
        description: "Greece and Rome — and their non-Western contemporaries",
        prerequisiteNames: ["Prehistory & Early Civilizations"],
        milestones: [
          { name: "Read a Greek-history overview through Alexander", xpReward: 150 },
          { name: "Read Thucydides's Peloponnesian War (selections)", xpReward: 175 },
          { name: "Read Plutarch's Parallel Lives (a few biographies)", xpReward: 125 },
          { name: "Read a Roman-Republic-to-Empire overview (Mary Beard's SPQR or Holland's Rubicon)", xpReward: 175 },
          { name: "Read Tacitus or Suetonius on the early emperors", xpReward: 150 },
          { name: "Learn the Han dynasty in detail", xpReward: 125 },
          { name: "Learn the Mauryan and Gupta empires", xpReward: 125 },
          { name: "Read a book on the fall of Rome (Heather, Ward-Perkins, or Gibbon abridged)", xpReward: 175 },
        ],
      },

      {
        name: "Medieval & Late Antiquity",
        description: "Byzantium, Islam, China, the European 'middle' — not so dark",
        prerequisiteNames: ["Classical Antiquity"],
        milestones: [
          { name: "Learn the Byzantine empire in outline (Norwich or Herrin)", xpReward: 150 },
          { name: "Read a history of early Islam (Donner or Hourani)", xpReward: 150 },
          { name: "Learn the Tang and Song dynasties", xpReward: 150 },
          { name: "Read a history of medieval Europe (Wickham, Bartlett, or similar)", xpReward: 175 },
          { name: "Learn the Mongol empire (Weatherford or May)", xpReward: 150 },
          { name: "Learn the Black Death and 14th-century crisis", xpReward: 100 },
          { name: "Learn medieval Africa (Ghana, Mali, Songhai, Ethiopia)", xpReward: 125 },
        ],
      },

      {
        name: "Early Modern (1500–1800)",
        description: "Renaissance, Reformation, Enlightenment, conquest",
        prerequisiteNames: ["Medieval & Late Antiquity"],
        milestones: [
          { name: "Read a Renaissance overview (Burckhardt or Brotton)", xpReward: 150 },
          { name: "Read a Reformation history (MacCulloch, abridged)", xpReward: 175 },
          { name: "Read on the Spanish conquest of the Americas (Restall, Hugh Thomas, or Conquistadores)", xpReward: 150 },
          { name: "Read a history of the Atlantic slave trade", xpReward: 175 },
          { name: "Learn the Scientific Revolution (Copernicus → Newton)", xpReward: 125 },
          { name: "Read on the Enlightenment (Israel, Pagden, or Outram)", xpReward: 150 },
          { name: "Learn the Ottoman, Safavid, and Mughal empires in their golden ages", xpReward: 175 },
          { name: "Learn Tokugawa Japan and Qing China", xpReward: 125 },
        ],
      },

      {
        name: "The Long 19th Century (1789–1914)",
        description: "Revolution, industry, empire",
        prerequisiteNames: ["Early Modern (1500–1800)"],
        milestones: [
          { name: "Read a French Revolution history (Schama, Doyle, or Soboul)", xpReward: 175 },
          { name: "Read a Napoleonic-era history", xpReward: 150 },
          { name: "Read on the Industrial Revolution", xpReward: 125 },
          { name: "Read a US Civil War history (McPherson's Battle Cry of Freedom)", xpReward: 175 },
          { name: "Read on European imperialism in Africa and Asia", xpReward: 175 },
          { name: "Learn the Meiji Restoration", xpReward: 100 },
          { name: "Learn the late Qing collapse and the Boxer Rebellion", xpReward: 125 },
          { name: "Learn Latin American independence and the 19th-century caudillos", xpReward: 125 },
        ],
      },

      {
        name: "20th Century",
        description: "World wars, cold war, decolonization, the bloodiest century",
        prerequisiteNames: ["The Long 19th Century (1789–1914)"],
        milestones: [
          { name: "Read a World War I history (Hew Strachan, Margaret MacMillan, or Tuchman)", xpReward: 200 },
          { name: "Read a Russian Revolution history", xpReward: 150 },
          { name: "Read a World War II history (Beevor, Hastings, or Overy)", xpReward: 250 },
          { name: "Read a Holocaust history (Hilberg, Browning, or Snyder's Bloodlands)", xpReward: 200 },
          { name: "Read a Cold War history (Gaddis or Westad)", xpReward: 175 },
          { name: "Learn Mao's China and the Cultural Revolution", xpReward: 150 },
          { name: "Learn decolonization (Africa and Asia, 1945–1970)", xpReward: 175 },
          { name: "Learn the dissolution of the Soviet Union", xpReward: 125 },
        ],
      },

      {
        name: "Modern Era (1991–present)",
        description: "Globalization, terrorism, climate, digital",
        prerequisiteNames: ["20th Century"],
        milestones: [
          { name: "Read on the post-Cold-War global order (Mearsheimer, Kagan, or Tooze)", xpReward: 150 },
          { name: "Read on 9/11 and the post-2001 wars", xpReward: 150 },
          { name: "Read on the 2008 financial crisis (Tooze's Crashed)", xpReward: 150 },
          { name: "Read on the Arab Spring", xpReward: 100 },
          { name: "Read on China's 21st-century rise", xpReward: 125 },
          { name: "Maintain awareness of current geopolitics (read serious news weekly for a year)", xpReward: 175 },
        ],
      },

      {
        name: "Regional Deep Dive",
        description: "Pick a region and go deep — not just the West",
        prerequisiteNames: ["20th Century"],
        milestones: [
          { name: "Read a multi-volume history of a single country (3+ books)", xpReward: 250 },
          { name: "Read a long history of a non-Western region (East Asia, Middle East, Africa, South America)", xpReward: 200 },
          { name: "Visit one place you've read about and connect what you read to what you saw", xpReward: 175 },
          { name: "Read a primary source in its original language (Latin, Greek, or modern foreign)", xpReward: 250 },
        ],
      },

      {
        name: "Mastery — A Synthesis",
        description: "Connect it all — patterns, comparisons, your own picture",
        prerequisiteNames: ["Modern Era (1991–present)", "Regional Deep Dive"],
        milestones: [
          { name: "Build a coherent personal world-history timeline (mental or written)", xpReward: 175 },
          { name: "Identify and articulate a recurring pattern across eras", xpReward: 150 },
          { name: "Write a 5,000-word essay synthesizing a major historical question", xpReward: 200 },
          { name: "Read 50+ history books total (lifetime)", xpReward: 200 },
          { name: "Read 100+ history books (lifetime)", xpReward: 300 },
          { name: "Teach a friend a topic you've read in depth, well enough that they remember it", xpReward: 175 },
        ],
      },
    ],
    achievements: [
      { name: "Historian's Eye", description: "Sources and bias are second nature", icon: "🔍", trigger: { type: "subskill_mastered", subskillName: "Historical Thinking" } },
      { name: "Ancient World", description: "Rome and Greece are home", icon: "🏛️", trigger: { type: "subskill_mastered", subskillName: "Classical Antiquity" } },
      { name: "Renaissance Mind", description: "Early modern world mapped", icon: "🎨", trigger: { type: "subskill_mastered", subskillName: "Early Modern (1500–1800)" } },
      { name: "Bloody Century", description: "Read deeply on the 20th century", icon: "⚔️", trigger: { type: "subskill_mastered", subskillName: "20th Century" } },
      { name: "Specialist", description: "Went deep on one region or topic", icon: "🎯", trigger: { type: "subskill_mastered", subskillName: "Regional Deep Dive" } },
      { name: "Journeyman Historian", description: "Reached Journeyman", icon: "⚔️", trigger: { type: "stage_reached", stage: 3 } },
      { name: "World-Historical", description: "Mastered every branch — coherent picture of the human story", icon: "👑", trigger: { type: "all_mastered" } },
    ],
  },
  {
    id: "biology",
    name: "Biology",
    description: "From the cell to the biosphere — a living understanding of life",
    icon: "🧬",
    coverImage: DEFAULT_COVER_GRADIENT,
    coverKey: "biology",
    subskills: [
      {
        name: "Foundations & Scientific Method",
        description: "How biology actually works as a science",
        milestones: [
          { name: "Read an introductory biology text (Campbell or a serious primer)", xpReward: 175 },
          { name: "Understand and articulate the scientific method as biologists use it", xpReward: 100 },
          { name: "Read a paper from a primary literature journal end-to-end", xpReward: 125 },
          { name: "Understand basic experimental design (control, variable, sample size)", xpReward: 100 },
          { name: "Distinguish observation, hypothesis, theory, and law in biological context", xpReward: 75 },
        ],
      },

      {
        name: "Cell & Molecular Biology",
        description: "The chemistry of being alive",
        prerequisiteNames: ["Foundations & Scientific Method"],
        milestones: [
          { name: "Understand and explain the central dogma (DNA → RNA → protein)", xpReward: 125 },
          { name: "Know all major organelles and their functions cold", xpReward: 100 },
          { name: "Understand cellular respiration (glycolysis, Krebs, ETC) at a serious level", xpReward: 150 },
          { name: "Understand photosynthesis (light + dark reactions)", xpReward: 125 },
          { name: "Understand the cell cycle and mitosis / meiosis", xpReward: 125 },
          { name: "Read a serious cell-biology textbook chapter (Molecular Biology of the Cell)", xpReward: 175 },
        ],
      },

      {
        name: "Genetics",
        description: "Mendel through CRISPR",
        prerequisiteNames: ["Cell & Molecular Biology"],
        milestones: [
          { name: "Solve Mendelian genetics problems (mono- and dihybrid crosses)", xpReward: 100 },
          { name: "Understand DNA replication, transcription, translation in detail", xpReward: 150 },
          { name: "Understand gene regulation (operons, transcription factors, epigenetics)", xpReward: 150 },
          { name: "Understand modern molecular techniques (PCR, gel electrophoresis, sequencing, CRISPR)", xpReward: 175 },
          { name: "Read a popular but serious book on genetics (Mukherjee's The Gene, or Dawkins's Selfish Gene)", xpReward: 150 },
        ],
      },

      {
        name: "Evolution",
        description: "The unifying theory of biology",
        prerequisiteNames: ["Genetics"],
        milestones: [
          { name: "Read Darwin's Origin of Species (selections at minimum)", xpReward: 175 },
          { name: "Understand the Modern Synthesis (Mendel + Darwin + population genetics)", xpReward: 150 },
          { name: "Understand natural, sexual, and kin selection clearly", xpReward: 125 },
          { name: "Understand the molecular evidence for common descent", xpReward: 125 },
          { name: "Read 'The Selfish Gene' or 'The Greatest Show on Earth' (Dawkins)", xpReward: 125 },
          { name: "Read a serious evolutionary-biology text (Futuyma or Coyne)", xpReward: 200 },
          { name: "Argue both sides of a real evolutionary debate (group selection, units of selection, EvoDevo)", xpReward: 150 },
        ],
      },

      {
        name: "Anatomy & Physiology",
        description: "How a body works",
        prerequisiteNames: ["Cell & Molecular Biology"],
        milestones: [
          { name: "Memorize all 11 organ systems and their main functions", xpReward: 100 },
          { name: "Understand the cardiovascular system in detail", xpReward: 125 },
          { name: "Understand the nervous system (CNS, PNS, action potentials)", xpReward: 150 },
          { name: "Understand the immune system (innate + adaptive)", xpReward: 175 },
          { name: "Understand the endocrine system and hormonal regulation", xpReward: 125 },
          { name: "Read a serious anatomy / physiology text (Guyton or Marieb)", xpReward: 200 },
          { name: "Dissect (or simulated dissect) at least one organism", xpReward: 100 },
        ],
      },

      {
        name: "Neuroscience",
        description: "The most complex object we know of",
        prerequisiteNames: ["Anatomy & Physiology"],
        milestones: [
          { name: "Understand neurons, synapses, and neurotransmitters", xpReward: 125 },
          { name: "Memorize the major brain regions and what they do", xpReward: 150 },
          { name: "Understand sensory processing (vision, audition)", xpReward: 125 },
          { name: "Understand learning and memory (LTP, hippocampus, etc.)", xpReward: 150 },
          { name: "Read a serious neuroscience text (Kandel's Principles, or Bear)", xpReward: 200 },
          { name: "Read a popular neuroscience book (Sapolsky, Damasio, or LeDoux)", xpReward: 100 },
        ],
      },

      {
        name: "Ecology & Biodiversity",
        description: "Organisms in their environment, life as a system",
        prerequisiteNames: ["Evolution"],
        milestones: [
          { name: "Understand population dynamics (logistic growth, carrying capacity)", xpReward: 100 },
          { name: "Understand community ecology (niches, competition, predation)", xpReward: 125 },
          { name: "Understand ecosystems (energy flow, nutrient cycling)", xpReward: 125 },
          { name: "Understand biodiversity, species concepts, and the current extinction crisis", xpReward: 125 },
          { name: "Read a foundational ecology book (Wilson, Carson's Silent Spring, or a textbook)", xpReward: 150 },
          { name: "Identify 50 species in your local environment by sight (plants, birds, insects)", xpReward: 175 },
        ],
      },

      {
        name: "Microbiology & Virology",
        description: "The mostly-invisible majority of life",
        prerequisiteNames: ["Cell & Molecular Biology"],
        milestones: [
          { name: "Understand bacterial structure, growth, and metabolism", xpReward: 125 },
          { name: "Understand the viral life cycle and key virus types", xpReward: 125 },
          { name: "Understand the human microbiome and its importance", xpReward: 100 },
          { name: "Understand antibiotic resistance and how it evolves", xpReward: 100 },
          { name: "Read a serious popular book on microbes (Yong's I Contain Multitudes)", xpReward: 100 },
        ],
      },

      {
        name: "Botany & Mycology",
        description: "Plants and fungi — usually overlooked, fundamentally weird",
        prerequisiteNames: ["Cell & Molecular Biology"],
        milestones: [
          { name: "Understand plant anatomy (root, stem, leaf, flower)", xpReward: 100 },
          { name: "Understand plant reproductive cycles (alternation of generations)", xpReward: 125 },
          { name: "Identify 30 plant species in your area by features", xpReward: 125 },
          { name: "Understand fungi life cycles and ecological roles", xpReward: 100 },
          { name: "Forage and identify (safely!) at least 5 wild edible species", xpReward: 175 },
          { name: "Read 'Entangled Life' (Sheldrake) or another serious mycology book", xpReward: 100 },
        ],
      },

      {
        name: "Mastery — A Living Worldview",
        description: "The capstone — biology as a coherent picture, not a set of facts",
        prerequisiteNames: ["Evolution", "Neuroscience", "Ecology & Biodiversity"],
        milestones: [
          { name: "Read a serious 'big picture' biology book (Gould, Wilson, or Margulis)", xpReward: 200 },
          { name: "Maintain a nature journal or species log for 6+ months", xpReward: 175 },
          { name: "Read a primary research paper in your area of interest end-to-end with full understanding", xpReward: 175 },
          { name: "Teach a topic in biology to a layperson clearly", xpReward: 150 },
          { name: "Pick a biological question and read deeply enough to have a defended position", xpReward: 200 },
        ],
      },
    ],
    achievements: [
      { name: "Cell Reader", description: "Molecules of life — not a black box anymore", icon: "🔬", trigger: { type: "subskill_mastered", subskillName: "Cell & Molecular Biology" } },
      { name: "Mendel + Darwin", description: "Genetics + evolution = The Modern Synthesis", icon: "🧬", trigger: { type: "subskill_mastered", subskillName: "Evolution" } },
      { name: "Anatomist", description: "The body, mapped", icon: "🫀", trigger: { type: "subskill_mastered", subskillName: "Anatomy & Physiology" } },
      { name: "Brain on Brain", description: "Neuroscience under your belt", icon: "🧠", trigger: { type: "subskill_mastered", subskillName: "Neuroscience" } },
      { name: "Naturalist", description: "Local species recognized in the wild", icon: "🌿", trigger: { type: "subskill_mastered", subskillName: "Ecology & Biodiversity" } },
      { name: "Journeyman Biologist", description: "Reached Journeyman", icon: "⚔️", trigger: { type: "stage_reached", stage: 3 } },
      { name: "Living Worldview", description: "Mastered every branch", icon: "👑", trigger: { type: "all_mastered" } },
    ],
  },
  {
    id: "physics",
    name: "Physics",
    description: "From dropped balls to general relativity and quantum field theory",
    icon: "⚛️",
    coverImage: DEFAULT_COVER_GRADIENT,
    coverKey: "physics",
    subskills: [
      {
        name: "Mathematical Foundations",
        description: "The math you'll need before serious physics",
        milestones: [
          { name: "Master single-variable calculus (derivatives, integrals)", xpReward: 150 },
          { name: "Master multivariable calculus (gradient, divergence, curl)", xpReward: 175 },
          { name: "Master linear algebra (vector spaces, eigenvectors, matrix calculus)", xpReward: 175 },
          { name: "Master differential equations (ODE methods, intro PDE)", xpReward: 175 },
          { name: "Use complex numbers fluently in calculations", xpReward: 100 },
          { name: "Read a math methods book for physicists (Boas or Riley)", xpReward: 150 },
        ],
      },

      {
        name: "Classical Mechanics",
        description: "Newton, Lagrange, Hamilton",
        prerequisiteNames: ["Mathematical Foundations"],
        milestones: [
          { name: "Solve standard Newtonian mechanics problems (kinematics, dynamics, work-energy)", xpReward: 150 },
          { name: "Apply conservation laws (momentum, energy, angular momentum)", xpReward: 125 },
          { name: "Use Lagrangian mechanics on a non-trivial problem (pendulum, double pendulum)", xpReward: 175 },
          { name: "Use Hamiltonian mechanics", xpReward: 175 },
          { name: "Solve a central-force / Kepler problem from scratch", xpReward: 175 },
          { name: "Work through Taylor's Classical Mechanics (or Goldstein for the brave)", xpReward: 250 },
        ],
      },

      {
        name: "Electromagnetism",
        description: "Maxwell's equations and what they mean",
        prerequisiteNames: ["Mathematical Foundations"],
        milestones: [
          { name: "Understand and apply Coulomb's law and electric fields", xpReward: 100 },
          { name: "Apply Gauss's law to symmetric charge distributions", xpReward: 125 },
          { name: "Understand magnetic fields (Biot-Savart, Ampère)", xpReward: 125 },
          { name: "State and explain all four Maxwell equations", xpReward: 150 },
          { name: "Derive the electromagnetic wave equation from Maxwell's equations", xpReward: 200 },
          { name: "Work through Griffiths's Introduction to Electrodynamics", xpReward: 250 },
        ],
      },

      {
        name: "Thermodynamics & Statistical Mechanics",
        description: "Why heat flows, why time has a direction",
        prerequisiteNames: ["Classical Mechanics"],
        milestones: [
          { name: "State and apply the four laws of thermodynamics", xpReward: 125 },
          { name: "Solve heat-engine and Carnot-cycle problems", xpReward: 125 },
          { name: "Understand entropy as both Clausius and Boltzmann defined it", xpReward: 150 },
          { name: "Use the partition function to derive thermodynamic quantities", xpReward: 175 },
          { name: "Understand the Maxwell-Boltzmann, Bose-Einstein, and Fermi-Dirac distributions", xpReward: 175 },
          { name: "Work through a stat-mech text (Schroeder or Kittel)", xpReward: 200 },
        ],
      },

      {
        name: "Special Relativity",
        description: "Time and space are not what you thought",
        prerequisiteNames: ["Classical Mechanics", "Electromagnetism"],
        milestones: [
          { name: "Derive time dilation and length contraction from the postulates", xpReward: 150 },
          { name: "Use Lorentz transformations correctly", xpReward: 150 },
          { name: "Solve relativistic kinematics problems (velocity addition, particle decay)", xpReward: 150 },
          { name: "Understand spacetime intervals and light cones", xpReward: 100 },
          { name: "Use 4-vectors fluently", xpReward: 150 },
          { name: "Read a serious SR text (Taylor & Wheeler's Spacetime Physics)", xpReward: 200 },
        ],
      },

      {
        name: "Quantum Mechanics",
        description: "The deepest theory we have",
        prerequisiteNames: ["Mathematical Foundations", "Classical Mechanics"],
        milestones: [
          { name: "Solve the infinite square well, harmonic oscillator, and hydrogen atom", xpReward: 200 },
          { name: "Understand the postulates of QM and the Schrödinger equation", xpReward: 175 },
          { name: "Use bra-ket notation fluently", xpReward: 150 },
          { name: "Understand spin and the Pauli matrices", xpReward: 150 },
          { name: "Understand entanglement and Bell's inequalities", xpReward: 175 },
          { name: "Apply perturbation theory to a real problem", xpReward: 175 },
          { name: "Work through Griffiths's Introduction to QM", xpReward: 250 },
          { name: "Engage with QM interpretations (Copenhagen, Many-Worlds, pilot wave)", xpReward: 150 },
        ],
      },

      {
        name: "General Relativity",
        description: "Gravity is geometry — Einstein's masterpiece",
        prerequisiteNames: ["Special Relativity"],
        milestones: [
          { name: "Understand the Equivalence Principle", xpReward: 100 },
          { name: "Use tensor notation fluently (Einstein summation, raise/lower indices)", xpReward: 200 },
          { name: "Understand the metric tensor and curved spacetime", xpReward: 175 },
          { name: "Derive the Schwarzschild solution outline", xpReward: 250 },
          { name: "Understand black holes (event horizon, Hawking radiation conceptually)", xpReward: 150 },
          { name: "Read a serious GR text (Schutz, Carroll, or Hartle)", xpReward: 300 },
        ],
      },

      {
        name: "Quantum Field Theory & Particle Physics",
        description: "The deepest level we've probed — the Standard Model",
        prerequisiteNames: ["Quantum Mechanics", "Special Relativity"],
        milestones: [
          { name: "Understand the basic ideas of fields, second quantization, propagators", xpReward: 250 },
          { name: "Understand Feynman diagrams as calculation tools", xpReward: 200 },
          { name: "Memorize the Standard Model (3 generations × 4 forces × bosons + fermions)", xpReward: 175 },
          { name: "Understand symmetry and gauge invariance conceptually", xpReward: 200 },
          { name: "Read a QFT text (Peskin & Schroeder, or a friendlier intro like Lancaster)", xpReward: 300 },
          { name: "Read a popular but serious particle book ('t Hooft, or Lincoln, or Carroll)", xpReward: 100 },
        ],
      },

      {
        name: "Cosmology & Astrophysics",
        description: "The big picture",
        prerequisiteNames: ["General Relativity"],
        milestones: [
          { name: "Understand the Big Bang and the cosmic timeline", xpReward: 125 },
          { name: "Understand the FLRW metric and the Friedmann equations", xpReward: 175 },
          { name: "Understand the CMB and Big Bang nucleosynthesis", xpReward: 150 },
          { name: "Understand stellar structure and stellar evolution", xpReward: 150 },
          { name: "Understand dark matter and dark energy as observed phenomena", xpReward: 150 },
          { name: "Read a serious cosmology text (Ryden, or Liddle for an intro)", xpReward: 200 },
        ],
      },

      {
        name: "Experimental & Lab Physics",
        description: "Physics is also done with hands and instruments",
        prerequisiteNames: ["Classical Mechanics", "Electromagnetism"],
        milestones: [
          { name: "Run a real experiment with proper error analysis (Type A and B uncertainty)", xpReward: 150 },
          { name: "Use an oscilloscope, multimeter, function generator competently", xpReward: 100 },
          { name: "Reproduce a classic experiment (Millikan oil drop, Michelson-Morley, etc.) at home or in lab", xpReward: 200 },
          { name: "Take real data and analyze it with appropriate statistics", xpReward: 125 },
          { name: "Build a physics demo or apparatus from scratch", xpReward: 200 },
        ],
      },

      {
        name: "Computational Physics",
        description: "When you can't solve it analytically",
        prerequisiteNames: ["Classical Mechanics"],
        milestones: [
          { name: "Numerically integrate an ODE (Euler, RK4)", xpReward: 100 },
          { name: "Simulate the 3-body problem and visualize its chaos", xpReward: 150 },
          { name: "Run a Monte Carlo simulation (Ising model, random walks)", xpReward: 150 },
          { name: "Do a finite-difference simulation of a wave or heat equation", xpReward: 175 },
          { name: "Visualize a physics simulation in real time", xpReward: 125 },
        ],
      },

      {
        name: "Mastery — A Physicist's Worldview",
        description: "The capstone — physics in your bones, not just notes",
        prerequisiteNames: ["Quantum Mechanics", "General Relativity", "Thermodynamics & Statistical Mechanics"],
        milestones: [
          { name: "Read Feynman's Lectures on Physics (substantial portion)", xpReward: 300 },
          { name: "Solve a graduate-level qualifying-exam problem from scratch", xpReward: 300 },
          { name: "Read a primary research paper in your area of interest end-to-end", xpReward: 200 },
          { name: "Explain a physics concept to a non-physicist clearly and accurately", xpReward: 150 },
          { name: "Develop and articulate a personal favorite question in physics", xpReward: 175 },
        ],
      },
    ],
    achievements: [
      { name: "Newton's Heir", description: "Mechanics in all its forms", icon: "🍎", trigger: { type: "subskill_mastered", subskillName: "Classical Mechanics" } },
      { name: "Maxwell's Heir", description: "Electromagnetism mastered", icon: "⚡", trigger: { type: "subskill_mastered", subskillName: "Electromagnetism" } },
      { name: "Einstein I", description: "Special relativity, in your bones", icon: "🚀", trigger: { type: "subskill_mastered", subskillName: "Special Relativity" } },
      { name: "Quantum Native", description: "QM is not a paradox to you anymore", icon: "🌀", trigger: { type: "subskill_mastered", subskillName: "Quantum Mechanics" } },
      { name: "Einstein II", description: "Curved spacetime, understood", icon: "🌌", trigger: { type: "subskill_mastered", subskillName: "General Relativity" } },
      { name: "Field Theorist", description: "Standard Model in hand", icon: "🔬", trigger: { type: "subskill_mastered", subskillName: "Quantum Field Theory & Particle Physics" } },
      { name: "Journeyman Physicist", description: "Reached Journeyman", icon: "⚔️", trigger: { type: "stage_reached", stage: 3 } },
      { name: "Physicist's Worldview", description: "Mastered every branch", icon: "👑", trigger: { type: "all_mastered" } },
    ],
  },
  {
    id: "chemistry",
    name: "Chemistry",
    description: "From the periodic table to running real reactions",
    icon: "🧪",
    coverImage: DEFAULT_COVER_GRADIENT,
    coverKey: "chemistry",
    subskills: [
      {
        name: "Foundations",
        description: "Atoms, bonds, the periodic table",
        milestones: [
          { name: "Memorize the first 30 elements (symbol + atomic number) with mnemonics", xpReward: 100 },
          { name: "Memorize the full periodic table", xpReward: 200 },
          { name: "Understand atomic structure (subatomic particles, isotopes)", xpReward: 100 },
          { name: "Understand electron configuration and orbital filling", xpReward: 125 },
          { name: "Understand ionic, covalent, and metallic bonding", xpReward: 125 },
          { name: "Read a general chemistry textbook chapter (Brown, Atkins, Zumdahl)", xpReward: 150 },
        ],
      },

      {
        name: "Stoichiometry & Reaction Basics",
        description: "Balancing equations and counting atoms",
        prerequisiteNames: ["Foundations"],
        milestones: [
          { name: "Balance complex chemical equations", xpReward: 100 },
          { name: "Solve stoichiometry problems with limiting reagents", xpReward: 125 },
          { name: "Calculate empirical and molecular formulas", xpReward: 100 },
          { name: "Solve concentration problems (molarity, molality, dilution)", xpReward: 100 },
          { name: "Predict products of common reactions (acid-base, precipitation, redox)", xpReward: 150 },
        ],
      },

      {
        name: "Thermochemistry & Kinetics",
        description: "Energy and speed of reactions",
        prerequisiteNames: ["Stoichiometry & Reaction Basics"],
        milestones: [
          { name: "Apply Hess's Law to enthalpy calculations", xpReward: 125 },
          { name: "Calculate ΔG, ΔH, ΔS and predict reaction spontaneity", xpReward: 150 },
          { name: "Use rate laws and integrated rate equations", xpReward: 125 },
          { name: "Understand Arrhenius equation and activation energy", xpReward: 125 },
          { name: "Understand catalysis and reaction mechanisms", xpReward: 150 },
        ],
      },

      {
        name: "Equilibrium & Acid-Base Chemistry",
        description: "Reactions that go both ways, and pH",
        prerequisiteNames: ["Stoichiometry & Reaction Basics"],
        milestones: [
          { name: "Use the equilibrium constant K and apply Le Châtelier's principle", xpReward: 125 },
          { name: "Solve weak-acid / weak-base / buffer problems", xpReward: 150 },
          { name: "Understand and use the Henderson-Hasselbalch equation", xpReward: 125 },
          { name: "Solve titration problems including polyprotic acids", xpReward: 150 },
          { name: "Solve solubility-product (Ksp) problems", xpReward: 125 },
        ],
      },

      {
        name: "Organic Chemistry",
        description: "The chemistry of carbon — biology's substrate",
        prerequisiteNames: ["Foundations"],
        milestones: [
          { name: "Master IUPAC nomenclature for hydrocarbons and basic functional groups", xpReward: 150 },
          { name: "Understand and predict outcomes of SN1, SN2, E1, E2 reactions", xpReward: 175 },
          { name: "Understand and use NMR, IR, mass spectrometry to identify compounds", xpReward: 200 },
          { name: "Master alcohol, aldehyde, ketone, carboxylic acid, ester reactions", xpReward: 200 },
          { name: "Master aromatic chemistry (benzene, electrophilic aromatic substitution)", xpReward: 175 },
          { name: "Plan a multi-step synthesis (3+ steps)", xpReward: 200 },
          { name: "Work through Clayden's or McMurry's Organic Chemistry", xpReward: 300 },
        ],
      },

      {
        name: "Inorganic & Coordination Chemistry",
        description: "Beyond carbon — transition metals, complexes, materials",
        prerequisiteNames: ["Foundations"],
        milestones: [
          { name: "Understand coordination compounds and ligand-field theory", xpReward: 175 },
          { name: "Predict coordination geometry and isomerism in complexes", xpReward: 150 },
          { name: "Understand redox chemistry and standard reduction potentials", xpReward: 125 },
          { name: "Understand main-group inorganic chemistry (halogens, nitrogen group, etc.)", xpReward: 150 },
          { name: "Understand organometallic chemistry basics (Grignards, ferrocene)", xpReward: 150 },
        ],
      },

      {
        name: "Physical Chemistry",
        description: "Where chemistry meets physics — quantum + thermodynamics",
        prerequisiteNames: ["Thermochemistry & Kinetics"],
        milestones: [
          { name: "Understand the postulates of QM as applied to chemistry", xpReward: 200 },
          { name: "Solve the particle-in-a-box and harmonic oscillator quantum problems", xpReward: 175 },
          { name: "Understand molecular orbital theory (MO diagrams for diatomics)", xpReward: 175 },
          { name: "Apply statistical thermodynamics to chemical systems", xpReward: 200 },
          { name: "Understand the laws of thermodynamics from a chemist's perspective", xpReward: 150 },
          { name: "Work through Atkins's Physical Chemistry (substantial)", xpReward: 250 },
        ],
      },

      {
        name: "Biochemistry",
        description: "The chemistry of life",
        prerequisiteNames: ["Organic Chemistry"],
        milestones: [
          { name: "Understand the structure and function of all 20 amino acids", xpReward: 150 },
          { name: "Understand protein folding and secondary/tertiary structure", xpReward: 150 },
          { name: "Understand enzyme kinetics (Michaelis-Menten, Lineweaver-Burk)", xpReward: 150 },
          { name: "Understand the major metabolic pathways (glycolysis, TCA, ETC, fatty acid)", xpReward: 200 },
          { name: "Understand DNA / RNA chemistry and the central dogma at chemical level", xpReward: 175 },
          { name: "Read a biochemistry textbook (Lehninger, Stryer, or Voet)", xpReward: 250 },
        ],
      },

      {
        name: "Lab Skills & Safety",
        description: "Doing chemistry safely and well",
        prerequisiteNames: ["Stoichiometry & Reaction Basics"],
        milestones: [
          { name: "Pass a lab safety training (or read OSHA / GHS guidelines)", xpReward: 75 },
          { name: "Use volumetric glassware (pipette, burette) correctly", xpReward: 100 },
          { name: "Run a titration with proper technique and error analysis", xpReward: 125 },
          { name: "Do a recrystallization successfully", xpReward: 125 },
          { name: "Run column or thin-layer chromatography", xpReward: 175 },
          { name: "Distill a mixture (simple and fractional)", xpReward: 150 },
          { name: "Synthesize a real compound from start to characterized product", xpReward: 250 },
        ],
      },

      {
        name: "Analytical Chemistry",
        description: "How you actually know what you've got",
        prerequisiteNames: ["Lab Skills & Safety"],
        milestones: [
          { name: "Use UV-Vis spectroscopy quantitatively", xpReward: 125 },
          { name: "Interpret an IR spectrum to identify functional groups", xpReward: 125 },
          { name: "Interpret a 1H NMR spectrum (chemical shift, multiplicity, integration)", xpReward: 175 },
          { name: "Interpret a mass spectrum (molecular ion, fragmentation)", xpReward: 150 },
          { name: "Combine multiple spectra to determine an unknown structure", xpReward: 200 },
          { name: "Use HPLC or GC for separation and quantification", xpReward: 175 },
        ],
      },

      {
        name: "Mastery — A Chemist's Mind",
        description: "The capstone — chemistry in your fingers and your reasoning",
        prerequisiteNames: ["Organic Chemistry", "Physical Chemistry", "Analytical Chemistry"],
        milestones: [
          { name: "Read a primary chemistry research paper end-to-end with full understanding", xpReward: 175 },
          { name: "Plan and execute a multi-step synthesis from scratch (lab or paper)", xpReward: 250 },
          { name: "Identify an unknown compound from spectroscopic data alone", xpReward: 200 },
          { name: "Teach a chemistry concept to a layperson clearly", xpReward: 150 },
          { name: "Develop a personal interest area and read deeply (catalysis, materials, drug design, etc.)", xpReward: 200 },
        ],
      },
    ],
    achievements: [
      { name: "Periodic Mind", description: "The table is in your head", icon: "🧪", trigger: { type: "subskill_mastered", subskillName: "Foundations" } },
      { name: "Carbon Chains", description: "Organic chemistry in hand", icon: "⛓️", trigger: { type: "subskill_mastered", subskillName: "Organic Chemistry" } },
      { name: "Quantum Chemist", description: "Where chemistry meets physics", icon: "🌀", trigger: { type: "subskill_mastered", subskillName: "Physical Chemistry" } },
      { name: "Biochemist", description: "Life as chemistry", icon: "🧬", trigger: { type: "subskill_mastered", subskillName: "Biochemistry" } },
      { name: "Lab Hands", description: "Glassware, gloves, and good notebooks", icon: "🥽", trigger: { type: "subskill_mastered", subskillName: "Lab Skills & Safety" } },
      { name: "Spectroscopist", description: "Read NMR, IR, MS like a sentence", icon: "📈", trigger: { type: "subskill_mastered", subskillName: "Analytical Chemistry" } },
      { name: "Journeyman Chemist", description: "Reached Journeyman", icon: "⚔️", trigger: { type: "stage_reached", stage: 3 } },
      { name: "Master Chemist", description: "Mastered every branch", icon: "👑", trigger: { type: "all_mastered" } },
    ],
  },
  {
    id: "astronomy",
    name: "Astronomy",
    description: "From naked-eye stars to imaging galaxies in your backyard",
    icon: "🌌",
    coverImage: DEFAULT_COVER_GRADIENT,
    coverKey: "astronomy",
    subskills: [
      {
        name: "Naked-Eye Sky",
        description: "Know the sky before you ever buy a telescope",
        milestones: [
          { name: "Identify the 5 visible planets in the sky", xpReward: 100 },
          { name: "Identify 30 constellations on a clear night", xpReward: 150 },
          { name: "Find the celestial poles (Polaris north, Crux south)", xpReward: 75 },
          { name: "Identify the 20 brightest stars by name", xpReward: 125 },
          { name: "Watch a meteor shower at peak (Perseids, Geminids, etc.)", xpReward: 100 },
          { name: "Watch a total or partial solar eclipse", xpReward: 150 },
          { name: "Observe a lunar eclipse", xpReward: 100 },
          { name: "Watch the ISS pass overhead and identify it", xpReward: 75 },
        ],
      },

      {
        name: "Celestial Mechanics & Coordinates",
        description: "How the sky moves and how to navigate it",
        prerequisiteNames: ["Naked-Eye Sky"],
        milestones: [
          { name: "Use right ascension and declination on a star chart", xpReward: 100 },
          { name: "Use altitude and azimuth correctly", xpReward: 75 },
          { name: "Understand the celestial sphere and its rotation", xpReward: 100 },
          { name: "Understand precession and the changing pole star", xpReward: 100 },
          { name: "Calculate when an object will be visible from your location", xpReward: 125 },
          { name: "Understand Kepler's laws of planetary motion", xpReward: 150 },
        ],
      },

      {
        name: "Telescope & Observing Equipment",
        description: "Glass, mounts, eyepieces, and how to use them",
        prerequisiteNames: ["Naked-Eye Sky"],
        milestones: [
          { name: "Choose and buy a first scope (Dobsonian, refractor, or SCT)", xpReward: 150 },
          { name: "Set up and align a scope correctly", xpReward: 100 },
          { name: "Use a star diagonal, finder, eyepieces, and Barlow correctly", xpReward: 100 },
          { name: "Polar-align an equatorial mount", xpReward: 150 },
          { name: "Star-hop to a faint target without GoTo", xpReward: 150 },
          { name: "Use GoTo / push-to systems competently", xpReward: 100 },
          { name: "Collimate a Newtonian / SCT optics", xpReward: 175 },
          { name: "Maintain optics and equipment over 1 year of observing", xpReward: 100 },
        ],
      },

      {
        name: "Solar System Observation",
        description: "Our backyard — moons, planets, sun (safely!)",
        prerequisiteNames: ["Telescope & Observing Equipment"],
        milestones: [
          { name: "Sketch the moon at first quarter showing major features", xpReward: 100 },
          { name: "Observe and sketch all 8 planets (or as many as visible)", xpReward: 200 },
          { name: "Observe and identify Jupiter's 4 Galilean moons", xpReward: 100 },
          { name: "Observe Saturn's rings and at least 2 of its moons", xpReward: 125 },
          { name: "Observe a comet", xpReward: 150 },
          { name: "Observe sunspots safely (with proper solar filter)", xpReward: 125 },
          { name: "Identify and observe an asteroid", xpReward: 150 },
        ],
      },

      {
        name: "Deep Sky Observation",
        description: "Galaxies, nebulae, clusters",
        prerequisiteNames: ["Telescope & Observing Equipment"],
        milestones: [
          { name: "Observe and sketch the Andromeda galaxy", xpReward: 100 },
          { name: "Observe the Orion nebula and identify the Trapezium", xpReward: 100 },
          { name: "Complete the Messier marathon (or observe 50 Messier objects in a year)", xpReward: 250 },
          { name: "Observe all 110 Messier objects", xpReward: 350 },
          { name: "Observe a globular cluster and resolve its core stars", xpReward: 125 },
          { name: "Observe a planetary nebula and an open cluster of your choice", xpReward: 100 },
          { name: "Observe a supernova in another galaxy (when one occurs)", xpReward: 200 },
        ],
      },

      {
        name: "Astrophotography",
        description: "Capture what your eye can almost see",
        prerequisiteNames: ["Telescope & Observing Equipment"],
        milestones: [
          { name: "Capture a star-trail photo with a DSLR", xpReward: 100 },
          { name: "Capture a Milky Way photo with proper settings", xpReward: 125 },
          { name: "Capture a deep-sky object (nebula or galaxy) with a tracker", xpReward: 200 },
          { name: "Stack and process raw frames in DeepSkyStacker / PixInsight / Siril", xpReward: 200 },
          { name: "Capture a planetary image with lucky imaging (registax, AutoStakkert)", xpReward: 175 },
          { name: "Produce an image good enough to print and frame", xpReward: 200 },
        ],
      },

      {
        name: "Astrophysics & Theory",
        description: "Understand what you're looking at",
        prerequisiteNames: ["Celestial Mechanics & Coordinates"],
        milestones: [
          { name: "Understand stellar classification (OBAFGKM)", xpReward: 100 },
          { name: "Understand the H-R diagram", xpReward: 125 },
          { name: "Understand stellar evolution (main sequence → giant → endpoint)", xpReward: 150 },
          { name: "Understand black holes (Schwarzschild radius, accretion disks, conceptually)", xpReward: 150 },
          { name: "Understand the cosmic distance ladder", xpReward: 125 },
          { name: "Understand the Big Bang, CMB, and basic cosmology", xpReward: 175 },
          { name: "Read a serious astronomy text (Carroll & Ostlie, or Hawking's Brief History for popular)", xpReward: 250 },
        ],
      },

      {
        name: "Citizen Science & Observing Programs",
        description: "Contribute real data to real science",
        prerequisiteNames: ["Deep Sky Observation"],
        milestones: [
          { name: "Submit observations to a citizen-science program (AAVSO variable stars, Zooniverse, etc.)", xpReward: 175 },
          { name: "Earn an Astronomical League observing-program certificate", xpReward: 250 },
          { name: "Contribute to exoplanet transit observations or asteroid astrometry", xpReward: 200 },
          { name: "Maintain a regular observing log for 1 year", xpReward: 150 },
        ],
      },

      {
        name: "Dark-Sky Travel",
        description: "Skies you can't see from your driveway",
        prerequisiteNames: ["Naked-Eye Sky"],
        milestones: [
          { name: "Travel to a Bortle 3 (or better) site and observe", xpReward: 150 },
          { name: "Observe the Milky Way's galactic core in person", xpReward: 125 },
          { name: "Observe in both Northern AND Southern hemisphere skies", xpReward: 250 },
          { name: "Visit a major observatory (Mauna Kea, La Palma, ESO, Kitt Peak…)", xpReward: 200 },
          { name: "Attend a star party or astronomy convention", xpReward: 125 },
        ],
      },

      {
        name: "Mastery — Your Own Patch of Sky",
        description: "The capstone — observer, reader, and maybe contributor to the science",
        prerequisiteNames: ["Astrophotography", "Astrophysics & Theory", "Citizen Science & Observing Programs"],
        milestones: [
          { name: "Run a public outreach event (sidewalk astronomy, school visit)", xpReward: 175 },
          { name: "Produce a portfolio of 20+ astrophotos you're proud of", xpReward: 250 },
          { name: "Read 10+ serious astronomy / astrophysics books", xpReward: 200 },
          { name: "Develop a deep specialty (variable stars, double stars, comets, lunar mapping, etc.)", xpReward: 200 },
          { name: "Teach someone to use a telescope on their first night", xpReward: 150 },
        ],
      },
    ],
    achievements: [
      { name: "Star-Reader", description: "30 constellations on sight", icon: "✨", trigger: { type: "subskill_mastered", subskillName: "Naked-Eye Sky" } },
      { name: "First Light", description: "Telescope set up and working", icon: "🔭", trigger: { type: "subskill_mastered", subskillName: "Telescope & Observing Equipment" } },
      { name: "Saturn", description: "Saw the rings with your own eyes", icon: "🪐", trigger: { type: "subskill_mastered", subskillName: "Solar System Observation" } },
      { name: "All 110", description: "Completed the Messier catalog", icon: "🌠", trigger: { type: "subskill_mastered", subskillName: "Deep Sky Observation" } },
      { name: "Astrophotographer", description: "Captured the universe and processed it", icon: "📷", trigger: { type: "subskill_mastered", subskillName: "Astrophotography" } },
      { name: "Astrophysicist's Mind", description: "Knows what they're looking at", icon: "🌌", trigger: { type: "subskill_mastered", subskillName: "Astrophysics & Theory" } },
      { name: "Journeyman Astronomer", description: "Reached Journeyman", icon: "⚔️", trigger: { type: "stage_reached", stage: 3 } },
      { name: "Master of the Night Sky", description: "Mastered every branch", icon: "👑", trigger: { type: "all_mastered" } },
    ],
  },
  {
    id: "home-repair",
    name: "Home Repair",
    description: "Fix anything in a house — drywall to wiring, plumbing to roofing",
    icon: "🛠️",
    coverImage: DEFAULT_COVER_GRADIENT,
    coverKey: "home-repair",
    subskills: [
      {
        name: "Tools & Safety",
        description: "Right tool for the right job, all 10 fingers intact",
        milestones: [
          { name: "Build a basic homeowner's tool kit (hand + power tools)", xpReward: 100 },
          { name: "Learn to use a multimeter for AC voltage, continuity, resistance", xpReward: 100 },
          { name: "Use eye, ear, and respiratory protection appropriately every job", xpReward: 75 },
          { name: "Identify and respond to lead, asbestos, and mold concerns appropriately", xpReward: 125 },
          { name: "Learn safe ladder use (3-point contact, weight limits, GACS)", xpReward: 75 },
          { name: "Read a foundational text (Reader's Digest Complete Do-It-Yourself Manual or similar)", xpReward: 125 },
        ],
      },

      {
        name: "Drywall & Wall Finishing",
        description: "Patches, holes, and seams that disappear",
        prerequisiteNames: ["Tools & Safety"],
        milestones: [
          { name: "Patch a small nail hole invisibly", xpReward: 50 },
          { name: "Patch a fist-sized hole with backing board", xpReward: 125 },
          { name: "Tape and mud a drywall seam (3 coats, sanded)", xpReward: 150 },
          { name: "Hang a sheet of drywall properly (screw spacing, butt joints)", xpReward: 125 },
          { name: "Match an existing wall texture (orange peel, knockdown, smooth)", xpReward: 175 },
        ],
      },

      {
        name: "Painting",
        description: "A really good paint job is harder than it looks",
        prerequisiteNames: ["Tools & Safety"],
        milestones: [
          { name: "Prep a wall properly (clean, sand, fill, prime)", xpReward: 100 },
          { name: "Cut a clean line without tape", xpReward: 150 },
          { name: "Roll a wall without lap marks or roller stipple inconsistencies", xpReward: 100 },
          { name: "Paint trim and doors with smooth, brush-mark-free finish", xpReward: 150 },
          { name: "Repaint a full room start-to-finish", xpReward: 150 },
          { name: "Spray paint a piece of furniture with proper prep and topcoat", xpReward: 125 },
        ],
      },

      {
        name: "Plumbing — Repair",
        description: "Stop leaks, clear clogs, replace fixtures",
        prerequisiteNames: ["Tools & Safety"],
        milestones: [
          { name: "Shut off and drain a water supply correctly", xpReward: 75 },
          { name: "Replace a faucet (kitchen or bath)", xpReward: 150 },
          { name: "Replace a toilet wax ring / fill valve / flapper", xpReward: 125 },
          { name: "Clear a P-trap and snake a drain", xpReward: 100 },
          { name: "Replace a toilet entirely", xpReward: 150 },
          { name: "Repair a leaking shutoff valve", xpReward: 125 },
          { name: "Sweat (solder) a copper joint", xpReward: 175 },
          { name: "Make a solid PEX or push-fit (SharkBite) connection", xpReward: 100 },
        ],
      },
      {
        name: "Plumbing — Run New Lines",
        description: "Real plumbing — new fixtures, new lines",
        prerequisiteNames: ["Plumbing — Repair"],
        milestones: [
          { name: "Run a new supply line to a fixture", xpReward: 175 },
          { name: "Run a new drain with proper slope and venting", xpReward: 200 },
          { name: "Install a new sink + faucet from scratch", xpReward: 175 },
          { name: "Install a new dishwasher or washing machine", xpReward: 150 },
          { name: "Pull a permit and pass an inspection on a plumbing job", xpReward: 200 },
        ],
      },

      {
        name: "Electrical — Safe Repair",
        description: "Outlets, switches, fixtures — without dying",
        prerequisiteNames: ["Tools & Safety"],
        milestones: [
          { name: "Identify hot, neutral, and ground wires correctly", xpReward: 100 },
          { name: "Use a non-contact voltage tester EVERY time", xpReward: 75 },
          { name: "Replace a standard outlet correctly", xpReward: 100 },
          { name: "Replace a light switch (single, 3-way, dimmer)", xpReward: 125 },
          { name: "Install a new light fixture", xpReward: 125 },
          { name: "Install a GFCI / AFCI outlet correctly", xpReward: 125 },
          { name: "Replace a ceiling fan", xpReward: 150 },
          { name: "Read a circuit diagram for a residential branch circuit", xpReward: 150 },
        ],
      },
      {
        name: "Electrical — Branch Circuits & Panel",
        description: "New circuits, panel basics — when it's safe and legal",
        prerequisiteNames: ["Electrical — Safe Repair"],
        milestones: [
          { name: "Run a new branch circuit (NM cable, junction boxes, devices)", xpReward: 200 },
          { name: "Install a new breaker in an existing panel safely", xpReward: 175 },
          { name: "Wire a new sub-circuit for a major appliance (240V)", xpReward: 200 },
          { name: "Pull a permit and pass an electrical inspection", xpReward: 200 },
          { name: "Read NEC code sections relevant to residential work", xpReward: 175 },
        ],
      },

      {
        name: "Carpentry — Repair",
        description: "Stairs, doors, windows, frames",
        prerequisiteNames: ["Tools & Safety"],
        milestones: [
          { name: "Hang a door from scratch (hinges, strike plate, swing)", xpReward: 175 },
          { name: "Replace door hardware (knobs, deadbolts, hinges)", xpReward: 75 },
          { name: "Repair or replace baseboard / trim / crown molding", xpReward: 150 },
          { name: "Replace a damaged stair tread", xpReward: 150 },
          { name: "Repair rotten wood with epoxy or replacement", xpReward: 150 },
          { name: "Replace a window or repair window sashes", xpReward: 200 },
        ],
      },

      {
        name: "Floors",
        description: "Hardwood, tile, vinyl, carpet — repair and install",
        prerequisiteNames: ["Carpentry — Repair"],
        milestones: [
          { name: "Refinish a hardwood floor patch (sand, stain, finish)", xpReward: 175 },
          { name: "Replace damaged hardwood planks", xpReward: 175 },
          { name: "Install a click-lock laminate or LVP floor in a room", xpReward: 200 },
          { name: "Tile a small area (backsplash or floor patch)", xpReward: 200 },
          { name: "Grout and seal tiled work properly", xpReward: 100 },
          { name: "Patch carpet with a transition piece", xpReward: 100 },
        ],
      },

      {
        name: "HVAC Maintenance",
        description: "Keep your heating, cooling, and air clean",
        prerequisiteNames: ["Tools & Safety"],
        milestones: [
          { name: "Replace HVAC filters on schedule (4×/year minimum)", xpReward: 50 },
          { name: "Clean condenser coils outdoors", xpReward: 75 },
          { name: "Replace a thermostat (basic or smart)", xpReward: 100 },
          { name: "Identify and clear a clogged condensate line", xpReward: 100 },
          { name: "Diagnose common HVAC issues (no cool, no heat, short-cycling)", xpReward: 150 },
          { name: "Inspect and clean ducts", xpReward: 125 },
        ],
      },

      {
        name: "Roofing & Exterior",
        description: "Up high — gutters, shingles, sealing",
        prerequisiteNames: ["Tools & Safety"],
        milestones: [
          { name: "Clean gutters and check for blockages", xpReward: 50 },
          { name: "Replace a damaged asphalt shingle", xpReward: 175 },
          { name: "Seal a roof flashing leak with proper materials", xpReward: 150 },
          { name: "Caulk exterior joints (windows, doors, trim)", xpReward: 75 },
          { name: "Power-wash siding without damaging it", xpReward: 100 },
          { name: "Repair siding (vinyl, fiber-cement, or wood)", xpReward: 175 },
        ],
      },

      {
        name: "Diagnostic Skill",
        description: "Knowing what's wrong before you start",
        prerequisiteNames: ["Tools & Safety"],
        milestones: [
          { name: "Walk a property and produce a written punch-list of needed repairs", xpReward: 125 },
          { name: "Diagnose a leak by tracing it to the actual source (not just the visible drip)", xpReward: 150 },
          { name: "Diagnose an electrical issue with a multimeter (open circuit, short, ground fault)", xpReward: 150 },
          { name: "Read a home inspection report and prioritize correctly", xpReward: 100 },
          { name: "Know when to call a pro and when to DIY", xpReward: 100 },
        ],
      },

      {
        name: "Mastery — Capable Homeowner",
        description: "The capstone — almost nothing in a house can stop you",
        prerequisiteNames: ["Plumbing — Run New Lines", "Electrical — Branch Circuits & Panel", "Carpentry — Repair", "Floors"],
        milestones: [
          { name: "Renovate a bathroom or kitchen substantially (multi-trade project)", xpReward: 300 },
          { name: "Maintain a personal home-improvement log of all work done", xpReward: 100 },
          { name: "Help a friend with a major repair (mentor / co-work)", xpReward: 150 },
          { name: "Read NEC, IPC, IRC sections relevant to your work", xpReward: 175 },
          { name: "Save $5,000+ over a year doing repairs you'd otherwise pay for", xpReward: 250 },
        ],
      },
    ],
    achievements: [
      { name: "Toolkit Built", description: "Right tool for the job, every job", icon: "🧰", trigger: { type: "subskill_mastered", subskillName: "Tools & Safety" } },
      { name: "Drywall Doctor", description: "Holes vanish under your hand", icon: "🔨", trigger: { type: "subskill_mastered", subskillName: "Drywall & Wall Finishing" } },
      { name: "No More Leaks", description: "Plumbing repairs are routine", icon: "🚰", trigger: { type: "subskill_mastered", subskillName: "Plumbing — Repair" } },
      { name: "Sparky", description: "Wires hold no fear", icon: "⚡", trigger: { type: "subskill_mastered", subskillName: "Electrical — Safe Repair" } },
      { name: "Doors & Trim", description: "Carpentry repairs done right", icon: "🚪", trigger: { type: "subskill_mastered", subskillName: "Carpentry — Repair" } },
      { name: "Inspector's Eye", description: "Diagnose before you cut", icon: "🔍", trigger: { type: "subskill_mastered", subskillName: "Diagnostic Skill" } },
      { name: "Journeyman Handyman", description: "Reached Journeyman", icon: "⚔️", trigger: { type: "stage_reached", stage: 3 } },
      { name: "Capable Homeowner", description: "Mastered every branch — almost nothing stops you", icon: "👑", trigger: { type: "all_mastered" } },
    ],
  },
  {
    id: "conversation",
    name: "Conversation",
    description: "From small talk dread to making everyone you talk to feel seen",
    icon: "💬",
    coverImage: DEFAULT_COVER_GRADIENT,
    coverKey: "conversation",
    subskills: [
      {
        name: "Foundations & Mindset",
        description: "What conversation actually is — connection, curiosity, presence",
        milestones: [
          { name: "Read 'How to Win Friends and Influence People' (Carnegie) and apply 3 lessons in a week", xpReward: 125 },
          { name: "Read 'Never Eat Alone' (Ferrazzi) or 'How to Talk to Anyone' (Lowndes)", xpReward: 100 },
          { name: "Identify your top 3 conversational fears and write a plan for each", xpReward: 75 },
          { name: "Identify your speaking patterns by listening to a recording of yourself", xpReward: 100 },
          { name: "Practice the rule of being the most genuinely interested person in the room for 1 day", xpReward: 100 },
        ],
      },

      {
        name: "Listening",
        description: "The unsexy half of conversation that everyone gets wrong",
        prerequisiteNames: ["Foundations & Mindset"],
        milestones: [
          { name: "Have one conversation where you ask only questions for 5 minutes straight", xpReward: 100 },
          { name: "Practice reflective listening (paraphrasing back what you heard) in 5 conversations", xpReward: 100 },
          { name: "Catch yourself preparing your response while someone is still speaking, and stop", xpReward: 100 },
          { name: "Ask follow-up questions that go 3 layers deeper than the surface answer", xpReward: 125 },
          { name: "Sit through 30 seconds of silence in a conversation without filling it", xpReward: 125 },
          { name: "Read 'You're Not Listening' (Murphy) or another listening-focused book", xpReward: 125 },
        ],
      },

      {
        name: "Curiosity & Questions",
        description: "Better questions, better conversations",
        prerequisiteNames: ["Listening"],
        milestones: [
          { name: "Develop 5 go-to opening questions that aren't 'what do you do'", xpReward: 75 },
          { name: "Ask one open-ended question that opens 10+ minutes of follow-up", xpReward: 100 },
          { name: "Use 'tell me more' or 'what do you mean by that' instead of moving on", xpReward: 75 },
          { name: "Ask someone something they've never been asked before", xpReward: 125 },
          { name: "Read 'A More Beautiful Question' (Berger) or 'Power Questions' (Sobel)", xpReward: 100 },
        ],
      },

      {
        name: "Storytelling",
        description: "Be a person worth listening to",
        prerequisiteNames: ["Foundations & Mindset"],
        milestones: [
          { name: "Identify 5 personal stories you can tell well", xpReward: 75 },
          { name: "Tell a 2-minute story without losing the room", xpReward: 100 },
          { name: "Use the 'situation → struggle → resolution' arc on demand", xpReward: 125 },
          { name: "Read 'Storyworthy' (Dicks) or 'Long Story Short' (Margaret McGirr)", xpReward: 125 },
          { name: "Tell a story at a Moth-style storytelling event (or open mic)", xpReward: 200 },
          { name: "Make someone laugh with a story you're known to tell", xpReward: 100 },
        ],
      },

      {
        name: "Small Talk",
        description: "The gateway — strangers in elevators, parties, weddings",
        prerequisiteNames: ["Curiosity & Questions"],
        milestones: [
          { name: "Have 5 successful small-talk conversations with strangers in a week", xpReward: 100 },
          { name: "Open a conversation with a stranger using something specific to the moment", xpReward: 100 },
          { name: "Smoothly exit a conversation without awkwardness", xpReward: 100 },
          { name: "Connect two strangers and watch them keep talking", xpReward: 125 },
          { name: "Walk into a party where you know one person and leave with three new contacts", xpReward: 150 },
        ],
      },

      {
        name: "Deep Conversation",
        description: "Beyond pleasantries — real connection",
        prerequisiteNames: ["Listening", "Storytelling"],
        milestones: [
          { name: "Have a 1-hour conversation with someone where neither of you checks a phone", xpReward: 100 },
          { name: "Ask someone about their childhood and listen for an hour", xpReward: 125 },
          { name: "Have a conversation about death, regret, or meaning without flinching", xpReward: 150 },
          { name: "Use 'The 36 Questions' or another structured intimacy framework with someone", xpReward: 150 },
          { name: "Make someone cry (in a good way) by finally asking what they needed asked", xpReward: 175 },
        ],
      },

      {
        name: "Difficult Conversations",
        description: "Conflict, criticism, hard truths — handled with skill",
        prerequisiteNames: ["Deep Conversation"],
        milestones: [
          { name: "Read 'Difficult Conversations' (Stone, Patton, Heen)", xpReward: 150 },
          { name: "Read 'Crucial Conversations' (Patterson et al.)", xpReward: 125 },
          { name: "Read 'Nonviolent Communication' (Rosenberg)", xpReward: 150 },
          { name: "Have a hard conversation you've been avoiding for 6+ months", xpReward: 200 },
          { name: "Give honest feedback to someone you care about and watch the relationship strengthen", xpReward: 175 },
          { name: "De-escalate a conflict in real time", xpReward: 175 },
          { name: "Apologize fully — acknowledging harm, taking responsibility, changing behavior", xpReward: 175 },
        ],
      },

      {
        name: "Charisma & Presence",
        description: "Making people feel something when you're there",
        prerequisiteNames: ["Storytelling"],
        milestones: [
          { name: "Practice making confident eye contact (not staring) for one full conversation", xpReward: 75 },
          { name: "Use the person's name naturally 2-3 times in a conversation", xpReward: 75 },
          { name: "Match someone's energy without losing your own", xpReward: 125 },
          { name: "Read 'The Charisma Myth' (Cabane)", xpReward: 125 },
          { name: "Walk into a room and have someone notice and approach you", xpReward: 150 },
          { name: "Get an unsolicited compliment about how you made someone feel", xpReward: 200 },
        ],
      },

      {
        name: "Negotiation & Persuasion",
        description: "Conversations with stakes",
        prerequisiteNames: ["Listening", "Curiosity & Questions"],
        milestones: [
          { name: "Read 'Never Split the Difference' (Voss)", xpReward: 150 },
          { name: "Read 'Influence' (Cialdini)", xpReward: 125 },
          { name: "Use tactical empathy and labeling in a real conversation", xpReward: 125 },
          { name: "Negotiate a price down (or up — salary, freelance) successfully", xpReward: 175 },
          { name: "Change someone's mind on something they cared about — and have them thank you", xpReward: 200 },
          { name: "Decline something cleanly without burning the relationship", xpReward: 100 },
        ],
      },

      {
        name: "Public & Group Conversation",
        description: "From dyad to room",
        prerequisiteNames: ["Storytelling", "Charisma & Presence"],
        milestones: [
          { name: "Speak up in a meeting and have your idea adopted", xpReward: 100 },
          { name: "Tell a story at a dinner of 6+ that holds the table", xpReward: 125 },
          { name: "Lead a group discussion (book club, class, work) where everyone contributes", xpReward: 150 },
          { name: "Toast at a wedding or event — well", xpReward: 175 },
          { name: "Give a public talk (Toastmasters or similar)", xpReward: 175 },
          { name: "MC an event", xpReward: 200 },
        ],
      },

      {
        name: "Cross-Cultural Conversation",
        description: "Talk well across language, class, age, culture",
        prerequisiteNames: ["Curiosity & Questions"],
        milestones: [
          { name: "Have a meaningful conversation with someone 30+ years older than you", xpReward: 100 },
          { name: "Have a meaningful conversation with someone from a totally different class background", xpReward: 125 },
          { name: "Hold a 30-minute conversation in a non-native language", xpReward: 175 },
          { name: "Talk well with someone whose politics you strongly disagree with — and feel closer at the end", xpReward: 200 },
          { name: "Read a book on cross-cultural communication (e.g. 'The Culture Map' by Meyer)", xpReward: 125 },
        ],
      },

      {
        name: "Mastery — A Person Worth Talking To",
        description: "The capstone — people leave conversations with you better than they came",
        prerequisiteNames: ["Difficult Conversations", "Public & Group Conversation", "Cross-Cultural Conversation", "Negotiation & Persuasion"],
        milestones: [
          { name: "Have someone unsolicited tell you 'you're the best listener I know'", xpReward: 200 },
          { name: "Become the friend people call when they have something hard to say", xpReward: 250 },
          { name: "Build or substantially deepen a real friendship through conversation", xpReward: 200 },
          { name: "Notice someone in a room being left out and bring them in", xpReward: 150 },
          { name: "Teach someone else one of these conversational skills", xpReward: 150 },
          { name: "Have your conversation make a measurable, real difference in someone's life", xpReward: 250 },
        ],
      },
    ],
    achievements: [
      { name: "Listener", description: "The hardest skill — done", icon: "👂", trigger: { type: "subskill_mastered", subskillName: "Listening" } },
      { name: "Storyteller", description: "Holds the room", icon: "🎭", trigger: { type: "subskill_mastered", subskillName: "Storytelling" } },
      { name: "Beyond Small Talk", description: "Real connections, not pleasantries", icon: "💬", trigger: { type: "subskill_mastered", subskillName: "Deep Conversation" } },
      { name: "Hard Talk", description: "Says the thing that needs to be said", icon: "🗣️", trigger: { type: "subskill_mastered", subskillName: "Difficult Conversations" } },
      { name: "Charismatic", description: "People notice when you walk in", icon: "✨", trigger: { type: "subskill_mastered", subskillName: "Charisma & Presence" } },
      { name: "Negotiator", description: "Conversations with stakes — won", icon: "🤝", trigger: { type: "subskill_mastered", subskillName: "Negotiation & Persuasion" } },
      { name: "Journeyman Conversationalist", description: "Reached Journeyman", icon: "⚔️", trigger: { type: "stage_reached", stage: 3 } },
      { name: "Person Worth Talking To", description: "Mastered every branch — people leave better than they came", icon: "👑", trigger: { type: "all_mastered" } },
    ],
  },
];

export function getTemplate(id: string): SkillTemplate | undefined {
  return SKILL_TEMPLATES.find((t) => t.id === id);
}

export function getAvailableTemplates(): SkillTemplate[] {
  return SKILL_TEMPLATES;
}

export function resolveCoverImage(skill: {
  templateId: string | null;
  coverImage: string | null;
}): string | null {
  if (skill.templateId) {
    const template = getTemplate(skill.templateId);
    if (template) return template.coverImage;
  }
  return skill.coverImage;
}
