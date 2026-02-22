import type { QueryEmbedder } from "../../domain/ports/QueryEmbedder.js";

/**
 * Server-side query embedder using Vercel AI SDK.
 * Receives a pre-configured embedding model from any supported provider.
 *
 * The model is created by SemanticQueryComposer with API key from ConfigProvider.
 * This embedder is provider-agnostic and delegates to the AI SDK model.
 *
 * Must use the same model/provider as AISdkEmbeddingStrategy for vector compatibility.
 *
 * Supported providers:
 * - OpenAI: openai.embedding("text-embedding-3-small")
 * - Cohere: cohere.textEmbeddingModel("embed-multilingual-v3.0")
 * - HuggingFace: hf.textEmbeddingModel("sentence-transformers/all-MiniLM-L6-v2")
 *
 * @example
 * // Model is created by SemanticQueryComposer
 * const embedder = new AISdkQueryEmbedder(model);
 */
export class AISdkQueryEmbedder implements QueryEmbedder {
  constructor(private readonly embeddingModel: any) {}

  async embed(text: string): Promise<number[]> {
    const result = await this.embeddingModel.doEmbed({
      values: [text],
    });
    return result.embeddings[0];
  }
}
