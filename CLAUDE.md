# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

make_article は、テーマ入力から議論・Webリサーチ・構成案・原稿作成までを段階的に進める実験用PoCシステム。CLI型AIエージェント（Claude Code / Codex CLI / Gemini CLI / OpenCode）をヘッドレス実行し、成果物をMarkdownファイルとして保存する。

## Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Database**: なし（ファイルシステムで永続化）
- **Port**: 3000固定（使用中の場合はkillしてから起動）

## Build & Development Commands

```bash
npm run dev          # 開発サーバー起動（ポート3000）
npm run build        # プロダクションビルド
npm test             # テスト実行
```

※ プロジェクトは設計段階。`npm init` / `npx create-next-app` による初期化がまだ必要。

## Architecture

MVC分離を厳守する。各レイヤーの責務を混ぜない。

```
src/
  app/                    # View (Next.js App Router) - UIレンダリングのみ
    api/                  # API Routes - Controller境界
      projects/route.ts
      projects/[id]/discussion/route.ts
      projects/[id]/research/route.ts
      projects/[id]/outline/route.ts
      projects/[id]/draft/route.ts
      projects/[id]/review/route.ts
      projects/[id]/complete/route.ts
  controllers/            # Controller - ワークフロー調停のみ
    workflow_controller.ts
    agent_runner.ts
  models/                 # Model - データとビジネスルールのみ
    article_project.ts
    research_result.ts
  repositories/           # 永続化 - ファイルI/Oのみ
    project_repository.ts
```

### Data Flow

1. View → API Route → WorkflowController → AgentRunner → CLI Agent
2. 結果 → Model → ProjectRepository → ファイル保存

### Workflow States

`idea` → `research` → `outline` → `draft` → `review` → `done`

### File-based Storage

```
projects/{project_id}/
  theme.md          # テーマ
  discussion.md     # 議論ログ
  research.md       # リサーチ結果（URL・要約・引用）
  outline.md        # 構成案
  draft.md          # 原稿
  review.md         # 修正履歴
  metadata.json     # 状態・タイムスタンプ
```

## Design Documents

実装の根拠は `docs/` 配下のドキュメント。変更時は対応ドキュメントも更新すること。

- `docs/Plan.md` - プロジェクト計画・仮説
- `docs/requirements.md` - 要件定義
- `docs/design.md` - システム設計（**アーキテクチャの正）**
- `docs/database_design.md` - ファイル保存構造
- `docs/api_design.md` - APIエンドポイント仕様
- `docs/ui_design.md` - UI設計
- `docs/tasks.md` - 実装タスクリスト

## Key Constraints

- 最小実装優先。過剰な抽象化・先回り実装をしない。
- AgentRunner は差し替え可能な設計にする（将来の新CLIエージェント対応）。
- 永続化層もDB差し替え可能な設計にする。
- ASCII識別子を使用（既存ファイルが非ASCIIを使用している場合を除く）。
