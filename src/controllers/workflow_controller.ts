import { ArticleProject, ProjectStatus } from "../models/article_project";
import { ChatMessage } from "../models/chat_message";
import { AgentRunner } from "./agent_runner";
import { ProjectRepository } from "../repositories/project_repository";

type DiscussionResult = {
  status: ProjectStatus;
  aiMessage: string;
  messages: ChatMessage[];
};

export type WorkflowController = {
  startProject: (theme: string) => ArticleProject;
  generateOpening: (id: string) => Promise<DiscussionResult>;
  appendDiscussion: (id: string, message: string) => Promise<DiscussionResult>;
  loadMessages: (id: string) => ChatMessage[];
  runResearch: (id: string) => Promise<{
    status: ProjectStatus;
    researchSummary: string;
    messages: ChatMessage[];
  }>;
  generateOutline: (id: string) => Promise<{
    status: ProjectStatus;
    outlineMarkdown: string;
    messages: ChatMessage[];
  }>;
  generateDraft: (id: string) => Promise<{
    status: ProjectStatus;
    draftMarkdown: string;
    messages: ChatMessage[];
  }>;
  applyReview: (id: string, feedback: string) => Promise<{
    status: ProjectStatus;
    updatedDraft: string;
    messages: ChatMessage[];
  }>;
  complete: (id: string) => { status: ProjectStatus; messages: ChatMessage[] };
};

function createMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return { role: role, content: content, timestamp: new Date().toISOString() };
}

function rebuildDiscussionMd(messages: ChatMessage[]): string {
  return messages
    .filter((m) => m.role !== "system")
    .map((m) => {
      const label = m.role === "user" ? "User" : "AI";
      return `**${label}**: ${m.content}`;
    })
    .join("\n\n");
}

export function createWorkflowController(
  repo: ProjectRepository,
  runner: AgentRunner
): WorkflowController {
  function updateStatus(id: string, status: ProjectStatus) {
    const project = repo.loadProject(id);
    repo.saveProject({ ...project, status: status });
    return status;
  }

  function addSystemMessage(id: string, content: string): ChatMessage[] {
    const msg = createMessage("system", content);
    repo.appendMessage(id, msg);
    return repo.loadMessages(id);
  }

  return {
    startProject: function (theme) {
      return repo.createProject(theme);
    },
    generateOpening: async function (id) {
      const aiResponse = await runner.runAgent("discussion", "opening", { projectId: id });
      const msg = createMessage("assistant", aiResponse);
      repo.appendMessage(id, msg);
      const messages = repo.loadMessages(id);
      repo.saveArtifact(id, "discussion", rebuildDiscussionMd(messages));
      const status = updateStatus(id, "idea");
      return { status: status, aiMessage: aiResponse, messages: messages };
    },
    appendDiscussion: async function (id, message) {
      const userMsg = createMessage("user", message);
      repo.appendMessage(id, userMsg);
      const allMessages = repo.loadMessages(id);
      const messagesJson = JSON.stringify(allMessages);
      const aiResponse = await runner.runAgent("discussion", "discuss", {
        projectId: id,
        _messagesJson: messagesJson,
      });
      const aiMsg = createMessage("assistant", aiResponse);
      repo.appendMessage(id, aiMsg);
      const messages = repo.loadMessages(id);
      repo.saveArtifact(id, "discussion", rebuildDiscussionMd(messages));
      const status = updateStatus(id, "idea");
      return { status: status, aiMessage: aiResponse, messages: messages };
    },
    loadMessages: function (id) {
      return repo.loadMessages(id);
    },
    runResearch: async function (id) {
      const payload = await runner.runAgent("research", "web_research", { projectId: id });
      repo.saveArtifact(id, "research", payload);
      const status = updateStatus(id, "research");
      const messages = addSystemMessage(id, "リサーチが完了しました。");
      return { status: status, researchSummary: payload, messages: messages };
    },
    generateOutline: async function (id) {
      const payload = await runner.runAgent("outline", "create_outline", { projectId: id });
      repo.saveArtifact(id, "outline", payload);
      const status = updateStatus(id, "outline");
      const messages = addSystemMessage(id, "構成案が作成されました。");
      return { status: status, outlineMarkdown: payload, messages: messages };
    },
    generateDraft: async function (id) {
      const payload = await runner.runAgent("draft", "create_draft", { projectId: id });
      repo.saveArtifact(id, "draft", payload);
      const status = updateStatus(id, "draft");
      const messages = addSystemMessage(id, "原稿が作成されました。");
      return { status: status, draftMarkdown: payload, messages: messages };
    },
    applyReview: async function (id, feedback) {
      const payload = await runner.runAgent("review", "apply_review", {
        projectId: id,
        feedback: feedback,
      });
      repo.saveArtifact(id, "review", payload);
      const status = updateStatus(id, "review");
      const messages = addSystemMessage(id, "レビューが完了しました。");
      return { status: status, updatedDraft: payload, messages: messages };
    },
    complete: function (id) {
      const status = updateStatus(id, "done");
      const messages = addSystemMessage(id, "記事が完成しました。");
      return { status: status, messages: messages };
    },
  };
}
