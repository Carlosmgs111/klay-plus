import { hashToVector } from "../../../../shared/infrastructure/hashVector.js";
/**
 * Deterministic local query embedder.
 * Uses the same hashToVector function as HashEmbeddingStrategy
 * so that vectors are compatible for cosine similarity.
 */
export class HashQueryEmbedder {
    dimensions;
    constructor(dimensions = 128) {
        this.dimensions = dimensions;
    }
    async embed(text) {
        return hashToVector(text, this.dimensions);
    }
}
//# sourceMappingURL=HashQueryEmbedder.js.map