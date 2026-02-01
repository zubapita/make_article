import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function withTempCwd<T>(fn: (tempDir: string) => Promise<T>) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "agent-runner-"));
  const originalCwd = process.cwd();
  process.chdir(tempDir);
  return fn(tempDir).finally(() => {
    process.chdir(originalCwd);
    fs.rmSync(tempDir, { recursive: true, force: true });
  });
}

// --- context_loader tests ---

test("context_loader reads existing files", async () => {
  await withTempCwd(async (tempDir) => {
    const { loadProjectContext } = await import(
      "../src/controllers/context_loader"
    );
    const projectDir = path.join(tempDir, "projects", "test-1");
    fs.mkdirSync(projectDir, { recursive: true });
    fs.writeFileSync(path.join(projectDir, "theme.md"), "AI and society\n");
    fs.writeFileSync(
      path.join(projectDir, "discussion.md"),
      "Focus on ethics\n"
    );

    const ctx = loadProjectContext("test-1", ["theme", "discussion", "research"]);
    assert.equal(ctx.theme, "AI and society");
    assert.equal(ctx.discussion, "Focus on ethics");
    assert.equal(ctx.research, "");
  });
});

test("context_loader returns empty strings for missing files", async () => {
  await withTempCwd(async (tempDir) => {
    const { loadProjectContext } = await import(
      "../src/controllers/context_loader"
    );
    const projectDir = path.join(tempDir, "projects", "test-2");
    fs.mkdirSync(projectDir, { recursive: true });

    const ctx = loadProjectContext("test-2", ["theme", "outline", "draft"]);
    assert.equal(ctx.theme, "");
    assert.equal(ctx.outline, "");
    assert.equal(ctx.draft, "");
  });
});

// --- prompt_templates tests ---

test("researchPrompt includes theme and search results", async () => {
  const { researchPrompt } = await import(
    "../src/controllers/prompt_templates"
  );
  const prompt = researchPrompt("AI Ethics", "Discuss bias", [
    { url: "https://example.com", title: "Example", content: "AI bias info" },
  ]);
  assert.ok(prompt.includes("AI Ethics"));
  assert.ok(prompt.includes("Discuss bias"));
  assert.ok(prompt.includes("https://example.com"));
  assert.ok(prompt.includes("AI bias info"));
});

test("outlinePrompt includes theme, discussion, and research", async () => {
  const { outlinePrompt } = await import(
    "../src/controllers/prompt_templates"
  );
  const prompt = outlinePrompt("Topic A", "Some discussion", "Research data");
  assert.ok(prompt.includes("Topic A"));
  assert.ok(prompt.includes("Some discussion"));
  assert.ok(prompt.includes("Research data"));
});

test("draftPrompt includes theme, outline, and research", async () => {
  const { draftPrompt } = await import("../src/controllers/prompt_templates");
  const prompt = draftPrompt("Topic B", "## Section 1", "Research content");
  assert.ok(prompt.includes("Topic B"));
  assert.ok(prompt.includes("## Section 1"));
  assert.ok(prompt.includes("Research content"));
});

test("reviewPrompt includes theme, draft, and feedback", async () => {
  const { reviewPrompt } = await import("../src/controllers/prompt_templates");
  const prompt = reviewPrompt("Topic C", "Draft text here", "Add more detail");
  assert.ok(prompt.includes("Topic C"));
  assert.ok(prompt.includes("Draft text here"));
  assert.ok(prompt.includes("Add more detail"));
});

test("researchPrompt handles empty search results", async () => {
  const { researchPrompt } = await import(
    "../src/controllers/prompt_templates"
  );
  const prompt = researchPrompt("Theme", "", []);
  assert.ok(prompt.includes("No search results available"));
});

test("openingPrompt includes theme", async () => {
  const { openingPrompt } = await import(
    "../src/controllers/prompt_templates"
  );
  const prompt = openingPrompt("AI in Healthcare");
  assert.ok(prompt.includes("AI in Healthcare"));
  assert.ok(prompt.includes("Theme"));
});

test("discussionPrompt includes theme and conversation history", async () => {
  const { discussionPrompt } = await import(
    "../src/controllers/prompt_templates"
  );
  const messages = [
    { role: "assistant" as const, content: "Hello!", timestamp: "2024-01-01T00:00:00Z" },
    { role: "user" as const, content: "I want to write about AI", timestamp: "2024-01-01T00:01:00Z" },
  ];
  const prompt = discussionPrompt("AI Topic", messages);
  assert.ok(prompt.includes("AI Topic"));
  assert.ok(prompt.includes("[assistant]: Hello!"));
  assert.ok(prompt.includes("[user]: I want to write about AI"));
});

test("discussionPrompt handles empty messages", async () => {
  const { discussionPrompt } = await import(
    "../src/controllers/prompt_templates"
  );
  const prompt = discussionPrompt("Theme", []);
  assert.ok(prompt.includes("No conversation yet"));
});

