# API Design

## 方針
- PoCではローカル実行を前提
- APIはUIとControllerの境界として定義
- HTTP APIを用意する場合の最小設計を示す

## エンドポイント (想定)

### 1. 新規プロジェクト作成
- POST /projects
- Request:
  - theme: string
- Response:
  - projectId: string
  - status: "idea"

### 2. 議論ステップ更新
- POST /projects/{id}/discussion
- Request:
  - message: string
- Response:
  - status: "idea"
  - projectId: string
  - data:
    - nextQuestion: string

### 3. リサーチ実行
- POST /projects/{id}/research
- Response:
  - status: "research"
  - projectId: string
  - data:
    - researchSummary: string

### 4. 構成案生成
- POST /projects/{id}/outline
- Response:
  - status: "outline"
  - projectId: string
  - data:
    - outlineMarkdown: string

### 5. 原稿生成
- POST /projects/{id}/draft
- Response:
  - status: "draft"
  - projectId: string
  - data:
    - draftMarkdown: string

### 6. 原稿修正
- POST /projects/{id}/review
- Request:
  - feedback: string
- Response:
  - status: "review"
  - projectId: string
  - data:
    - updatedDraft: string

### 7. 完了
- POST /projects/{id}/complete
- Response:
  - status: "done"
  - projectId: string

### 8. 成果物取得
- GET /projects/{id}/artifacts
- Response:
  - status: "ok"
  - projectId: string
  - data:
    - type: string  # theme/discussion/research/outline/draft/review
    - content: string | null
    - updatedAt: string | null

### 9. 成果物ダウンロード
- GET /projects/{id}/artifact?type={type}
- Params:
  - type: string  # theme/discussion/research/outline/draft/review
- Response:
  - 200: Markdownファイル (Content-Disposition: attachment)
  - 400: type不正
  - 404: ファイル不存在

## エラーレスポンス
- 400: 入力不足
- 404: projectId 不正
- 500: エージェント実行失敗

## レスポンス共通形式 (最小実装)
- 成功: `{ status, projectId, data? }`
- 失敗: `{ status: "error", message }`
