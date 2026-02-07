import type {
  SemanticKnowledgeOrchestratorPolicy,
  ResolvedSemanticKnowledgeModules,
} from "./infra-policies.js";
import type { SemanticUnitInfrastructurePolicy } from "../../semantic-unit/composition/infra-policies.js";
import type { LineageInfrastructurePolicy } from "../../lineage/composition/infra-policies.js";

export class SemanticKnowledgeOrchestratorComposer {
  /**
   * Resolves all modules for the Semantic Knowledge context.
   * Uses dynamic imports for tree-shaking and environment-specific loading.
   */
  static async resolve(
    policy: SemanticKnowledgeOrchestratorPolicy,
  ): Promise<ResolvedSemanticKnowledgeModules> {
    // Build module-specific policies inheriting from orchestrator defaults
    const semanticUnitPolicy: SemanticUnitInfrastructurePolicy = {
      type: policy.overrides?.semanticUnit?.type ?? policy.type,
      dbPath: policy.overrides?.semanticUnit?.dbPath ?? policy.dbPath,
      dbName: policy.overrides?.semanticUnit?.dbName ?? policy.dbName,
    };

    const lineagePolicy: LineageInfrastructurePolicy = {
      type: policy.overrides?.lineage?.type ?? policy.type,
      dbPath: policy.overrides?.lineage?.dbPath ?? policy.dbPath,
      dbName: policy.overrides?.lineage?.dbName ?? policy.dbName,
    };

    // Dynamically import and instantiate modules in parallel
    const [semanticUnitModule, lineageModule] = await Promise.all([
      import("../../semantic-unit/index.js").then((m) =>
        m.semanticUnitFactory(semanticUnitPolicy),
      ),
      import("../../lineage/index.js").then((m) =>
        m.lineageFactory(lineagePolicy),
      ),
    ]);

    return {
      semanticUnit: semanticUnitModule,
      lineage: lineageModule,
    };
  }
}
