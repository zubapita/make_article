import { NextResponse } from "next/server";
import { createProjectRepository } from "../../../../../repositories/project_repository";
import { createAgentRunner } from "../../../../../controllers/agent_runner";
import { createWorkflowController } from "../../../../../controllers/workflow_controller";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await request.json();
  const feedback = String(body.feedback || "");
  if (!feedback) {
    return NextResponse.json({ status: "error", message: "feedback is required" }, { status: 400 });
  }

  const repo = createProjectRepository();
  const runner = createAgentRunner();
  const controller = createWorkflowController(repo, runner);
  const result = await controller.applyReview(id, feedback);

  return NextResponse.json({
    status: result.status,
    projectId: id,
    data: { updatedDraft: result.updatedDraft },
    messages: result.messages,
  });
}
