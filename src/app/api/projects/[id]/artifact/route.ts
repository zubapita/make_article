import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const allowedTypes = new Set([
  "theme",
  "discussion",
  "research",
  "outline",
  "draft",
  "review",
]);

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const url = new URL(request.url);
  const type = url.searchParams.get("type") || "";
  if (!allowedTypes.has(type)) {
    return NextResponse.json({ status: "error", message: "invalid type" }, { status: 400 });
  }

  const filePath = path.join(process.env.PROJECTS_BASE_DIR || path.join(process.cwd(), "projects"), id, `${type}.md`);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ status: "error", message: "file not found" }, { status: 404 });
  }

  const content = fs.readFileSync(filePath, "utf-8");
  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename=\"${type}.md\"`,
    },
  });
}
