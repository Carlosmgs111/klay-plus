import type { QueryEmbedder } from "../../domain/ports/QueryEmbedder.js";
/**
 * Browser-side query embedder using @mlc-ai/web-llm.
 * Must use the same model as WebLLMEmbeddingStrategy for vector compatibility.
 */
export declare class WebLLMQueryEmbedder implements QueryEmbedder {
    private readonly modelId;
    private engine;
    constructor(modelId?: string);
    initialize(): Promise<void>;
    embed(text: string): Promise<number[]>;
}
//# sourceMappingURL=WebLLMQueryEmbedder.d.ts.map