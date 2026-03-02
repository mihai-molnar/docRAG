const OLLAMA_BASE = "http://localhost:11434";
export const OLLAMA_EMBED_MODEL = "nomic-embed-text";
const EMBED_BATCH_SIZE = 100;

function sanitizeError(message: string): string {
  return message.replace(/sk-[A-Za-z0-9_-]+/g, "sk-***");
}

export async function checkOllamaStatus(): Promise<{ running: boolean; hasModel: boolean }> {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`);
    if (!res.ok) return { running: false, hasModel: false };
    const data = await res.json();
    const models: Array<{ name: string }> = data.models ?? [];
    const hasModel = models.some((m) => m.name.startsWith(OLLAMA_EMBED_MODEL));
    return { running: true, hasModel };
  } catch {
    return { running: false, hasModel: false };
  }
}

export async function ollamaEmbed(texts: string[]): Promise<number[][]> {
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += EMBED_BATCH_SIZE) {
    const batch = texts.slice(i, i + EMBED_BATCH_SIZE);

    const response = await fetch(`${OLLAMA_BASE}/v1/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: batch, model: OLLAMA_EMBED_MODEL }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Ollama embeddings error: ${response.status} — ${err}`);
    }

    const data = await response.json();
    const sorted = data.data.sort(
      (a: { index: number }, b: { index: number }) => a.index - b.index
    );
    for (const item of sorted) {
      allEmbeddings.push(item.embedding);
    }
  }

  return allEmbeddings;
}

export interface OllamaPullProgress {
  status: string;
  completed?: number;
  total?: number;
}

export async function* pullOllamaModel(): AsyncGenerator<OllamaPullProgress> {
  const response = await fetch(`${OLLAMA_BASE}/api/pull`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: OLLAMA_EMBED_MODEL }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Ollama pull error: ${response.status} — ${err}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        yield JSON.parse(trimmed) as OllamaPullProgress;
      } catch {
        // skip malformed chunks
      }
    }
  }
}

export interface ChatCompletionMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function* streamChatCompletion(
  messages: ChatCompletionMessage[],
  apiKey: string,
  model: string,
  temperature: number
): AsyncGenerator<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      stream: true,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(sanitizeError(`OpenAI chat error: ${response.status} — ${err}`));
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data: ")) continue;
      const data = trimmed.slice(6);
      if (data === "[DONE]") return;

      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) {
          yield content;
        }
      } catch {
        // skip malformed chunks
      }
    }
  }
}
