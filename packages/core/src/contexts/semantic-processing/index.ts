/**
 * Semantic Processing Bounded Context
 *
 * Responsible for processing extracted content into semantic projections:
 * - Chunking content into meaningful segments
 * - Generating embeddings for semantic search
 * - Storing vectors for retrieval
 * - Managing processing profiles (versionable, selectable configurations)
 */

export * from "./processing-profile";
export * from "./projection";
