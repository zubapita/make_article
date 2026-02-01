# Contract 05: プロジェクト削除

## 優先度: 5

## 目的

不要なプロジェクトを削除する `DELETE /api/projects/[id]` を実装する。
ファイルシステムベースのため、削除手段がないとディスクが際限なく消費される。

## 現状の問題

- プロジェクト削除のAPIもUIも存在しない
- `projects/` ディレクトリに不要なプロジェクトが蓄積される
- 手動で `rm -rf` するしか削除手段がない

## 変更対象ファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/repositories/project_repository.ts` | `deleteProject` メソッド追加 |
| `src/app/api/projects/[id]/route.ts` | `DELETE` ハンドラ追加 |
| `src/app/projects/[id]/page.tsx` | 削除ボタン追加（確認ダイアログ付き） |

## 実装仕様

### 1. Repository: `deleteProject`

`ProjectRepository` 型に追加:

```typescript
deleteProject: (id: string) => void;
```

実装:
- `projectDir(id)` が存在するか確認。存在しなければ例外。
- `fs.rmSync(dir, { recursive: true, force: true })` でディレクトリごと削除。

### 2. API: `DELETE /api/projects/[id]`

```typescript
export async function DELETE(
  _: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const repo = createProjectRepository();
  try {
    repo.deleteProject(id);
    return NextResponse.json({ status: "ok", message: "deleted" });
  } catch (err) {
    return NextResponse.json(
      { status: "error", message: "project not found" },
      { status: 404 }
    );
  }
}
```

### 3. UI: 削除ボタン

- プロジェクトページのヘッダーに「削除」ボタンを追加
- クリック時に `window.confirm("このプロジェクトを削除しますか？")` で確認
- 確認後に `DELETE /api/projects/[id]` を呼び出す
- 成功したらトップページ（`/`）に遷移

## テスト仕様

### ユニットテスト（`tests/repository.test.ts` に追加）

| # | テスト | 検証内容 |
|---|--------|---------|
| 1 | 既存プロジェクト削除 | ディレクトリが消える |
| 2 | 存在しないプロジェクト | 例外がスローされる |

### E2Eテスト（`tests/e2e/e2e.test.ts` に追加）

| # | テスト | 検証内容 |
|---|--------|---------|
| 1 | DELETE /api/projects/[id] | status=ok |
| 2 | 削除後にGET | 404が返る |
| 3 | 存在しないPJ削除 | 404が返る |

## 完了条件

- [ ] `npm test` 全パス
- [ ] `npm run test:e2e` 全パス
- [ ] `npm run build` 成功
