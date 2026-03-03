import jsPDF from "jspdf";

let fontBase64Cache: string | null = null;

async function loadFont(): Promise<string> {
  if (fontBase64Cache) return fontBase64Cache;
  const res = await fetch("/fonts/Roboto-Regular.ttf");
  const buffer = await res.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  fontBase64Cache = btoa(binary);
  return fontBase64Cache;
}

export async function downloadMessageAsPdf(text: string): Promise<void> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const fontData = await loadFont();
  doc.addFileToVFS("Roboto-Regular.ttf", fontData);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.setFont("Roboto");

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const usableWidth = pageWidth - margin * 2;
  const lineHeight = 16;

  // Title with timestamp
  const timestamp = new Date().toLocaleString();
  doc.setFontSize(14);
  doc.text("Inkling \u2014 Assistant Answer", margin, margin + 14);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(timestamp, margin, margin + 30);
  doc.setTextColor(0);

  // Body
  doc.setFontSize(11);
  const lines = doc.splitTextToSize(text, usableWidth) as string[];
  let y = margin + 52;

  for (const line of lines) {
    if (y + lineHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += lineHeight;
  }

  doc.save(`inkling-answer-${Date.now()}.pdf`);
}
