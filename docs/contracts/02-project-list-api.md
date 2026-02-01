# Contract 02: プロジェクト一覧API

## 優先度: 2

## 目的

既存プロジェクトの一覧を取得する `GET /api/projects` を実装し、トップページに一覧を表示する。
現在はプロジェクト作成（POST）のみで、一度ページを離れると既存プロジェクトにアクセスする手段がない。

## 現状の問題

- `GET /api/projects` が未実装（`src/app/api/projects/route.ts` にはPOSTのみ）
- トップページ（`src/app/page.tsx`）はテーマ入力フォームのみ
- `projects/` ディレクトリを手動で確認しないと既存プロジェクトにアクセスできない

## 変更対象ファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/repositories/project_repository.ts` | `listProjects` メソッド追加 |
| `src/app/api/projects/route.ts` | `GET` ハンドラ追加 |
| `src/app/page.tsx` | プロジェクト一覧表示を追加 |

## 実装仕様

### 1. Repository: `listProjects`

`ProjectRepository` 型に追加:

```typescript
listProjects: () => ArticleProject[];
```

実装:
- `baseDir` 内のディレクトリを `fs.readdirSync` で列挙
- 各ディレクトリの `metadata.json` を読んで `ArticleProject` を返す
- `metadata.json` が存在しない / パースエラーのディレクトリはスキップ
- `updatedAt` 降順でソートして返す

### 2. API: `GET /api/projects`

レスポンス形式:
```json
{
  "status": "ok",
  "data": [
    { "id": "project-xxx", "theme": "...", "status": "idea", "createdAt": "...", "updatedAt": "..." },
    ...
  ]
}
```

### 3. UI: トップページにプロジェクト一覧

- ページ読み込み時に `GET /api/projects` を呼ぶ
- テーマ入力フォームの下にカード形式で一覧表示
- 各カードに表示: テーマ、ステータスラベル、更新日時
- カードクリックで `/projects/[id]` に遷移
- プロジェクトが0件の場合は非表示

## テスト仕様

### ユニットテスト（`tests/repository.test.ts` に追加）

| # | テスト | 検証内容 |
|---|--------|---------|
| 1 | 空ディレクトリ | listProjects が空配列を返す |
| 2 | 複数プロジェクト | 正しい件数が返る |
| 3 | updatedAt降順 | 最新が先頭 |
| 4 | 不正ディレクトリ混在 | metadata.jsonがないディレクトリをスキップ |

### E2Eテスト（`tests/e2e/e2e.test.ts` に追加）

| # | テスト | 検証内容 |
|---|--------|---------|
| 1 | GET /api/projects | status=ok, data が配列 |
| 2 | プロジェクト作成後の一覧 | 作成したプロジェクトが含まれる |

## 完了条件

- [ ] `npm test` 全パス
- [ ] `npm run test:e2e` 全パス
- [ ] `npm run build` 成功
