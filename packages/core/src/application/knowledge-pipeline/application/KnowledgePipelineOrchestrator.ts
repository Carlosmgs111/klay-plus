import type { SourceIngestionService } from "../../../contexts/source-ingestion/service/SourceIngestionService";
import type { SemanticProcessingService } from "../../../contexts/semantic-processing/service/SemanticProcessingService";
import type { ContextManagementService } from "../../../contexts/context-management/service/ContextManagementService";
import type { KnowledgeRetrievalService } from "../../../contexts/knowledge-retrieval/service/KnowledgeRetrievalService";
import type { ManifestRepository } from "../contracts/ManifestRepository";
import type { KnowledgePipelinePort } from "../contracts/KnowledgePipelinePort";
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
  ListProfilesResult,
  UpdateProfileInput,
  UpdateProfileResult,
  DeprecateProfileInput,
  DeprecateProfileResult,
  GetManifestInput,
  GetManifestSuccess,
  IngestAndAddSourceInput,
  IngestAndAddSourceSuccess,
} from "../contracts/dtos";
import type { SourceType } from "../../../contexts/source-ingestion/source/domain/SourceType";
import type { ProjectionType } from "../../../contexts/semantic-processing/projection/domain/ProjectionType";
import { Result } from "../../../shared/domain/Result";
import type { KnowledgePipelineError } from "../domain/KnowledgePipelineError";
import { KnowledgePipelineError as PipelineError } from "../domain/KnowledgePipelineError";
import { PipelineStep } from "../domain/PipelineStep";
import { ExecuteFullPipeline } from "./use-cases/ExecuteFullPipeline";

const DEFAULT_PROJECTION_TYPE = "EMBEDDING";

export interface ResolvedPipelineDependencies {
  ingestion: SourceIngestionService;
  processing: SemanticProcessingService;
  contextManagement: ContextManagementService;
  retrieval: KnowledgeRetrievalService;
  manifestRepository: ManifestRepository;
}

export class KnowledgePipelineOrchestrator implements KnowledgePipelinePort {
  private readonly _ingestion: SourceIngestionService;
  private readonly _processing: SemanticProcessingService;
  private readonly _contextManagement: ContextManagementService;
  private readonly _retrieval: KnowledgeRetrievalService;
  private readonly _manifestRepository: ManifestRepository;
  private readonly _executeFullPipeline: ExecuteFullPipeline;

  constructor(deps: ResolvedPipelineDependencies) {
    this._ingestion = deps.ingestion;
    this._processing = deps.processing;
    this._contextManagement = deps.contextManagement;
    this._retrieval = deps.retrieval;
    this._manifestRepository = deps.manifestRepository;

    this._executeFullPipeline = new ExecuteFullPipeline(
      deps.ingestion,
      deps.processing,
      deps.contextManagement,
      deps.manifestRepository,
    );
  }

  async execute(
    input: ExecutePipelineInput,
  ): Promise<Result<KnowledgePipelineError, ExecutePipelineSuccess>> {
    return this._executeFullPipeline.execute(input);
  }

