import { spawn } from "child_process";

export type CliResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
};

export type CliAgentType = "claude" | "codex" | "gemini" | "opencode";

const cliConfigs: Record<CliAgentType, { args: string[] }> = {
  claude:   { args: ["-p", "--output-format", "text"] },
  codex:    { args: ["-q"] },
  gemini:   { args: ["-p"] },
  opencode: { args: ["-p"] },
};

export function executeCliAgent(
  cliPath: string,
  prompt: string,
  timeoutMs: number,
  agentType: CliAgentType = "claude"
): Promise<CliResult> {
  return new Promise((resolve, reject) => {
    const config = cliConfigs[agentType] || cliConfigs.claude;
    const proc = spawn(cliPath, config.args, {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let killed = false;

    const timer = setTimeout(() => {
      killed = true;
      proc.kill("SIGTERM");
    }, timeoutMs);

    proc.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    proc.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    proc.on("close", (code) => {
      clearTimeout(timer);
      if (killed) {
        reject(new Error(`CLI agent timed out after ${timeoutMs}ms`));
        return;
      }
      if (code !== 0) {
        reject(
          new Error(`CLI agent exited with code ${code}. stderr: ${stderr}`)
        );
        return;
      }
      resolve({ stdout: stdout.trim(), stderr, exitCode: code ?? 0 });
    });

    proc.on("error", (err) => {
      clearTimeout(timer);
      reject(new Error(`Failed to spawn CLI agent at "${cliPath}": ${err.message}`));
    });

    proc.stdin.write(prompt);
    proc.stdin.end();
  });
}
