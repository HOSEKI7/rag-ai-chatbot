import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MessageItem } from "@/components/chat/MessageItem";
import * as pdfExportModule from "@/lib/utils/pdfExport";

describe("Single-Answer PDF Technical Report Export", () => {
  const onCitationClickMock = vi.fn();

  const sampleAssistantMessage = {
    id: "msg-1",
    role: "assistant" as const,
    content:
      "Siemens SIMOTICS 1LE1 motor delivers 15 kW rated power with IE3 efficiency [1].",
    timestamp: Date.now(),
    provider: "gemini",
    confidence_score: 0.94,
    passed_guardrail: true,
    citations: [
      {
        index: 1,
        document_id: "doc_siemens_1le1_motor",
        document_title: "Siemens SIMOTICS 1LE1 AC Motor",
        category: "AC Motor",
        section_title: "Electrical Ratings",
        page_number: 3,
        chunk_id: "c1",
        parent_id: "p1",
        excerpt: "Rated output power 15 kW.",
        confidence_score: 0.94,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Export PDF button on assistant message with verified content", () => {
    render(
      <MessageItem
        message={sampleAssistantMessage}
        originatingQuery="What is the rated power of Siemens 1LE1?"
        onCitationClick={onCitationClickMock}
      />
    );

    const exportBtn = screen.getByText(/Export PDF ↓/i);
    expect(exportBtn).toBeDefined();
  });

  it("triggers downloadTechnicalReportPdf when export button is clicked", () => {
    const downloadSpy = vi
      .spyOn(pdfExportModule, "downloadTechnicalReportPdf")
      .mockImplementation(() => {});

    render(
      <MessageItem
        message={sampleAssistantMessage}
        originatingQuery="What is the rated power of Siemens 1LE1?"
        onCitationClick={onCitationClickMock}
      />
    );

    const exportBtn = screen.getByText(/Export PDF ↓/i);
    fireEvent.click(exportBtn);

    expect(downloadSpy).toHaveBeenCalledTimes(1);
    expect(downloadSpy.mock.calls[0][0].query).toBe(
      "What is the rated power of Siemens 1LE1?"
    );
    expect(downloadSpy.mock.calls[0][0].confidenceScore).toBe(0.94);
  });

  it("generates a valid jsPDF document instance with markdown table parsing and structured citations", () => {
    const pdfDoc = pdfExportModule.generateTechnicalReportPdf({
      query: "Compare motor torque and voltage",
      answerContent:
        "| Parameter | Siemens 1LE1 | ABB ACS580 |\n|---|---|---|\n| Voltage | 400 V | 380-480 V |",
      confidenceScore: 0.91,
      citations: [
        {
          index: 1,
          document_id: "doc_1",
          document_title: "Motor Datasheet",
          category: "Datasheet",
          section_title: "Specs",
          page_number: 1,
          chunk_id: "c1",
          parent_id: "p1",
          excerpt: "Voltage is 400 V.",
          confidence_score: 0.91,
        },
      ],
    });

    expect(pdfDoc).toBeDefined();
    expect(pdfDoc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });
});
