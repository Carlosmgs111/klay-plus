import { ChunkerFactory } from "./ChunkerFactory";
import { FixedSizeChunker } from "./FixedSizeChunker";
import { SentenceChunker } from "./SentenceChunker";
import { RecursiveChunker } from "./RecursiveChunker";

// Register default chunking strategies
ChunkerFactory.register("fixed-size", () => new FixedSizeChunker());
ChunkerFactory.register("sentence", () => new SentenceChunker());
ChunkerFactory.register("recursive", () => new RecursiveChunker());

export { BaseChunker } from "./BaseChunker";
export { FixedSizeChunker } from "./FixedSizeChunker";
export { SentenceChunker } from "./SentenceChunker";
export { RecursiveChunker } from "./RecursiveChunker";
export { ChunkerFactory } from "./ChunkerFactory";
export { HashEmbeddingStrategy } from "./HashEmbeddingStrategy";
export { WebLLMEmbeddingStrategy } from "./WebLLMEmbeddingStrategy";
export { AISdkEmbeddingStrategy } from "./AISdkEmbeddingStrategy";
