"use client";

import createDOMPurify from "dompurify";
import { marked } from "marked";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type ProjectData = {
  id: string;
  theme: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type ChatMsg = {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
};

type Artifact = {
  type: string;
  content: string | null;
  updatedAt: string | null;
};

const statusLabels: Record<string, string> = {
  idea: "議論中",
  research: "リサーチ済",
  outline: "構成案済",
  draft: "原稿済",
  review: "レビュー済",
  done: "完了",
};

const nextStepByStatus: Record<string, string[]> = {
  idea: ["research"],
  research: ["outline"],
  outline: ["draft"],
  draft: ["review"],
  review: ["draft", "complete"],
  done: [],
};

const workflowButtons = [
  { key: "research", label: "リサーチ" },
  { key: "outline", label: "構成案" },
  { key: "draft", label: "原稿" },
  { key: "review", label: "レビュー" },
  { key: "complete", label: "完了" },
];

const artifactOrder = ["theme", "discussion", "research", "outline", "draft", "review"];

marked.setOptions({ breaks: true, async: false });

export default function ProjectPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const projectId = params?.id;

  const [project, setProject] = useState<ProjectData | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("idea");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showArtifacts, setShowArtifacts] = useState(false);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [artifactLoading, setArtifactLoading] = useState(false);
  const [openingDone, setOpeningDone] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const dompurify = useMemo(() => {
    if (typeof window === "undefined") return null;
    return createDOMPurify(window);
  }, []);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load project
  useEffect(() => {
    if (!projectId) return;
    async function load() {
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        const data = await res.json();
        if (res.ok) {
          setProject(data.data);
          setStatus(data.data.status);
        } else {
          setError(data.message || "読み込みエラー");
        }
      } catch {
        setError("通信に失敗しました。");
      }
    }
    load();
  }, [projectId]);

  // Load messages
  useEffect(() => {
    if (!projectId) return;
    async function load() {
      try {
        const res = await fetch(`/api/projects/${projectId}/messages`);
        const data = await res.json();
        if (res.ok) {
          setMessages(data.messages || []);
          if ((data.messages || []).length > 0) {
            setOpeningDone(true);
          }
        }
      } catch {
        // silent
      }
    }
    load();
  }, [projectId]);

  // Generate opening message
  useEffect(() => {
    if (!projectId || openingDone || loading) return;
    if (messages.length > 0) {
      setOpeningDone(true);
      return;
    }
    setOpeningDone(true);
    setLoading(true);
    async function generate() {
      try {
        const res = await fetch(`/api/projects/${projectId}/opening`, { method: "POST" });
        const data = await res.json();
        if (res.ok) {
          setMessages(data.messages || []);
          setStatus(data.status);
        }
      } catch {
        setError("AI初回メッセージの生成に失敗しました。");
      } finally {
        setLoading(false);
      }
    }
    generate();
  }, [projectId, openingDone, loading, messages.length]);

  async function handleDelete() {
    if (!projectId) return;
    if (!window.confirm("このプロジェクトを削除しますか？")) return;
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/");
      } else {
        setError("削除に失敗しました。");
      }
    } catch {
      setError("通信に失敗しました。");
    }
  }

  async function sendMessage() {
    if (!projectId || !input.trim() || loading) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/discussion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages || []);
        setStatus(data.status);
        setInput("");
      } else {
        setError(data.message || "送信に失敗しました。");
      }
    } catch {
      setError("通信に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  async function runWorkflowStep(step: string) {
    if (!projectId || loading) return;
    setError("");
    setLoading(true);
    try {
      const body: Record<string, string> = {};
      if (step === "review") {
        body.feedback = input || "全体的にレビューしてください";
        setInput("");
      }
      const res = await fetch(`/api/projects/${projectId}/${step}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus(data.status);
        if (data.messages) {
          setMessages(data.messages);
        }
        if (project) {
          setProject({ ...project, status: data.status, updatedAt: new Date().toISOString() });
        }
      } else {
        setError(data.message || "処理に失敗しました。");
      }
    } catch {
      setError("通信に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  async function loadArtifacts() {
    if (!projectId) return;
    setArtifactLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/artifacts`);
      const data = await res.json();
      if (res.ok) {
        const sorted = (data.data || []).slice().sort((a: Artifact, b: Artifact) => {
          return artifactOrder.indexOf(a.type) - artifactOrder.indexOf(b.type);
        });
        setArtifacts(sorted);
      }
    } catch {
      // silent
    } finally {
      setArtifactLoading(false);
    }
  }

  function toggleArtifacts() {
    const next = !showArtifacts;
    setShowArtifacts(next);
    if (next) loadArtifacts();
  }

  const allowedSteps = useMemo(() => {
    return new Set(nextStepByStatus[status] || []);
  }, [status]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function renderMessageContent(content: string) {
    const rawHtml = marked.parse(content) as string;
    const html = dompurify ? dompurify.sanitize(rawHtml) : rawHtml;
    return <div className="markdown" dangerouslySetInnerHTML={{ __html: html }} />;
  }

  return (
    <main className="chat-page">
      <header className="chat-header">
        <div className="chat-header-left">
          <button className="back-btn" onClick={() => router.push("/")} type="button">
            &larr;
          </button>
          <div>
            <h1 className="chat-title">{project?.theme || "読み込み中..."}</h1>
            <span className="chat-status">{statusLabels[status] || status}</span>
          </div>
        </div>
        <button
          className={showArtifacts ? "artifact-toggle artifact-toggle-active" : "artifact-toggle"}
          onClick={toggleArtifacts}
          type="button"
        >
          成果物
        </button>
        <button
          className="delete-btn"
          onClick={handleDelete}
          type="button"
        >
          削除
        </button>
      </header>

      <div className="chat-body">
        <div className={showArtifacts ? "chat-main chat-main-with-panel" : "chat-main"}>
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg chat-msg-${msg.role}`}>
                {msg.role === "system" ? (
                  <div className="chat-system">{msg.content}</div>
                ) : (
                  <div className="chat-bubble">
                    <span className="chat-role">
                      {msg.role === "user" ? "You" : "AI"}
                    </span>
                    {renderMessageContent(msg.content)}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="chat-msg chat-msg-assistant">
                <div className="chat-bubble">
                  <span className="chat-role">AI</span>
                  <div className="chat-typing">考え中...</div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="chat-workflow-bar">
            {workflowButtons.map((btn) => {
              const disabled = loading || !allowedSteps.has(btn.key);
              return (
                <button
                  key={btn.key}
                  type="button"
                  className="workflow-btn"
                  disabled={disabled}
                  onClick={() => runWorkflowStep(btn.key)}
                >
                  {btn.label}
                </button>
              );
            })}
          </div>

          <div className="chat-input-bar">
            <textarea
              className="chat-input"
              placeholder={status === "done" ? "完了しました" : "メッセージを入力..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading || status === "done"}
              rows={1}
            />
            <button
              className="chat-send"
              type="button"
              disabled={loading || !input.trim() || status === "done"}
              onClick={sendMessage}
            >
              送信
            </button>
          </div>
          {error && <p className="chat-error">{error}</p>}
        </div>

        {showArtifacts && (
          <aside className="artifact-panel">
            <div className="artifact-panel-header">
              <h2>成果物</h2>
              <button
                type="button"
                onClick={loadArtifacts}
                disabled={artifactLoading}
                className="artifact-refresh"
              >
                {artifactLoading ? "更新中..." : "更新"}
              </button>
            </div>
            {artifacts.length === 0 ? (
              <p className="muted">成果物はまだありません。</p>
            ) : (
              <div className="artifact-list">
                {artifacts.map((item) => {
                  const rawHtml = marked.parse(item.content || "(empty)") as string;
                  const html = dompurify ? dompurify.sanitize(rawHtml) : rawHtml;
                  return (
                    <details key={item.type} className="artifact-item">
                      <summary>
                        {item.type}
                        {item.updatedAt && (
                          <span className="artifact-meta">{item.updatedAt}</span>
                        )}
                      </summary>
                      <div className="markdown" dangerouslySetInnerHTML={{ __html: html }} />
                    </details>
                  );
                })}
              </div>
            )}
          </aside>
        )}
      </div>
    </main>
  );
}
