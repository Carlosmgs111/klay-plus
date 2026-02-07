import type {
  SourceIngestionOrchestratorPolicy,
  ResolvedSourceIngestionModules,
} from "./infra-policies.js";
import type { SourceInfrastructurePolicy } from "../../source/composition/infra-policies.js";
import type { ExtractionInfrastructurePolicy } from "../../extraction/composition/infra-policies.js";

export class SourceIngestionOrchestratorComposer {
  /**
   * Resolves all modules for the Source Ingestion context.
   * Uses dynamic imports for tree-shaking and environment-specific loading.
   */
  static async resolve(
    policy: SourceIngestionOrchestratorPolicy,
  ): Promise<ResolvedSourceIngestionModules> {
    // Build module-specific policies inheriting from orchestrator defaults
    const sourcePolicy: SourceInfrastructurePolicy = {
      type: policy.overrides?.source?.type ?? policy.type,
      dbPath: policy.overrides?.source?.dbPath ?? policy.dbPath,
      dbName: policy.overrides?.source?.dbName ?? policy.dbName,
    };

    const extractionPolicy: ExtractionInfrastructurePolicy = {
      type: policy.overrides?.extraction?.type ?? policy.type,
      dbPath: policy.overrides?.extraction?.dbPath ?? policy.dbPath,
      dbName: policy.overrides?.extraction?.dbName ?? policy.dbName,
    };

    // Resolve modules in parallel
    const [sourceModule, extractionModule] = await Promise.all([
      import("../../source/index.js").then((m) =>
        m.sourceFactory(sourcePolicy),
      ),
      import("../../extraction/index.js").then((m) =>
        m.extractionFactory(extractionPolicy),
      ),
    ]);

    return {
      source: sourceModule,
      extraction: extractionModule,
    };
  }
}
