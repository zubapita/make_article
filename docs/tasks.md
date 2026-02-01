# Tasks

## 初期セットアップ
- [x] ルート構成の決定 (Web UI / Next.js App Router)
- [x] Next.js App Router の最小構成を作成
- [x] ポート3000の起動確認 (占有時は停止してから起動)
- [x] CLIエージェント呼び出しの最小実装
- [x] プロジェクトディレクトリ生成ロジック

## モデル実装
- [x] ArticleProject モデル作成
- [x] ResearchResult モデル作成

## コントローラ実装
- [x] WorkflowController の最小フロー実装
- [x] AgentRunner の最小実装

## ビュー実装
- [x] テーマ入力画面
- [x] 議論・質問画面
- [x] リサーチ結果画面
- [x] 構成案画面
- [x] 原稿画面
- [x] 完了画面

## 永続化
- [x] Markdown保存処理
- [x] metadata.json 更新処理

## テスト
- [x] モデル単体テスト
- [x] Controller 単体テスト
- [x] 最小UIフローのE2E確認
  - [x] `npm run dev` を起動し、`http://localhost:3000` にアクセス
  - [x] テーマ入力 → プロジェクト作成 → `/projects/[id]` 遷移を確認
  - [x] 各ボタン（議論/リサーチ/構成案/原稿/レビュー/完了）でAPIが応答することを確認
  - [x] `projects/{projectId}` に `metadata.json` と `*.md` が出力されることを確認
  - [x] 成果物のdownload表示は生成済みのみであることを確認
  - [x] Markdownプレビュー（blockquote/コードブロック/テーブル）表示を確認
  - [x] 成果物一覧の一括展開/折りたたみを確認
  - [x] 成果物メニューがクリック外/ESCで閉じることを確認
  - [x] 成果物メニューのフォーカスリング表示を確認

## API
- [x] Next.js API ルートの最小スタブ作成

## Contract 実装
- [x] Contract 01: 状態遷移ガード (TransitionError, allowedTransitions, guardTransition)
- [x] Contract 02: プロジェクト一覧API (GET /api/projects)
- [x] Contract 03: マルチCLIエージェント対応 (claude/codex/gemini/opencode)
- [x] Contract 04: Review → Draft 差し戻し (redraft タスク)
- [x] Contract 05: プロジェクト削除 (DELETE /api/projects/[id])
- [x] Contract 06: XSSサニタイズ検証 (marked + DOMPurify テスト)
- [x] Contract 07: SKILLテンプレート外部化 (skills/*.md + loadTemplate/renderTemplate)
- [x] Contract 08: 商用品質プロンプト改善 (品質基準・チェックリスト追加)

## 自動テスト
- [x] ユニットテスト 38件パス (controller, repository, agent_runner, sanitize)
- [x] E2Eテスト 28件パス (全APIエンドポイント + ワークフロー)
- [x] ビルド成功 (npm run build)
