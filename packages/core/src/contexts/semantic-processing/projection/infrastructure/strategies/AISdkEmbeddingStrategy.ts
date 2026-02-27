import type {
  EmbeddingStrategy,
  EmbeddingResult,
} from "../../domain/ports/EmbeddingStrategy";

/**
 * Server-side embedding strategy using Vercel AI SDK.
 * Receives a pre-configured embedding model from any supported provider.
 *
 * The model is created by ProjectionComposer with API key from ConfigProvider.
 * This strategy is provider-agnostic and delegates to the AI SDK model.
 *
 * Supported providers:
 * - OpenAI: openai.embedding("text-embedding-3-small")
 * - Cohere: cohere.textEmbeddingModel("embed-multilingual-v3.0")
 * - HuggingFace: hf.textEmbeddingModel("sentence-transformers/all-MiniLM-L6-v2")
 *
 * @example
 * // Model is created by ProjectionComposer
 * const strategy = new AISdkEmbeddingStrategy(model, "openai-text-embedding-3-small");
 */
export class AISdkEmbeddingStrategy implements EmbeddingStrategy {
  readonly strategyId: string;
  readonly version = 1;

  constructor(
    private readonly embeddingModel: any,
    strategyId: string = "ai-sdk-embedding"
  ) {
    this.strategyId = strategyId;
  }

  async embed(content: string): Promise<EmbeddingResult> {
    const result = await this.embeddingModel.doEmbed({
      values: [content],
    });
    const vector = result.embeddings[0];
    return {
      vector,
      model: this.strategyId,
      dimensions: vector.length,
    };
  }

  async embedBatch(contents: string[]): Promise<EmbeddingResult[]> {
    const result = await this.embeddingModel.doEmbed({
      values: contents,
    });
    return result.embeddings.map((vector: number[]) => ({
      vector,
      model: this.strategyId,
      dimensions: vector.length,
    }));
  }
}
