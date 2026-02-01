#!/bin/bash
INPUT=$(cat)
if echo "$INPUT" | grep -q "Continue the conversation"; then
  echo "mock-discussion: なるほど、良い方向性ですね。"
elif echo "$INPUT" | grep -q "editorial assistant"; then
  echo "mock-opening: テーマについていくつか質問させてください。"
elif echo "$INPUT" | grep -q "research analyst"; then
  echo "mock-research: ## リサーチ結果"
elif echo "$INPUT" | grep -q "article planner"; then
  echo "mock-outline: ## 1. はじめに"
elif echo "$INPUT" | grep -q "article writer"; then
  echo "mock-draft: # 記事タイトル"
elif echo "$INPUT" | grep -q "experienced editor"; then
  echo "mock-review: # 改訂版記事"
else
  echo "mock-unknown"
fi
