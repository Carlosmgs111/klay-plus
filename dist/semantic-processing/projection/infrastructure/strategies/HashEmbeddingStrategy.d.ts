import type { EmbeddingStrategy, EmbeddingResult } from "../../domain/ports/EmbeddingStrategy.js";
/**
 * Deterministic local embedding strategy.
 * Produces reproducible vectors via hashing — no API calls.
 * Useful for testing, development, and offline scenarios.
 */
export declare class HashEmbeddingStrategy implements EmbeddingStrategy {
    private readonly dimensions;
    readonly strategyId = "hash-embedding";
    readonly version = 1;
    constructor(dimensions?: number);
    embed(content: string): Promise<EmbeddingResult>;
    embedBatch(contents: string[]): Promise<EmbeddingResult[]>;
}
//# sourceMappingURL=HashEmbeddingStrategy.d.ts.map