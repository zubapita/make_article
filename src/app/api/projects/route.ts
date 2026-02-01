import { NextResponse } from "next/server";
import { createProjectRepository } from "../../../repositories/project_repository";
import { createAgentRunner } from "../../../controllers/agent_runner";
import { createWorkflowController } from "../../../controllers/workflow_controller";

export async function POST(request: Request) {
  const body = await request.json();
  const theme = String(body.theme || "");
  if (!theme) {
    return NextResponse.json({ status: "error", message: "theme is required" }, { status: 400 });
  }

  const repo = createProjectRepository();
  const runner = createAgentRunner();
  const controller = createWorkflowController(repo, runner);
  const project = controller.startProject(theme);

  return NextResponse.json({ status: project.status, projectId: project.id });
}
