"use client";

interface EmptyStateProps {
  onSelectQuery: (query: string) => void;
}

const STARTER_PROMPTS = [
  {
    category: "Siemens Motor",
    title: "Siemens 1LE1 Specifications",
    query:
      "What is the rated power, speed, and torque of the Siemens 1LE1 motor?",
    badge: "IE3 Motor",
  },
  {
    category: "Omron Sensor",
    title: "Omron E2E Sensor Ratings",
    query:
      "What is the sensing distance, voltage range, and output type of the Omron E2E proximity sensor?",
    badge: "IP67 Sensor",
  },
  {
    category: "ABB Drive",
    title: "ABB ACS580 Safety & Protocols",
    query:
      "What communication protocols and integrated safety functions are available on the ABB ACS580 VFD?",
    badge: "VFD Drive",
  },
  {
    category: "Mitsubishi PLC",
    title: "Mitsubishi MELSEC iQ-R Performance",
    query:
      "What is the basic instruction processing speed and network bus standard of the MELSEC iQ-R series PLC?",
    badge: "TSN PLC",
  },
];

export function EmptyState({ onSelectQuery }: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 max-w-3xl mx-auto text-center">
      {/* Field Note Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[var(--radius-tags)] bg-[var(--surface-bone)] border border-[var(--color-mist)] mb-6">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-sage-leaf)]" />
        <span className="text-xs font-mono tracking-wider uppercase text-[var(--color-forest-ink)]">
          VERIFIED INDUSTRIAL DATASHEET AGENT
        </span>
      </div>

      <h2 className="font-serif text-3xl sm:text-4xl font-light text-[var(--color-olive-press)] tracking-tight mb-4">
        Interactive Technical Support Workspace
      </h2>

      <p className="text-sm text-[var(--color-sage-gray)] max-w-xl mb-10 leading-relaxed font-normal">
        Ask complex industrial machinery questions across verified datasheets.
        Every answer is grounded with verifiable footnote citations and
        cross-encoder confidence checks.
      </p>

      {/* Suggested Starter Questions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full text-left">
        {STARTER_PROMPTS.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onSelectQuery(item.query)}
            className="p-4 bg-[var(--surface-bone)] border border-[var(--color-mist)] rounded-[var(--radius-cards)] hover:border-[var(--color-lichen)] transition-all cursor-pointer flex flex-col justify-between group text-left"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase text-[var(--color-sage-leaf)]">
                  {item.category}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-[var(--radius-tags)] bg-[var(--surface-linen)] border border-[var(--color-mist)] text-[var(--color-sage-gray)]">
                  {item.badge}
                </span>
              </div>
              <h3 className="text-sm font-medium text-[var(--color-forest-ink)] group-hover:text-[var(--color-olive-press)] mb-1">
                {item.title}
              </h3>
              <p className="text-xs font-mono text-[var(--color-sage-gray)] line-clamp-2">
                &ldquo;{item.query}&rdquo;
              </p>
            </div>
            <span className="text-xs font-mono text-[var(--color-sage-mist)] group-hover:text-[var(--color-forest-ink)] mt-3 block">
              Ask this question →
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
