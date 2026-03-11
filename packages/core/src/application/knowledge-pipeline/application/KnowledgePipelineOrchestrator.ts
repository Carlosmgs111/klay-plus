import type { SourceIngestionService } from "../../../contexts/source-ingestion/service/SourceIngestionService";
import type { SemanticProcessingService } from "../../../contexts/semantic-processing/service/SemanticProcessingService";
import type { SourceKnowledgeService } from "../../../contexts/source-knowledge/service/SourceKnowledgeService";
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
  sourceKnowledge: SourceKnowledgeService;
  contextManagement: ContextManagementService;
  retrieval: KnowledgeRetrievalService;
  manifestRepository: ManifestRepository;
}

export class KnowledgePipelineOrchestrator implements KnowledgePipelinePort {
  private readonly _ingestion: SourceIngestionService;
  private readonly _processing: SemanticProcessingService;
  private readonly _sourceKnowledge: SourceKnowledgeService;
  private readonly _contextManagement: ContextManagementService;
  private readonly _retrieval: KnowledgeRetrievalService;
  private readonly _manifestRepository: ManifestRepository;
  private readonly _executeFullPipeline: ExecuteFullPipeline;

  constructor(deps: ResolvedPipelineDependencies) {
    this._ingestion = deps.ingestion;
    this._processing = deps.processing;
    this._sourceKnowledge = deps.sourceKnowledge;
    this._contextManagement = deps.contextManagement;
    this._retrieval = deps.retrieval;
    this._manifestRepository = deps.manifestRepository;

    this._executeFullPipeline = new ExecuteFullPipeline(
      deps.ingestion,
      deps.processing,
      deps.sourceKnowledge,
      deps.contextManagement,
      deps.manifestRepository,
    );
  }

  async execute(
    input: ExecutePipelineInput,
  ): Promise<Result<KnowledgePipelineError, ExecutePipelineSuccess>> {
    return this._executeFullPipeline.execute(input);
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

      // Register projection in source-knowledge hub (best-effort)
      await this._sourceKnowledge.registerProjection({
        sourceId: input.sourceId,
        projectionId: result.value.projectionId,
        profileId: input.processingProfileId,
        status: "COMPLETED",
      });

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
