import type { EmbeddingStrategy, EmbeddingResult } from "../../domain/ports/EmbeddingStrategy.js";
/**
 * Browser-side embedding strategy using @mlc-ai/web-llm.
 * Runs a model locally in the browser via WebGPU / WASM.
 *
 * Usage:
 *   const strategy = new WebLLMEmbeddingStrategy("Phi-3-mini-4k-instruct-q4f16_1-MLC");
 *   await strategy.initialize();
 */
export declare class WebLLMEmbeddingStrategy implements EmbeddingStrategy {
    private readonly modelId;
    private readonly embeddingDimensions;
    readonly strategyId = "web-llm-embedding";
    readonly version = 1;
    private engine;
    constructor(modelId?: string, embeddingDimensions?: number);
    initialize(): Promise<void>;
    embed(content: string): Promise<EmbeddingResult>;
    embedBatch(contents: string[]): Promise<EmbeddingResult[]>;
    private ensureInitialized;
}
//# sourceMappingURL=WebLLMEmbeddingStrategy.d.ts.map