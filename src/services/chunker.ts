import type { TextChunk, PageSpan } from "../types/documents";

const SEPARATORS = ["\n\n", "\n", ". ", " "];

interface RawChunk {
  content: string;
  startOffset: number;
}

function splitText(
  text: string,
  chunkSize: number,
  chunkOverlap: number
): RawChunk[] {
  if (text.length <= chunkSize) {
    return [{ content: text, startOffset: 0 }];
  }

  const chunks: RawChunk[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;

    if (end < text.length) {
      let bestSplit = -1;
      for (const sep of SEPARATORS) {
        const searchStart = start + Math.floor(chunkSize * 0.5);
        const searchRegion = text.slice(searchStart, end);
        const lastIndex = searchRegion.lastIndexOf(sep);
        if (lastIndex !== -1) {
          bestSplit = searchStart + lastIndex + sep.length;
          break;
        }
      }
      if (bestSplit > start) {
        end = bestSplit;
      }
    } else {
      end = text.length;
    }

    const content = text.slice(start, end).trim();
    if (content) {
      chunks.push({ content, startOffset: start });
    }

    start = end - chunkOverlap;
    if (start >= text.length) break;
    if (end === text.length) break;
  }

  return chunks;
}

function resolvePageNumber(
  offset: number,
  pages?: PageSpan[]
): number | undefined {
  if (!pages || pages.length === 0) return undefined;

  for (let i = pages.length - 1; i >= 0; i--) {
    if (offset >= pages[i].startOffset) {
      return pages[i].pageNumber;
    }
  }
  return pages[0].pageNumber;
}

export function chunkDocument(
  text: string,
  documentPath: string,
  documentName: string,
  chunkSize: number,
  chunkOverlap: number,
  pages?: PageSpan[]
): TextChunk[] {
  const pieces = splitText(text, chunkSize, chunkOverlap);

  return pieces.map((piece, index) => ({
    id: `${documentPath}::${index}`,
    documentPath,
    documentName,
    content: piece.content,
    chunkIndex: index,
    pageNumber: resolvePageNumber(piece.startOffset, pages),
  }));
}
