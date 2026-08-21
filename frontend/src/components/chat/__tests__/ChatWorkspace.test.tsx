import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ChatPage from "@/app/chat/page";

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("Interactive Chat Workspace", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("renders empty state with curated starter questions", () => {
    render(<ChatPage />);
    expect(
      screen.getByText(/Interactive Technical Support Workspace/i)
    ).toBeDefined();
    expect(screen.getByText("Siemens 1LE1 Specifications")).toBeDefined();
    expect(screen.getByText("Omron E2E Sensor Ratings")).toBeDefined();
  });

  it("renders input field and clear chat action", () => {
    render(<ChatPage />);
    expect(
      screen.getByPlaceholderText(
        /Ask technical specifications, wiring, tolerances.../i
      )
    ).toBeDefined();
    expect(screen.getByRole("button", { name: /send/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /clear/i })).toBeDefined();
  });

  it("clicking a starter question populates and initiates chat query", async () => {
    render(<ChatPage />);
    const starterButton = screen.getByText("Siemens 1LE1 Specifications");
    fireEvent.click(starterButton);

    await waitFor(() => {
      // User message should be rendered
      expect(
        screen.getByText(
          "What is the rated power, speed, and torque of the Siemens 1LE1 motor?"
        )
      ).toBeDefined();
    });
  });

  it("renders Contexure brand logo in header and empty state", () => {
    render(<ChatPage />);
    const logos = screen.getAllByAltText("Contexure Logo");
    expect(logos.length).toBeGreaterThanOrEqual(2);
  });
});
