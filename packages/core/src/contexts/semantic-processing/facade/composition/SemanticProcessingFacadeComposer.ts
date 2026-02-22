import type {
  SemanticProcessingFacadePolicy,
  ResolvedSemanticProcessingModules,
  VectorStoreConfig,
} from "./infra-policies.js";
import type { ProjectionInfrastructurePolicy } from "../../projection/composition/index.js";
import type { ProcessingProfileInfrastructurePolicy } from "../../processing-profile/composition/index.js";
import { resolveConfigProvider } from "../../../../platform/config/resolveConfigProvider.js";

/**
 * Composer for the Semantic Processing Facade.
 *
 * This is a COMPOSITION component - it only:
 * - Selects infrastructure implementations based on policy
 * - Resolves configuration based on environment
 * - Instantiates modules via their factories
 * - Wires dependencies for the facade
 *
 * It does NOT contain:
 * - Business logic
 * - Domain rules
 * - Application flows
 */
export class SemanticProcessingFacadeComposer {
  // ─── Main Resolution ──────────────────────────────────────────────────────

  /**
   * Resolves all modules for the Semantic Processing context.
   * Uses dynamic imports for tree-shaking and environment-specific loading.
   *
   * ProcessingProfile is resolved first because its repository is needed
   * for cross-module wiring with Projection (GenerateProjection looks up
   * profiles at runtime via profileRepository).
   */
  static async resolve(
    policy: SemanticProcessingFacadePolicy
  ): Promise<ResolvedSemanticProcessingModules> {
    // Resolve configuration provider first
    const config = await resolveConfigProvider(policy);

    // Resolve dbPath and dbName from config
    const resolvedDbPath =
      policy.dbPath ?? config.getOrDefault("KLAY_DB_PATH", "./data");
    const resolvedDbName =
      policy.dbName ?? config.getOrDefault("KLAY_DB_NAME", "semantic-processing");

    // ─── Build ProcessingProfile policy ─────────────────────────────────────
    const profilePolicy: ProcessingProfileInfrastructurePolicy = {
      provider: policy.overrides?.processingProfile?.provider ?? policy.provider,
      dbPath:
        policy.overrides?.processingProfile?.dbPath ?? resolvedDbPath,
      dbName:
        policy.overrides?.processingProfile?.dbName ?? resolvedDbName,
    };

    // ─── Resolve ProcessingProfile first (needed by Projection) ─────────────
    const processingProfileResult = await import(
      "../../processing-profile/composition/processing-profile.factory.js"
    ).then((m) => m.processingProfileFactory(profilePolicy));

    // ─── Build Projection policy ────────────────────────────────────────────
    const projectionPolicy: ProjectionInfrastructurePolicy = {
      provider: policy.overrides?.projection?.provider ?? policy.provider,
      dbPath:
        policy.overrides?.projection?.dbPath ?? resolvedDbPath,
      dbName:
        policy.overrides?.projection?.dbName ?? resolvedDbName,
      embeddingDimensions:
        policy.overrides?.projection?.embeddingDimensions ??
        policy.embeddingDimensions,

      // ─── Embedding Provider Configuration ─────────────────────────────────────
      embeddingProvider:
        policy.overrides?.projection?.embeddingProvider ??
        policy.embeddingProvider,
      embeddingModel:
        policy.overrides?.projection?.embeddingModel ??
        policy.embeddingModel,

      // ─── Environment Configuration ─────────────────────────────────────────────
      configOverrides: policy.configOverrides,
    };

    // ─── Resolve Projection (with profileRepository wiring) ─────────────────
    const projectionResult = await import(
      "../../projection/composition/projection.factory.js"
    ).then((m) =>
      m.projectionFactory(projectionPolicy, processingProfileResult.repository)
    );

    // ─── Build vectorStoreConfig for cross-context wiring ───────────────────
    const vectorStoreConfig: VectorStoreConfig = {
      dbPath: projectionPolicy.dbPath
        ? `${projectionPolicy.dbPath}/vector-entries.db`
        : undefined,
      dbName: projectionPolicy.dbName,
    };

    // For in-memory, expose the sharedEntries Map from the write store
    if (policy.provider === "in-memory") {
      const writeStore = projectionResult.infra.vectorWriteStore as any;
      if (writeStore.sharedEntries) {
        vectorStoreConfig.sharedEntries = writeStore.sharedEntries;
      }
    }

    return {
      projection: projectionResult.useCases,
      processingProfile: processingProfileResult.useCases,
      profileRepository: processingProfileResult.repository,
      vectorStoreConfig,
    };
  }
}
