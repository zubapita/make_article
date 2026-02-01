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
  const message = String(body.message || "");
  if (!message) {
    return NextResponse.json({ status: "error", message: "message is required" }, { status: 400 });
  }

  const repo = createProjectRepository();
  const runner = createAgentRunner();
  const controller = createWorkflowController(repo, runner);
  const result = await controller.appendDiscussion(id, message);

  return NextResponse.json({
    status: result.status,
    projectId: id,
    aiMessage: result.aiMessage,
    messages: result.messages,
  });
}
