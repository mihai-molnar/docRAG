import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { parsePptx } from "../lib/pptxParser";
import type { ParseResult } from "../types/documents";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();

async function parsePdf(bytes: Uint8Array): Promise<ParseResult> {
  const doc = await pdfjsLib.getDocument({ data: bytes }).promise;
  const pages: Array<{ pageNumber: number; text: string }> = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    if (pageText.trim()) {
      pages.push({ pageNumber: i, text: pageText });
    }
  }

  // Build full text and track page boundaries
  let fullText = "";
  const pageSpans: Array<{ pageNumber: number; startOffset: number }> = [];

  for (const page of pages) {
    pageSpans.push({ pageNumber: page.pageNumber, startOffset: fullText.length });
    fullText += page.text;
    fullText += "\n\n";
  }

  return { text: fullText, pages: pageSpans };
}

async function parseDocx(bytes: Uint8Array): Promise<ParseResult> {
  const result = await mammoth.extractRawText({
    arrayBuffer: bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength
    ),
  });
  return { text: result.value };
}

async function parsePptxWrapper(bytes: Uint8Array): Promise<ParseResult> {
  const text = await parsePptx(bytes);
  return { text };
}

export async function parseDocument(
  bytes: Uint8Array,
  extension: string
): Promise<ParseResult> {
  switch (extension.toLowerCase()) {
    case "pdf":
      return parsePdf(bytes);
    case "docx":
      return parseDocx(bytes);
    case "pptx":
      return parsePptxWrapper(bytes);
    default:
      throw new Error(`Unsupported file format: .${extension}`);
  }
}
