import JSZip from "jszip";

export async function parsePptx(bytes: Uint8Array): Promise<string> {
  const zip = await JSZip.loadAsync(bytes);
  const slides: Array<{ index: number; text: string }> = [];

  for (const [path, file] of Object.entries(zip.files)) {
    const match = path.match(/^ppt\/slides\/slide(\d+)\.xml$/);
    if (!match) continue;

    const xml = await file.async("text");
    const text = extractTextFromXml(xml);
    if (text.trim()) {
      slides.push({ index: parseInt(match[1], 10), text });
    }
  }

  slides.sort((a, b) => a.index - b.index);
  return slides.map((s) => s.text).join("\n\n");
}

function extractTextFromXml(xml: string): string {
  const textParts: string[] = [];
  const regex = /<a:t[^>]*>([\s\S]*?)<\/a:t>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    const decoded = match[1]
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
    textParts.push(decoded);
  }
  return textParts.join(" ");
}
