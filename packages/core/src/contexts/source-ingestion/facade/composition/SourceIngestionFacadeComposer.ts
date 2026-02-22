import type {
  SourceIngestionFacadePolicy,
  ResolvedSourceIngestionModules,
} from "./infra-policies.js";
import type { SourceInfrastructurePolicy } from "../../source/composition/index.js";
import type { ExtractionInfrastructurePolicy } from "../../extraction/composition/index.js";
import type { ResourceInfrastructurePolicy } from "../../resource/composition/index.js";
import { resolveConfigProvider } from "../../../../platform/config/resolveConfigProvider.js";

/**
 * Composer for the Source Ingestion Facade.
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
export class SourceIngestionFacadeComposer {
  // ─── Main Resolution ────────────────────────────────────────────────────────

  /**
   * Resolves all modules for the Source Ingestion context.
   * Uses dynamic imports for tree-shaking and environment-specific loading.
   */
  static async resolve(
    policy: SourceIngestionFacadePolicy,
  ): Promise<ResolvedSourceIngestionModules> {
    // Resolve configuration provider first
    const config = await resolveConfigProvider(policy);

    // Build module-specific policies inheriting from facade defaults
    // ConfigProvider can influence policy values when not explicitly set
    const sourcePolicy: SourceInfrastructurePolicy = {
      provider: policy.overrides?.source?.provider ?? policy.provider,
      dbPath: policy.overrides?.source?.dbPath ??
              policy.dbPath ??
              config.getOrDefault("KLAY_DB_PATH", "./data"),
      dbName: policy.overrides?.source?.dbName ??
              policy.dbName ??
              config.getOrDefault("KLAY_DB_NAME", "knowledge-platform"),
    };

    const extractionPolicy: ExtractionInfrastructurePolicy = {
      provider: policy.overrides?.extraction?.provider ?? policy.provider,
      dbPath: policy.overrides?.extraction?.dbPath ??
              policy.dbPath ??
              config.getOrDefault("KLAY_DB_PATH", "./data"),
      dbName: policy.overrides?.extraction?.dbName ??
              policy.dbName ??
              config.getOrDefault("KLAY_DB_NAME", "knowledge-platform"),
    };

    const resourcePolicy: ResourceInfrastructurePolicy = {
      provider: policy.overrides?.resource?.provider ?? policy.provider,
      dbPath: policy.overrides?.resource?.dbPath ??
              policy.dbPath ??
              config.getOrDefault("KLAY_DB_PATH", "./data"),
      dbName: policy.overrides?.resource?.dbName ??
              policy.dbName ??
              config.getOrDefault("KLAY_DB_NAME", "knowledge-platform"),
      uploadPath: policy.overrides?.resource?.uploadPath ??
                  policy.uploadPath ??
                  config.getOrDefault("KLAY_UPLOAD_PATH", "./uploads"),
    };

    // Resolve modules in parallel using their factories (from composition/)
    const [sourceResult, extractionResult, resourceResult] = await Promise.all([
      import("../../source/composition/source.factory.js").then((m) =>
        m.sourceFactory(sourcePolicy),
      ),
      import("../../extraction/composition/extraction.factory.js").then((m) =>
        m.extractionFactory(extractionPolicy),
      ),
      import("../../resource/composition/resource.factory.js").then((m) =>
        m.resourceFactory(resourcePolicy),
      ),
    ]);

    return {
      source: sourceResult.useCases,
      extraction: extractionResult.useCases,
      resource: resourceResult.useCases,
      sourceRepository: sourceResult.infra.repository,
      resourceRepository: resourceResult.infra.repository,
    };
  }
}
