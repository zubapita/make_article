import fs from "fs";
import path from "path";

export type ArtifactKey = "theme" | "discussion" | "research" | "outline" | "draft" | "review";

const baseDir = process.env.PROJECTS_BASE_DIR || path.join(process.cwd(), "projects");

export function loadProjectContext(
  projectId: string,
  artifactTypes: ArtifactKey[]
): Record<string, string> {
  const result: Record<string, string> = {};
  const dir = path.join(baseDir, projectId);

  for (const type of artifactTypes) {
    const filePath = path.join(dir, `${type}.md`);
    if (fs.existsSync(filePath)) {
      result[type] = fs.readFileSync(filePath, "utf-8").trim();
    } else {
      result[type] = "";
    }
  }

  return result;
}
