import { NextResponse } from "next/server";
import { createProjectRepository } from "../../../../../repositories/project_repository";
import { createAgentRunner } from "../../../../../controllers/agent_runner";
import { createWorkflowController } from "../../../../../controllers/workflow_controller";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const repo = createProjectRepository();
  const runner = createAgentRunner();
  const controller = createWorkflowController(repo, runner);
  const result = controller.complete(id);

  return NextResponse.json({
    status: result.status,
    projectId: id,
    messages: result.messages,
  });
}
