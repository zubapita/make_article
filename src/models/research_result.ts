export type ResearchItem = {
  url: string;
  title: string;
  summary: string;
};

export type ResearchResult = {
  items: ResearchItem[];
};
