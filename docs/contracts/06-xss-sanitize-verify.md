# Contract 06: Markdownプレビューのセキュリティ検証

## 優先度: 6

## 目的

Markdownプレビューのサニタイズ処理が正しく機能し、XSS攻撃を防止できることをテストで検証する。
dompurifyは既に導入済みだが、テストで動作確認されていない。

## 現状の問題

- `src/app/projects/[id]/page.tsx` で `dompurify.sanitize()` は呼ばれている
- しかし攻撃ベクトルに対するテストがない
- AI応答に悪意あるHTMLが含まれた場合の安全性が未検証

## 変更対象ファイル

| ファイル | 変更内容 |
|---------|---------|
| `tests/e2e/e2e.test.ts` | サニタイズ検証テスト追加 |
| `tests/e2e/mock-claude.sh` | XSS検証用の応答パターン追加（任意） |

## 実装仕様

### 方針

サーバー側（API応答）では生のMarkdownを返すため、サニタイズはクライアント側の責務。
E2EテストではAPIレスポンスの内容確認（サーバー側は加工しない）と、
サニタイズロジック自体のユニットテストの2層で検証する。

### 1. サニタイズユニットテスト

`tests/sanitize.test.ts` を新規作成。`marked` + `dompurify`（jsdom経由）で以下を検証:

| # | 入力 | 期待結果 |
|---|------|---------|
| 1 | `<script>alert('xss')</script>` | script タグが除去される |
| 2 | `<img src=x onerror=alert('xss')>` | onerror属性が除去される |
| 3 | `[link](javascript:alert('xss'))` | javascript: URLが無効化される |
| 4 | `<a href="javascript:void(0)">click</a>` | javascript: が除去される |
| 5 | 正常なMarkdown（`## 見出し`, `**太字**`） | 正しくHTMLに変換される |

### 2. テスト実装方法

```typescript
import { JSDOM } from "jsdom";
import createDOMPurify from "dompurify";
import { marked } from "marked";

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

function sanitizeMarkdown(md: string): string {
  const raw = marked.parse(md) as string;
  return DOMPurify.sanitize(raw);
}
```

### 3. 依存追加

```bash
npm install --save-dev jsdom @types/jsdom
```

## テスト仕様

### ユニットテスト（`tests/sanitize.test.ts`）

5件（上記テーブル参照）

## 完了条件

- [ ] `npm test` 全パス（sanitize.test.ts 含む）
- [ ] `npm run build` 成功
- [ ] 5つのXSS攻撃ベクトルすべてで無害化が確認される
