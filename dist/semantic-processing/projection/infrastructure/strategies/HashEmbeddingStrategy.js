import { hashToVector } from "../../../../shared/infrastructure/hashVector.js";
/**
 * Deterministic local embedding strategy.
 * Produces reproducible vectors via hashing — no API calls.
 * Useful for testing, development, and offline scenarios.
 */
export class HashEmbeddingStrategy {
    dimensions;
    strategyId = "hash-embedding";
    version = 1;
    constructor(dimensions = 128) {
        this.dimensions = dimensions;
    }
    async embed(content) {
        return {
            vector: hashToVector(content, this.dimensions),
            model: "hash-local",
            dimensions: this.dimensions,
        };
    }
    async embedBatch(contents) {
        return contents.map((content) => ({
            vector: hashToVector(content, this.dimensions),
            model: "hash-local",
            dimensions: this.dimensions,
        }));
    }
}
//# sourceMappingURL=HashEmbeddingStrategy.js.map