import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AdminPage from "@/app/admin/page";
import * as docsApi from "@/lib/api/documents";

describe("Admin Authentication & Document Ingestion Management UI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the admin portal authentication and upload zone", () => {
    render(<AdminPage />);
    expect(screen.getByText(/Source Document Ingestion/i)).toBeDefined();
    expect(
      screen.getByText(/Drag & drop industrial PDF datasheet/i)
    ).toBeDefined();
  });

  it("renders active indexed documents table after loading", async () => {
    vi.spyOn(docsApi, "fetchIndexedDocuments").mockResolvedValueOnce([
      {
        document_id: "doc_siemens_1le1",
        document_title: "Siemens SIMOTICS 1LE1 AC Motor",
        category: "AC Induction Motor",
        page_count: 8,
        parent_chunk_count: 4,
        child_chunk_count: 16,
        created_at: "2026-08-20T00:00:00Z",
      },
    ]);

    render(<AdminPage />);
    expect(screen.getByText(/Active Knowledge Base Documents/i)).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText("Document Title")).toBeDefined();
      expect(screen.getByText("Child Chunks")).toBeDefined();
      expect(screen.getByText("Siemens SIMOTICS 1LE1 AC Motor")).toBeDefined();
    });
  });

  it("renders category selection options in the upload form", () => {
    render(<AdminPage />);
    expect(screen.getByRole("combobox")).toBeDefined();
    expect(screen.getByText("AC Induction Motor")).toBeDefined();
  });
});
