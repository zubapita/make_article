# Contract 01: 状態遷移ガード

## 優先度: 1（最高）

## 目的

ワークフローの状態遷移を検証し、不正な遷移を400エラーで拒否する。
設計書に「不正遷移は400とし、現状態を返す」と明記されているが未実装。

## 現状の問題

- `WorkflowController` の各メソッドが状態チェックなしで実行される
- 例: `idea` 状態で `generateOutline` を呼ぶと、researchをスキップして構成案が生成される
- ファイルが存在しない状態で後段処理が走り、空のプロンプトが生成される

## 許容される状態遷移

```
idea → idea        (opening, discussion: 繰り返し可)
idea → research    (runResearch)
research → outline (generateOutline)
outline → draft    (generateDraft)
draft → review     (applyReview)
review → draft     (generateDraft: 差し戻し再生成)
review → done      (complete)
```

## 変更対象ファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/controllers/workflow_controller.ts` | 各メソッド冒頭に状態チェック追加 |

## 実装仕様

### 1. 遷移テーブルの定義

`workflow_controller.ts` 内にマップを追加する。

```typescript
const allowedTransitions: Record<string, string[]> = {
  runResearch: ["idea"],
  generateOutline: ["research"],
  generateDraft: ["outline", "review"],
  applyReview: ["draft"],
  complete: ["review"],
};
```

### 2. ガード関数

```typescript
function guardTransition(project: ArticleProject, action: string): void {
  const allowed = allowedTransitions[action];
  if (allowed && !allowed.includes(project.status)) {
    throw new TransitionError(project.status, action);
  }
}
```

### 3. TransitionError

新しいエラークラスまたは判別可能なエラーを定義する。APIルート側で `instanceof` チェックして400を返す。

```typescript
export class TransitionError extends Error {
  currentStatus: string;
  action: string;
  constructor(currentStatus: string, action: string) {
    super(`Cannot ${action} in status "${currentStatus}"`);
    this.currentStatus = currentStatus;
    this.action = action;
  }
}
```

### 4. APIルート側の対応

各APIルート（research, outline, draft, review, complete）の catch ブロックで `TransitionError` を判別し、400を返す。

```typescript
} catch (err) {
  if (err instanceof TransitionError) {
    return NextResponse.json(
      { status: "error", message: err.message, currentStatus: err.currentStatus },
      { status: 400 }
    );
  }
  throw err;
}
```

## テスト仕様

### ユニットテスト（`tests/controller.test.ts` に追加）

| # | テスト | 検証内容 |
|---|--------|---------|
| 1 | idea → research 許可 | 正常に研究が実行される |
| 2 | idea → outline 拒否 | TransitionError がスローされる |
| 3 | idea → draft 拒否 | TransitionError がスローされる |
| 4 | research → outline 許可 | 正常実行 |
| 5 | outline → draft 許可 | 正常実行 |
| 6 | draft → review 許可 | 正常実行 |
| 7 | review → draft 許可 | 差し戻し再生成が動く |
| 8 | review → complete 許可 | 正常実行 |
| 9 | done → 全操作拒否 | TransitionError がスローされる |

### E2Eテスト（`tests/e2e/e2e.test.ts` に追加）

| # | テスト | 検証内容 |
|---|--------|---------|
| 1 | idea状態でoutline → 400 | `{ status: "error" }` が返る |
| 2 | idea状態でdraft → 400 | 同上 |
| 3 | idea状態でcomplete → 400 | 同上 |

## 完了条件

- [ ] `npm test` が既存 + 新規ユニットテスト全パス
- [ ] `npm run test:e2e` が既存 + 新規E2Eテスト全パス
- [ ] `npm run build` 成功
