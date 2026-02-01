import { NextResponse } from "next/server";
import { createProjectRepository } from "../../../../repositories/project_repository";

export async function GET(
  _: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const repo = createProjectRepository();
  try {
    const project = repo.loadProject(id);
    return NextResponse.json({ status: project.status, projectId: project.id, data: project });
  } catch (err) {
    return NextResponse.json(
      { status: "error", message: "project not found" },
      { status: 404 }
    );
  }
}
