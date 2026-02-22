import type { QueryEmbedder } from "../../domain/ports/QueryEmbedder.js";
import { hashToVector } from "../../../../../platform/vector/hashVector.js";

/**
 * Deterministic local query embedder.
 * Uses the same hashToVector function as HashEmbeddingStrategy
 * so that vectors are compatible for cosine similarity.
 */
export class HashQueryEmbedder implements QueryEmbedder {
  constructor(private readonly dimensions: number = 128) {}

  async embed(text: string): Promise<number[]> {
    return hashToVector(text, this.dimensions);
  }
}
