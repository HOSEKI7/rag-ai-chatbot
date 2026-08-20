import { jsPDF } from "jspdf";
import { CitationItem } from "@/types/chat";

export interface TechnicalReportData {
  query: string;
  answerContent: string;
  confidenceScore: number;
  provider?: string;
  citations: CitationItem[];
  timestamp?: number;
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

  // Colors based on Adaline Design System (DESIGN.md)
  const forestInk = [10, 29, 8] as const; // #0a1d08
  const olivePress = [43, 57, 10] as const; // #2b390a
  const sageLeaf = [74, 109, 71] as const; // #4a6d47
  const sageGray = [92, 107, 90] as const; // #5c6b5a
  const mistBorder = [225, 230, 223] as const; // #e1e6df
  const boneSurface = [239, 242, 232] as const; // #eff2e8

  // --- 1. Header & Brand Banner ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...forestInk);
  doc.text("CONTEXURE", margin, yPos);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...sageLeaf);
  doc.text("TECHNICAL VERIFICATION REPORT", margin + 45, yPos - 1);

  yPos += 4;
  doc.setDrawColor(...mistBorder);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, margin + contentWidth, yPos);
  yPos += 8;

  // --- 2. Metadata Banner Box ---
  doc.setFillColor(...boneSurface);
  doc.roundedRect(margin, yPos, contentWidth, 20, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...forestInk);
  doc.text(
    "VERIFICATION STATUS: GROUNDED IN INDUSTRIAL DATASHEETS",
    margin + 4,
    yPos + 6
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...sageGray);
  const dateStr = new Date(data.timestamp || Date.now()).toLocaleString(
    "en-US",
    {
      timeZone: "UTC",
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
  doc.text(`Timestamp: ${dateStr} UTC`, margin + 4, yPos + 11);
  doc.text(
    `Confidence Score: ${(data.confidenceScore * 100).toFixed(1)}% | Provider: ${
      data.provider?.toUpperCase() || "DUAL-LLM PIPELINE"
    }`,
    margin + 4,
    yPos + 16
  );

  yPos += 28;

  // --- 3. Originating Inquiry ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...olivePress);
  doc.text("ORIGINATING INQUIRY", margin, yPos);
  yPos += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...forestInk);
  const queryLines = doc.splitTextToSize(`"${data.query}"`, contentWidth);
  doc.text(queryLines, margin, yPos);
  yPos += queryLines.length * 4.5 + 8;

  // --- 4. Verified Synthesis & Answer ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...olivePress);
  doc.text("VERIFIED TECHNICAL SYNTHESIS", margin, yPos);
  yPos += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...forestInk);

  // Clean Markdown headers/stars for clean PDF output
  const cleanAnswer = data.answerContent
    .replace(/^#+\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1");

  const answerLines = doc.splitTextToSize(cleanAnswer, contentWidth);

  for (const line of answerLines) {
    if (yPos > 260) {
      doc.addPage();
      yPos = 20;
    }
    doc.text(line, margin, yPos);
    yPos += 4;
  }

  yPos += 8;

  // --- 5. Verified Citation Footnotes Table ---
  if (data.citations && data.citations.length > 0) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...olivePress);
    doc.text(
      `VERIFIED SOURCE CITATIONS (${data.citations.length})`,
      margin,
      yPos
    );
    yPos += 6;

    data.citations.forEach((cite) => {
      if (yPos > 265) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...sageLeaf);
      doc.text(
        `[${cite.index}] ${cite.document_title} - Page ${cite.page_number}`,
        margin,
        yPos
      );
      yPos += 3.5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...sageGray);
      const excerptLines = doc.splitTextToSize(
        `Excerpt: "${cite.excerpt.replace(/\n+/g, " ")}"`,
        contentWidth - 6
      );
      doc.text(excerptLines, margin + 4, yPos);
      yPos += excerptLines.length * 3.2 + 4;
    });
  }

  // --- 6. Document Footer ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...sageGray);
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
