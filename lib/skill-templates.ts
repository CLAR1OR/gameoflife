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

export type SkillTemplate = {
  id: string;
  name: string;
  description: string;
  icon: string;
  coverImage: string;
  subskills: SubskillTemplate[];
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
  },
  {
    id: "russian",
    name: "Russian Language",
    description: "From Cyrillic basics to reading Dostoevsky in the original",
    icon: "🇷🇺",
    coverImage: "linear-gradient(135deg, #1e1b4b 0%, #7f1d1d 55%, #450a0a 100%)",
    subskills: [
      // =====================
      // COMPREHENSIBLE INPUT (A1 → C1)
      // =====================
      {
        name: "A1 Comprehensible Input",
        description: "Beginner videos with visuals and simple speech",
        milestones: [
          { name: "Watch your first 10 A1 CI videos", xpReward: 50 },
          { name: "Complete a beginner CI playlist", xpReward: 100 },
          { name: "Watch 30 A1 videos total", xpReward: 100 },
          { name: "Understand 50% of an A1 video without subtitles", xpReward: 100 },
          { name: "Complete a second A1 playlist", xpReward: 100 },
          { name: "Accumulate 20+ hours of A1 input", xpReward: 150 },
        ],
      },
      {
        name: "A2 Comprehensible Input",
        description: "Elementary videos, slow clear speech, everyday topics",
        prerequisiteNames: ["A1 Comprehensible Input"],
        milestones: [
          { name: "Watch 10 A2 videos", xpReward: 50 },
          { name: "Complete an A2 playlist", xpReward: 100 },
          { name: "Watch 30 A2 videos total", xpReward: 100 },
          { name: "Understand 70% of an A2 video without subtitles", xpReward: 100 },
          { name: "Complete a second A2 playlist", xpReward: 100 },
          { name: "Reach 40+ cumulative hours of input", xpReward: 150 },
        ],
      },
      {
        name: "B1 Comprehensible Input",
        description: "Intermediate: vlogs, slow podcasts, slice-of-life content",
        prerequisiteNames: ["A2 Comprehensible Input"],
        milestones: [
          { name: "Watch 10 B1 videos", xpReward: 50 },
          { name: "Complete a B1 playlist (30+ videos)", xpReward: 100 },
          { name: "Understand a Russian vlogger's casual video", xpReward: 100 },
          { name: "Watch 50 B1 videos total", xpReward: 100 },
          { name: "Follow a podcast episode for intermediate learners", xpReward: 100 },
          { name: "Reach 80+ cumulative hours of input", xpReward: 150 },
        ],
      },
      {
        name: "B2 Comprehensible Input",
        description: "Upper intermediate: TV shows, native podcasts, interviews",
        prerequisiteNames: ["B1 Comprehensible Input"],
        milestones: [
          { name: "Watch a full episode of 'Кухня' (or any Russian sitcom)", xpReward: 100 },
          { name: "Understand a Russian news segment", xpReward: 100 },
          { name: "Complete a native-speaker podcast episode", xpReward: 100 },
          { name: "Finish a B2 playlist or course", xpReward: 100 },
          { name: "Watch 5 full episodes of a Russian show", xpReward: 100 },
          { name: "Reach 150+ cumulative hours of input", xpReward: 100 },
        ],
      },
      {
        name: "C1 Comprehensible Input",
        description: "Advanced: native media, cinema, stand-up, debates",
        prerequisiteNames: ["B2 Comprehensible Input"],
        milestones: [
          { name: "Watch a Russian movie without subtitles", xpReward: 100 },
          { name: "Understand a Russian stand-up comedy bit", xpReward: 100 },
          { name: "Follow an interview with a Russian-speaking public figure", xpReward: 100 },
          { name: "Finish a Russian TV show (10+ episodes)", xpReward: 100 },
          { name: "Understand a podcast on a complex topic (politics, science)", xpReward: 100 },
          { name: "Reach 300+ cumulative hours of input", xpReward: 100 },
        ],
      },

      // =====================
      // READING (Comics → Classics)
      // =====================
      {
        name: "Reading — Comics",
        description: "Entry-level reading with visual context",
        prerequisiteNames: ["A1 Comprehensible Input"],
        milestones: [
          { name: "Read your first Russian comic strip", xpReward: 75 },
          { name: "Finish a short comic book", xpReward: 100 },
          { name: "Read 5 comic strips in a row", xpReward: 100 },
          { name: "Finish 3 full comic books", xpReward: 125 },
          { name: "Read a comic without looking up more than 5 words", xpReward: 100 },
          { name: "Complete 10 comics total", xpReward: 100 },
        ],
      },
      {
        name: "Reading — Easy Books",
        description: "Graded readers and children's books",
        prerequisiteNames: ["Reading — Comics"],
        milestones: [
          { name: "Finish your first A1/A2 graded reader", xpReward: 100 },
          { name: "Read a Russian children's book (e.g., Чебурашка)", xpReward: 100 },
          { name: "Finish 3 short graded readers", xpReward: 100 },
          { name: "Read a short-story collection for learners", xpReward: 125 },
          { name: "Finish a B1-level graded book", xpReward: 125 },
          { name: "Complete 5 easy books total", xpReward: 50 },
        ],
      },
      {
        name: "Reading — Intermediate",
        description: "Contemporary novels and non-fiction",
        prerequisiteNames: ["Reading — Easy Books", "B1 Comprehensible Input"],
        milestones: [
          { name: "Finish a young-adult novel in Russian", xpReward: 100 },
          { name: "Read a novella (100–200 pages)", xpReward: 100 },
          { name: "Read a non-fiction book in Russian", xpReward: 125 },
          { name: "Finish a contemporary Russian novel", xpReward: 125 },
          { name: "Read a full book without using a dictionary", xpReward: 100 },
          { name: "Complete 3 intermediate books total", xpReward: 50 },
        ],
      },
      {
        name: "Reading — Classics",
        description: "19th-century literature in the original",
        prerequisiteNames: ["Reading — Intermediate", "B2 Comprehensible Input"],
        milestones: [
          { name: "Read a Chekhov short story", xpReward: 100 },
          { name: "Finish 'A Hero of Our Time' (Lermontov)", xpReward: 150 },
          { name: "Finish a Turgenev or Gogol novel", xpReward: 150 },
          { name: "Read a Dostoevsky novel", xpReward: 100 },
          { name: "Read a Tolstoy work (short story or novel)", xpReward: 100 },
        ],
      },

      // =====================
      // WRITING
      // =====================
      {
        name: "Handwriting",
        description: "Cyrillic print and cursive",
        milestones: [
          { name: "Learn all 33 Cyrillic letters (print)", xpReward: 100 },
          { name: "Practice each letter 20 times in cursive", xpReward: 100 },
          { name: "Copy a full page of printed text", xpReward: 100 },
          { name: "Keep a handwritten journal for a week", xpReward: 100 },
          { name: "Write a handwritten letter to a friend", xpReward: 100 },
          { name: "Maintain a handwritten journal for a month", xpReward: 100 },
        ],
      },
      {
        name: "Touch Typing",
        description: "ЙЦУКЕН layout mastery",
        milestones: [
          { name: "Learn the ЙЦУКЕН keyboard layout", xpReward: 100 },
          { name: "Type at 20 WPM without looking", xpReward: 100 },
          { name: "Complete a Russian typing course", xpReward: 100 },
          { name: "Reach 40 WPM", xpReward: 100 },
          { name: "Reach 60 WPM", xpReward: 100 },
          { name: "Type a 500-word essay in Russian", xpReward: 100 },
        ],
      },

      // =====================
      // VOCABULARY
      // =====================
      {
        name: "Vocabulary",
        description: "Build the words you need, one tier at a time",
        milestones: [
          { name: "Learn the 500 most common Russian words", xpReward: 100 },
          { name: "Complete a beginner Anki deck (or equivalent)", xpReward: 100 },
          { name: "Reach 1,000 words known", xpReward: 100 },
          { name: "Reach 2,000 words known", xpReward: 100 },
          { name: "Reach 5,000 words known", xpReward: 100 },
          { name: "Reach 10,000 words known (advanced reader level)", xpReward: 100 },
        ],
      },
    ],
  },
  {
    id: "piano",
  name: "Piano",
  description: "From first chords to advanced concert repertoire",
  icon: "🎹",
  coverImage: "linear-gradient(135deg, #0a0a0a 0%, #1c1917 30%, #422006 70%, #854d0e 100%)",
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
  },
  {
    id: "survival",
    name: "Survival Skills",
    description: "Be the person who stays calm and capable when things go wrong",
    icon: "🏕️",
    coverImage: "linear-gradient(135deg, #0c0a07 0%, #2a1810 30%, #3d2a17 55%, #4a5d3a 100%)",
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
