import { ChatMessage } from "../models/chat_message";
import { SearchResult } from "./search_client";

const MAX_PROMPT_MESSAGES = 50;
const MAX_MESSAGE_CHARS = 2000;

function truncateContent(content: string): string {
  if (content.length <= MAX_MESSAGE_CHARS) return content;
  return content.slice(0, MAX_MESSAGE_CHARS) + "...";
}

function formatMessages(messages: ChatMessage[]): string {
  if (messages.length === 0) return "(No conversation yet)";
  const recent = messages.length > MAX_PROMPT_MESSAGES
    ? messages.slice(-MAX_PROMPT_MESSAGES)
    : messages;
  return recent
    .map((m) => `[${m.role}]: ${truncateContent(m.content)}`)
    .join("\n");
}

export function openingPrompt(theme: string): string {
  return `You are an editorial assistant helping a writer develop an article. The writer has chosen a theme. Your job is to ask thoughtful questions to help clarify the direction, scope, and angle of the article.

## Theme
${theme}

## Instructions
- Ask 2-3 focused questions about the theme
- Help the writer think about audience, angle, and key points
- Be conversational and encouraging
- Write in Japanese
- Output your response directly, no preamble or markdown headers`;
}

export function discussionPrompt(
  theme: string,
  messages: ChatMessage[]
): string {
  const history = formatMessages(messages);
  return `You are an editorial assistant helping a writer develop an article through discussion. Continue the conversation based on the history below.

## Theme
${theme}

## Conversation History
${history}

## Instructions
- Respond to the writer's latest message
- Ask follow-up questions if needed to clarify the article direction
- Summarize key decisions when the discussion seems to converge
- Be conversational and helpful
- Write in Japanese
- Output your response directly, no preamble or markdown headers`;
}

function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) return "(No search results available)";
  return results
    .map(
      (r, i) =>
        `### Source ${i + 1}: ${r.title}\nURL: ${r.url}\n${r.content}`
    )
    .join("\n\n");
}

export function researchPrompt(
  theme: string,
  discussion: string,
  searchResults: SearchResult[]
): string {
  const sources = formatSearchResults(searchResults);
  return `You are a research analyst. Analyze the following web search results and create a comprehensive research report in Markdown.

## Theme
${theme}

## Discussion Context
${discussion || "(No discussion yet)"}

## Web Search Results
${sources}

## Instructions
- Summarize key findings from the search results
- Include source URLs as references
- Organize by topic or theme
- Highlight important quotes or data points
- Write in Japanese
- Output Markdown only, no preamble`;
}

export function outlinePrompt(
  theme: string,
  discussion: string,
  research: string
): string {
  return `You are an article planner. Create a detailed article outline in Markdown based on the provided context.

## Theme
${theme}

## Discussion Context
${discussion || "(No discussion yet)"}

## Research
${research || "(No research available)"}

## Instructions
- Create a clear hierarchical outline with sections and subsections
- Each section should have a brief description of what to cover
- Suggest an engaging title
- Include introduction and conclusion sections
- Write in Japanese
- Output Markdown only, no preamble`;
}

export function draftPrompt(
  theme: string,
  outline: string,
  research: string
): string {
  return `You are a skilled article writer. Write a complete article draft in Markdown following the provided outline.

## Theme
${theme}

## Outline
${outline || "(No outline available)"}

## Research
${research || "(No research available)"}

## Instructions
- Follow the outline structure closely
- Use research data and quotes with proper attribution
- Write engaging, well-structured prose
- Include section headings matching the outline
- Write in Japanese
- Output Markdown only, no preamble`;
}

export function reviewPrompt(
  theme: string,
  draft: string,
  feedback: string
): string {
  return `You are an experienced editor. Revise the article draft based on the feedback provided.

## Theme
${theme}

## Current Draft
${draft || "(No draft available)"}

## Feedback
${feedback}

## Instructions
- Address all feedback points
- Improve clarity and flow where needed
- Maintain the original structure unless feedback says otherwise
- Write in Japanese
- Output the complete revised article in Markdown, no preamble`;
}
