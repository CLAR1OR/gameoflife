/**
 * Pre-built quest ideas the user can drop into their backlog with one click,
 * mirroring how skill templates work. Activating a template creates a new
 * quest in the user's backlog (status = "backlog") and stamps templateId so
 * we can hide it from the gallery.
 */

export type QuestTemplate = {
  id: string;
  type: "main" | "side";
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  category: string; // grouping label for the template gallery
  tasks?: string[];
};

export const QUEST_TEMPLATES: QuestTemplate[] = [
  // ===== Health & Body =====
  {
    id: "run-5k",
    type: "side",
    category: "Health & Body",
    name: "Run a 5K",
    description: "Build up to running 5 kilometers without stopping.",
    icon: "🏃",
    xpReward: 75,
    tasks: [
      "Walk 30 minutes / 3× this week",
      "Run-walk intervals for 2 weeks",
      "Run 3K continuously",
      "Run 5K continuously",
    ],
  },
  {
    id: "lose-5kg",
    type: "main",
    category: "Health & Body",
    name: "Lose 5kg the healthy way",
    description: "Sustainable weight loss through habits, not crash diets.",
    icon: "💪",
    xpReward: 250,
    tasks: [
      "Set weekly weigh-in routine",
      "Track calories for 4 weeks",
      "Hit step count daily for a month",
      "Reach goal weight",
    ],
  },
  {
    id: "do-pullup",
    type: "side",
    category: "Health & Body",
    name: "Do my first unassisted pull-up",
    description: "From dead-hang to one clean rep.",
    icon: "🏋️",
    xpReward: 50,
    tasks: [
      "30s dead-hang",
      "5× negative pull-ups",
      "Banded pull-ups for 3 sets",
      "One unassisted rep",
    ],
  },
  {
    id: "meditate-30",
    type: "side",
    category: "Health & Body",
    name: "Meditate 30 days in a row",
    description: "10 minutes per day, no exceptions.",
    icon: "🧘",
    xpReward: 50,
  },

  // ===== Career & Money =====
  {
    id: "side-project-ship",
    type: "main",
    category: "Career & Money",
    name: "Ship a side project",
    description: "Build something small, polish it, and put it in the world.",
    icon: "🚀",
    xpReward: 200,
    tasks: [
      "Pick the idea",
      "MVP working end-to-end",
      "Get 5 friends to try it",
      "Ship publicly",
    ],
  },
  {
    id: "ask-for-raise",
    type: "side",
    category: "Career & Money",
    name: "Ask for a raise",
    description: "Build the case, schedule the talk, have it.",
    icon: "💼",
    xpReward: 100,
    tasks: [
      "Document last year's wins",
      "Research market rate",
      "Draft talking points",
      "Schedule the conversation",
      "Have the conversation",
    ],
  },
  {
    id: "emergency-fund",
    type: "main",
    category: "Career & Money",
    name: "Build a 3-month emergency fund",
    description: "Three months of expenses set aside in a savings account.",
    icon: "💰",
    xpReward: 250,
    tasks: [
      "Calculate monthly burn",
      "Open a dedicated savings account",
      "Automate monthly transfer",
      "Reach 1-month buffer",
      "Reach 3-month buffer",
    ],
  },
  {
    id: "learn-new-skill",
    type: "side",
    category: "Career & Money",
    name: "Learn a marketable new skill",
    description: "Pick one, do the work, ship something with it.",
    icon: "🧠",
    xpReward: 100,
  },

  // ===== Creativity =====
  {
    id: "write-novel",
    type: "main",
    category: "Creativity",
    name: "Write a novel",
    description: "First draft of a 60,000+ word novel.",
    icon: "✍️",
    xpReward: 500,
    tasks: [
      "Outline the plot",
      "Draft chapter 1",
      "Hit 20,000 words",
      "Hit 40,000 words",
      "Finish first draft",
    ],
  },
  {
    id: "release-album",
    type: "main",
    category: "Creativity",
    name: "Release a 5-song EP",
    description: "Write, record, mix, and put it on streaming services.",
    icon: "🎸",
    xpReward: 300,
  },
  {
    id: "art-show",
    type: "side",
    category: "Creativity",
    name: "Submit work to a juried show",
    description: "Make the work, polish it, send it in.",
    icon: "🎨",
    xpReward: 75,
  },
  {
    id: "blog-12-posts",
    type: "side",
    category: "Creativity",
    name: "Publish 12 blog posts in a year",
    description: "One per month — about anything you find interesting.",
    icon: "📝",
    xpReward: 100,
    tasks: [
      "Set up the blog",
      "Publish post 1",
      "Publish post 6",
      "Publish post 12",
    ],
  },

  // ===== Adventure =====
  {
    id: "solo-trip",
    type: "side",
    category: "Adventure",
    name: "Take a solo trip",
    description: "Travel somewhere new on your own for at least 5 days.",
    icon: "🗺️",
    xpReward: 100,
  },
  {
    id: "summit-mountain",
    type: "main",
    category: "Adventure",
    name: "Summit a real mountain",
    description: "Pick one above 2,500m. Train, plan, climb.",
    icon: "🏔️",
    xpReward: 200,
    tasks: [
      "Pick the mountain",
      "Train weekly cardio",
      "Test gear on a hike",
      "Summit",
    ],
  },
  {
    id: "learn-language-basics",
    type: "side",
    category: "Adventure",
    name: "Hold a 5-minute conversation in a new language",
    description: "Past pleasantries — actual back-and-forth.",
    icon: "🌍",
    xpReward: 100,
  },

  // ===== Relationships =====
  {
    id: "host-dinner",
    type: "side",
    category: "Relationships",
    name: "Host a dinner party for 6+",
    description: "Plan it, cook it, enjoy it.",
    icon: "🍽️",
    xpReward: 50,
    tasks: [
      "Pick a date and guest list",
      "Plan the menu",
      "Shop & prep",
      "Host",
    ],
  },
  {
    id: "reconnect-old-friend",
    type: "side",
    category: "Relationships",
    name: "Reconnect with an old friend",
    description: "Reach out, set a real plan, follow through.",
    icon: "🤝",
    xpReward: 25,
  },
  {
    id: "weekly-call",
    type: "side",
    category: "Relationships",
    name: "Call a family member weekly for 3 months",
    description: "Same time every week — make it a ritual.",
    icon: "📞",
    xpReward: 50,
  },

  // ===== Home =====
  {
    id: "declutter-home",
    type: "side",
    category: "Home",
    name: "Declutter the whole home",
    description: "Room by room. Donate / discard / keep.",
    icon: "🏠",
    xpReward: 75,
    tasks: [
      "Bedroom",
      "Closet",
      "Kitchen",
      "Living room",
      "Garage / storage",
    ],
  },
  {
    id: "garden-grow",
    type: "side",
    category: "Home",
    name: "Grow something edible from seed to plate",
    description: "Pick a vegetable or herb. See it through.",
    icon: "🌱",
    xpReward: 50,
  },
];

export function getQuestTemplate(id: string): QuestTemplate | null {
  return QUEST_TEMPLATES.find((t) => t.id === id) ?? null;
}

export function listQuestTemplateCategories(): string[] {
  const seen = new Set<string>();
  const order: string[] = [];
  for (const t of QUEST_TEMPLATES) {
    if (!seen.has(t.category)) {
      seen.add(t.category);
      order.push(t.category);
    }
  }
  return order;
}
