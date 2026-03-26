import type { ConfigStore } from "./ConfigStore";
import type { InfrastructureProfile } from "./InfrastructureProfile";
import type { SecretStore } from "./secrets/SecretStore";

/**
 * Shared policy type for all orchestrator factories.
 *
 * Superset of fields used by KnowledgePipeline, KnowledgeManagement,
 * and KnowledgeLifecycle factories. Each factory only reads the fields
 * it needs — the rest are silently ignored.
 */
export interface OrchestratorPolicy {
  provider: string;
  dbPath?: string;
  dbName?: string;
  embeddingDimensions?: number;
  defaultChunkingStrategy?: string;
  embeddingProvider?: string;
  embeddingModel?: string;
  configOverrides?: Record<string, string>;
  configStore?: ConfigStore;
  secretStore?: SecretStore;
  infrastructure?: Partial<InfrastructureProfile>;
}

