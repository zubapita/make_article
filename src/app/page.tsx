"use client";

import { useEffect, useState } from "react";

type ProjectSummary = {
  id: string;
  theme: string;
  status: string;
  updatedAt: string;
};

const statusLabels: Record<string, string> = {
  idea: "議論中",
  research: "リサーチ済",
  outline: "構成案済",
  draft: "原稿済",
  review: "レビュー済",
  done: "完了",
};

export default function HomePage() {
  const [theme, setTheme] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        if (data.data) setProjects(data.data);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!theme.trim()) {
      setError("テーマを入力してください。");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: theme.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "作成に失敗しました。");
        return;
      }
      window.location.href = `/projects/${data.projectId}`;
    } catch (err) {
      setError("通信に失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page">
      <h1>make_article</h1>
      <p>テーマを入力して記事プロジェクトを開始します。</p>
      <form className="card" onSubmit={handleSubmit}>
        <label htmlFor="theme">テーマ</label>
        <input
          id="theme"
          name="theme"
          type="text"
          placeholder="例: 生成AIとニュース媒体の未来"
          value={theme}
          onChange={(event) => setTheme(event.target.value)}
        />
        {error ? <p className="error">{error}</p> : null}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "作成中..." : "開始"}
        </button>
      </form>
      {projects.length > 0 && (
        <section className="project-list">
          <h2>既存プロジェクト</h2>
          {projects.map((p) => (
            <a key={p.id} href={`/projects/${p.id}`} className="card project-card">
              <strong>{p.theme}</strong>
              <span className="project-meta">
                {statusLabels[p.status] || p.status} ・ {new Date(p.updatedAt).toLocaleDateString("ja-JP")}
              </span>
            </a>
          ))}
        </section>
      )}
    </main>
  );
}
