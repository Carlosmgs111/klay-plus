import type { EmbeddingStrategy, EmbeddingResult } from "../../domain/ports/EmbeddingStrategy.js";
/**
 * Server-side embedding strategy using Vercel AI SDK.
 * Delegates to any provider supported by ai-sdk (OpenAI, Cohere, etc.).
 *
 * Usage:
 *   import { openai } from "@ai-sdk/openai";
 *   const strategy = new AISdkEmbeddingStrategy(openai.embedding("text-embedding-3-small"));
 */
export declare class AISdkEmbeddingStrategy implements EmbeddingStrategy {
    private readonly embeddingModel;
    readonly strategyId: string;
    readonly version = 1;
    constructor(embeddingModel: any, strategyId?: string);
    embed(content: string): Promise<EmbeddingResult>;
    embedBatch(contents: string[]): Promise<EmbeddingResult[]>;
}
//# sourceMappingURL=AISdkEmbeddingStrategy.d.ts.map