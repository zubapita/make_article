export type SearchResult = {
  url: string;
  title: string;
  content: string;
};

export async function searchWeb(
  query: string,
  apiKey: string,
  maxResults: number = 5
): Promise<SearchResult[]> {
  if (!apiKey) {
    throw new Error("TAVILY_API_KEY is not set. Set the environment variable to use web research.");
  }

  const tavilyUrl = process.env.TAVILY_API_URL || "https://api.tavily.com";
  const response = await fetch(`${tavilyUrl}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query: query,
      max_results: maxResults,
      include_answer: false,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Tavily API error (${response.status}): ${text}`);
  }

  const data = await response.json();
  const results: SearchResult[] = (data.results || []).map(
    (r: { url?: string; title?: string; content?: string }) => ({
      url: r.url || "",
      title: r.title || "",
      content: r.content || "",
    })
  );

  return results;
}
