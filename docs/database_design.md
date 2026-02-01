# Database Design

## 方針
- PoCのためDBは使用しない
- ファイルシステムを永続化層とする

## 保存構造
```
/projects/{project_id}/
  theme.md
  discussion.md
  research.md
  outline.md
  draft.md
  review.md
  metadata.json
```

## ファイル詳細
- theme.md: テーマ入力
- discussion.md: 議論ログ
- research.md: リサーチ結果
- outline.md: 構成案
- draft.md: 原稿
- review.md: 修正履歴
- metadata.json: 状態や作成日時などのメタ情報

## 代替案 (将来)
- SQLite を導入し、検索性や履歴管理を強化
