/**
 * Deterministic hash-to-vector function.
 * Produces a normalized unit vector from any string content.
 * Used by both EmbeddingStrategy (indexing) and QueryEmbedder (querying)
 * to guarantee compatible vector spaces.
 *
 * Browser + Node.js compatible. No external dependencies.
 */
export function hashToVector(content, dimensions) {
    const vector = new Array(dimensions).fill(0);
    for (let i = 0; i < content.length; i++) {
        const charCode = content.charCodeAt(i);
        const idx = i % dimensions;
        vector[idx] = vector[idx] + Math.sin(charCode * (i + 1)) * 0.5;
    }
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    if (magnitude > 0) {
        for (let i = 0; i < vector.length; i++) {
            vector[i] = vector[i] / magnitude;
        }
    }
    return vector;
}
export function cosineSimilarity(a, b) {
    if (a.length !== b.length)
        return 0;
    let dot = 0;
    let magA = 0;
    let magB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        magA += a[i] * a[i];
        magB += b[i] * b[i];
    }
    const denominator = Math.sqrt(magA) * Math.sqrt(magB);
    return denominator === 0 ? 0 : dot / denominator;
}
//# sourceMappingURL=hashVector.js.map