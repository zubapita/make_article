import fs from "fs";
import path from "path";
import { ArticleProject } from "../models/article_project";
import { ChatMessage } from "../models/chat_message";

function safeParseMessages(data: string): ChatMessage[] {
  try {
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed as ChatMessage[];
    }
    return [];
  } catch {
    return [];
  }
}

function atomicWriteFile(filePath: string, content: string) {
  const tmpPath = path.join(
    path.dirname(filePath),
    `.tmp-${process.pid}-${Date.now()}${path.extname(filePath)}`
  );
  fs.writeFileSync(tmpPath, content);
  fs.renameSync(tmpPath, filePath);
}

export type ArtifactType =
  | "theme"
  | "discussion"
  | "research"
  | "outline"
  | "draft"
  | "review";

export type ProjectRepository = {
  createProject: (theme: string) => ArticleProject;
  loadProject: (id: string) => ArticleProject;
  saveProject: (project: ArticleProject) => void;
  saveArtifact: (id: string, type: ArtifactType, markdown: string) => void;
  loadMessages: (id: string) => ChatMessage[];
  appendMessage: (id: string, message: ChatMessage) => void;
  listProjects: () => ArticleProject[];
  deleteProject: (id: string) => void;
};

const baseDir = process.env.PROJECTS_BASE_DIR || path.join(process.cwd(), "projects");

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function projectDir(id: string) {
  return path.join(baseDir, id);
}

export function createProjectRepository(): ProjectRepository {
  return {
    createProject: function (theme) {
      const id = `project-${Date.now()}`;
      const now = new Date().toISOString();
      const project: ArticleProject = {
        id: id,
        theme: theme,
        status: "idea",
        createdAt: now,
        updatedAt: now,
      };
      const dir = projectDir(id);
      ensureDir(dir);
      fs.writeFileSync(path.join(dir, "metadata.json"), JSON.stringify(project, null, 2));
      fs.writeFileSync(path.join(dir, "theme.md"), theme + "\n");
      return project;
    },
    loadProject: function (id) {
      const filePath = path.join(projectDir(id), "metadata.json");
      const data = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(data) as ArticleProject;
    },
    saveProject: function (project) {
      const dir = projectDir(project.id);
      ensureDir(dir);
      const updated = { ...project, updatedAt: new Date().toISOString() };
      fs.writeFileSync(path.join(dir, "metadata.json"), JSON.stringify(updated, null, 2));
    },
    saveArtifact: function (id, type, markdown) {
      const dir = projectDir(id);
      ensureDir(dir);
      fs.writeFileSync(path.join(dir, `${type}.md`), markdown + "\n");
    },
    loadMessages: function (id) {
      const filePath = path.join(projectDir(id), "messages.json");
      if (!fs.existsSync(filePath)) {
        return [];
      }
      const data = fs.readFileSync(filePath, "utf-8");
      return safeParseMessages(data);
    },
    appendMessage: function (id, message) {
      const dir = projectDir(id);
      ensureDir(dir);
      const filePath = path.join(dir, "messages.json");
      const messages: ChatMessage[] = fs.existsSync(filePath)
        ? safeParseMessages(fs.readFileSync(filePath, "utf-8"))
        : [];
      messages.push(message);
      atomicWriteFile(filePath, JSON.stringify(messages, null, 2));
    },
    listProjects: function () {
      if (!fs.existsSync(baseDir)) return [];
      const entries = fs.readdirSync(baseDir, { withFileTypes: true });
      const projects: ArticleProject[] = [];
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const metaPath = path.join(baseDir, entry.name, "metadata.json");
        if (!fs.existsSync(metaPath)) continue;
        try {
          const data = fs.readFileSync(metaPath, "utf-8");
          projects.push(JSON.parse(data) as ArticleProject);
        } catch {
          // skip invalid
        }
      }
      projects.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
      return projects;
    },
    deleteProject: function (id) {
      const dir = projectDir(id);
      if (!fs.existsSync(dir)) {
        throw new Error(`Project not found: ${id}`);
      }
      fs.rmSync(dir, { recursive: true, force: true });
    },
  };
}
