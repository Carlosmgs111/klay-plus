/**
 * Server-side embedding strategy using Vercel AI SDK.
 * Delegates to any provider supported by ai-sdk (OpenAI, Cohere, etc.).
 *
 * Usage:
 *   import { openai } from "@ai-sdk/openai";
 *   const strategy = new AISdkEmbeddingStrategy(openai.embedding("text-embedding-3-small"));
 */
export class AISdkEmbeddingStrategy {
    embeddingModel;
    strategyId;
    version = 1;
    constructor(embeddingModel, strategyId = "ai-sdk-embedding") {
        this.embeddingModel = embeddingModel;
        this.strategyId = strategyId;
    }
    async embed(content) {
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
    async embedBatch(contents) {
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
//# sourceMappingURL=AISdkEmbeddingStrategy.js.map