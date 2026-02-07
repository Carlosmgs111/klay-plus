import type { QueryEmbedder } from "../../domain/ports/QueryEmbedder.js";
/**
 * Server-side query embedder using Vercel AI SDK.
 * Must use the same model as AISdkEmbeddingStrategy for vector compatibility.
 *
 * Usage:
 *   import { openai } from "@ai-sdk/openai";
 *   const embedder = new AISdkQueryEmbedder(openai.embedding("text-embedding-3-small"));
 */
export declare class AISdkQueryEmbedder implements QueryEmbedder {
    private readonly embeddingModel;
    constructor(embeddingModel: any);
    embed(text: string): Promise<number[]>;
}
//# sourceMappingURL=AISdkQueryEmbedder.d.ts.map