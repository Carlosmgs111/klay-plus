import { ChunkerFactory } from "./ChunkerFactory.js";
import { FixedSizeChunker } from "./FixedSizeChunker.js";
import { SentenceChunker } from "./SentenceChunker.js";
import { RecursiveChunker } from "./RecursiveChunker.js";

// Register default chunking strategies
ChunkerFactory.register("fixed-size", () => new FixedSizeChunker());
ChunkerFactory.register("sentence", () => new SentenceChunker());
ChunkerFactory.register("recursive", () => new RecursiveChunker());

export { BaseChunker } from "./BaseChunker.js";
export { FixedSizeChunker } from "./FixedSizeChunker.js";
export { SentenceChunker } from "./SentenceChunker.js";
export { RecursiveChunker } from "./RecursiveChunker.js";
export { ChunkerFactory } from "./ChunkerFactory.js";
export { HashEmbeddingStrategy } from "./HashEmbeddingStrategy.js";
export { WebLLMEmbeddingStrategy } from "./WebLLMEmbeddingStrategy.js";
export { AISdkEmbeddingStrategy } from "./AISdkEmbeddingStrategy.js";
