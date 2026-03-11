import type { InfrastructureProfile } from "./InfrastructureProfile";
import type { PersistenceConfig } from "./PersistenceConfig";
import type { VectorStoreConfig } from "./VectorStoreConfig";
import type { EmbeddingConfig } from "./EmbeddingConfig";
import type { DocumentStorageConfig } from "./DocumentStorageConfig";

/**
 * Maps a PersistenceConfig type to the legacy provider registry key
 * used by sub-context factories (ProviderRegistryBuilder).
 *
 * New config types map to old registry keys:
 *   "in-memory" -> "in-memory"
 *   "indexeddb"  -> "browser"
 *   "nedb"       -> "server"
 *   "sqlite"     -> "server"  (fallback)
 *   "postgresql"  -> "server"  (fallback)
 *   "mongodb"    -> "server"  (fallback)
 */
export function persistenceToProvider(config: PersistenceConfig): string {
  switch (config.type) {
    case "in-memory":
      return "in-memory";
    case "indexeddb":
      return "browser";
    case "nedb":
    case "sqlite":
    case "postgresql":
    case "mongodb":
      return "server";
    default:
      return "in-memory";
  }
}

/**
 * Maps a VectorStoreConfig type to the legacy provider registry key.
 */
export function vectorStoreToProvider(config: VectorStoreConfig): string {
  switch (config.type) {
    case "in-memory":
      return "in-memory";
    case "indexeddb":
      return "browser";
    case "nedb":
    case "pgvector":
    case "pinecone":
    case "qdrant":
    case "chromadb":
    case "weaviate":
    case "milvus":
      return "server";
    default:
      return "in-memory";
  }
}

/**
 * Maps a DocumentStorageConfig type to the legacy provider registry key.
 */
export function documentStorageToProvider(config: DocumentStorageConfig): string {
  switch (config.type) {
    case "in-memory":
      return "in-memory";
    case "browser":
      return "browser";
    case "local":
    case "s3":
    case "gcs":
    case "azure-blob":
    case "minio":
      return "server";
    default:
      return "in-memory";
  }
}

/**
 * Extract the embedding dimensions from the profile.
 * Checks EmbeddingConfig first, falls back to VectorStoreConfig dimensions.
 */
export function getEmbeddingDimensions(profile: InfrastructureProfile): number | undefined {
  const embed = profile.embedding as Record<string, unknown>;
  if (typeof embed.dimensions === "number") return embed.dimensions;
  return profile.vectorStore.dimensions;
}

/**
 * Extract the embedding model from the profile's EmbeddingConfig, if present.
 */
export function getEmbeddingModel(profile: InfrastructureProfile): string | undefined {
  const embed = profile.embedding as Record<string, unknown>;
  return typeof embed.model === "string" ? embed.model : undefined;
}
