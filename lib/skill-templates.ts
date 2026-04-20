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

export type SkillTemplate = {
  id: string;
  name: string;
  description: string;
  icon: string;
  coverImage: string;
  subskills: SubskillTemplate[];
  achievements?: TemplateAchievement[];
};

export const SKILL_TEMPLATES: SkillTemplate[] = [
  {
    id: "cooking",
    name: "Cooking",
    description: "From kitchen basics to confident home cook",
    coverImage: "url('/cooking.webp') center/cover",
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
    coverImage: "url('/russian.png') center/cover",
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
  coverImage: "url('/piano.png') center/cover",
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
    coverImage: "linear-gradient(135deg, #0a0a0a 0%, #3a2418 45%, #92400e 100%)",
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
    coverImage: "url('/survival.png') center/cover",
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
    coverImage: "linear-gradient(135deg, #0c0a0a 0%, #2a1f15 35%, #4a3a28 65%, #8a6a3a 100%)",
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
    description: "From surviving on the bottom to finishing from anywhere",
    icon: "🥋",
    coverImage: "url('/bjj.png') center/cover",
    subskills: [
      // =====================
      // FOUNDATIONS
      // =====================
      {
        name: "Fundamentals & Movement",
        description: "Shrimps, bridges, breakfalls — the body mechanics underneath everything",
        milestones: [
          { name: "Do 20 shrimps (hip escapes) in each direction consecutively", xpReward: 75 },
          { name: "Do 20 bridges with full hip extension", xpReward: 50 },
          { name: "Safely breakfall from a kneeling position", xpReward: 75 },
          { name: "Execute forward and backward rolls over each shoulder", xpReward: 100 },
          { name: "Perform a technical stand-up cleanly", xpReward: 75 },
          { name: "Hold base in both knee-up and turtle against pressure", xpReward: 100 },
          { name: "Attend 10 fundamentals classes", xpReward: 125 },
        ],
      },
      {
        name: "Base Positions & Awareness",
        description: "Know every position and the hierarchy between them",
        prerequisiteNames: ["Fundamentals & Movement"],
        milestones: [
          { name: "Name and demonstrate mount, side, back, guard, half guard, turtle, knee-on-belly, north-south", xpReward: 100 },
          { name: "Explain the position hierarchy (and why)", xpReward: 75 },
          { name: "Identify your current position during a live roll", xpReward: 100 },
          { name: "Apply proper posture and frames in 5 bad positions", xpReward: 100 },
          { name: "Transition through 5 positions in sequence smoothly", xpReward: 125 },
          { name: "Know the key grip and hand-fighting principles", xpReward: 100 },
        ],
      },
      {
        name: "Takedowns",
        description: "Get the fight to the ground on your terms",
        prerequisiteNames: ["Fundamentals & Movement"],
        milestones: [
          { name: "Execute a single-leg takedown", xpReward: 100 },
          { name: "Execute a double-leg takedown", xpReward: 100 },
          { name: "Execute a judo throw (o-goshi, osoto-gari, or similar)", xpReward: 100 },
          { name: "Pull guard safely with a grip break and control", xpReward: 75 },
          { name: "Defend 3 takedown attempts with sprawl or scramble", xpReward: 100 },
          { name: "Take a resisting partner down and establish position 5 times", xpReward: 125 },
        ],
      },

      // =====================
      // SURVIVE → ESCAPE
      // =====================
      {
        name: "Escapes",
        description: "Get out of mount, side, back, and turtle",
        prerequisiteNames: ["Base Positions & Awareness"],
        milestones: [
          { name: "Execute the upa (bridge-and-roll) mount escape 10 times live", xpReward: 100 },
          { name: "Execute the elbow-knee mount escape 10 times live", xpReward: 100 },
          { name: "Recover guard from side control 10 times live", xpReward: 100 },
          { name: "Escape back control (handfight, peel grips, get hooks out)", xpReward: 100 },
          { name: "Escape turtle to guard or standing", xpReward: 100 },
          { name: "Survive and escape 5 times in live rolls", xpReward: 100 },
        ],
      },

      // =====================
      // GUARD FAMILY
      // =====================
      {
        name: "Closed Guard",
        description: "The bread-and-butter bottom position — attacks and sweeps",
        prerequisiteNames: ["Base Positions & Awareness"],
        milestones: [
          { name: "Establish closed guard and break your opponent's posture", xpReward: 75 },
          { name: "Finish a cross collar choke from closed guard", xpReward: 100 },
          { name: "Finish an armbar from closed guard", xpReward: 100 },
          { name: "Finish a triangle choke from closed guard", xpReward: 100 },
          { name: "Sweep from closed guard (scissor, hip bump, or flower)", xpReward: 100 },
          { name: "Chain 3 attacks together in closed guard", xpReward: 75 },
          { name: "Hold closed guard for 2 minutes against a resisting partner", xpReward: 50 },
        ],
      },
      {
        name: "Half Guard",
        description: "The most played position in modern BJJ",
        prerequisiteNames: ["Closed Guard"],
        milestones: [
          { name: "Establish a proper knee-shield half guard", xpReward: 75 },
          { name: "Sweep with the underhook from half guard", xpReward: 100 },
          { name: "Sweep with the knee-shield", xpReward: 100 },
          { name: "Defend and recover from top-half-guard attacks", xpReward: 100 },
          { name: "Use half guard to recover full guard", xpReward: 100 },
          { name: "Win or hold 2 minutes from half guard", xpReward: 125 },
        ],
      },
      {
        name: "Open Guards",
        description: "Spider, De La Riva, butterfly, lasso — the modern game",
        prerequisiteNames: ["Closed Guard"],
        milestones: [
          { name: "Play butterfly guard and land a butterfly sweep", xpReward: 100 },
          { name: "Play spider guard with grips and hook control", xpReward: 100 },
          { name: "Play De La Riva guard", xpReward: 100 },
          { name: "Play lasso guard", xpReward: 100 },
          { name: "Chain between 2 open guards fluidly", xpReward: 100 },
          { name: "Sweep a resisting partner from an open guard 5 times", xpReward: 100 },
        ],
      },

      // =====================
      // DOMINATE → SUBMIT
      // =====================
      {
        name: "Guard Passing",
        description: "Get past guards and into dominant top positions",
        prerequisiteNames: ["Escapes"],
        milestones: [
          { name: "Perform a toreando (bullfighter) pass", xpReward: 100 },
          { name: "Perform a knee-slice pass", xpReward: 100 },
          { name: "Perform a stack pass against closed guard", xpReward: 100 },
          { name: "Defeat grips and pass open guards (spider / DLR)", xpReward: 100 },
          { name: "Pass and stabilize in side control", xpReward: 100 },
          { name: "Pass a resisting partner 5 times during rolling", xpReward: 100 },
        ],
      },
      {
        name: "Pinning & Top Control",
        description: "Keep them where you put them",
        prerequisiteNames: ["Guard Passing"],
        milestones: [
          { name: "Hold side control for 2 minutes against resistance", xpReward: 100 },
          { name: "Hold mount for 1 minute against resistance", xpReward: 100 },
          { name: "Hold back control (seat belt + hooks) for 1 minute", xpReward: 100 },
          { name: "Transition between top positions without losing control", xpReward: 100 },
          { name: "Apply and maintain knee-on-belly", xpReward: 75 },
          { name: "Establish the mount hierarchy (S-mount, technical mount)", xpReward: 125 },
        ],
      },
      {
        name: "Submissions",
        description: "Chokes and joint locks — the finish",
        prerequisiteNames: ["Pinning & Top Control", "Closed Guard"],
        milestones: [
          { name: "Finish a rear naked choke from back control", xpReward: 100 },
          { name: "Finish an armbar from mount or guard", xpReward: 100 },
          { name: "Finish a triangle choke in live rolling", xpReward: 100 },
          { name: "Finish a kimura", xpReward: 75 },
          { name: "Finish a guillotine", xpReward: 75 },
          { name: "Chain submission attempts (A → B → C)", xpReward: 75 },
          { name: "Tap 5 partners with 5 different submissions", xpReward: 75 },
        ],
      },

      // =====================
      // LIVE TRAINING & COMPETITION
      // =====================
      {
        name: "Rolling & Sparring",
        description: "Live training — where skill actually develops",
        prerequisiteNames: ["Escapes", "Closed Guard"],
        milestones: [
          { name: "Complete 10 rolling sessions (5+ minutes each)", xpReward: 75 },
          { name: "Roll with someone bigger or more experienced", xpReward: 75 },
          { name: "Do positional sparring (start in a bad position, escape)", xpReward: 100 },
          { name: "Roll a full class using only ONE technique", xpReward: 75 },
          { name: "Log 50 total rolls", xpReward: 125 },
          { name: "Tap 3 similar-level partners in a single session", xpReward: 75 },
          { name: "Attend 50 training sessions", xpReward: 75 },
        ],
      },
      {
        name: "Competition & Mental Game",
        description: "Test yourself against strangers who want to beat you",
        prerequisiteNames: ["Rolling & Sparring", "Submissions"],
        milestones: [
          { name: "Enter your first BJJ tournament", xpReward: 150 },
          { name: "Win a match at any competition", xpReward: 125 },
          { name: "Compete in 3+ tournaments", xpReward: 125 },
          { name: "Develop and write down a personal competition game plan", xpReward: 75 },
          { name: "Recover mentally from a loss and compete again", xpReward: 75 },
          { name: "Win a tournament division or medal", xpReward: 50 },
        ],
      },
    ],
    achievements: [
      { name: "Survivor", description: "You can escape mount, side, and back", icon: "🛡️", trigger: { type: "subskill_mastered", subskillName: "Escapes" } },
      { name: "Guard Player", description: "Open guards are your home", icon: "🧘", trigger: { type: "subskill_mastered", subskillName: "Open Guards" } },
      { name: "The Passer", description: "Nobody stays in guard against you", icon: "⚡", trigger: { type: "subskill_mastered", subskillName: "Guard Passing" } },
      { name: "Finisher", description: "You end fights with submissions", icon: "🥋", trigger: { type: "subskill_mastered", subskillName: "Submissions" } },
      { name: "Competitor", description: "Tested yourself in real tournaments", icon: "🏆", trigger: { type: "subskill_mastered", subskillName: "Competition & Mental Game" } },
      { name: "Black Belt Mindset", description: "Mastered every branch of BJJ", icon: "👑", trigger: { type: "all_mastered" } },
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
    coverImage: "linear-gradient(135deg, #0a0a1a 0%, #1e1b4b 40%, #4c1d95 75%, #a78bfa 100%)",
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
    coverImage: "linear-gradient(135deg, #020617 0%, #0c4a6e 40%, #0891b2 75%, #67e8f9 100%)",
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
