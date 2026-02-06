import type {
  EmbeddingStrategy,
  EmbeddingResult,
} from "../../domain/ports/EmbeddingStrategy.js";

/**
 * Server-side embedding strategy using Vercel AI SDK.
 * Delegates to any provider supported by ai-sdk (OpenAI, Cohere, etc.).
 *
 * Usage:
 *   import { openai } from "@ai-sdk/openai";
 *   const strategy = new AISdkEmbeddingStrategy(openai.embedding("text-embedding-3-small"));
 */
export class AISdkEmbeddingStrategy implements EmbeddingStrategy {
  readonly strategyId: string;
  readonly version = 1;

  constructor(
    private readonly embeddingModel: any,
    strategyId: string = "ai-sdk-embedding",
  ) {
    this.strategyId = strategyId;
  }

  async embed(content: string): Promise<EmbeddingResult> {
    const ai = await import("ai");
    const { embedding } = await ai.embed({
      model: this.embeddingModel,
      value: content,
    });

    return {
      vector: embedding,
      model: this.strategyId,
      dimensions: embedding.length,
    };
  }

  async embedBatch(contents: string[]): Promise<EmbeddingResult[]> {
    const ai = await import("ai");
    const { embeddings } = await ai.embedMany({
      model: this.embeddingModel,
      values: contents,
    });

    return embeddings.map((vector) => ({
      vector,
      model: this.strategyId,
      dimensions: vector.length,
    }));
  }
}
