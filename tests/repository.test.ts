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
