import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

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

test("project_repository creates project and artifacts", async () => {
  await withTempCwd(async (tempDir) => {
    const repoModule = await import("../src/repositories/project_repository");
    const repo = repoModule.createProjectRepository();

    const project = repo.createProject("test theme");
    assert.equal(project.theme, "test theme");
    assert.equal(project.status, "idea");

    repo.saveArtifact(project.id, "discussion", "hello");

    const projectPath = path.join(tempDir, "projects", project.id);
    assert.ok(fs.existsSync(path.join(projectPath, "metadata.json")));
    assert.ok(fs.existsSync(path.join(projectPath, "theme.md")));
    assert.ok(fs.existsSync(path.join(projectPath, "discussion.md")));
  });
});

test("listProjects returns empty array for empty dir", async () => {
  await withTempCwd(async () => {
    const repoModule = await import("../src/repositories/project_repository");
    const repo = repoModule.createProjectRepository();
    const list = repo.listProjects();
    assert.ok(Array.isArray(list));
    assert.equal(list.length, 0);
  });
});

test("listProjects returns created projects", async () => {
  await withTempCwd(async () => {
    const repoModule = await import("../src/repositories/project_repository");
    const repo = repoModule.createProjectRepository();
    repo.createProject("Theme A");
    // small delay to ensure different timestamps
    await new Promise((r) => setTimeout(r, 10));
    repo.createProject("Theme B");
    const list = repo.listProjects();
    assert.equal(list.length, 2);
  });
});

test("deleteProject removes project directory", async () => {
  await withTempCwd(async () => {
    const repoModule = await import("../src/repositories/project_repository");
    const repo = repoModule.createProjectRepository();
    const p = repo.createProject("Delete me");
    repo.deleteProject(p.id);
    try {
      repo.loadProject(p.id);
      assert.fail("should have thrown");
    } catch (err) {
      // expected
    }
  });
});

test("deleteProject throws for non-existent project", async () => {
  await withTempCwd(async () => {
    const repoModule = await import("../src/repositories/project_repository");
    const repo = repoModule.createProjectRepository();
    try {
      repo.deleteProject("nonexistent");
      assert.fail("should have thrown");
    } catch (err) {
      assert.ok(err instanceof Error);
    }
  });
});
