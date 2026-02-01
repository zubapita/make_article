import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { setupE2E, E2EContext } from "./setup";
import { postJson, getJson, getText } from "./helpers";

let ctx: E2EContext;
let projectId: string;

describe("E2E: Full workflow", () => {
  before(async () => {
    ctx = await setupE2E();
  }, { timeout: 120000 });

  after(async () => {
    if (ctx) await ctx.cleanup();
  }, { timeout: 30000 });

  // ─── Happy Path (12) ──────────────────────────────────────────

  it("1. POST /api/projects creates a project", async () => {
    const res = await postJson("/api/projects", { theme: "AIと教育" });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.status, "idea");
    assert.ok(res.data.projectId, "projectId should be returned");
    projectId = res.data.projectId;
  });

  it("2. GET /api/projects/[id] returns the project", async () => {
    const res = await getJson(`/api/projects/${projectId}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.status, "idea");
    assert.strictEqual(res.data.data.theme, "AIと教育");
  });

  it("3. POST opening generates AI opening", async () => {
    const res = await postJson(`/api/projects/${projectId}/opening`, {});
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.aiMessage.includes("mock-opening"), "aiMessage should contain mock-opening");
    assert.strictEqual(res.data.messages.length, 1);
  });

  it("4. GET messages returns persisted messages", async () => {
    const res = await getJson(`/api/projects/${projectId}/messages`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.messages.length, 1);
  });

  it("5. POST discussion appends user+AI messages", async () => {
    const res = await postJson(`/api/projects/${projectId}/discussion`, {
      message: "ターゲット読者は大学生です",
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.aiMessage.includes("mock-discussion"), "aiMessage should contain mock-discussion");
    assert.strictEqual(res.data.messages.length, 3);
  });

  it("6. POST research runs research", async () => {
    const res = await postJson(`/api/projects/${projectId}/research`, {});
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.status, "research");
    assert.ok(
      res.data.data.researchSummary.includes("mock-research"),
      "summary should contain mock-research"
    );
  });

  it("7. POST outline generates outline", async () => {
    const res = await postJson(`/api/projects/${projectId}/outline`, {});
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.status, "outline");
    assert.ok(
      res.data.data.outlineMarkdown.includes("mock-outline"),
      "outline should contain mock-outline"
    );
  });

  it("8. POST draft generates draft", async () => {
    const res = await postJson(`/api/projects/${projectId}/draft`, {});
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.status, "draft");
    assert.ok(
      res.data.data.draftMarkdown.includes("mock-draft"),
      "draft should contain mock-draft"
    );
  });

  it("9. POST review applies review", async () => {
    const res = await postJson(`/api/projects/${projectId}/review`, {
      feedback: "もう少し具体的な事例を追加してください",
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.status, "review");
    assert.ok(
      res.data.data.updatedDraft.includes("mock-review"),
      "review draft should contain mock-review"
    );
  });

  it("10. POST complete marks project done", async () => {
    const res = await postJson(`/api/projects/${projectId}/complete`, {});
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.status, "done");
  });

  it("11. GET project after complete shows done", async () => {
    const res = await getJson(`/api/projects/${projectId}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.status, "done");
  });

  it("12. File system has all expected files", () => {
    const dir = path.join(ctx.tempDir, projectId);
    const expectedFiles = [
      "metadata.json",
      "theme.md",
      "discussion.md",
      "research.md",
      "outline.md",
      "draft.md",
      "review.md",
      "messages.json",
    ];
    for (const file of expectedFiles) {
      assert.ok(fs.existsSync(path.join(dir, file)), `${file} should exist`);
    }
  });

  // ─── Message Persistence (4) ──────────────────────────────────

  it("13. Multiple discussion rounds accumulate messages", async () => {
    // Create a fresh project for this test
    const create = await postJson("/api/projects", { theme: "メッセージ蓄積テスト" });
    const pid = create.data.projectId;

    // Opening: 1 message (assistant)
    await postJson(`/api/projects/${pid}/opening`, {});

    // 3 rounds of discussion: each adds user + assistant = 2 messages per round
    await postJson(`/api/projects/${pid}/discussion`, { message: "質問1" });
    await postJson(`/api/projects/${pid}/discussion`, { message: "質問2" });
    await postJson(`/api/projects/${pid}/discussion`, { message: "質問3" });

    const res = await getJson(`/api/projects/${pid}/messages`);
    // opening(1) + 3 rounds(2 each) = 7
    assert.strictEqual(res.data.messages.length, 7);
  });

  it("14. System message added after research", async () => {
    // Use the main projectId which went through full workflow
    const res = await getJson(`/api/projects/${projectId}/messages`);
    const messages = res.data.messages;
    // Find system messages
    const systemMessages = messages.filter((m: { role: string }) => m.role === "system");
    assert.ok(systemMessages.length > 0, "should have system messages");
  });

  it("15. Message roles follow expected pattern", async () => {
    const res = await getJson(`/api/projects/${projectId}/messages`);
    const messages = res.data.messages;
    assert.ok(messages.length > 0, "should have messages");
    // First message should be assistant (opening)
    assert.strictEqual(messages[0].role, "assistant");
    // After opening, pattern should be user, assistant pairs
    if (messages.length >= 3) {
      assert.strictEqual(messages[1].role, "user");
      assert.strictEqual(messages[2].role, "assistant");
    }
  });

  it("16. GET messages matches messages.json file", async () => {
    const res = await getJson(`/api/projects/${projectId}/messages`);
    const apiMessages = res.data.messages;

    const filePath = path.join(ctx.tempDir, projectId, "messages.json");
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const fileMessages = JSON.parse(fileContent);

    assert.deepStrictEqual(apiMessages, fileMessages);
  });

  // ─── Artifacts (6) ────────────────────────────────────────────

  it("17. Initial artifacts: only theme has content", async () => {
    const create = await postJson("/api/projects", { theme: "Artifacts初期テスト" });
    const pid = create.data.projectId;
    const res = await getJson(`/api/projects/${pid}/artifacts`);
    assert.strictEqual(res.status, 200);
    const artifacts = res.data.data;
    const theme = artifacts.find((a: { type: string }) => a.type === "theme");
    assert.ok(theme.content, "theme should have content");
    const others = artifacts.filter((a: { type: string }) => a.type !== "theme");
    for (const a of others) {
      assert.strictEqual(a.content, null, `${a.type} should be null initially`);
    }
  });

  it("18. Artifacts accumulate through workflow stages", async () => {
    // Use the main projectId which has completed full workflow
    const res = await getJson(`/api/projects/${projectId}/artifacts`);
    const artifacts = res.data.data;
    const types = ["theme", "discussion", "research", "outline", "draft", "review"];
    for (const type of types) {
      const a = artifacts.find((x: { type: string }) => x.type === type);
      assert.ok(a.content, `${type} should have content after full workflow`);
    }
  });

  it("19. Single artifact download returns text/markdown", async () => {
    const res = await getText(`/api/projects/${projectId}/artifact?type=theme`);
    assert.strictEqual(res.status, 200);
    const ct = res.headers.get("content-type") || "";
    assert.ok(ct.includes("text/markdown"), "Content-Type should be text/markdown");
  });

  it("20. Draft artifact contains mock content", async () => {
    const res = await getText(`/api/projects/${projectId}/artifact?type=draft`);
    assert.strictEqual(res.status, 200);
    assert.ok(res.text.includes("mock-draft"), "draft artifact should contain mock-draft");
  });

  it("21. Invalid artifact type returns 400", async () => {
    const res = await getJson(`/api/projects/${projectId}/artifact?type=invalid`);
    assert.strictEqual(res.status, 400);
  });

  it("22. Ungenerated artifact returns 404", async () => {
    // Create a new project that hasn't done research
    const create = await postJson("/api/projects", { theme: "未生成テスト" });
    const pid = create.data.projectId;
    const res = await getJson(`/api/projects/${pid}/artifact?type=research`);
    assert.strictEqual(res.status, 404);
  });

  // ─── Error Cases (6) ──────────────────────────────────────────

  it("23. Empty theme returns 400", async () => {
    const res = await postJson("/api/projects", { theme: "" });
    assert.strictEqual(res.status, 400);
  });

  it("24. Non-existent project returns error", async () => {
    const res = await getJson("/api/projects/nonexistent-project");
    assert.ok(res.status === 404 || res.status === 500, "should return 404 or 500");
    assert.strictEqual(res.data.status, "error");
  });

  it("25. Empty discussion message returns 400", async () => {
    const res = await postJson(`/api/projects/${projectId}/discussion`, { message: "" });
    assert.strictEqual(res.status, 400);
  });

  it("26. Empty review feedback returns 400", async () => {
    const res = await postJson(`/api/projects/${projectId}/review`, { feedback: "" });
    assert.strictEqual(res.status, 400);
  });

  it("27. Missing artifact type returns 400", async () => {
    const res = await getJson(`/api/projects/${projectId}/artifact`);
    assert.strictEqual(res.status, 400);
  });

  it("28. Messages for non-existent project returns empty", async () => {
    const res = await getJson("/api/projects/nonexistent-project/messages");
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(res.data.messages, []);
  });
});
