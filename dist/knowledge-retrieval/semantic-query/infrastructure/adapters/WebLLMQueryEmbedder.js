/**
 * Browser-side query embedder using @mlc-ai/web-llm.
 * Must use the same model as WebLLMEmbeddingStrategy for vector compatibility.
 */
export class WebLLMQueryEmbedder {
    modelId;
    engine = null;
    constructor(modelId = "Phi-3-mini-4k-instruct-q4f16_1-MLC") {
        this.modelId = modelId;
    }
    async initialize() {
        const webllm = await import("@mlc-ai/web-llm");
        this.engine = await webllm.CreateMLCEngine(this.modelId);
    }
    async embed(text) {
        if (!this.engine) {
            throw new Error("WebLLMQueryEmbedder not initialized. Call initialize() first.");
        }
        const response = await this.engine.embeddings.create({
            input: text,
            model: this.modelId,
        });
        return response.data[0].embedding;
    }
}
//# sourceMappingURL=WebLLMQueryEmbedder.js.map