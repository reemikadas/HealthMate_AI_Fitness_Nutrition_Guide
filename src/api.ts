import type { ChatResponse, Message } from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "";

export async function askHealthMate(
  message: string,
  history: Message[],
  signal?: AbortSignal,
): Promise<ChatResponse> {
  const response = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      history: history
        .filter((item) => !item.error)
        .slice(-6)
        .map((item) => ({ role: item.role, content: item.content })),
    }),
    signal,
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.detail ?? "HealthMate could not answer right now.");
  }
  return body as ChatResponse;
}
