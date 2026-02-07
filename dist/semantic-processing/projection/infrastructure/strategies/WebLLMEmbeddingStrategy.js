/**
 * Browser-side embedding strategy using @mlc-ai/web-llm.
 * Runs a model locally in the browser via WebGPU / WASM.
 *
 * Usage:
 *   const strategy = new WebLLMEmbeddingStrategy("Phi-3-mini-4k-instruct-q4f16_1-MLC");
 *   await strategy.initialize();
 */
export class WebLLMEmbeddingStrategy {
    modelId;
    embeddingDimensions;
    strategyId = "web-llm-embedding";
    version = 1;
    engine = null;
    constructor(modelId = "Phi-3-mini-4k-instruct-q4f16_1-MLC", embeddingDimensions = 768) {
        this.modelId = modelId;
        this.embeddingDimensions = embeddingDimensions;
    }
    async initialize() {
        const webllm = await import("@mlc-ai/web-llm");
        this.engine = await webllm.CreateMLCEngine(this.modelId);
    }
    async embed(content) {
        this.ensureInitialized();
        const response = await this.engine.embeddings.create({
            input: content,
            model: this.modelId,
        });
        const vector = response.data[0].embedding;
        return {
            vector,
            model: this.modelId,
            dimensions: vector.length,
        };
    }
    async embedBatch(contents) {
        this.ensureInitialized();
        const response = await this.engine.embeddings.create({
            input: contents,
            model: this.modelId,
        });
        return response.data.map((item) => ({
            vector: item.embedding,
            model: this.modelId,
            dimensions: item.embedding.length,
        }));
    }
    ensureInitialized() {
        if (!this.engine) {
            throw new Error("WebLLMEmbeddingStrategy not initialized. Call initialize() first.");
        }
    }
}
//# sourceMappingURL=WebLLMEmbeddingStrategy.js.map