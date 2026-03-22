import type { QueryExpander } from "../../domain/ports/QueryExpander";

/**
 * Generates N alternative query formulations using a language model.
 * Each alternative is used as an additional query for multi-vector search.
 *
 * Accepts a LanguageModelV1 from the Vercel AI SDK.
 */
export class MultiQueryExpander implements QueryExpander {
  constructor(
    private readonly model: any,
    private readonly count: number = 3,
  ) {}

  async expand(queryText: string): Promise<string[]> {
    const { generateText } = await import("ai");

    const { text } = await generateText({
      model: this.model,
      prompt: `Generate ${this.count} alternative search queries for the following query. Return only the queries, one per line, with no numbering or extra text.\n\nQuery: ${queryText}`,
    });

    return text
      .split("\n")
      .map((q) => q.trim())
      .filter(Boolean)
      .slice(0, this.count);
  }
}
