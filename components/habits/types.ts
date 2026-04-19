export type SubskillGroup = {
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  subskills: { id: string; name: string }[];
};
