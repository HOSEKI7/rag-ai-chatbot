import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CompareModal } from "@/components/chat/CompareModal";
import * as docsApi from "@/lib/api/documents";

describe("Multi-Document Specification Comparison Modal", () => {
  const onCompareMock = vi.fn();
  const onCloseMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders when open with document selection dropdowns", async () => {
    vi.spyOn(docsApi, "fetchIndexedDocuments").mockResolvedValueOnce([
      {
        document_id: "doc_siemens_1le1_motor",
        document_title: "Siemens SIMOTICS 1LE1 AC Motor",
        category: "AC Motor",
        page_count: 12,
        parent_chunk_count: 12,
        child_chunk_count: 36,
        created_at: "2026-08-20T00:00:00Z",
      },
      {
        document_id: "doc_abb_acs580_drive",
        document_title: "ABB ACS580 General Purpose VFD",
        category: "VFD Drive",
        page_count: 14,
        parent_chunk_count: 14,
        child_chunk_count: 42,
        created_at: "2026-08-20T00:00:00Z",
      },
    ]);

    render(
      <CompareModal
        isOpen={true}
        onClose={onCloseMock}
        onCompare={onCompareMock}
      />
    );

    expect(
      screen.getByText(/Compare Equipment Datasheets Side-by-Side/i)
    ).toBeDefined();
    expect(screen.getByText(/EQUIPMENT SPECIMEN A/i)).toBeDefined();
    expect(screen.getByText(/EQUIPMENT SPECIMEN B/i)).toBeDefined();

    await waitFor(() => {
      expect(
        screen.getAllByText(/Siemens SIMOTICS 1LE1 AC Motor/i).length
      ).toBeGreaterThan(0);
    });
  });

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <CompareModal
        isOpen={false}
        onClose={onCloseMock}
        onCompare={onCompareMock}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("submits comparison query when two distinct documents are selected", async () => {
    vi.spyOn(docsApi, "fetchIndexedDocuments").mockResolvedValueOnce([
      {
        document_id: "doc_siemens_1le1_motor",
        document_title: "Siemens SIMOTICS 1LE1 AC Motor",
        category: "AC Motor",
        page_count: 12,
        parent_chunk_count: 12,
        child_chunk_count: 36,
        created_at: "2026-08-20T00:00:00Z",
      },
      {
        document_id: "doc_abb_acs580_drive",
        document_title: "ABB ACS580 General Purpose VFD",
        category: "VFD Drive",
        page_count: 14,
        parent_chunk_count: 14,
        child_chunk_count: 42,
        created_at: "2026-08-20T00:00:00Z",
      },
    ]);

    render(
      <CompareModal
        isOpen={true}
        onClose={onCloseMock}
        onCompare={onCompareMock}
      />
    );

    const submitBtn = screen.getByText(/Generate Comparison Matrix →/i);
    fireEvent.click(submitBtn);

    expect(onCompareMock).toHaveBeenCalledTimes(1);
    expect(onCompareMock.mock.calls[0][0]).toEqual([
      "doc_siemens_1le1_motor",
      "doc_abb_acs580_drive",
    ]);
  });
});
