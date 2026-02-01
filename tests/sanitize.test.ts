import { test } from "node:test";
import assert from "node:assert";
import { JSDOM } from "jsdom";
import createDOMPurify from "dompurify";
import { marked } from "marked";

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window as unknown as Window);

marked.setOptions({ breaks: true, async: false });

function sanitizeMarkdown(md: string): string {
  const raw = marked.parse(md) as string;
  return DOMPurify.sanitize(raw);
}

test("sanitize: script tag is removed", () => {
  const result = sanitizeMarkdown("<script>alert('xss')</script>");
  assert.ok(!result.includes("<script"), "script tag should be removed");
});

test("sanitize: onerror attribute cannot survive the pipeline", () => {
  const result = sanitizeMarkdown('<img src=x onerror=alert("xss")>');
  // marked v16 escapes inline HTML into entities, so no real <img> tag exists
  assert.ok(
    !/<img[^>]*onerror/i.test(result),
    "no img tag should have onerror attribute"
  );
});

test("sanitize: javascript: URL in markdown link is neutralized", () => {
  const result = sanitizeMarkdown("[click](javascript:alert('xss'))");
  assert.ok(
    !result.includes("javascript:"),
    "javascript: URL should be removed"
  );
});

test("sanitize: javascript: href in anchor tag is neutralized", () => {
  const result = sanitizeMarkdown('<a href="javascript:void(0)">click</a>');
  // marked v16 escapes inline HTML, so no real <a> tag with javascript: exists
  assert.ok(
    !/<a[^>]*href\s*=\s*["']?javascript:/i.test(result),
    "no anchor should have javascript: href"
  );
});

test("sanitize: DOMPurify strips onerror from raw HTML", () => {
  const raw = '<img src=x onerror=alert("xss")>';
  const result = DOMPurify.sanitize(raw);
  assert.ok(!result.includes("onerror"), "DOMPurify should strip onerror");
});

test("sanitize: DOMPurify strips javascript: href from raw HTML", () => {
  const raw = '<a href="javascript:void(0)">click</a>';
  const result = DOMPurify.sanitize(raw);
  assert.ok(
    !result.includes("javascript:"),
    "DOMPurify should strip javascript: href"
  );
});

test("sanitize: normal markdown renders correctly", () => {
  const result = sanitizeMarkdown("## 見出し\n\n**太字テスト**\n\n- リスト項目");
  assert.ok(result.includes("<h2"), "h2 should be present");
  assert.ok(result.includes("<strong>"), "strong should be present");
  assert.ok(result.includes("<li>"), "li should be present");
});
