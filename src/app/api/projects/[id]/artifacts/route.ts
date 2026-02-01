import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const artifactFiles = ["theme", "discussion", "research", "outline", "draft", "review"];

export async function GET(
  _: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const baseDir = path.join(process.env.PROJECTS_BASE_DIR || path.join(process.cwd(), "projects"), id);
  try {
    const artifacts = artifactFiles.map((name) => {
      const filePath = path.join(baseDir, `${name}.md`);
      if (!fs.existsSync(filePath)) {
        return { type: name, content: null, updatedAt: null };
      }
      const content = fs.readFileSync(filePath, "utf-8");
      const stat = fs.statSync(filePath);
      return { type: name, content: content, updatedAt: stat.mtime.toISOString() };
    });
    return NextResponse.json({ status: "ok", projectId: id, data: artifacts });
  } catch (err) {
    return NextResponse.json({ status: "error", message: "project not found" }, { status: 404 });
  }
}
