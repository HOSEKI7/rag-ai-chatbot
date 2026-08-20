import Link from "next/link";

interface SpecimenItem {
  id: string;
  manufacturer: string;
  model: string;
  category: string;
  keySpecs: string[];
  sampleQuery: string;
}

const SPECIMENS: SpecimenItem[] = [
  {
    id: "siemens-1le1",
    manufacturer: "Siemens",
    model: "SIMOTICS 1LE1",
    category: "AC Induction Motor",
    keySpecs: [
      "15 kW Rated Output Power",
      "1475 RPM Rated Speed · 97 Nm Torque",
      "IE3 Premium Efficiency Class",
      "IP55 Protection · Cast Iron 160M",
    ],
    sampleQuery:
      "What is the rated torque and efficiency rating of the Siemens 1LE1 motor?",
  },
  {
    id: "abb-acs580",
    manufacturer: "ABB",
    model: "ACS580 VFD",
    category: "Variable Frequency Drive",
    keySpecs: [
      "37 kW Heavy-Duty Output",
      "380V–480V 3-Phase AC Input",
      "Integrated Modbus RTU & Safe Torque Off (STO)",
      "Built-in EMC Filter Category C2",
    ],
    sampleQuery:
      "What communication protocols and safety certifications does the ABB ACS580 drive support?",
  },
  {
    id: "omron-e2e",
    manufacturer: "Omron",
    model: "E2E Proximity Sensor",
    category: "Inductive Proximity Sensor",
    keySpecs: [
      "5mm to 10mm Sensing Distance",
      "12V–24V DC Operating Voltage",
      "NPN Normally Open (NO) Output",
      "IP67 / IP69K Washdown Rated Housing",
    ],
    sampleQuery:
      "What is the sensing distance and operating voltage for the Omron E2E sensor?",
  },
  {
    id: "mitsubishi-iqr",
    manufacturer: "Mitsubishi Electric",
    model: "MELSEC iQ-R Series",
    category: "Programmable Logic Controller",
    keySpecs: [
      "0.98 ns Basic Instruction Execution",
      "CC-Link IE TSN Gigabit Industrial Ethernet",
      "Multi-CPU synchronized motion control",
      "Security key authentication & IP filtering",
    ],
    sampleQuery:
      "What is the instruction processing speed and network capability of the MELSEC iQ-R PLC?",
  },
];

export function SpecimenCatalog() {
  return (
    <section
      id="datasheets"
      className="py-24 border-b border-[var(--color-mist)]"
    >
      {/* Header (Akkurat Sans) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-[var(--color-sage-leaf)] block mb-2">
            CURATED SPECIMEN CATALOG
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-normal text-[var(--color-olive-press)] tracking-tight">
            Indexed industrial equipment datasheets.
          </h2>
        </div>
        <p className="text-sm text-[var(--color-sage-gray)] max-w-sm mt-4 md:mt-0 font-normal">
          Industrial equipment documentation indexed and verified for
          zero-hallucination footnote citations.
        </p>
      </div>

      {/* Grid of Specimen Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SPECIMENS.map((specimen) => (
          <div
            key={specimen.id}
            className="bg-[var(--surface-bone)] border border-[var(--color-mist)] rounded-[var(--radius-cards)] p-6 flex flex-col justify-between hover:border-[var(--color-lichen)] transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase tracking-wider text-[var(--color-sage-leaf)]">
                  {specimen.manufacturer}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-[var(--radius-tags)] bg-[var(--surface-linen)] border border-[var(--color-mist)] text-[var(--color-sage-gray)]">
                  {specimen.category}
                </span>
              </div>

              <h3 className="text-xl font-medium text-[var(--color-forest-ink)] mb-4">
                {specimen.model}
              </h3>

              <ul className="space-y-2 mb-6">
                {specimen.keySpecs.map((spec, i) => (
                  <li
                    key={i}
                    className="text-xs font-mono text-[var(--color-sage-gray)] flex items-center gap-2"
                  >
                    <span className="w-1 h-1 rounded-full bg-[var(--color-sage-mist)]" />
                    <span>{spec}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t border-[var(--color-mist)] flex items-center justify-between">
              <span className="text-xs font-mono text-[var(--color-sage-mist)] truncate max-w-[240px]">
                Qdrant Indexed & Verified
              </span>
              <Link
                href={`/chat?query=${encodeURIComponent(specimen.sampleQuery)}`}
                className="text-xs font-medium text-[var(--color-forest-ink)] hover:text-[var(--color-olive-press)] underline underline-offset-4 font-mono transition-colors"
              >
                Query Datasheet →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
