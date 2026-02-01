import { NextResponse } from "next/server";
import { createProjectRepository } from "../../../../../repositories/project_repository";

export async function GET(
  _: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const repo = createProjectRepository();
  const messages = repo.loadMessages(id);
  return NextResponse.json({ messages: messages });
}
