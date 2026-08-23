"use client";

import React, { useMemo } from "react";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { CitationItem } from "@/types/chat";

interface MarkdownRendererProps {
  content: string;
  citations?: CitationItem[];
  onCitationClick?: (citation: CitationItem) => void;
  isStreaming?: boolean;
}

/**
 * Recursively traverses React nodes and transforms string patterns matching `[N]`
 * into interactive citation badge buttons.
 */
function formatWithCitations(
  nodes: React.ReactNode,
  citations?: CitationItem[],
  onCitationClick?: (citation: CitationItem) => void
): React.ReactNode {
  if (!nodes) return nodes;

  if (typeof nodes === "string") {
    const regex = /\[(\d+)\]/g;
    if (!regex.test(nodes)) return nodes;
    regex.lastIndex = 0;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(nodes)) !== null) {
      const matchIndex = match.index;
      const citationNumber = parseInt(match[1], 10);

      if (matchIndex > lastIndex) {
        parts.push(nodes.substring(lastIndex, matchIndex));
      }

      const matchedCitation = citations?.find(
        (c) => c.index === citationNumber
      );

      parts.push(
        <button
          key={`cite-${matchIndex}-${citationNumber}`}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (matchedCitation && onCitationClick) {
              onCitationClick(matchedCitation);
            }
          }}
          className="inline-flex items-center px-1.5 py-0.2 mx-0.5 rounded-[var(--radius-tags)] bg-[var(--color-eucalyptus)] text-[var(--color-forest-ink)] hover:bg-[var(--color-lichen)] border border-[var(--color-lichen)] text-[11px] font-mono font-medium transition-colors cursor-pointer align-baseline"
          title={
            matchedCitation
              ? `${matchedCitation.document_title} (Page ${matchedCitation.page_number})`
              : `Citation [${citationNumber}]`
          }
          aria-label={`View citation ${citationNumber}`}
        >
          [{citationNumber}]
        </button>
      );

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < nodes.length) {
      parts.push(nodes.substring(lastIndex));
    }

    return parts;
  }

  if (Array.isArray(nodes)) {
    return nodes.map((node, i) => (
      <React.Fragment key={i}>
        {formatWithCitations(node, citations, onCitationClick)}
      </React.Fragment>
    ));
  }

  if (
    React.isValidElement(nodes) &&
    (nodes.props as { children?: React.ReactNode })?.children
  ) {
    const elementProps = nodes.props as {
      children?: React.ReactNode;
      [key: string]: unknown;
    };
    if (nodes.type === "code" || nodes.type === "pre") {
      return nodes;
    }
    return React.cloneElement(
      nodes as React.ReactElement<{ children?: React.ReactNode }>,
      {
        ...elementProps,
        children: formatWithCitations(
          elementProps.children,
          citations,
          onCitationClick
        ),
      }
    );
  }

  return nodes;
}

