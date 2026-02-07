import type { QueryEmbedder } from "../../domain/ports/QueryEmbedder.js";
/**
 * Deterministic local query embedder.
 * Uses the same hashToVector function as HashEmbeddingStrategy
 * so that vectors are compatible for cosine similarity.
 */
export declare class HashQueryEmbedder implements QueryEmbedder {
    private readonly dimensions;
    constructor(dimensions?: number);
    embed(text: string): Promise<number[]>;
}
//# sourceMappingURL=HashQueryEmbedder.d.ts.map