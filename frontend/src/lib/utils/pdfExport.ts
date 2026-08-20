import { jsPDF } from "jspdf";
import { CitationItem } from "@/types/chat";

export interface TechnicalReportData {
  query: string;
  answerContent: string;
  confidenceScore: number;
  citations: CitationItem[];
  timestamp?: number;
}

// Adaline Design System Color Palette (DESIGN.md)
const ADALINE_COLORS = {
  forestInk: [10, 29, 8] as const, // #0a1d08
  olivePress: [43, 57, 10] as const, // #2b390a
  sageLeaf: [74, 109, 71] as const, // #4a6d47
  sageGray: [107, 120, 96] as const, // #6b7860
  mistBorder: [225, 230, 223] as const, // #e1e6df
  boneSurface: [239, 242, 232] as const, // #eff2e8
  linenCanvas: [248, 249, 245] as const, // #f8f9f5
};

function ensurePageSpace(
  doc: jsPDF,
  currentY: number,
  requiredHeight: number
): number {
  if (currentY + requiredHeight > 275) {
    doc.addPage();
    return 20;
  }
  return currentY;
}

export function generateTechnicalReportPdf(data: TechnicalReportData): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPos = 24;

  // --- 1. Header & Brand Banner ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...ADALINE_COLORS.forestInk);
  doc.text("CONTEXURE", margin, yPos);

  doc.setFont("courier", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...ADALINE_COLORS.sageLeaf);
  doc.text("TECHNICAL VERIFICATION REPORT", margin + 40, yPos - 1);

  yPos += 4;
  doc.setDrawColor(...ADALINE_COLORS.mistBorder);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, margin + contentWidth, yPos);
  yPos += 8;

  // --- 2. Metadata Banner Box ---
  doc.setFillColor(...ADALINE_COLORS.boneSurface);
  doc.roundedRect(margin, yPos, contentWidth, 18, 2, 2, "F");

  doc.setFont("courier", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...ADALINE_COLORS.forestInk);
  doc.text(
    "GROUNDING STATUS: VERIFIED AGAINST INDEXED DATASHEETS",
    margin + 4,
    yPos + 6
  );

  doc.setFont("courier", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...ADALINE_COLORS.sageGray);
  const dateStr = new Date(data.timestamp || Date.now()).toLocaleString(
    "en-US",
    {
      timeZone: "UTC",
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
  doc.text(
    `Timestamp: ${dateStr} UTC  |  Confidence Score: ${(data.confidenceScore * 100).toFixed(1)}%`,
    margin + 4,
    yPos + 12
  );

  yPos += 26;

  // --- 3. Originating Inquiry ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...ADALINE_COLORS.olivePress);
  doc.text("ORIGINATING INQUIRY", margin, yPos);
  yPos += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...ADALINE_COLORS.forestInk);
  const queryLines = doc.splitTextToSize(`"${data.query}"`, contentWidth);
  doc.text(queryLines, margin, yPos);
  yPos += queryLines.length * 4.2 + 8;

  // --- 4. Verified Technical Answer ---
  yPos = ensurePageSpace(doc, yPos, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...ADALINE_COLORS.olivePress);
  doc.text("VERIFIED TECHNICAL ANSWER", margin, yPos);
  yPos += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...ADALINE_COLORS.forestInk);

  const rawLines = data.answerContent.split("\n");
  let inTable = false;
  const tableRows: string[][] = [];

  const renderTable = (rows: string[][]) => {
    if (rows.length < 2) return;
    const colCount = rows[0].length;
    const colWidth = contentWidth / colCount;

    rows.forEach((row, rIdx) => {
      yPos = ensurePageSpace(doc, yPos, 7);
      const isHeader = rIdx === 0;

      if (isHeader) {
        doc.setFillColor(...ADALINE_COLORS.boneSurface);
        doc.rect(margin, yPos - 3.5, contentWidth, 6, "F");
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...ADALINE_COLORS.olivePress);
      } else {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...ADALINE_COLORS.forestInk);
      }

      row.forEach((cell, cIdx) => {
        const cleanCell = cell
          .replace(/\*\*(.*?)\*\*/g, "$1")
          .replace(/\[(\d+)\]/g, "[$1]")
          .trim();
        doc.text(cleanCell, margin + cIdx * colWidth + 2, yPos);
      });

      doc.setDrawColor(...ADALINE_COLORS.mistBorder);
      doc.setLineWidth(0.2);
      doc.line(margin, yPos + 2.5, margin + contentWidth, yPos + 2.5);
      yPos += 6;
    });
    yPos += 3;
  };

  for (const line of rawLines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      if (trimmed.includes("---")) continue; // Skip separator line
      inTable = true;
      const cells = trimmed
        .split("|")
        .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
        .map((c) => c.trim());
      tableRows.push(cells);
    } else {
      if (inTable && tableRows.length > 0) {
        renderTable(tableRows);
        tableRows.length = 0;
        inTable = false;
      }

      if (!trimmed) {
        yPos += 2;
        continue;
      }

      const cleanText = trimmed
        .replace(/^#+\s+/gm, "")
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1")
        .replace(/`([^`]+)`/g, "$1");

      const wrappedLines = doc.splitTextToSize(cleanText, contentWidth);
      for (const wLine of wrappedLines) {
        yPos = ensurePageSpace(doc, yPos, 5);
        doc.text(wLine, margin, yPos);
        yPos += 4;
      }
    }
  }

  if (inTable && tableRows.length > 0) {
    renderTable(tableRows);
    tableRows.length = 0;
  }

  yPos += 8;

  // --- 5. Verified Citation Footnotes Table ---
  if (data.citations && data.citations.length > 0) {
    yPos = ensurePageSpace(doc, yPos, 25);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...ADALINE_COLORS.olivePress);
    doc.text(
      `VERIFIED SOURCE CITATIONS (${data.citations.length})`,
      margin,
      yPos
    );
    yPos += 6;

    // Table Header
    doc.setFillColor(...ADALINE_COLORS.boneSurface);
    doc.rect(margin, yPos - 3.5, contentWidth, 5.5, "F");
    doc.setFont("courier", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...ADALINE_COLORS.olivePress);
    doc.text("ID", margin + 2, yPos);
    doc.text("SOURCE DOCUMENT & SECTION", margin + 12, yPos);
    doc.text("PAGE", margin + contentWidth - 12, yPos);
    yPos += 5.5;

    data.citations.forEach((cite) => {
      yPos = ensurePageSpace(doc, yPos, 12);

      doc.setFont("courier", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(...ADALINE_COLORS.sageLeaf);
      doc.text(`[${cite.index}]`, margin + 2, yPos);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(...ADALINE_COLORS.forestInk);
      doc.text(
        `${cite.document_title} · ${cite.section_title}`,
        margin + 12,
        yPos
      );

      doc.setFont("courier", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...ADALINE_COLORS.sageGray);
      doc.text(`p.${cite.page_number}`, margin + contentWidth - 12, yPos);
      yPos += 3.5;

      const excerptLines = doc.splitTextToSize(
        `"${cite.excerpt.replace(/\n+/g, " ").trim()}"`,
        contentWidth - 14
      );
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...ADALINE_COLORS.sageGray);
      doc.text(excerptLines, margin + 12, yPos);
      yPos += excerptLines.length * 3.0 + 3.5;

      doc.setDrawColor(...ADALINE_COLORS.mistBorder);
      doc.setLineWidth(0.2);
      doc.line(margin, yPos - 1.5, margin + contentWidth, yPos - 1.5);
    });
  }

  // --- 6. Document Pagination Footer ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("courier", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...ADALINE_COLORS.sageGray);
    doc.text(
      `Contexure Industrial AI · Confidential Technical Report · Page ${i} of ${totalPages}`,
      margin,
      287
    );
  }

  return doc;
}

export function downloadTechnicalReportPdf(data: TechnicalReportData): void {
  const doc = generateTechnicalReportPdf(data);
  const safeFilename = `Contexure_Report_${Date.now()}.pdf`;
  doc.save(safeFilename);
}
