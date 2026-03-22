import type { QueryExpander } from "../../domain/ports/QueryExpander";

/**
 * Hypothetical Document Embeddings (HyDE) expander.
 * Generates a hypothetical document that would answer the query.
 * This hypothetical document is embedded and used as an additional search vector,
 * which often captures the semantic space of relevant answers better than the query itself.
 *
 * Accepts a LanguageModelV1 from the Vercel AI SDK.
 */
export class HyDEExpander implements QueryExpander {
  constructor(private readonly model: any) {}

  async expand(queryText: string): Promise<string[]> {
    const { generateText } = await import("ai");

    const { text } = await generateText({
      model: this.model,
      prompt: `Write a short passage (2-3 sentences) that would directly answer the following question or query. Write as if you are an expert providing a factual answer.\n\nQuery: ${queryText}`,
    });

    return [text.trim()].filter(Boolean);
  }
}