  async ingestAndAddSource(
    input: IngestAndAddSourceInput,
  ): Promise<Result<KnowledgePipelineError, IngestAndAddSourceSuccess>> {
    const completedSteps: PipelineStep[] = [];
    const sourceKnowledgeId = `sk-${input.sourceId}`;

    // Verify context exists
    const context = await this._contextManagement.getContext(input.contextId);
    if (!context) {
      return Result.fail(
        PipelineError.fromStep(
          PipelineStep.Cataloging,
          { message: `Context ${input.contextId} not found`, code: "CONTEXT_NOT_FOUND" },
          completedSteps,
        ),
      );
    }

    // Step 1: Ingest source
    const ingestionResult = await this._ingestion.ingestAndExtract({
      sourceId: input.sourceId,
      sourceName: input.sourceName,
      uri: input.uri,
      type: input.sourceType as SourceType,
      extractionJobId: input.extractionJobId,
      content: input.content,
    });

    if (ingestionResult.isFail()) {
      return Result.fail(
        PipelineError.fromStep(PipelineStep.Ingestion, ingestionResult.error, completedSteps),
      );
    }

    completedSteps.push(PipelineStep.Ingestion);

    // Step 2: Process content
    const processingResult = await this._processing.processContent({
      projectionId: input.projectionId,
      sourceId: input.sourceId,
      content: ingestionResult.value.extractedText,
      type: (input.projectionType ?? DEFAULT_PROJECTION_TYPE) as ProjectionType,
      processingProfileId: input.processingProfileId,
    });

    if (processingResult.isFail()) {
      return Result.fail(
        PipelineError.fromStep(PipelineStep.Processing, processingResult.error, completedSteps),
      );
    }

    completedSteps.push(PipelineStep.Processing);

    // Step 3: Add source to context
    const addResult = await this._contextManagement.addSourceToContext({
      contextId: input.contextId,
      sourceId: input.sourceId,
      sourceKnowledgeId,
    });

    if (addResult.isFail()) {
      return Result.fail(
        PipelineError.fromStep(PipelineStep.Cataloging, addResult.error, completedSteps),
      );
    }

    // Best-effort manifest recording
    if (this._manifestRepository) {
      try {
        await this._manifestRepository.save({
          id: crypto.randomUUID(),
          resourceId: input.resourceId ?? input.sourceId,
          sourceId: input.sourceId,
          extractionJobId: input.extractionJobId,
          sourceKnowledgeId,
          projectionId: processingResult.value.projectionId,
          contextId: input.contextId,
          status: "complete",
          completedSteps: [...completedSteps],
          contentHash: ingestionResult.value.contentHash,
          extractedTextLength: ingestionResult.value.extractedText.length,
          chunksCount: processingResult.value.chunksCount,
          dimensions: processingResult.value.dimensions,
          model: processingResult.value.model,
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        });
      } catch {
        // Best-effort: manifest recording should not fail the operation
      }
    }

    return Result.ok({
      sourceId: input.sourceId,
      sourceKnowledgeId,
      contextId: input.contextId,
      projectionId: processingResult.value.projectionId,
      contentHash: ingestionResult.value.contentHash,
      extractedTextLength: ingestionResult.value.extractedText.length,
      chunksCount: processingResult.value.chunksCount,
      dimensions: processingResult.value.dimensions,
      model: processingResult.value.model,
      resourceId: input.resourceId,
    });
  }

  async ingestDocument(
    input: IngestDocumentInput,
  ): Promise<Result<KnowledgePipelineError, IngestDocumentSuccess>> {
    try {
      const result = await this._ingestion.ingestAndExtract({
        sourceId: input.sourceId,
        sourceName: input.sourceName,
        uri: input.uri,
        type: input.sourceType as SourceType,
        extractionJobId: input.extractionJobId,
      });

      if (result.isFail()) {
        return Result.fail(
          PipelineError.fromStep(PipelineStep.Ingestion, result.error, []),
        );
      }

      return Result.ok({
        sourceId: result.value.sourceId,
        jobId: result.value.jobId,
        contentHash: result.value.contentHash,
        extractedText: result.value.extractedText,
        metadata: result.value.metadata,
      });
    } catch (error) {
      return Result.fail(
        PipelineError.fromStep(PipelineStep.Ingestion, error, []),
      );
    }
  }