export function MarkdownRenderer({
  content,
  citations,
  onCitationClick,
  isStreaming = false,
}: MarkdownRendererProps) {
  const components: Components = useMemo(
    () => ({
      h1({ children }) {
        return (
          <h1 className="text-xl font-medium text-[var(--color-olive-press)] mt-4 mb-2 first:mt-0 tracking-tight font-sans">
            {formatWithCitations(children, citations, onCitationClick)}
          </h1>
        );
      },
      h2({ children }) {
        return (
          <h2 className="text-lg font-medium text-[var(--color-olive-press)] mt-3.5 mb-2 first:mt-0 tracking-tight font-sans">
            {formatWithCitations(children, citations, onCitationClick)}
          </h2>
        );
      },
      h3({ children }) {
        return (
          <h3 className="text-base font-semibold text-[var(--color-olive-press)] mt-3 mb-1.5 first:mt-0 font-sans">
            {formatWithCitations(children, citations, onCitationClick)}
          </h3>
        );
      },
      h4({ children }) {
        return (
          <h4 className="text-sm font-semibold text-[var(--color-olive-press)] mt-2.5 mb-1 first:mt-0 font-sans">
            {formatWithCitations(children, citations, onCitationClick)}
          </h4>
        );
      },
      p({ children }) {
        return (
          <p className="text-sm leading-relaxed text-[var(--color-forest-ink)] mb-3 last:mb-0">
            {formatWithCitations(children, citations, onCitationClick)}
          </p>
        );
      },
      strong({ children }) {
        return (
          <strong className="font-semibold text-[var(--color-forest-ink)]">
            {formatWithCitations(children, citations, onCitationClick)}
          </strong>
        );
      },
      em({ children }) {
        return (
          <em className="italic text-[var(--color-forest-ink)]">
            {formatWithCitations(children, citations, onCitationClick)}
          </em>
        );
      },
      ul({ children }) {
        return (
          <ul className="list-disc list-outside pl-5 space-y-1 mb-3 text-sm text-[var(--color-forest-ink)] font-sans">
            {children}
          </ul>
        );
      },
      ol({ children }) {
        return (
          <ol className="list-decimal list-outside pl-5 space-y-1 mb-3 text-sm text-[var(--color-forest-ink)] font-sans">
            {children}
          </ol>
        );
      },
      li({ children }) {
        return (
          <li className="leading-relaxed pl-1">
            {formatWithCitations(children, citations, onCitationClick)}
          </li>
        );
      },
      blockquote({ children }) {
        return (
          <blockquote className="border-l-2 border-[var(--color-sage-leaf)] pl-3.5 py-1.5 my-3 text-xs italic text-[var(--color-sage-gray)] bg-[var(--surface-bone)]/40 rounded-r-[var(--radius-inputs)]">
            {formatWithCitations(children, citations, onCitationClick)}
          </blockquote>
        );
      },
      table({ children }) {
        return (
          <div className="overflow-x-auto my-4 border border-[var(--color-mist)] rounded-[var(--radius-inputs)] bg-[var(--surface-bone)]">
            <table className="w-full text-xs font-mono border-collapse divide-y divide-[var(--color-mist)]">
              {children}
            </table>
          </div>
        );
      },
      thead({ children }) {
        return (
          <thead className="bg-[var(--surface-bone)] text-[var(--color-olive-press)] font-semibold border-b border-[var(--color-mist)]">
            {children}
          </thead>
        );
      },
      tbody({ children }) {
        return (
          <tbody className="bg-[var(--surface-linen)] divide-y divide-[var(--color-mist)]">
            {children}
          </tbody>
        );
      },
      tr({ children }) {
        return (
          <tr className="hover:bg-[var(--surface-bone)]/50 transition-colors">
            {children}
          </tr>
        );
      },
      th({ children }) {
        return (
          <th className="py-2.5 px-3.5 text-left font-semibold text-[var(--color-olive-press)]">
            {formatWithCitations(children, citations, onCitationClick)}
          </th>
        );
      },
      td({ children }) {
        return (
          <td className="py-2.5 px-3.5 text-left text-[var(--color-forest-ink)]">
            {formatWithCitations(children, citations, onCitationClick)}
          </td>
        );
      },
      hr() {
        return <hr className="border-t border-[var(--color-mist)] my-4" />;
      },
      a({ href, children }) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-deep-teal)] hover:text-[var(--color-olive-press)] underline underline-offset-2 transition-colors font-medium"
          >
            {children}
          </a>
        );
      },
      code({ className, children, node: _node, ...props }) {
        const isInline =
          !className &&
          typeof children === "string" &&
          !children.includes("\n");

        if (isInline) {
          return (
            <code
              className="px-1.5 py-0.5 rounded-[var(--radius-inputs)] bg-[var(--surface-bone)] border border-[var(--color-mist)] font-mono text-xs text-[var(--color-forest-ink)]"
              {...props}
            >
              {children}
            </code>
          );
        }

        return (
          <code
            className={`font-mono text-xs text-[var(--color-forest-ink)] ${
              className || ""
            }`}
            {...props}
          >
            {children}
          </code>
        );
      },
      pre({ children }) {
        return (
          <pre className="overflow-x-auto my-3 p-3.5 rounded-[var(--radius-cards)] bg-[var(--surface-bone)] border border-[var(--color-mist)] font-mono text-xs text-[var(--color-forest-ink)] leading-normal">
            {children}
          </pre>
        );
      },
    }),
    [citations, onCitationClick]
  );

  if (!content && !isStreaming) return null;

  return (
    <div className="prose-contexure w-full">
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </Markdown>
      {isStreaming && (
        <span
          data-testid="streaming-cursor"
          className="inline-block w-2 h-4 ml-1 bg-[var(--color-sage-leaf)] animate-pulse align-middle"
        />
      )}
    </div>
  );
}
