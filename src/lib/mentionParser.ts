export interface ActiveMention {
  query: string;
  startIndex: number;
  endIndex: number;
}

export interface ParsedMentions {
  mentionedDocuments: string[];
  cleanContent: string;
}

/**
 * Scans backward from cursor to find an active @mention trigger.
 * Only triggers when @ is preceded by start-of-string, space, or newline.
 * Allows spaces in query (document names can have spaces). Stops at newlines.
 */
export function getActiveMention(
  text: string,
  cursorPos: number
): ActiveMention | null {
  // Search backward from cursor to find @
  const before = text.slice(0, cursorPos);
  // Find the last @ before cursor that isn't part of an email
  for (let i = before.length - 1; i >= 0; i--) {
    const ch = before[i];
    // Stop at newline — mention can't span lines
    if (ch === "\n") return null;
    if (ch === "@") {
      // @ must be at start of string, or preceded by space/newline
      if (i > 0 && before[i - 1] !== " " && before[i - 1] !== "\n") {
        return null;
      }
      const query = before.slice(i + 1);
      return { query, startIndex: i, endIndex: cursorPos };
    }
  }
  return null;
}

/**
 * Filters document names by case-insensitive substring match.
 * Prefix matches sorted first. Max 8 results.
 */
export function filterDocuments(
  query: string,
  documentNames: string[]
): string[] {
  if (!query) return documentNames.slice(0, 8);

  const lower = query.toLowerCase();
  const prefixMatches: string[] = [];
  const substringMatches: string[] = [];

  for (const name of documentNames) {
    const nameLower = name.toLowerCase();
    if (nameLower.startsWith(lower)) {
      prefixMatches.push(name);
    } else if (nameLower.includes(lower)) {
      substringMatches.push(name);
    }
  }

  return [...prefixMatches, ...substringMatches].slice(0, 8);
}

/**
 * Finds all @docName mentions in sent text by matching against known names.
 * Names are sorted longest-first for greedy matching.
 * Returns mentioned documents and clean content with @ prefixes stripped.
 */
export function parseMentions(
  text: string,
  knownDocNames: string[]
): ParsedMentions {
  if (!knownDocNames.length) {
    return { mentionedDocuments: [], cleanContent: text };
  }

  // Sort longest-first so greedy match works correctly
  const sorted = [...knownDocNames].sort((a, b) => b.length - a.length);
  const mentioned: Set<string> = new Set();
  let cleanContent = text;

  for (const name of sorted) {
    // Match @name that is preceded by start-of-string, space, or newline
    // and followed by end-of-string, space, newline, comma, or period
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(?<=^|\\s)@${escaped}(?=\\s|$|[,.]|)`, "gi");

    if (regex.test(cleanContent)) {
      mentioned.add(name);
      // Strip the @ prefix from mentions in clean content
      cleanContent = cleanContent.replace(regex, name);
    }
  }

  return {
    mentionedDocuments: Array.from(mentioned),
    cleanContent: cleanContent.trim(),
  };
}
