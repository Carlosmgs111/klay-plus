import type {
  EmbeddingStrategy,
  EmbeddingResult,
} from "../../domain/ports/EmbeddingStrategy.js";
import { hashToVector } from "../../../../../platform/vector/hashVector.js";

/**
 * Deterministic local embedding strategy.
 * Produces reproducible vectors via hashing — no API calls.
 * Useful for testing, development, and offline scenarios.
 */
export class HashEmbeddingStrategy implements EmbeddingStrategy {
  readonly strategyId = "hash-embedding";
  readonly version = 1;

  constructor(private readonly dimensions: number = 128) {}

  async embed(content: string): Promise<EmbeddingResult> {
    return {
      vector: hashToVector(content, this.dimensions),
      model: "hash-local",
      dimensions: this.dimensions,
    };
  }

  async embedBatch(contents: string[]): Promise<EmbeddingResult[]> {
    return contents.map((content) => ({
      vector: hashToVector(content, this.dimensions),
      model: "hash-local",
      dimensions: this.dimensions,
    }));
  }
}
