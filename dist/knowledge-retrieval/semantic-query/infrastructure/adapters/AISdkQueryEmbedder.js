/**
 * Server-side query embedder using Vercel AI SDK.
 * Must use the same model as AISdkEmbeddingStrategy for vector compatibility.
 *
 * Usage:
 *   import { openai } from "@ai-sdk/openai";
 *   const embedder = new AISdkQueryEmbedder(openai.embedding("text-embedding-3-small"));
 */
export class AISdkQueryEmbedder {
    embeddingModel;
    constructor(embeddingModel) {
        this.embeddingModel = embeddingModel;
    }
    async embed(text) {
        const ai = await import("ai");
        const { embedding } = await ai.embed({
            model: this.embeddingModel,
            value: text,
        });
        return embedding;
    }
}
//# sourceMappingURL=AISdkQueryEmbedder.js.map