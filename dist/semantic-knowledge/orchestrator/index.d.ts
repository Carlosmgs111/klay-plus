import type { SemanticUnitUseCases } from "../semantic-unit/application/index.js";
import type { LineageUseCases } from "../lineage/application/index.js";
export { SemanticKnowledgeOrchestratorComposer } from "./composition/SemanticKnowledgeOrchestratorComposer.js";
export type { SemanticKnowledgeOrchestratorPolicy, SemanticKnowledgeInfraPolicy, ResolvedSemanticKnowledgeModules, } from "./composition/infra-policies.js";
import type { ResolvedSemanticKnowledgeModules } from "./composition/infra-policies.js";
/**
 * Orchestrator for the Semantic Knowledge bounded context.
 *
 * Provides a unified facade to all modules within the context,
 * enabling coordinated operations across semantic units and lineage tracking.
 */
export declare class SemanticKnowledgeOrchestrator {
    private readonly _semanticUnit;
    private readonly _lineage;
    constructor(modules: ResolvedSemanticKnowledgeModules);
    get semanticUnit(): SemanticUnitUseCases;
    get lineage(): LineageUseCases;
    /**
     * Creates a semantic unit and registers its origin transformation in lineage.
     */
    createSemanticUnitWithLineage(params: {
        id: string;
        sourceId: string;
        sourceType: string;
        content: string;
        language: string;
        topics?: string[];
        summary?: string;
        createdBy: string;
        tags?: string[];
        attributes?: Record<string, string>;
    }): Promise<{
        unitId: string;
    }>;
    /**
     * Versions a semantic unit and records the transformation.
     */
    versionSemanticUnitWithLineage(params: {
        unitId: string;
        content: string;
        language: string;
        topics?: string[];
        summary?: string;
        reason: string;
        previousVersion: number;
    }): Promise<{
        unitId: string;
        newVersion: number;
    }>;
    /**
     * Deprecates a semantic unit and records the action in lineage.
     */
    deprecateSemanticUnitWithLineage(params: {
        unitId: string;
        reason: string;
        currentVersion: number;
    }): Promise<void>;
}
import type { SemanticKnowledgeOrchestratorPolicy } from "./composition/infra-policies.js";
export declare function semanticKnowledgeOrchestratorFactory(policy: SemanticKnowledgeOrchestratorPolicy): Promise<SemanticKnowledgeOrchestrator>;
//# sourceMappingURL=index.d.ts.map