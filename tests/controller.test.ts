import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { AgentRunner } from "../src/controllers/agent_runner";

function withTempCwd<T>(fn: (tempDir: string) => Promise<T>) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "make-article-"));
  const originalCwd = process.cwd();
  process.chdir(tempDir);
  return fn(tempDir)
    .finally(() => {
      process.chdir(originalCwd);
      fs.rmSync(tempDir, { recursive: true, force: true });
    });
}

function createMockRunner(): AgentRunner {
  return {
    runAgent: async function (_agentName, task, _inputs) {
      return `mock result for ${task}`;
    },
  };
}

test("workflow_controller runs minimal flow with mock runner", async () => {
  await withTempCwd(async (tempDir) => {
    const repoModule = await import("../src/repositories/project_repository");
    const controllerModule = await import("../src/controllers/workflow_controller");

    const repo = repoModule.createProjectRepository();
    const runner = createMockRunner();
    const controller = controllerModule.createWorkflowController(repo, runner);

    const project = controller.startProject("test theme");

    // generateOpening creates the first AI message
    const opening = await controller.generateOpening(project.id);
    assert.equal(opening.status, "idea");
    assert.equal(opening.aiMessage, "mock result for opening");
    assert.equal(opening.messages.length, 1);
    assert.equal(opening.messages[0].role, "assistant");

    // appendDiscussion is now async and returns AI response
    const discussion = await controller.appendDiscussion(project.id, "message");
    assert.ok(discussion.aiMessage.length > 0);
    assert.equal(discussion.status, "idea");
    // Should have: opening assistant + user + discuss assistant = 3 messages
    assert.equal(discussion.messages.length, 3);

    const research = await controller.runResearch(project.id);
    assert.ok(research.researchSummary.length > 0);
    assert.equal(research.status, "research");
    // Should have system message added
    assert.ok(research.messages.length > discussion.messages.length);

    // Verify research artifact is saved
    const researchPath = path.join(tempDir, "projects", project.id, "research.md");
    const savedResearch = fs.readFileSync(researchPath, "utf-8");
    assert.ok(savedResearch.includes("mock result for web_research"));

    const outline = await controller.generateOutline(project.id);
    assert.ok(outline.outlineMarkdown.length > 0);
    assert.equal(outline.status, "outline");

    const draft = await controller.generateDraft(project.id);
    assert.ok(draft.draftMarkdown.length > 0);
    assert.equal(draft.status, "draft");

    const review = await controller.applyReview(project.id, "feedback");
    assert.ok(review.updatedDraft.length > 0);
    assert.equal(review.status, "review");

    const completed = controller.complete(project.id);
    assert.equal(completed.status, "done");
    assert.ok(completed.messages.length > 0);

    const projectPath = path.join(tempDir, "projects", project.id);
    assert.ok(fs.existsSync(path.join(projectPath, "review.md")));
    assert.ok(fs.existsSync(path.join(projectPath, "draft.md")));
    assert.ok(fs.existsSync(path.join(projectPath, "messages.json")));
  });
});

import { TransitionError } from "../src/controllers/workflow_controller";

function createTestRepo() {
  const repoModule = require("../src/repositories/project_repository");
  return repoModule.createProjectRepository();
}

test("TransitionError: idea → outline is rejected", async () => {
  await withTempCwd(async () => {
    const repo = createTestRepo();
    const mockRunner = createMockRunner();
    const controllerModule = await import("../src/controllers/workflow_controller");
    const controller = controllerModule.createWorkflowController(repo, mockRunner);
    const project = controller.startProject("test theme");

    try {
      await controller.generateOutline(project.id);
      assert.fail("should have thrown TransitionError");
    } catch (err) {
      assert.ok(err instanceof TransitionError);
      assert.strictEqual((err as TransitionError).currentStatus, "idea");
    }
  });
});

test("TransitionError: idea → draft is rejected", async () => {
  await withTempCwd(async () => {
    const repo = createTestRepo();
    const mockRunner = createMockRunner();
    const controllerModule = await import("../src/controllers/workflow_controller");
    const controller = controllerModule.createWorkflowController(repo, mockRunner);
    const project = controller.startProject("test theme");

    try {
      await controller.generateDraft(project.id);
      assert.fail("should have thrown TransitionError");
    } catch (err) {
      assert.ok(err instanceof TransitionError);
    }
  });
});

test("TransitionError: idea → complete is rejected", async () => {
  await withTempCwd(async () => {
    const repo = createTestRepo();
    const mockRunner = createMockRunner();
    const controllerModule = await import("../src/controllers/workflow_controller");
    const controller = controllerModule.createWorkflowController(repo, mockRunner);
    const project = controller.startProject("test theme");

    try {
      controller.complete(project.id);
      assert.fail("should have thrown TransitionError");
    } catch (err) {
      assert.ok(err instanceof TransitionError);
    }
  });
});

test("TransitionError: done → all operations rejected", async () => {
  await withTempCwd(async () => {
    const repo = createTestRepo();
    const mockRunner = createMockRunner();
    const controllerModule = await import("../src/controllers/workflow_controller");
    const controller = controllerModule.createWorkflowController(repo, mockRunner);
    const project = controller.startProject("test theme");
    // Manually set status to done
    repo.saveProject({ ...project, status: "done" });

    try {
      await controller.runResearch(project.id);
      assert.fail("should have thrown");
    } catch (err) {
      assert.ok(err instanceof TransitionError);
    }
  });
});
