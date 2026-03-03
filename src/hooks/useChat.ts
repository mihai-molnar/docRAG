import { useCallback } from "react";
import { useAppStore } from "../store/appStore";
import { vectorStore } from "../services/vectorStore";
import { ollamaEmbed, streamChatCompletion } from "../services/openaiClient";
import { parseMentions } from "../lib/mentionParser";
import { checkAndIncrementPrompt } from "../services/promptLimit";
import { saveActiveConversation } from "./useConversations";
import type { ChatMessage, ChatSource } from "../types/chat";
import type { SearchResult } from "../types/vectorStore";

const SYSTEM_PROMPT = `You are a helpful assistant that answers questions based ONLY on the provided document excerpts.

Rules:
- Only use information from the provided excerpts to answer
- Combine and synthesize information from multiple excerpts to build a comprehensive answer — character names, themes, events, and facts may be spread across many excerpts
- You may generate derivative content (quizzes, summaries, flashcards, study guides, comparisons, etc.) as long as it is based on the provided excerpts
- When referencing information, naturally mention the document name in your answer (e.g. "According to report.pdf..." or "The budget spreadsheet shows...")
- Only say "I don't have enough information in the provided documents to answer this question." if the excerpts are truly unrelated to the question
- Answer in the same language the user uses
- Be concise and accurate
- Do not make up information not present in the excerpts`;

function buildContextPrompt(sources: ChatSource[]): string {
  const excerpts = sources
    .map((s, i) => {
      const location = s.pageNumber
        ? `${s.documentName}, page ${s.pageNumber}`
        : s.documentName;
      return `[Excerpt ${i + 1}] (${location}):\n${s.chunkContent}`;
    })
    .join("\n\n---\n\n");

  return `Here are relevant excerpts from the user's documents:\n\n${excerpts}`;
}

