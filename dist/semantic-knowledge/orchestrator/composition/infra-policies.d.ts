import type { SemanticUnitInfrastructurePolicy } from "../../semantic-unit/composition/infra-policies.js";
import type { LineageInfrastructurePolicy } from "../../lineage/composition/infra-policies.js";
import type { SemanticUnitUseCases } from "../../semantic-unit/application/index.js";
import type { LineageUseCases } from "../../lineage/application/index.js";
export type SemanticKnowledgeInfraPolicy = "in-memory" | "browser" | "server";
export interface SemanticKnowledgeOrchestratorPolicy {
    type: SemanticKnowledgeInfraPolicy;
    /**
     * Database path for server-side persistence (NeDB).
     * @default "./data"
     */
    dbPath?: string;
    /**
     * Database name for browser-side persistence (IndexedDB).
     * @default "semantic-knowledge"
     */
    dbName?: string;
    /**
     * Override policies for individual modules.
     * If not provided, modules inherit from the orchestrator's type.
     */
    overrides?: {
        semanticUnit?: Partial<SemanticUnitInfrastructurePolicy>;
        lineage?: Partial<LineageInfrastructurePolicy>;
    };
}
export interface ResolvedSemanticKnowledgeModules {
    semanticUnit: SemanticUnitUseCases;
    lineage: LineageUseCases;
}
//# sourceMappingURL=infra-policies.d.ts.map