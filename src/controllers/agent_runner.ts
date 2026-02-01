import { loadProjectContext } from "./context_loader";
import { searchWeb } from "./search_client";
import { executeCliAgent } from "./cli_executor";
import { ChatMessage } from "../models/chat_message";
import {
  openingPrompt,
  discussionPrompt,
  researchPrompt,
  outlinePrompt,
  draftPrompt,
  reviewPrompt,
} from "./prompt_templates";

export type AgentRunner = {
  runAgent: (agentName: string, task: string, inputs: Record<string, string>) => Promise<string>;
};

export function createAgentRunner(): AgentRunner {
  const cliPath = process.env.CLAUDE_CLI_PATH || "claude";
  const timeoutMs = Number(process.env.AGENT_TIMEOUT_MS) || 300000;
  const tavilyKey = process.env.TAVILY_API_KEY || "";

  return {
    runAgent: async function (_agentName, task, inputs) {
      const projectId = inputs.projectId;

      if (task === "opening") {
        const ctx = loadProjectContext(projectId, ["theme"]);
        const prompt = openingPrompt(ctx.theme);
        const result = await executeCliAgent(cliPath, prompt, timeoutMs);
        return result.stdout;
      }

      if (task === "discuss") {
        const ctx = loadProjectContext(projectId, ["theme"]);
        const messagesJson = inputs._messagesJson || "[]";
        const messages: ChatMessage[] = JSON.parse(messagesJson);
        const prompt = discussionPrompt(ctx.theme, messages);
        const result = await executeCliAgent(cliPath, prompt, timeoutMs);
        return result.stdout;
      }

      if (task === "web_research") {
        const ctx = loadProjectContext(projectId, ["theme", "discussion"]);
        const searchResults = await searchWeb(ctx.theme, tavilyKey, 5);
        const prompt = researchPrompt(ctx.theme, ctx.discussion, searchResults);
        const result = await executeCliAgent(cliPath, prompt, timeoutMs);
        return result.stdout;
      }

      if (task === "create_outline") {
        const ctx = loadProjectContext(projectId, ["theme", "discussion", "research"]);
        const prompt = outlinePrompt(ctx.theme, ctx.discussion, ctx.research);
        const result = await executeCliAgent(cliPath, prompt, timeoutMs);
        return result.stdout;
      }

      if (task === "create_draft") {
        const ctx = loadProjectContext(projectId, ["theme", "outline", "research"]);
        const prompt = draftPrompt(ctx.theme, ctx.outline, ctx.research);
        const result = await executeCliAgent(cliPath, prompt, timeoutMs);
        return result.stdout;
      }

      if (task === "apply_review") {
        const ctx = loadProjectContext(projectId, ["theme", "draft"]);
        const feedback = inputs.feedback || "";
        const prompt = reviewPrompt(ctx.theme, ctx.draft, feedback);
        const result = await executeCliAgent(cliPath, prompt, timeoutMs);
        return result.stdout;
      }

      throw new Error(`Unknown task: ${task}`);
    },
  };
}
