export type MessageRole = "user" | "assistant" | "system";

export type ChatMessage = {
  role: MessageRole;
  content: string;
  timestamp: string;
};
