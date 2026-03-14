import type { ConfigStore } from "../../platform/config/ConfigStore";
import type { InfrastructureProfile } from "../../platform/config/InfrastructureProfile";
import type { SecretStore } from "../../platform/secrets/SecretStore";

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

/** @deprecated Use `OrchestratorPolicy` instead. */
export type KnowledgePipelinePolicy = OrchestratorPolicy;

/** @deprecated Use `OrchestratorPolicy` instead. */
export type KnowledgeManagementPolicy = OrchestratorPolicy;

/** @deprecated Use `OrchestratorPolicy` instead. */
export type KnowledgeLifecyclePolicy = OrchestratorPolicy;
