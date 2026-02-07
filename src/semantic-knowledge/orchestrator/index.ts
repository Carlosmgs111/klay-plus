import type { SemanticUnitUseCases } from "../semantic-unit/application/index.js";
import type { LineageUseCases } from "../lineage/application/index.js";
import { TransformationType } from "../lineage/domain/Transformation.js";

// ─── Composition ───────────────────────────────────────────────────
export { SemanticKnowledgeOrchestratorComposer } from "./composition/SemanticKnowledgeOrchestratorComposer.js";
export type {
  SemanticKnowledgeOrchestratorPolicy,
  SemanticKnowledgeInfraPolicy,
  ResolvedSemanticKnowledgeModules,
} from "./composition/infra-policies.js";

import type { ResolvedSemanticKnowledgeModules } from "./composition/infra-policies.js";

// ─── Orchestrator ──────────────────────────────────────────────────

/**
 * Orchestrator for the Semantic Knowledge bounded context.
 *
 * Provides a unified facade to all modules within the context,
 * enabling coordinated operations across semantic units and lineage tracking.
 */
export class SemanticKnowledgeOrchestrator {
  private readonly _semanticUnit: SemanticUnitUseCases;
  private readonly _lineage: LineageUseCases;

  constructor(modules: ResolvedSemanticKnowledgeModules) {
    this._semanticUnit = modules.semanticUnit;
    this._lineage = modules.lineage;
  }

  // ─── Module Accessors ─────────────────────────────────────────────────────

  get semanticUnit(): SemanticUnitUseCases {
    return this._semanticUnit;
  }

  get lineage(): LineageUseCases {
    return this._lineage;
  }

  // ─── Orchestrated Operations ──────────────────────────────────────────────

  /**
   * Creates a semantic unit and registers its origin transformation in lineage.
   */
  async createSemanticUnitWithLineage(params: {
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
  }): Promise<{ unitId: string }> {
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
  async versionSemanticUnitWithLineage(params: {
    unitId: string;
    content: string;
    language: string;
    topics?: string[];
    summary?: string;
    reason: string;
    previousVersion: number;
  }): Promise<{ unitId: string; newVersion: number }> {
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
  async deprecateSemanticUnitWithLineage(params: {
    unitId: string;
    reason: string;
    currentVersion: number;
  }): Promise<void> {
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

// ─── Orchestrator Factory ──────────────────────────────────────────
import type { SemanticKnowledgeOrchestratorPolicy } from "./composition/infra-policies.js";

export async function semanticKnowledgeOrchestratorFactory(
  policy: SemanticKnowledgeOrchestratorPolicy,
): Promise<SemanticKnowledgeOrchestrator> {
  const { SemanticKnowledgeOrchestratorComposer } = await import(
    "./composition/SemanticKnowledgeOrchestratorComposer.js"
  );
  const modules = await SemanticKnowledgeOrchestratorComposer.resolve(policy);
  return new SemanticKnowledgeOrchestrator(modules);
}
