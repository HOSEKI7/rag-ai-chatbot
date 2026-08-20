"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { ChatMessage, CitationItem } from "@/types/chat";
import { streamChatQuery } from "@/lib/api/chatStream";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { EmptyState } from "@/components/chat/EmptyState";
import { MessageItem } from "@/components/chat/MessageItem";
import { CitationDrawer } from "@/components/chat/CitationDrawer";
import { CompareModal } from "@/components/chat/CompareModal";
import { ChatInput } from "@/components/chat/ChatInput";

const STORAGE_KEY = "contexure_chat_messages";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<CitationItem | null>(
    null
  );
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Helper to update specific assistant message fields cleanly
  const updateAssistantMessage = useCallback(
    (messageId: string, updates: Partial<ChatMessage>) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, ...updates } : msg))
      );
    },
    []
  );

  // Load conversation history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setMessages(JSON.parse(saved));
      }
    } catch {
      // Ignore storage read error
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
      // Ignore storage write error
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
    async (queryText: string, docIds?: string[]) => {
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
          "/api/chat",
          queryText,
          updatedHistory.map((m) => ({ role: m.role, content: m.content })),
          {
            onMetadata: (meta) => {
              updateAssistantMessage(assistantMsgId, {
                passed_guardrail: meta.passed_guardrail,
                confidence_score: meta.confidence_score,
                citations: meta.citations,
                refusal_message: meta.refusal_message,
              });
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
              updateAssistantMessage(assistantMsgId, {
                isStreaming: false,
                provider: metrics.provider,
                latency_ms: metrics.latency_ms,
              });
            },
          },
          abortController.signal,
          docIds
        );
      } catch (err: unknown) {
        if ((err as Error)?.name !== "AbortError") {
          const errMsg =
            (err as Error)?.message || "Failed to communicate with RAG engine.";
          setError(errMsg);

          updateAssistantMessage(assistantMsgId, {
            isStreaming: false,
            content: `Communication error: ${errMsg}`,
            passed_guardrail: false,
            refusal_message:
              "Connection to backend service could not be established.",
          });
        }
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [isLoading, messages, updateAssistantMessage]
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
      <ChatHeader
        onClear={handleClearChat}
        onOpenCompare={() => setIsCompareOpen(true)}
        messageCount={messages.length}
      />

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

      {/* Compare Modal */}
      <CompareModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        onCompare={(docIds, queryText) => handleSendMessage(queryText, docIds)}
      />
    </div>
  );
}
