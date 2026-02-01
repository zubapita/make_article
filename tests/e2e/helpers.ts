const BASE = "http://localhost:3000";

export async function postJson(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return {
    status: res.status,
    data: await res.json(),
  };
}

export async function getJson(path: string) {
  const res = await fetch(`${BASE}${path}`);
  return {
    status: res.status,
    data: await res.json(),
  };
}

export async function getText(path: string) {
  const res = await fetch(`${BASE}${path}`);
  return {
    status: res.status,
    text: await res.text(),
    headers: res.headers,
  };
}

export async function waitForServer(maxMs: number = 60000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const res = await fetch(`${BASE}/api/projects`, { method: "OPTIONS" }).catch(() => null);
      if (res) return;
      // Even a 404/405 means the server is up
    } catch {
      // ignore
    }
    // Also try a simple GET that might return something
    try {
      await fetch(BASE);
      return;
    } catch {
      // ignore
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Server did not start within ${maxMs}ms`);
}
