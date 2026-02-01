import http from "node:http";

export type MockTavilyServer = {
  port: number;
  close: () => Promise<void>;
};

export function startMockTavilyServer(): Promise<MockTavilyServer> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      if (req.method === "POST" && req.url === "/search") {
        let body = "";
        req.on("data", (chunk: Buffer) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          const payload = JSON.parse(body);
          const response = {
            results: [
              {
                url: "https://example.com/article1",
                title: "Mock Search Result 1",
                content: `Search result for: ${payload.query}`,
              },
              {
                url: "https://example.com/article2",
                title: "Mock Search Result 2",
                content: "Additional mock search content.",
              },
            ],
          };
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(response));
        });
      } else {
        res.writeHead(404);
        res.end("Not found");
      }
    });

    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (addr && typeof addr === "object") {
        resolve({
          port: addr.port,
          close: () =>
            new Promise<void>((res) => {
              server.close(() => res());
            }),
        });
      } else {
        reject(new Error("Failed to get server address"));
      }
    });

    server.on("error", reject);
  });
}
