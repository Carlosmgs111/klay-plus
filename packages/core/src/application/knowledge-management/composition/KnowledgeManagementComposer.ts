import type { ResolvedManagementDependencies } from "../application/KnowledgeManagementOrchestrator.js";

// --- Management Policy ---

/**
 * Policy for the Knowledge Management orchestrator.
 *
 * Consumed ONLY by this Composer — the Orchestrator never reads policy.
 * The Composer translates the policy into facade policies for each context.
 */
export interface KnowledgeManagementPolicy {
  /** Infrastructure provider: determines how each context resolves its adapters */
  provider: string;
  /** Database path for server-side persistence (shared across contexts) */
  dbPath?: string;
  /** Database name for browser-side persistence (shared across contexts) */
  dbName?: string;
  /** Embedding dimensions — must be consistent across processing and retrieval */
  embeddingDimensions?: number;
  /** Embedding provider — forwarded to processing */
  embeddingProvider?: string;
  /** Embedding model — forwarded to processing */
  embeddingModel?: string;
  /**
   * Configuration overrides for testing or explicit environment setup.
   * Forwarded to all context facades.
   */
  configOverrides?: Record<string, string>;
}

// --- Composer ---

/**
 * KnowledgeManagementComposer — creates and wires the 3 bounded context facades
 * needed by the management orchestrator (ingestion + knowledge + processing).
 *
 * This is a COMPOSITION component only. It:
 * - Reads the policy
 * - Creates each context facade via their factory functions
 * - Returns resolved dependencies for the Orchestrator
 *
 * It does NOT contain business logic, domain rules, or application flows.
 */
export class KnowledgeManagementComposer {
  /**
   * Resolves the 3 context facades and returns the wired dependencies.
   *
   * Resolution: source-ingestion + semantic-knowledge + semantic-processing
   * in parallel (no cross-deps).
   */
  static async resolve(
    policy: KnowledgeManagementPolicy,
  ): Promise<ResolvedManagementDependencies> {
    const [
      { createSourceIngestionFacade },
      { createSemanticKnowledgeFacade },
      { createSemanticProcessingFacade },
    ] = await Promise.all([
      import("../../../contexts/source-ingestion/facade/index.js"),
      import("../../../contexts/semantic-knowledge/facade/index.js"),
      import("../../../contexts/semantic-processing/facade/index.js"),
    ]);

    const [ingestion, knowledge, processing] = await Promise.all([
      createSourceIngestionFacade({
        provider: policy.provider,
        dbPath: policy.dbPath,
        dbName: policy.dbName,
        configOverrides: policy.configOverrides,
      }),
      createSemanticKnowledgeFacade({
        provider: policy.provider,
        dbPath: policy.dbPath,
        dbName: policy.dbName,
        configOverrides: policy.configOverrides,
      }),
      createSemanticProcessingFacade({
        provider: policy.provider,
        dbPath: policy.dbPath,
        dbName: policy.dbName,
        embeddingDimensions: policy.embeddingDimensions,
        embeddingProvider: policy.embeddingProvider,
        embeddingModel: policy.embeddingModel,
        configOverrides: policy.configOverrides,
      }),
    ]);

    return { ingestion, knowledge, processing };
  }
}
