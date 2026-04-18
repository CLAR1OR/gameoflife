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
