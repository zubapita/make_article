export type ProjectStatus = "idea" | "research" | "outline" | "draft" | "review" | "done";

export type ArticleProject = {
  id: string;
  theme: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
};
