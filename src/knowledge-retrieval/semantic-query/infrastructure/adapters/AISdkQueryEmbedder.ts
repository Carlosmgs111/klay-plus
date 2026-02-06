import type { QueryEmbedder } from "../../domain/ports/QueryEmbedder.js";

/**
 * Server-side query embedder using Vercel AI SDK.
 * Must use the same model as AISdkEmbeddingStrategy for vector compatibility.
 *
 * Usage:
 *   import { openai } from "@ai-sdk/openai";
 *   const embedder = new AISdkQueryEmbedder(openai.embedding("text-embedding-3-small"));
 */
export class AISdkQueryEmbedder implements QueryEmbedder {
  constructor(private readonly embeddingModel: any) {}

  async embed(text: string): Promise<number[]> {
    const ai = await import("ai");
    const { embedding } = await ai.embed({
      model: this.embeddingModel,
      value: text,
    });
    return embedding;
  }
}
