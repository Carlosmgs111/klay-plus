import type { ResolvedPipelineDependencies } from "../application/KnowledgePipelineOrchestrator.js";
import type { ManifestRepository } from "../contracts/ManifestRepository.js";

/**
 * Policy for the Knowledge Pipeline.
 *
 * Consumed ONLY by this Composer — the Orchestrator never reads policy.
 * The Composer translates the policy into facade policies for each context.
 */
export interface KnowledgePipelinePolicy {
  /** Infrastructure provider: determines how each context resolves its adapters */
  provider: string;
  /** Database path for server-side persistence (shared across contexts) */
  dbPath?: string;
  /** Database name for browser-side persistence (shared across contexts) */
  dbName?: string;
  /** Embedding dimensions — must be consistent across processing and retrieval */
  embeddingDimensions?: number;
  /** Default chunking strategy for semantic processing */
  defaultChunkingStrategy?: string;
  /** Embedding provider — forwarded to processing and retrieval */
  embeddingProvider?: string;
  /** Embedding model — forwarded to processing and retrieval */
  embeddingModel?: string;
  /**
   * Configuration overrides for testing or explicit environment setup.
   * Forwarded to all context facades.
   */
  configOverrides?: Record<string, string>;
}

/**
 * KnowledgePipelineComposer — creates and wires the 4 bounded context facades.
 *
 * This is a COMPOSITION component only. It:
 * - Reads the policy
 * - Creates each context facade via their factory functions
 * - Handles cross-context wiring (vectorStoreConfig from processing → retrieval)
 * - Creates the ManifestRepository for pipeline tracking
 * - Returns resolved dependencies for the Orchestrator
 *
 * It does NOT contain business logic, domain rules, or application flows.
 */
export class KnowledgePipelineComposer {
  /**
   * Resolves all 4 context facades and returns the wired dependencies.
   *
   * Resolution order:
   * 1. source-ingestion + semantic-knowledge + semantic-processing (parallel — no cross-deps)
   * 2. knowledge-retrieval (consumes vectorStoreConfig from processing)
   * 3. ManifestRepository (based on provider)
   */
  static async resolve(
    policy: KnowledgePipelinePolicy,
  ): Promise<ResolvedPipelineDependencies> {
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
        defaultChunkingStrategy: policy.defaultChunkingStrategy,
        embeddingProvider: policy.embeddingProvider,
        embeddingModel: policy.embeddingModel,
        configOverrides: policy.configOverrides,
      }),
    ]);

    const { createKnowledgeRetrievalFacade } = await import(
      "../../../contexts/knowledge-retrieval/facade/index.js"
    );

    const retrieval = await createKnowledgeRetrievalFacade({
      provider: policy.provider,
      vectorStoreConfig: processing.vectorStoreConfig,
      embeddingDimensions: policy.embeddingDimensions,
      embeddingProvider: policy.embeddingProvider,
      embeddingModel: policy.embeddingModel,
      configOverrides: policy.configOverrides,
    });

    const manifestRepository = await KnowledgePipelineComposer._createManifestRepository(policy);

    return { ingestion, processing, knowledge, retrieval, manifestRepository };
  }

  /**
   * Creates the ManifestRepository based on provider.
   */
  private static async _createManifestRepository(
    policy: KnowledgePipelinePolicy,
  ): Promise<ManifestRepository> {
    if (policy.provider === "in-memory") {
      const { InMemoryManifestRepository } = await import(
        "../infrastructure/InMemoryManifestRepository.js"
      );
      return new InMemoryManifestRepository();
    }

    // server and browser both use NeDB for manifest (lightweight, no IndexedDB needed)
    const { NeDBManifestRepository } = await import(
      "../infrastructure/NeDBManifestRepository.js"
    );
    const filename = policy.dbPath ? `${policy.dbPath}/manifests.db` : undefined;
    return new NeDBManifestRepository(filename);
  }
}
