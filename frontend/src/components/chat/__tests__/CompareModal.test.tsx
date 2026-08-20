import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CompareModal } from "@/components/chat/CompareModal";

describe("Multi-Document Specification Comparison Modal", () => {
  const onCompareMock = vi.fn();
  const onCloseMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders when open with document selection dropdowns", () => {
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

  it("submits comparison query when two distinct documents are selected", () => {
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
