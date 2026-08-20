import { CitationItem } from "@/lib/api/retrieve";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  citations?: CitationItem[];
  passed_guardrail?: boolean;
  confidence_score?: number;
  refusal_message?: string | null;
  provider?: string;
  latency_ms?: number;
  isStreaming?: boolean;
}

export type { CitationItem };
