# Contract 07: エージェントSKILL外部化

## 優先度: 7

## 目的

プロンプトテンプレートを外部Markdownファイルに分離し、エージェントのSKILLとして管理可能にする。
Plan.mdの検証項目「SKILLは標準化されたSkillを作成、保存し、それが使われるようにする」を実現する。

## 現状の問題

- `src/controllers/prompt_templates.ts` にすべてのプロンプトがハードコードされている
- プロンプトの調整にコード変更とリビルドが必要
- 他のCLIエージェント用にプロンプトを差し替えられない

## 変更対象ファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/controllers/prompt_templates.ts` | 外部ファイル読み込みロジック追加 |

## 新規ファイル

| ファイル | 内容 |
|---------|------|
| `skills/opening.md` | Opening プロンプトテンプレート |
| `skills/discussion.md` | Discussion プロンプトテンプレート |
| `skills/research.md` | Research プロンプトテンプレート |
| `skills/outline.md` | Outline プロンプトテンプレート |
| `skills/draft.md` | Draft プロンプトテンプレート |
| `skills/review.md` | Review プロンプトテンプレート |
| `skills/redraft.md` | Redraft プロンプトテンプレート（Contract 04 後） |

## 実装仕様

### 1. SKILLファイル形式

Mustache風のプレースホルダーを使用:

```markdown
You are an editorial assistant helping a writer develop an article.

## Theme
{{theme}}

## Instructions
- Ask 2-3 focused questions about the theme
- Write in Japanese
- Output your response directly
```

### 2. テンプレートローダー

```typescript
const SKILLS_DIR = process.env.SKILLS_DIR || path.join(process.cwd(), "skills");

function loadTemplate(name: string): string | null {
  const filePath = path.join(SKILLS_DIR, `${name}.md`);
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, "utf-8");
  }
  return null;
}

function renderTemplate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}
```

### 3. フォールバック

外部ファイルが存在しない場合は、現在のハードコードされたプロンプトを使用する。
これにより既存動作に影響を与えない。

```typescript
export function openingPrompt(theme: string): string {
  const external = loadTemplate("opening");
  if (external) {
    return renderTemplate(external, { theme });
  }
  // 既存のハードコードプロンプト（フォールバック）
  return `You are an editorial assistant...`;
}
```

### 4. 環境変数

- `SKILLS_DIR`: SKILLファイルのディレクトリパス（デフォルト: `<cwd>/skills`）

## テスト仕様

### ユニットテスト（`tests/prompt_templates.test.ts` として既存テストを拡張）

| # | テスト | 検証内容 |
|---|--------|---------|
| 1 | 外部ファイルなし | 既存ハードコードプロンプトが返る |
| 2 | 外部ファイルあり | 外部テンプレートの内容が使われる |
| 3 | プレースホルダー展開 | `{{theme}}` が実際の値に置換される |
| 4 | 複数プレースホルダー | `{{theme}}`, `{{discussion}}` 等すべて展開 |

## 完了条件

- [ ] `npm test` 全パス
- [ ] `npm run test:e2e` 全パス（外部ファイルなしでも既存動作）
- [ ] `npm run build` 成功
- [ ] `skills/` ディレクトリに6+ファイルが存在