  async processDocument(
    input: ProcessDocumentInput,
  ): Promise<Result<KnowledgePipelineError, ProcessDocumentSuccess>> {
    try {
      const result = await this._processing.processContent({
        projectionId: input.projectionId,
        sourceId: input.sourceId,
        content: input.content,
        type: (input.projectionType ?? DEFAULT_PROJECTION_TYPE) as ProjectionType,
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
    } catch (error) {
      return Result.fail(
        PipelineError.fromStep(PipelineStep.Processing, error, []),
      );
    }
  }

  async catalogDocument(
    input: CatalogDocumentInput,
  ): Promise<Result<KnowledgePipelineError, CatalogDocumentSuccess>> {
    try {
      const result = await this._contextManagement.createContext({
        id: input.contextId,
        name: input.name,
        description: input.description,
        language: input.language,
        requiredProfileId: input.requiredProfileId,
        createdBy: input.createdBy,
        tags: input.tags,
        attributes: input.attributes,
      });

      if (result.isFail()) {
        return Result.fail(
          PipelineError.fromStep(PipelineStep.Cataloging, result.error, []),
        );
      }

      return Result.ok({ contextId: result.value.id.value });
    } catch (error) {
      return Result.fail(
        PipelineError.fromStep(PipelineStep.Cataloging, error, []),
      );
    }
  }

  async searchKnowledge(
    input: SearchKnowledgeInput,
  ): Promise<Result<KnowledgePipelineError, SearchKnowledgeSuccess>> {
    try {
      const result = await this._retrieval.query({
        text: input.queryText,
        topK: input.topK,
        minScore: input.minScore,
        filters: input.filters,
      });

      return Result.ok({
        queryText: result.queryText,
        items: result.items.map((item) => ({
          sourceId: item.sourceId,
          content: item.content,
          score: item.score,
          metadata: item.metadata as Record<string, unknown>,
        })),
        totalFound: result.totalFound,
      });
    } catch (error) {
      return Result.fail(
        PipelineError.fromStep(PipelineStep.Search, error, []),
      );
    }
  }

  async createProcessingProfile(
    input: CreateProcessingProfileInput,
  ): Promise<Result<KnowledgePipelineError, CreateProcessingProfileSuccess>> {
    const result = await this._processing.createProcessingProfile({
      id: input.id,
      name: input.name,
      preparation: input.preparation,
      fragmentation: input.fragmentation,
      projection: input.projection,
    });

    if (result.isFail()) {
      return Result.fail(
        PipelineError.fromStep(PipelineStep.Processing, result.error, []),
      );
    }

    return Result.ok({
      profileId: result.value.profileId,
      version: result.value.version,
    });
  }

  async listProfiles(): Promise<Result<KnowledgePipelineError, ListProfilesResult>> {
    try {
      const profiles = await this._processing.listProcessingProfiles();
      return Result.ok({
        profiles: profiles.map((p) => ({
          id: p.id.value,
          name: p.name,
          version: p.version,
          preparation: p.preparation.toDTO(),
          fragmentation: p.fragmentation.toDTO(),
          projection: p.projection.toDTO(),
          status: p.status,
          createdAt: p.createdAt.toISOString(),
        })),
      });
    } catch (error) {
      return Result.fail(
        PipelineError.fromStep(PipelineStep.Processing, error, []),
      );
    }
  }

  async updateProfile(
    input: UpdateProfileInput,
  ): Promise<Result<KnowledgePipelineError, UpdateProfileResult>> {
    const result = await this._processing.updateProcessingProfile({
      id: input.id,
      name: input.name,
      preparation: input.preparation,
      fragmentation: input.fragmentation,
      projection: input.projection,
    });

    if (result.isFail()) {
      return Result.fail(
        PipelineError.fromStep(PipelineStep.Processing, result.error, []),
      );
    }

    return Result.ok({
      profileId: result.value.profileId,
      version: result.value.version,
    });
  }

  async deprecateProfile(
    input: DeprecateProfileInput,
  ): Promise<Result<KnowledgePipelineError, DeprecateProfileResult>> {
    const result = await this._processing.deprecateProcessingProfile({
      id: input.id,
      reason: input.reason,
    });

    if (result.isFail()) {
      return Result.fail(
        PipelineError.fromStep(PipelineStep.Processing, result.error, []),
      );
    }

    return Result.ok({
      profileId: result.value.profileId,
    });
  }

  async getManifest(
    input: GetManifestInput,
  ): Promise<Result<KnowledgePipelineError, GetManifestSuccess>> {
    try {
      if (input.manifestId) {
        const manifest = await this._manifestRepository.findById(input.manifestId);
        return Result.ok({ manifests: manifest ? [manifest] : [] });
      }
      if (input.resourceId) {
        const manifests = await this._manifestRepository.findByResourceId(input.resourceId);
        return Result.ok({ manifests });
      }
      if (input.sourceId) {
        const manifests = await this._manifestRepository.findBySourceId(input.sourceId);
        return Result.ok({ manifests });
      }
      if (input.contextId) {
        const manifests = await this._manifestRepository.findByContextId(input.contextId);
        return Result.ok({ manifests });
      }
      const manifests = await this._manifestRepository.findAll();
      return Result.ok({ manifests });
    } catch (error) {
      return Result.fail(
        PipelineError.fromStep(PipelineStep.Search, error, []),
      );
    }
  }
}
