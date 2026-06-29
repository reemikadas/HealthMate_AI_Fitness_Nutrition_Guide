export type Role = "user" | "assistant";

export interface Message {
  id: string;
  role: Role;
  content: string;
  sources?: string[];
  error?: boolean;
}

export interface Chat {
  id: string;
  title: string;
  createdAt: number;
  messages: Message[];
}

export interface ChatResponse {
  answer: string;
  sources: string[];
}
