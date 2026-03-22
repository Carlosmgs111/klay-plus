import type { QueryEmbedder } from "../../domain/ports/QueryEmbedder";

/**
 * Server-side query embedder using Vercel AI SDK.
 * Receives a pre-configured embedding model from any supported provider.
 *
 * Must use the same model/provider as AISdkEmbeddingStrategy for vector compatibility.
 *
 * Supported providers:
 * - OpenAI: openai.embedding("text-embedding-3-small")
 * - Cohere: cohere.textEmbeddingModel("embed-multilingual-v3.0")
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
