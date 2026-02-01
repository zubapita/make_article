# System Design

## 概要
make_article は、テーマ入力から議論・リサーチ・構成案・原稿作成までを段階的に進めるPoCシステム。CLI型AIエージェント群をヘッドレス実行し、成果物をMarkdownで保存する。

## アーキテクチャ方針
- 最小実装で動作検証を優先する。
- モジュールは疎結合にする。
- MVC分離を厳守する。

## UI方式の決定
- Web UI (Next.js) を採用する
- 理由: 状態遷移の可視化と編集性を優先。PoCでも体験評価がしやすい。

## 主要コンポーネント

### Model
- ArticleProject
  - 役割: 記事プロジェクトの状態とデータを保持する。
  - 状態例: `idea`, `research`, `outline`, `draft`, `review`, `done`
  - 保存対象: テーマ、議論ログ、リサーチ結果、構成案、原稿

- ResearchResult
  - 役割: リサーチ結果の記録。URL、要約、引用など。

### View
- UI (Web / Next.js)
  - 役割: ユーザー入力と出力の提示のみを担当
  - 表示: 状態進行、質問、成果物プレビュー

### Controller
- WorkflowController
  - 役割: ModelとViewの仲介、ワークフローの進行管理
  - 主要フロー:
    1. テーマ入力
    2. 質問/議論
    3. リサーチ実行
    4. 構成案生成
    5. 原稿生成
    6. 修正・確定

- AgentRunner
  - 役割: CLIエージェントの起動・結果取得
  - インタフェース: `runAgent(agentName, task, inputs)`

## データフロー
1. ユーザーがテーマを入力
2. WorkflowController が議論用の質問を生成
3. AgentRunner が指定エージェントでWebリサーチ
4. ResearchResult を保存
5. 構成案と原稿を順次生成
6. ArticleProject に結果を保存

## 永続化
- すべての成果物はプロジェクトごとのディレクトリにMarkdownで保存
- DBは使用しない（PoCのため）

## 例: ワークフロー状態遷移
- `idea` → `research` → `outline` → `draft` → `review` → `done`

## エラーハンドリング
- 入力チェックは境界でのみ行う
- 失敗時は具体的なメッセージを返す

## 拡張余地
- AgentRunnerを差し替えて新規CLIエージェントに対応
- 永続化層をDBに差し替え可能

## 最小ディレクトリ/モジュール構成
```
src/
  app/                  # View (Next.js App Router)
    page.tsx
    projects/
      [id]/page.tsx
    api/                 # Controller境界 (必要最小限)
      projects/route.ts
      projects/[id]/discussion/route.ts
      projects/[id]/research/route.ts
      projects/[id]/outline/route.ts
      projects/[id]/draft/route.ts
      projects/[id]/review/route.ts
      projects/[id]/complete/route.ts
  controllers/          # Controller
    workflow_controller.ts
    agent_runner.ts
  models/               # Model
    article_project.ts
    research_result.ts
  repositories/         # 永続化 (file system)
    project_repository.ts
```

### モジュール責務
- `models/*`: データとビジネスルールのみ
- `controllers/*`: ワークフローとエージェント実行の調停
- `repositories/*`: ファイル保存の入出力
- `app/*`: UIレンダリングのみ (状態表示と入力)

## 最小実装の具体化

### 1) 状態と許容遷移
- 状態: `idea` → `research` → `outline` → `draft` → `review` → `done`
- `review` からは `draft` に戻して再生成可能
- 不正遷移は 400 とし、現状態を返す

### 2) Modelの最小データ構造
- ArticleProject
  - `id: string`
  - `theme: string`
  - `status: string`
  - `createdAt: string`
  - `updatedAt: string`
- ResearchResult
  - `items: { url: string, title: string, summary: string }[]`

### 3) Repositoryの最小インタフェース
- `createProject(theme): ArticleProject`
- `loadProject(id): ArticleProject`
- `saveProject(project): void`
- `saveArtifact(id, type, markdown): void`  # typeは theme/discussion/research/outline/draft/review

### 4) Controllerの最小インタフェース
- `startProject(theme)` → `projectId`
- `appendDiscussion(id, message)` → `nextQuestion`
- `runResearch(id)` → `researchSummary`
- `generateOutline(id)` → `outlineMarkdown`
- `generateDraft(id)` → `draftMarkdown`
- `applyReview(id, feedback)` → `updatedDraft`
- `complete(id)` → `status`

### 5) APIの最小レスポンス規約
- 成功: `{ status, data }`
- 失敗: `{ status: "error", message }`
- すべてのAPIは `projectId` と `status` を返す

### 6) UIの最小要件
- `/`: テーマ入力 + 作成ボタンのみ
- `/projects/[id]`: 状態表示 + 次のアクションボタン + Markdownプレビュー
