import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import HomePage from "@/app/page";

describe("Adaline Editorial Landing Page", () => {
  it("renders brand headline in Newsreader serif display font", () => {
    render(<HomePage />);
    expect(
      screen.getByText(/Deterministic intelligence for industrial machinery/i)
    ).toBeDefined();
  });

  it("renders dual CTA buttons for workspace launch and architecture inspection", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("link", { name: /start technical query/i })
    ).toBeDefined();
    expect(
      screen.getByRole("link", { name: /inspect architecture/i })
    ).toBeDefined();
  });

  it("renders the interactive 5-stage RAG architecture pipeline", () => {
    render(<HomePage />);
    expect(
      screen.getAllByText(/Docling Layout Parser/i).length
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText(/Hierarchical Parent-Child Chunking/i).length
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText(/Local 768-dim FastEmbed/i).length
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText(/FlashRank Cross-Encoder & Guardrail/i).length
    ).toBeGreaterThanOrEqual(1);
  });

  it("renders the industrial specimen catalog cards", () => {
    render(<HomePage />);
    expect(screen.getByText(/SIMOTICS 1LE1/i)).toBeDefined();
    expect(screen.getByText(/ACS580 VFD/i)).toBeDefined();
    expect(screen.getByText(/E2E Proximity Sensor/i)).toBeDefined();
  });
});
