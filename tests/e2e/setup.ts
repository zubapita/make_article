import { spawn, ChildProcess } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { startMockTavilyServer, MockTavilyServer } from "./mock_tavily_server";
import { waitForServer } from "./helpers";

export type E2EContext = {
  tempDir: string;
  serverProcess: ChildProcess;
  tavilyServer: MockTavilyServer;
  cleanup: () => Promise<void>;
};

export async function setupE2E(): Promise<E2EContext> {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-projects-"));

  const tavilyServer = await startMockTavilyServer();

  const mockClaudePath = path.resolve(__dirname, "mock-claude.sh");

  const env = {
    ...process.env,
    PROJECTS_BASE_DIR: tempDir,
    CLAUDE_CLI_PATH: mockClaudePath,
    TAVILY_API_KEY: "test-key",
    TAVILY_API_URL: `http://127.0.0.1:${tavilyServer.port}`,
    AGENT_TIMEOUT_MS: "30000",
    PORT: "3000",
  };

  // Kill any existing process on port 3000
  try {
    const { execSync } = require("node:child_process");
    execSync("lsof -ti:3000 | xargs kill -9 2>/dev/null || true", { stdio: "ignore" });
  } catch {
    // ignore
  }

  // Wait a moment for port to free up
  await new Promise((r) => setTimeout(r, 1000));

  const projectRoot = path.resolve(__dirname, "../..");
  const serverProcess = spawn("npx", ["next", "dev", "-p", "3000"], {
    cwd: projectRoot,
    env: env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  serverProcess.stdout?.on("data", (chunk: Buffer) => {
    // Uncomment for debugging: console.log("[next]", chunk.toString());
  });
  serverProcess.stderr?.on("data", (chunk: Buffer) => {
    // Uncomment for debugging: console.error("[next:err]", chunk.toString());
  });

  await waitForServer(60000);

  const cleanup = async () => {
    serverProcess.kill("SIGTERM");
    await new Promise<void>((resolve) => {
      serverProcess.on("close", () => resolve());
      setTimeout(() => {
        serverProcess.kill("SIGKILL");
        resolve();
      }, 5000);
    });

    await tavilyServer.close();

    fs.rmSync(tempDir, { recursive: true, force: true });
  };

  return { tempDir, serverProcess, tavilyServer, cleanup };
}
