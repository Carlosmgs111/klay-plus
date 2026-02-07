/**
 * Deterministic hash-to-vector function.
 * Produces a normalized unit vector from any string content.
 * Used by both EmbeddingStrategy (indexing) and QueryEmbedder (querying)
 * to guarantee compatible vector spaces.
 *
 * Browser + Node.js compatible. No external dependencies.
 */
export declare function hashToVector(content: string, dimensions: number): number[];
export declare function cosineSimilarity(a: number[], b: number[]): number;
//# sourceMappingURL=hashVector.d.ts.map