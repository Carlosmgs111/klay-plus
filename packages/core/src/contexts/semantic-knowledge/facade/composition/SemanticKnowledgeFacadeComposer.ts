import type {
  SemanticKnowledgeFacadePolicy,
  ResolvedSemanticKnowledgeModules,
} from "./infra-policies.js";
import type { SemanticUnitInfrastructurePolicy } from "../../semantic-unit/composition/infra-policies.js";
import type { LineageInfrastructurePolicy } from "../../lineage/composition/infra-policies.js";
import { resolveConfigProvider } from "../../../../platform/config/resolveConfigProvider.js";

/**
 * Composer for the Semantic Knowledge Facade.
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
export class SemanticKnowledgeFacadeComposer {

  /**
   * Resolves all modules for the Semantic Knowledge context.
   * Uses dynamic imports for tree-shaking and environment-specific loading.
   */
  static async resolve(
    policy: SemanticKnowledgeFacadePolicy,
  ): Promise<ResolvedSemanticKnowledgeModules> {
    // Resolve configuration provider first
    const config = await resolveConfigProvider(policy);

    // Build module-specific policies inheriting from facade defaults
    // ConfigProvider can influence policy values when not explicitly set
    const semanticUnitPolicy: SemanticUnitInfrastructurePolicy = {
      provider: policy.overrides?.semanticUnit?.provider ?? policy.provider,
      dbPath:
        policy.overrides?.semanticUnit?.dbPath ??
        policy.dbPath ??
        config.getOrDefault("KLAY_DB_PATH", "./data"),
      dbName:
        policy.overrides?.semanticUnit?.dbName ??
        policy.dbName ??
        config.getOrDefault("KLAY_DB_NAME", "knowledge-platform"),
    };

    const lineagePolicy: LineageInfrastructurePolicy = {
      provider: policy.overrides?.lineage?.provider ?? policy.provider,
      dbPath:
        policy.overrides?.lineage?.dbPath ??
        policy.dbPath ??
        config.getOrDefault("KLAY_DB_PATH", "./data"),
      dbName:
        policy.overrides?.lineage?.dbName ??
        policy.dbName ??
        config.getOrDefault("KLAY_DB_NAME", "knowledge-platform"),
    };

    // Resolve modules in parallel using their factories (from composition/)
    const [semanticUnitResult, lineageResult] = await Promise.all([
      import("../../semantic-unit/composition/semantic-unit.factory.js").then(
        (m) => m.semanticUnitFactory(semanticUnitPolicy),
      ),
      import("../../lineage/composition/lineage.factory.js").then((m) =>
        m.lineageFactory(lineagePolicy),
      ),
    ]);

    return {
      semanticUnit: semanticUnitResult.useCases,
      lineage: lineageResult.useCases,
      semanticUnitRepository: semanticUnitResult.infra.repository,
      lineageRepository: lineageResult.infra.repository,
    };
  }
}
