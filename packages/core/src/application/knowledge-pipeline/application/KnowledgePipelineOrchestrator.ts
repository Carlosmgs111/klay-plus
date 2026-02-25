import type { SourceIngestionFacade } from "../../../contexts/source-ingestion/facade/SourceIngestionFacade.js";
import type { SemanticProcessingFacade } from "../../../contexts/semantic-processing/facade/SemanticProcessingFacade.js";
import type { SemanticKnowledgeFacade } from "../../../contexts/semantic-knowledge/facade/SemanticKnowledgeFacade.js";
import type { KnowledgeRetrievalFacade } from "../../../contexts/knowledge-retrieval/facade/KnowledgeRetrievalFacade.js";
import type { ManifestRepository } from "../contracts/ManifestRepository.js";
import type { KnowledgePipelinePort } from "../contracts/KnowledgePipelinePort.js";
import type {
  ExecutePipelineInput,
  ExecutePipelineSuccess,
  IngestDocumentInput,
  IngestDocumentSuccess,
  ProcessDocumentInput,
  ProcessDocumentSuccess,
  CatalogDocumentInput,
  CatalogDocumentSuccess,
  SearchKnowledgeInput,
  SearchKnowledgeSuccess,
  CreateProcessingProfileInput,
  CreateProcessingProfileSuccess,
  GetManifestInput,
  GetManifestSuccess,
  AddSourceInput,
  AddSourceSuccess,
  RemoveSourceInput,
  RemoveSourceSuccess,
  ReprocessUnitInput,
  ReprocessUnitSuccess,
  RollbackUnitInput,
  RollbackUnitSuccess,
  AddProjectionInput,
  AddProjectionSuccess,
  LinkUnitsInput,
  LinkUnitsSuccess,
} from "../contracts/dtos.js";
import { Result } from "../../../shared/domain/Result.js";
import type { KnowledgePipelineError } from "../domain/KnowledgePipelineError.js";
import { ExecuteFullPipeline } from "./use-cases/ExecuteFullPipeline.js";
import { IngestDocument } from "./use-cases/IngestDocument.js";
import { ProcessDocument } from "./use-cases/ProcessDocument.js";
import { CatalogDocument } from "./use-cases/CatalogDocument.js";
import { SearchKnowledge } from "./use-cases/SearchKnowledge.js";
import { GetManifest } from "./use-cases/GetManifest.js";
import { KnowledgePipelineError as PipelineError } from "../domain/KnowledgePipelineError.js";
import { PipelineStep } from "../domain/PipelineStep.js";
import type { ProjectionType } from "../../../contexts/semantic-processing/projection/domain/ProjectionType.js";

/**
 * Resolved dependencies for the KnowledgePipelineOrchestrator.
 * Created by the Composer — not read from policy.
 */
export interface ResolvedPipelineDependencies {
  ingestion: SourceIngestionFacade;
  processing: SemanticProcessingFacade;
  knowledge: SemanticKnowledgeFacade;
  retrieval: KnowledgeRetrievalFacade;
  manifestRepository: ManifestRepository;
}

/**
 * KnowledgePipelineOrchestrator — Application Boundary.
 *
 * Implements KnowledgePipelinePort as the single public API.
 * Receives 4 facades and a ManifestRepository privately, creates use cases internally.
 *
 * This is NOT a bounded context — it's an application layer that
 * coordinates existing bounded contexts via their facades.
 *
 * Rules:
 * - No facade getters — facades are private implementation details
 * - No policy reading — the Composer handles infrastructure selection
 * - No domain logic — only delegation to use cases
 * - No framework dependencies — pure TypeScript
 */
export class KnowledgePipelineOrchestrator implements KnowledgePipelinePort {
  private readonly _processing: SemanticProcessingFacade;
  private readonly _knowledge: SemanticKnowledgeFacade;
  private readonly _executeFullPipeline: ExecuteFullPipeline;
  private readonly _ingestDocument: IngestDocument;
  private readonly _processDocument: ProcessDocument;
  private readonly _catalogDocument: CatalogDocument;
  private readonly _searchKnowledge: SearchKnowledge;
  private readonly _getManifest: GetManifest;

  constructor(deps: ResolvedPipelineDependencies) {
    this._processing = deps.processing;
    this._knowledge = deps.knowledge;

    // Create use cases with only the facades they need
    this._executeFullPipeline = new ExecuteFullPipeline(
      deps.ingestion,
      deps.processing,
      deps.knowledge,
      deps.manifestRepository,
    );
    this._ingestDocument = new IngestDocument(deps.ingestion);
    this._processDocument = new ProcessDocument(deps.processing);
    this._catalogDocument = new CatalogDocument(deps.knowledge);
    this._searchKnowledge = new SearchKnowledge(deps.retrieval);
    this._getManifest = new GetManifest(deps.manifestRepository);
  }

  // ─── KnowledgePipelinePort Implementation ──────────────────────────────────

  async execute(
    input: ExecutePipelineInput,
  ): Promise<Result<KnowledgePipelineError, ExecutePipelineSuccess>> {
    return this._executeFullPipeline.execute(input);
  }

  async ingestDocument(
    input: IngestDocumentInput,
  ): Promise<Result<KnowledgePipelineError, IngestDocumentSuccess>> {
    return this._ingestDocument.execute(input);
  }

