# Contract 03: マルチCLIエージェント対応

## 優先度: 3

## 目的

Claude Code 以外のCLIエージェント（Codex CLI / Gemini CLI / OpenCode）をヘッドレス実行可能にする。
Plan.mdの主目的「CLI型AIエージェントに適切なMCPやSKILLが設定されていれば、呼び出すUIラッパーを作れる」の検証核心。

## 現状の問題

- `cli_executor.ts` が `spawn(cliPath, ["-p", "--output-format", "text"])` 固定
- `-p` と `--output-format text` は Claude Code 固有のオプション
- 他のCLIエージェントは異なるフラグ体系を持つ

## 各CLIのプロンプト渡しインタフェース

| CLI | コマンド形式 | stdin対応 |
|-----|------------|-----------|
| Claude Code | `claude -p --output-format text` | stdin にプロンプト |
| Codex CLI | `codex -q --prompt "..."` | 引数 or stdin |
| Gemini CLI | `gemini -p` | stdin にプロンプト |
| OpenCode | `opencode -p` | stdin にプロンプト |

## 変更対象ファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/controllers/cli_executor.ts` | CLI種別ごとのargs生成を追加 |
| `src/controllers/agent_runner.ts` | `CLI_AGENT_TYPE` 環境変数の参照 |

## 実装仕様

### 1. CLI種別定義

```typescript
export type CliAgentType = "claude" | "codex" | "gemini" | "opencode";
```

### 2. CLI種別ごとのargs / 入力方式マップ

`cli_executor.ts` に設定マップを追加:

```typescript
const cliConfigs: Record<CliAgentType, { args: string[]; inputMode: "stdin" | "arg" }> = {
  claude:   { args: ["-p", "--output-format", "text"], inputMode: "stdin" },
  codex:    { args: ["-q"],                            inputMode: "stdin" },
  gemini:   { args: ["-p"],                            inputMode: "stdin" },
  opencode: { args: ["-p"],                            inputMode: "stdin" },
};
```

### 3. `executeCliAgent` の拡張

```typescript
export function executeCliAgent(
  cliPath: string,
  prompt: string,
  timeoutMs: number,
  agentType: CliAgentType = "claude"
): Promise<CliResult>
```

- `cliConfigs[agentType]` から args を取得
- `inputMode` に応じて stdin or コマンドライン引数でプロンプトを渡す
- 既存の呼び出し箇所はデフォルト引数で互換性維持

### 4. 環境変数

- `CLI_AGENT_TYPE`: `claude` | `codex` | `gemini` | `opencode`（デフォルト: `claude`）
- `agent_runner.ts` で参照し、`executeCliAgent` に渡す

### 5. .env.example の更新

```
CLI_AGENT_TYPE=claude
```

## テスト仕様

### ユニットテスト（`tests/agent_runner.test.ts` に追加）

| # | テスト | 検証内容 |
|---|--------|---------|
| 1 | デフォルト（claude） | `-p --output-format text` で呼ばれる |
| 2 | codex指定 | `-q` で呼ばれる |
| 3 | 不正な種別 | デフォルト(claude)にフォールバック |

### E2Eテスト

既存E2Eテストが `mock-claude.sh` で引き続きパスすることを確認。
mock-claude.sh はフラグを無視して stdin を読むため、agent_type が変わっても動作する。

## 完了条件

- [ ] `npm test` 全パス
- [ ] `npm run test:e2e` 全パス
- [ ] `npm run build` 成功
- [ ] `.env.example` に `CLI_AGENT_TYPE` 追加済み