export function useChat() {
  const settings = useAppStore((s) => s.settings);
  const messages = useAppStore((s) => s.messages);
  const addMessage = useAppStore((s) => s.addMessage);
  const updateLastAssistantMessage = useAppStore(
    (s) => s.updateLastAssistantMessage
  );
  const streaming = useAppStore((s) => s.streaming);
  const setStreaming = useAppStore((s) => s.setStreaming);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!settings.apiKey || streaming) return;

      // Check prompt limit before proceeding
      try {
        const promptCheck = await checkAndIncrementPrompt();
        if (!promptCheck.allowed) {
          const userMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: "user",
            content,
            timestamp: Date.now(),
          };
          addMessage(userMsg);
          addMessage({
            id: crypto.randomUUID(),
            role: "assistant",
            content:
              "You've used all 5 free prompts. Upgrade to a paid plan for unlimited access.",
            timestamp: Date.now(),
          });
          await saveActiveConversation();
          return;
        }
      } catch (err) {
        addMessage({
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Error: ${err instanceof Error ? err.message : "Failed to check prompt limit"}`,
          timestamp: Date.now(),
        });
        return;
      }

      // Parse @mentions from the message
      const index = useAppStore.getState().index;
      const knownDocNames = index ? index.files.map((f) => f.name) : [];
      const { mentionedDocuments, cleanContent } = parseMentions(
        content,
        knownDocNames
      );

      // For follow-up queries without @mentions, carry forward mentions
      // from recent conversation so "what are the main characters?" still
      // targets the previously-mentioned document.
      let effectiveMentions = mentionedDocuments;
      if (effectiveMentions.length === 0 && messages.length > 0) {
        for (let i = messages.length - 1; i >= 0; i--) {
          if (messages[i].role === "user") {
            const prev = parseMentions(messages[i].content, knownDocNames);
            if (prev.mentionedDocuments.length > 0) {
              effectiveMentions = prev.mentionedDocuments;
              break;
            }
          }
        }
      }

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: Date.now(),
      };
      addMessage(userMessage);

      setStreaming(true);

      try {
        // Embed the clean content (@ stripped) and search
        const [queryEmbedding] = await ollamaEmbed([cleanContent], "search_query");

        let results: SearchResult[];

        if (effectiveMentions.length > 0) {
          // Semantic search + context expansion: find the best matches
          // then include ±1 neighboring chunks for surrounding context.
          // This compensates for small chunk sizes by grouping related content.
          const semantic = vectorStore.searchFiltered(
            queryEmbedding,
            20,
            effectiveMentions
          );
          const expanded = vectorStore.expandWithNeighbors(semantic, 1);

          // Add spread samples for broad coverage (fewer than before to reduce noise)
          const spread = vectorStore.spreadSample(effectiveMentions, 15);

          const seen = new Set<string>(expanded.map((r) => r.entry.id));
          const spreadResults: SearchResult[] = [];
          for (const entry of spread) {
            if (!seen.has(entry.id)) {
              seen.add(entry.id);
              spreadResults.push({ entry, score: 0 });
            }
          }

          // Semantic results first (by score desc) for relevance,
          // then spread samples (by position) for breadth
          expanded.sort((a, b) => b.score - a.score);
          spreadResults.sort(
            (a, b) => a.entry.chunkIndex - b.entry.chunkIndex
          );
          results = [...expanded, ...spreadResults];
        } else {
          results = vectorStore.search(queryEmbedding, settings.topK);
        }

        const allChunks: ChatSource[] = results.map((r) => ({
          documentName: r.entry.documentName,
          documentPath: r.entry.documentPath,
          chunkContent: r.entry.content,
          score: r.score,
          pageNumber: r.entry.pageNumber,
        }));

        // All chunks go to the LLM for maximum context
        const contextPrompt = buildContextPrompt(allChunks);

        // Filter displayed sources: for @mentioned docs keep all,
        // for general queries filter out low-similarity noise
        const MIN_SCORE = 0.3;
        const sources =
          effectiveMentions.length > 0
            ? allChunks
            : allChunks.filter((s) => s.score >= MIN_SCORE);
        const apiMessages = [
          { role: "system" as const, content: SYSTEM_PROMPT },
          { role: "system" as const, content: contextPrompt },
          ...messages.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
          { role: "user" as const, content },
        ];

        // Add placeholder assistant message (no sources yet)
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "",
          timestamp: Date.now(),
        };
        addMessage(assistantMessage);

        // Stream the response
        let fullContent = "";
        for await (const chunk of streamChatCompletion(
          apiMessages,
          settings.apiKey,
          settings.chatModel,
          settings.temperature
        )) {
          fullContent += chunk;
          updateLastAssistantMessage(fullContent);
        }

        // Attach sources after streaming — skip if the model couldn't answer
        const lower = fullContent.toLowerCase();
        const noAnswer =
          lower.includes("don't have enough information") ||
          lower.includes("do not have enough information") ||
          lower.includes("not found in the provided") ||
          lower.includes("no information in the provided") ||
          lower.includes("not mentioned in the provided");

        if (!noAnswer) {
          // Only show sources for documents the LLM actually referenced.
          // Use fuzzy matching: check if any significant word (>3 chars) from
          // the filename appears in the response text.
          const responseLower = fullContent.toLowerCase();
          const docReferencedInResponse = (name: string): boolean => {
            const words = name
              .replace(/\.[^.]+$/, "") // strip extension
              .toLowerCase()
              .split(/[\s.\-_]+/)
              .filter((w) => w.length > 3);
            return words.some((w) => responseLower.includes(w));
          };
          const relevantSources = sources.filter((s) =>
            docReferencedInResponse(s.documentName)
          );
          const finalSources =
            relevantSources.length > 0 ? relevantSources : sources;

          const msgs = useAppStore.getState().messages;
          const updated = [...msgs];
          for (let i = updated.length - 1; i >= 0; i--) {
            if (updated[i].role === "assistant") {
              updated[i] = { ...updated[i], sources: finalSources };
              break;
            }
          }
          useAppStore.setState({ messages: updated });
        }
      } catch (err) {
        const errorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Error: ${err instanceof Error ? err.message : "Unknown error occurred"}`,
          timestamp: Date.now(),
        };
        addMessage(errorMessage);
      } finally {
        setStreaming(false);
        await saveActiveConversation();
      }
    },
    [
      settings,
      messages,
      streaming,
      addMessage,
      updateLastAssistantMessage,
      setStreaming,
    ]
  );

  const newConversation = useCallback(() => {
    useAppStore.setState({ messages: [], activeConversationId: null });
  }, []);

  return { messages, sendMessage, streaming, newConversation };
}