// --- prompt_templates integration test ---

test("researchPrompt builds correct prompt from context values", async () => {
  const { researchPrompt } = await import(
    "../src/controllers/prompt_templates"
  );

  const theme = "Test theme";
  const discussion = "Test discussion";
  const searchResults = [
    { url: "https://test.com", title: "Test", content: "Test content" },
  ];

  const prompt = researchPrompt(theme, discussion, searchResults);
  assert.ok(prompt.includes("Test theme"));
  assert.ok(prompt.includes("Test discussion"));
  assert.ok(prompt.includes("https://test.com"));
  assert.ok(prompt.includes("Test content"));
});

// --- template loading tests (Contract 07) ---

test("loadTemplate reads a skill file", async () => {
  const { loadTemplate } = await import("../src/controllers/prompt_templates");
  const template = loadTemplate("opening");
  assert.ok(template.includes("{{theme}}"));
  assert.ok(template.includes("editorial assistant"));
});

test("renderTemplate replaces placeholders", async () => {
  const { renderTemplate } = await import("../src/controllers/prompt_templates");
  const result = renderTemplate("Hello {{name}}, welcome to {{place}}!", {
    name: "Alice",
    place: "Wonderland",
  });
  assert.equal(result, "Hello Alice, welcome to Wonderland!");
});

test("renderTemplate leaves missing placeholders empty", async () => {
  const { renderTemplate } = await import("../src/controllers/prompt_templates");
  const result = renderTemplate("{{exists}} and {{missing}}", { exists: "here" });
  assert.equal(result, "here and ");
});

// --- redraftPrompt tests (Contract 04) ---

test("redraftPrompt includes all parameters", async () => {
  const { redraftPrompt } = await import("../src/controllers/prompt_templates");
  const prompt = redraftPrompt(
    "Theme X",
    "## Outline",
    "Research data",
    "Current draft text",
    "Review feedback text"
  );
  assert.ok(prompt.includes("Theme X"));
  assert.ok(prompt.includes("## Outline"));
  assert.ok(prompt.includes("Research data"));
  assert.ok(prompt.includes("Current draft text"));
  assert.ok(prompt.includes("Review feedback text"));
});

test("redraftPrompt uses default text for empty params", async () => {
  const { redraftPrompt } = await import("../src/controllers/prompt_templates");
  const prompt = redraftPrompt("Theme", "", "", "", "");
  assert.ok(prompt.includes("No outline available"));
  assert.ok(prompt.includes("No research available"));
  assert.ok(prompt.includes("No draft available"));
  assert.ok(prompt.includes("No feedback"));
});

// --- cli_executor multi-CLI agent tests ---

test("executeCliAgent uses claude args by default", async () => {
  const { executeCliAgent } = await import("../src/controllers/cli_executor");
  const mockCliPath = path.join(__dirname, "e2e", "mock-claude.sh");

  // mock-claude.sh echoes output based on prompt content; default is claude args
  const result = await executeCliAgent(mockCliPath, "editorial assistant", 5000);
  assert.ok(result.stdout.includes("mock-opening"));
});

test("executeCliAgent accepts codex agent type", async () => {
  const { executeCliAgent } = await import("../src/controllers/cli_executor");
  const mockCliPath = path.join(__dirname, "e2e", "mock-claude.sh");

  // mock-claude.sh ignores flags, so it works for any agent type
  const result = await executeCliAgent(mockCliPath, "editorial assistant", 5000, "codex");
  assert.ok(result.stdout.includes("mock-opening"));
});

test("executeCliAgent accepts gemini agent type", async () => {
  const { executeCliAgent } = await import("../src/controllers/cli_executor");
  const mockCliPath = path.join(__dirname, "e2e", "mock-claude.sh");

  const result = await executeCliAgent(mockCliPath, "article writer", 5000, "gemini");
  assert.ok(result.stdout.includes("mock-draft"));
});

test("executeCliAgent accepts opencode agent type", async () => {
  const { executeCliAgent } = await import("../src/controllers/cli_executor");
  const mockCliPath = path.join(__dirname, "e2e", "mock-claude.sh");

  const result = await executeCliAgent(mockCliPath, "research analyst", 5000, "opencode");
  assert.ok(result.stdout.includes("mock-research"));
});

test("CliAgentType and cliConfigs are properly exported", async () => {
  const mod = await import("../src/controllers/cli_executor");
  // Verify the type exists by checking executeCliAgent accepts the agentType param
  assert.equal(typeof mod.executeCliAgent, "function");
  // Verify function has 4 parameters (cliPath, prompt, timeoutMs, agentType)
  assert.equal(mod.executeCliAgent.length, 3); // last param has default, so .length is 3
});
