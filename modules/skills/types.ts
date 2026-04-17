import { InferSelectModel } from "drizzle-orm";
import { skillCategory, skill, skillPrerequisite, milestone, xpSession } from "@/lib/db/schema";

export type SkillCategory = InferSelectModel<typeof skillCategory>;
export type Skill = InferSelectModel<typeof skill>;
export type SkillPrerequisite = InferSelectModel<typeof skillPrerequisite>;
export type Milestone = InferSelectModel<typeof milestone>;
export type XpSession = InferSelectModel<typeof xpSession>;

export type SkillWithPrerequisites = Skill & {
  prerequisites: (SkillPrerequisite & { prerequisite: Skill })[];
  milestones: Milestone[];
};
