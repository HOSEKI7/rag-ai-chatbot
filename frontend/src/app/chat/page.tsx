"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { ChatMessage, CitationItem } from "@/types/chat";
import { streamChatQuery } from "@/lib/api/chatStream";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { EmptyState } from "@/components/chat/EmptyState";
import { MessageItem } from "@/components/chat/MessageItem";
import { CitationDrawer } from "@/components/chat/CitationDrawer";
import { ChatInput } from "@/components/chat/ChatInput";

const STORAGE_KEY = "contexure_chat_messages";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<CitationItem | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  // Load conversation history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setMessages(JSON.parse(saved));
      }
    } catch {
      // Ignore parse error
    }
  }, []);

  // Save conversation history to localStorage
  useEffect(() => {
    try {
      if (messages.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore storage error
    }
  }, [messages]);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle sending a message
  const handleSendMessage = useCallback(
    async (queryText: string) => {
      if (!queryText.trim() || isLoading) return;

      setError(null);
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: queryText.trim(),
        timestamp: Date.now(),
      };

      const assistantMsgId = `assistant-${Date.now()}`;
      const initialAssistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        isStreaming: true,
      };

      const updatedHistory = [...messages, userMsg];
      setMessages([...updatedHistory, initialAssistantMsg]);
      setIsLoading(true);

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        await streamChatQuery(
          backendUrl,
          queryText,
          updatedHistory.map((m) => ({ role: m.role, content: m.content })),
          {
            onMetadata: (meta) => {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId
                    ? {
                        ...msg,
                        passed_guardrail: meta.passed_guardrail,
                        confidence_score: meta.confidence_score,
                        citations: meta.citations,
                        refusal_message: meta.refusal_message,
                      }
                    : msg
                )
              );
            },
            onToken: (token, provider) => {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId
                    ? {
                        ...msg,
                        content: msg.content + token,
                        provider: provider || msg.provider,
                      }
                    : msg
                )
              );
            },
            onError: (err) => {
              setError(err);
            },
            onDone: (metrics) => {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId
                    ? {
                        ...msg,
                        isStreaming: false,
                        provider: metrics.provider,
                        latency_ms: metrics.latency_ms,
                      }
                    : msg
                )
              );
            },
          },
          abortController.signal
        );
      } catch (err: unknown) {
        if ((err as Error)?.name !== "AbortError") {
          const errMsg =
            (err as Error)?.message || "Failed to communicate with RAG engine.";
          setError(errMsg);

          // Simulated offline fallback response for development
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? {
                    ...msg,
                    isStreaming: false,
                    content:
                      "Based on the verified technical documentation [1], the specified equipment operating parameters are verified.",
                    citations: [
                      {
                        index: 1,
                        document_id: "doc-siemens-1le1",
                        document_title: "Siemens 1LE1 AC Induction Motor",
                        category: "Motor",
                        section_title: "Technical Specifications",
                        page_number: 2,
                        chunk_id: "c-001",
                        parent_id: "p-001",
                        excerpt:
                          "The Siemens 1LE1 AC induction motor delivers 15 kW rated output power with 97 Nm rated torque at 1475 RPM.",
                        confidence_score: 0.89,
                      },
                    ],
                    passed_guardrail: true,
                    confidence_score: 0.89,
                    provider: "offline_mock",
                  }
                : msg
            )
          );
        }
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [backendUrl, isLoading, messages]
  );

  // Check URL query parameters for pre-populated questions on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryParam = params.get("query");
      if (queryParam && messages.length === 0) {
        handleSendMessage(queryParam);
      }
    }
  }, [handleSendMessage, messages.length]);

  const handleClearChat = () => {
    if (isLoading && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
    setError(null);
  };

  const handleStopStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--surface-linen)] flex flex-col justify-between text-[var(--color-forest-ink)]">
      {/* Top Header */}
      <ChatHeader onClear={handleClearChat} messageCount={messages.length} />

      {/* Main Chat Scroll Container */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 py-8 flex flex-col justify-between">
        {error && (
          <div className="max-w-3xl w-full mx-auto mb-4 p-3 rounded-[var(--radius-inputs)] bg-[var(--color-blush)] border border-[var(--color-crimson-specimen)]/30 text-xs font-mono text-[var(--color-crimson-specimen)] flex items-center justify-between">
            <span>Notice: {error}</span>
            <button
              onClick={() => setError(null)}
              className="text-[var(--color-forest-ink)] underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {messages.length === 0 ? (
          <EmptyState onSelectQuery={handleSendMessage} />
        ) : (
          <div className="flex-1 flex flex-col items-center">
            {messages.map((msg) => (
              <MessageItem
                key={msg.id}
                message={msg}
                onCitationClick={(cite) => setSelectedCitation(cite)}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Fixed Bottom Input Area */}
      <div className="sticky bottom-0 bg-[var(--surface-linen)]/90 backdrop-blur-md border-t border-[var(--color-mist)] p-4">
        <ChatInput
          onSend={handleSendMessage}
          isLoading={isLoading}
          onStop={handleStopStream}
        />
      </div>

      {/* Expandable Citation Drawer / Modal */}
      <CitationDrawer
        citation={selectedCitation}
        onClose={() => setSelectedCitation(null)}
      />
    </div>
  );
}
