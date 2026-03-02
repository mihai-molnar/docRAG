import * as pdfjsLib from "pdfjs-dist";
import JSZip from "jszip";
import { scanFolder, readFileBytes } from "./tauriCommands";

async function countPdfPages(bytes: Uint8Array): Promise<number> {
  const doc = await pdfjsLib.getDocument({ data: bytes }).promise;
  const count = doc.numPages;
  doc.destroy();
  return count;
}

async function countPptxSlides(bytes: Uint8Array): Promise<number> {
  const zip = await JSZip.loadAsync(bytes);
  let count = 0;
  for (const path of Object.keys(zip.files)) {
    if (/^ppt\/slides\/slide\d+\.xml$/.test(path)) count++;
  }
  return count;
}

async function countDocxPages(bytes: Uint8Array): Promise<number> {
  try {
    const zip = await JSZip.loadAsync(bytes);
    const appXml = zip.file("docProps/app.xml");
    if (appXml) {
      const xml = await appXml.async("text");
      const match = xml.match(/<Pages>(\d+)<\/Pages>/);
      if (match) return parseInt(match[1], 10);
    }
  } catch {
    // fall through to estimate
  }
  // Rough estimate: ~5 KB per page for docx
  return Math.max(1, Math.round(bytes.length / 5000));
}

export async function countFolderPages(
  folderPath: string
): Promise<{ total: number; exact: boolean }> {
  const files = await scanFolder(folderPath);
  let total = 0;
  let allExact = true;

  for (const file of files) {
    const bytesArray = await readFileBytes(file.path);
    const bytes = new Uint8Array(bytesArray);

    switch (file.extension.toLowerCase()) {
      case "pdf":
        total += await countPdfPages(bytes);
        break;
      case "pptx":
        total += await countPptxSlides(bytes);
        break;
      case "docx":
        total += await countDocxPages(bytes);
        allExact = false;
        break;
    }
  }

  return { total, exact: allExact };
}
