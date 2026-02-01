import fs from "fs";
import path from "path";
import { ChatMessage } from "../models/chat_message";
import { SearchResult } from "./search_client";

const MAX_PROMPT_MESSAGES = 50;
const MAX_MESSAGE_CHARS = 2000;

const skillsDir =
  process.env.SKILLS_DIR || path.join(process.cwd(), "skills");

function truncateContent(content: string): string {
  if (content.length <= MAX_MESSAGE_CHARS) return content;
  return content.slice(0, MAX_MESSAGE_CHARS) + "...";
}

function formatMessages(messages: ChatMessage[]): string {
  if (messages.length === 0) return "(No conversation yet)";
  const recent =
    messages.length > MAX_PROMPT_MESSAGES
      ? messages.slice(-MAX_PROMPT_MESSAGES)
      : messages;
  return recent
    .map((m) => `[${m.role}]: ${truncateContent(m.content)}`)
    .join("\n");
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

export function loadTemplate(name: string): string {
  const filePath = path.join(skillsDir, `${name}.md`);
  return fs.readFileSync(filePath, "utf-8").trim();
}

export function renderTemplate(
  template: string,
  vars: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}

export function openingPrompt(theme: string): string {
  const template = loadTemplate("opening");
  return renderTemplate(template, { theme });
}

export function discussionPrompt(
  theme: string,
  messages: ChatMessage[]
): string {
  const template = loadTemplate("discussion");
  const history = formatMessages(messages);
  return renderTemplate(template, { theme, history });
}

export function researchPrompt(
  theme: string,
  discussion: string,
  searchResults: SearchResult[]
): string {
  const template = loadTemplate("research");
  const sources = formatSearchResults(searchResults);
  return renderTemplate(template, {
    theme,
    discussion: discussion || "(No discussion yet)",
    sources,
  });
}

export function outlinePrompt(
  theme: string,
  discussion: string,
  research: string
): string {
  const template = loadTemplate("outline");
  return renderTemplate(template, {
    theme,
    discussion: discussion || "(No discussion yet)",
    research: research || "(No research available)",
  });
}

export function draftPrompt(
  theme: string,
  outline: string,
  research: string
): string {
  const template = loadTemplate("draft");
  return renderTemplate(template, {
    theme,
    outline: outline || "(No outline available)",
    research: research || "(No research available)",
  });
}

export function reviewPrompt(
  theme: string,
  draft: string,
  feedback: string
): string {
  const template = loadTemplate("review");
  return renderTemplate(template, {
    theme,
    draft: draft || "(No draft available)",
    feedback,
  });
}

export function redraftPrompt(
  theme: string,
  outline: string,
  research: string,
  currentDraft: string,
  reviewFeedback: string
): string {
  const template = loadTemplate("redraft");
  return renderTemplate(template, {
    theme,
    outline: outline || "(No outline available)",
    research: research || "(No research available)",
    draft: currentDraft || "(No draft available)",
    review: reviewFeedback || "(No feedback)",
  });
}
