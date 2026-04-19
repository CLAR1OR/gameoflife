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
