import { CitationItem, ChatMessage } from "@/types/chat";

export interface StreamCallbacks {
  onMetadata?: (meta: {
    passed_guardrail: boolean;
    confidence_score: number;
    citations: CitationItem[];
    refusal_message: string | null;
  }) => void;
  onToken?: (token: string, provider?: string) => void;
  onError?: (error: string) => void;
  onDone?: (metrics: { provider: string; latency_ms: number }) => void;
}

export async function streamChatQuery(
  apiEndpoint: string,
  query: string,
  history: Array<Pick<ChatMessage, "role" | "content">>,
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
  filterDocIds?: string[]
): Promise<void> {
  const url =
    apiEndpoint.startsWith("http") || apiEndpoint.startsWith("/")
      ? apiEndpoint
      : `/api/chat`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      history,
      filter_doc_ids: filterDocIds,
    }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `HTTP error ${response.status}: ${errorText || response.statusText}`
    );
  }

  if (!response.body) {
    throw new Error("No readable stream available in response");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data: ")) continue;

      const dataStr = trimmed.slice(6).trim();
      if (dataStr === "[DONE]") {
        break;
      }

      try {
        const event = JSON.parse(dataStr);
        if (event.type === "metadata" && callbacks.onMetadata) {
          callbacks.onMetadata({
            passed_guardrail: event.passed_guardrail,
            confidence_score: event.confidence_score,
            citations: event.citations || [],
            refusal_message: event.refusal_message,
          });
        } else if (event.type === "token" && callbacks.onToken) {
          callbacks.onToken(event.content || event.token || "", event.provider);
        } else if (event.type === "error" && callbacks.onError) {
          callbacks.onError(event.message || "Unknown generation error");
        } else if (event.type === "done" && callbacks.onDone) {
          callbacks.onDone({
            provider: event.provider || "unknown",
            latency_ms: event.latency_ms || 0,
          });
        }
      } catch {
        // Skip malformed chunk
      }
    }
  }
}
