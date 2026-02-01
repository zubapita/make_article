import { NextResponse } from "next/server";
import { createProjectRepository } from "../../../../../repositories/project_repository";
import { createAgentRunner } from "../../../../../controllers/agent_runner";
import { createWorkflowController, TransitionError } from "../../../../../controllers/workflow_controller";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const repo = createProjectRepository();
    const runner = createAgentRunner();
    const controller = createWorkflowController(repo, runner);
    const result = await controller.runResearch(id);

    return NextResponse.json({
      status: result.status,
      projectId: id,
      data: { researchSummary: result.researchSummary },
      messages: result.messages,
    });
  } catch (err) {
    if (err instanceof TransitionError) {
      return NextResponse.json(
        { status: "error", message: err.message, currentStatus: err.currentStatus },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { status: "error", message: err instanceof Error ? err.message : "unknown error" },
      { status: 500 }
    );
  }
}