  async processDocument(
    input: ProcessDocumentInput,
  ): Promise<Result<KnowledgePipelineError, ProcessDocumentSuccess>> {
    return this._processDocument.execute(input);
  }

  async catalogDocument(
    input: CatalogDocumentInput,
  ): Promise<Result<KnowledgePipelineError, CatalogDocumentSuccess>> {
    return this._catalogDocument.execute(input);
  }

  async searchKnowledge(
    input: SearchKnowledgeInput,
  ): Promise<Result<KnowledgePipelineError, SearchKnowledgeSuccess>> {
    return this._searchKnowledge.execute(input);
  }

  async createProcessingProfile(
    input: CreateProcessingProfileInput,
  ): Promise<Result<KnowledgePipelineError, CreateProcessingProfileSuccess>> {
    const result = await this._processing.createProcessingProfile({
      id: input.id,
      name: input.name,
      chunkingStrategyId: input.chunkingStrategyId,
      embeddingStrategyId: input.embeddingStrategyId,
      configuration: input.configuration,
    });

    if (result.isFail()) {
      return Result.fail(
        PipelineError.fromStep(
          PipelineStep.Processing,
          result.error,
          [],
        ),
      );
    }

    return Result.ok({
      profileId: result.value.profileId,
      version: result.value.version,
    });
  }

  async getManifest(
    input: GetManifestInput,
  ): Promise<Result<KnowledgePipelineError, GetManifestSuccess>> {
    return this._getManifest.execute(input);
  }

  // ─── New Operations: Source Management, Reprocessing, Rollback ──────────────

  async addSource(
    input: AddSourceInput,
  ): Promise<Result<KnowledgePipelineError, AddSourceSuccess>> {
    const result = await this._knowledge.addSourceToSemanticUnit({
      unitId: input.unitId,
      sourceId: input.sourceId,
      sourceType: input.sourceType,
      resourceId: input.resourceId,
      extractedContent: input.extractedContent,
      contentHash: input.contentHash,
      processingProfileId: input.processingProfileId,
      processingProfileVersion: input.processingProfileVersion,
    });

    if (result.isFail()) {
      return Result.fail(
        PipelineError.fromStep(PipelineStep.Cataloging, result.error, []),
      );
    }

    return Result.ok(result.value);
  }

  async removeSource(
    input: RemoveSourceInput,
  ): Promise<Result<KnowledgePipelineError, RemoveSourceSuccess>> {
    const result = await this._knowledge.removeSourceFromSemanticUnit({
      unitId: input.unitId,
      sourceId: input.sourceId,
    });

    if (result.isFail()) {
      return Result.fail(
        PipelineError.fromStep(PipelineStep.Cataloging, result.error, []),
      );
    }

    return Result.ok(result.value);
  }

  async reprocessUnit(
    input: ReprocessUnitInput,
  ): Promise<Result<KnowledgePipelineError, ReprocessUnitSuccess>> {
    const result = await this._knowledge.reprocessSemanticUnit({
      unitId: input.unitId,
      processingProfileId: input.processingProfileId,
      processingProfileVersion: input.processingProfileVersion,
      reason: input.reason,
    });

    if (result.isFail()) {
      return Result.fail(
        PipelineError.fromStep(PipelineStep.Cataloging, result.error, []),
      );
    }

    return Result.ok(result.value);
  }

  async rollbackUnit(
    input: RollbackUnitInput,
  ): Promise<Result<KnowledgePipelineError, RollbackUnitSuccess>> {
    const result = await this._knowledge.rollbackSemanticUnit({
      unitId: input.unitId,
      targetVersion: input.targetVersion,
    });

    if (result.isFail()) {
      return Result.fail(
        PipelineError.fromStep(PipelineStep.Cataloging, result.error, []),
      );
    }

    return Result.ok(result.value);
  }

  // ─── Projection & Linking ─────────────────────────────────────────────────

  async addProjection(
    input: AddProjectionInput,
  ): Promise<Result<KnowledgePipelineError, AddProjectionSuccess>> {
    const result = await this._processing.processContent({
      projectionId: input.projectionId,
      semanticUnitId: input.semanticUnitId,
      semanticUnitVersion: input.semanticUnitVersion,
      content: input.content,
      type: (input.projectionType ?? "EMBEDDING") as ProjectionType,
      processingProfileId: input.processingProfileId,
    });

    if (result.isFail()) {
      return Result.fail(
        PipelineError.fromStep(PipelineStep.Processing, result.error, []),
      );
    }

    return Result.ok({
      projectionId: result.value.projectionId,
      chunksCount: result.value.chunksCount,
      dimensions: result.value.dimensions,
      model: result.value.model,
    });
  }

  async linkUnits(
    input: LinkUnitsInput,
  ): Promise<Result<KnowledgePipelineError, LinkUnitsSuccess>> {
    const result = await this._knowledge.linkSemanticUnits({
      fromUnitId: input.fromUnitId,
      toUnitId: input.toUnitId,
      relationship: input.relationship,
    });

    if (result.isFail()) {
      return Result.fail(
        PipelineError.fromStep(PipelineStep.Cataloging, result.error, []),
      );
    }

    return Result.ok({
      fromUnitId: input.fromUnitId,
      toUnitId: input.toUnitId,
      relationship: input.relationship,
    });
  }
}
