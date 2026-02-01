# Contract 04: Review → Draft 差し戻し

## 優先度: 4

## 目的

レビュー後に原稿を再生成（差し戻し）できるようにする。
設計書に「`review` からは `draft` に戻して再生成可能」と明記。
UIの `nextStepByStatus` には `review: ["draft", "complete"]` が既に定義済みだが、
サーバー側の状態遷移ガードと差し戻し時のフロー処理が未整備。

## 現状の問題

- Contract 01（状態遷移ガード）を実装すると、`review` → `draft` の遷移が明示的に許可される
- しかし `generateDraft` は現在 `outline → draft` を想定した実装
- 差し戻し時にレビュー結果を考慮した再生成が必要
- UIの「原稿」ボタンは `review` 状態で有効だが、差し戻し意図が不明確

## 前提

- Contract 01（状態遷移ガード）が実装済みであること

## 変更対象ファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/controllers/workflow_controller.ts` | `generateDraft` に差し戻しロジック追加 |
| `src/controllers/agent_runner.ts` | `redraft` タスク追加 |
| `src/controllers/prompt_templates.ts` | `redraftPrompt` 関数追加 |

## 実装仕様

### 1. `WorkflowController.generateDraft` の分岐

```typescript
generateDraft: async function (id) {
  const project = repo.loadProject(id);
  guardTransition(project, "generateDraft");

  let payload: string;
  if (project.status === "review") {
    // 差し戻し: レビュー結果を含めて再生成
    payload = await runner.runAgent("draft", "redraft", { projectId: id });
  } else {
    // 通常: outline → draft
    payload = await runner.runAgent("draft", "create_draft", { projectId: id });
  }
  repo.saveArtifact(id, "draft", payload);
  const status = updateStatus(id, "draft");
  const messages = addSystemMessage(id, project.status === "review"
    ? "レビューを反映した原稿を再生成しました。"
    : "原稿が作成されました。");
  return { status, draftMarkdown: payload, messages };
},
```

### 2. AgentRunner: `redraft` タスク

```typescript
if (task === "redraft") {
  const ctx = loadProjectContext(projectId, ["theme", "outline", "research", "draft", "review"]);
  const prompt = redraftPrompt(ctx.theme, ctx.outline, ctx.research, ctx.draft, ctx.review);
  const result = await executeCliAgent(cliPath, prompt, timeoutMs);
  return result.stdout;
}
```

### 3. `redraftPrompt` テンプレート

```typescript
export function redraftPrompt(
  theme: string,
  outline: string,
  research: string,
  currentDraft: string,
  reviewFeedback: string
): string {
  return `You are a skilled article writer. Rewrite the article draft incorporating the review feedback.

## Theme
${theme}

## Outline
${outline || "(No outline available)"}

## Research
${research || "(No research available)"}

## Current Draft
${currentDraft || "(No draft available)"}

## Review Feedback
${reviewFeedback || "(No feedback)"}

## Instructions
- Address all review feedback
- Maintain the outline structure
- Use research data with proper attribution
- Write in Japanese
- Output Markdown only, no preamble`;
}
```

### 4. mock-claude.sh の更新

差し戻しプロンプトには "Rewrite the article draft" が含まれるため、既存の "article writer" マッチでも動作する。
テスト精度のため追加:

```bash
elif echo "$INPUT" | grep -q "Rewrite the article draft"; then
  echo "mock-redraft: # 改訂版原稿"
```

## テスト仕様

### ユニットテスト

| # | テスト | 検証内容 |
|---|--------|---------|
| 1 | review → generateDraft | status が draft に戻る |
| 2 | redraftPrompt | レビュー内容がプロンプトに含まれる |

### E2Eテスト

| # | テスト | 検証内容 |
|---|--------|---------|
| 1 | フルフロー: review → draft → review → complete | 差し戻しサイクルが正常に動作 |
| 2 | 差し戻し後のdraft artifact | 新しい内容で上書きされる |

## 完了条件

- [ ] `npm test` 全パス
- [ ] `npm run test:e2e` 全パス
- [ ] `npm run build` 成功
