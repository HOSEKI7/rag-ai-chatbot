import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MarkdownRenderer } from "@/components/chat/MarkdownRenderer";
import { CitationItem } from "@/types/chat";

describe("MarkdownRenderer Component", () => {
  const sampleCitations: CitationItem[] = [
    {
      index: 1,
      document_id: "doc_siemens_1le1",
      document_title: "Siemens SIMOTICS 1LE1 AC Motor",
      category: "AC Motor",
      section_title: "Rated Power",
      page_number: 3,
      chunk_id: "c1",
      parent_id: "p1",
      excerpt: "Rated output power 15 kW.",
      confidence_score: 0.95,
    },
    {
      index: 2,
      document_id: "doc_abb_acs580",
      document_title: "ABB ACS580 General Purpose VFD",
      category: "VFD Drive",
      section_title: "Voltage Range",
      page_number: 5,
      chunk_id: "c2",
      parent_id: "p2",
      excerpt: "Operating voltage range 380-480 V.",
      confidence_score: 0.92,
    },
  ];

  it("renders headings with proper semantic HTML and hierarchy", () => {
    const markdown = `# Main Title
## Section Title
### Subsection Title
#### Small Title`;

    render(<MarkdownRenderer content={markdown} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Main Title" })
    ).toBeDefined();
    expect(
      screen.getByRole("heading", { level: 2, name: "Section Title" })
    ).toBeDefined();
    expect(
      screen.getByRole("heading", { level: 3, name: "Subsection Title" })
    ).toBeDefined();
    expect(
      screen.getByRole("heading", { level: 4, name: "Small Title" })
    ).toBeDefined();
  });

  it("renders text formatting: bold, italic, and inline code", () => {
    const markdown =
      "This has **strong bold** text, *italicized emphasis*, and `const power = 15;` inline code.";

    const { container } = render(<MarkdownRenderer content={markdown} />);

    const strongEl = screen.getByText("strong bold");
    expect(strongEl.tagName.toLowerCase()).toBe("strong");

    const emEl = screen.getByText("italicized emphasis");
    expect(emEl.tagName.toLowerCase()).toBe("em");

    const codeEl = container.querySelector("code");
    expect(codeEl).toBeDefined();
    expect(codeEl?.textContent).toBe("const power = 15;");
  });

  it("renders unordered and ordered lists with correct list items", () => {
    const markdown = `### Key Features:
- Rated power: 15 kW
- Operating speed: 1500 RPM
- Enclosure rating: IP55

1. Connect primary leads
2. Calibrate sensor zero-point`;

    render(<MarkdownRenderer content={markdown} />);

    expect(screen.getByText(/Rated power: 15 kW/i)).toBeDefined();
    expect(screen.getByText(/Operating speed: 1500 RPM/i)).toBeDefined();
    expect(screen.getByText(/Connect primary leads/i)).toBeDefined();
    expect(screen.getByText(/Calibrate sensor zero-point/i)).toBeDefined();

    const listItems = screen.getAllByRole("listitem");
    expect(listItems.length).toBe(5);
  });

  it("renders markdown comparison tables with headers and cells", () => {
    const markdown = `| Parameter | Siemens 1LE1 | ABB ACS580 |
|---|---|---|
| Rated Power | 15 kW | 18.5 kW |
| Efficiency | IE3 (92.5%) | 98.0% |`;

    render(<MarkdownRenderer content={markdown} />);

    expect(screen.getByRole("table")).toBeDefined();
    expect(
      screen.getByRole("columnheader", { name: "Parameter" })
    ).toBeDefined();
    expect(
      screen.getByRole("columnheader", { name: "Siemens 1LE1" })
    ).toBeDefined();
    expect(screen.getByRole("cell", { name: "Rated Power" })).toBeDefined();
    expect(screen.getByRole("cell", { name: "IE3 (92.5%)" })).toBeDefined();
  });

  it("renders code blocks in preformatted containers", () => {
    const markdown = `\`\`\`json
{
  "motor_id": "1LE1",
  "rated_power_kw": 15
}
\`\`\``;

    const { container } = render(<MarkdownRenderer content={markdown} />);

    const preEl = container.querySelector("pre");
    expect(preEl).toBeDefined();
    expect(preEl?.textContent).toContain('"motor_id": "1LE1"');
  });

  it("renders blockquotes with citation accents", () => {
    const markdown = `> Note: Always verify motor shaft alignment before continuous operation.`;

    const { container } = render(<MarkdownRenderer content={markdown} />);

    const blockquoteEl = container.querySelector("blockquote");
    expect(blockquoteEl).toBeDefined();
    expect(blockquoteEl?.textContent).toContain(
      "Always verify motor shaft alignment"
    );
  });

  it("renders markdown links with security attributes", () => {
    const markdown = `Refer to the [Siemens Documentation](https://example.com/siemens) for details.`;

    render(<MarkdownRenderer content={markdown} />);

    const link = screen.getByRole("link", { name: "Siemens Documentation" });
    expect(link.getAttribute("href")).toBe("https://example.com/siemens");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });

  it("renders inline citation badges [1], [2] as clickable buttons and calls onCitationClick", () => {
    const onCitationClick = vi.fn();
    const markdown = `The Siemens 1LE1 motor delivers 15 kW [1] and works with ABB ACS580 drives [2].`;

    render(
      <MarkdownRenderer
        content={markdown}
        citations={sampleCitations}
        onCitationClick={onCitationClick}
      />
    );

    const cite1Btn = screen.getByRole("button", { name: /view citation 1/i });
    const cite2Btn = screen.getByRole("button", { name: /view citation 2/i });

    expect(cite1Btn).toBeDefined();
    expect(cite2Btn).toBeDefined();

    fireEvent.click(cite1Btn);
    expect(onCitationClick).toHaveBeenCalledTimes(1);
    expect(onCitationClick).toHaveBeenCalledWith(sampleCitations[0]);

    fireEvent.click(cite2Btn);
    expect(onCitationClick).toHaveBeenCalledTimes(2);
    expect(onCitationClick).toHaveBeenCalledWith(sampleCitations[1]);
  });

  it("renders streaming indicator when isStreaming is true", () => {
    render(
      <MarkdownRenderer
        content="Generating live technical response..."
        isStreaming={true}
      />
    );

    expect(screen.getByTestId("streaming-cursor")).toBeDefined();
  });

  it("handles empty content gracefully", () => {
    const { container } = render(
      <MarkdownRenderer content="" isStreaming={false} />
    );
    expect(container.firstChild).toBeNull();
  });
});
