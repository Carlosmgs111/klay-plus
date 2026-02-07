import { TransformationType } from "../lineage/domain/Transformation.js";
// ─── Composition ───────────────────────────────────────────────────
export { SemanticKnowledgeOrchestratorComposer } from "./composition/SemanticKnowledgeOrchestratorComposer.js";
// ─── Orchestrator ──────────────────────────────────────────────────
/**
 * Orchestrator for the Semantic Knowledge bounded context.
 *
 * Provides a unified facade to all modules within the context,
 * enabling coordinated operations across semantic units and lineage tracking.
 */
export class SemanticKnowledgeOrchestrator {
    _semanticUnit;
    _lineage;
    constructor(modules) {
        this._semanticUnit = modules.semanticUnit;
        this._lineage = modules.lineage;
    }
    // ─── Module Accessors ─────────────────────────────────────────────────────
    get semanticUnit() {
        return this._semanticUnit;
    }
    get lineage() {
        return this._lineage;
    }
    // ─── Orchestrated Operations ──────────────────────────────────────────────
    /**
     * Creates a semantic unit and registers its origin transformation in lineage.
     */
    async createSemanticUnitWithLineage(params) {
        await this._semanticUnit.createSemanticUnit.execute({
            id: params.id,
            sourceId: params.sourceId,
            sourceType: params.sourceType,
            extractedAt: new Date(),
            content: params.content,
            language: params.language,
            topics: params.topics,
            summary: params.summary,
            createdBy: params.createdBy,
            tags: params.tags,
            attributes: params.attributes,
        });
        await this._lineage.registerTransformation.execute({
            semanticUnitId: params.id,
            transformationType: TransformationType.Extraction,
            strategyUsed: "manual-creation",
            inputVersion: 0,
            outputVersion: 1,
            parameters: {
                sourceId: params.sourceId,
                sourceType: params.sourceType,
                createdAt: new Date().toISOString(),
            },
        });
        return { unitId: params.id };
    }
    /**
     * Versions a semantic unit and records the transformation.
     */
    async versionSemanticUnitWithLineage(params) {
        const newVersion = params.previousVersion + 1;
        await this._semanticUnit.versionSemanticUnit.execute({
            unitId: params.unitId,
            content: params.content,
            language: params.language,
            topics: params.topics,
            summary: params.summary,
            reason: params.reason,
        });
        await this._lineage.registerTransformation.execute({
            semanticUnitId: params.unitId,
            transformationType: TransformationType.Enrichment,
            strategyUsed: "version-update",
            inputVersion: params.previousVersion,
            outputVersion: newVersion,
            parameters: {
                reason: params.reason,
                versionedAt: new Date().toISOString(),
            },
        });
        return { unitId: params.unitId, newVersion };
    }
    /**
     * Deprecates a semantic unit and records the action in lineage.
     */
    async deprecateSemanticUnitWithLineage(params) {
        await this._semanticUnit.deprecateSemanticUnit.execute({
            unitId: params.unitId,
            reason: params.reason,
        });
        await this._lineage.registerTransformation.execute({
            semanticUnitId: params.unitId,
            transformationType: TransformationType.Enrichment,
            strategyUsed: "deprecation",
            inputVersion: params.currentVersion,
            outputVersion: params.currentVersion,
            parameters: {
                reason: params.reason,
                deprecatedAt: new Date().toISOString(),
            },
        });
    }
}
export async function semanticKnowledgeOrchestratorFactory(policy) {
    const { SemanticKnowledgeOrchestratorComposer } = await import("./composition/SemanticKnowledgeOrchestratorComposer.js");
    const modules = await SemanticKnowledgeOrchestratorComposer.resolve(policy);
    return new SemanticKnowledgeOrchestrator(modules);
}
//# sourceMappingURL=index.js.map