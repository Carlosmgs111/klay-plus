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
  private readonly _executeFullPipeline: ExecuteFullPipeline;
  private readonly _ingestDocument: IngestDocument;
  private readonly _processDocument: ProcessDocument;
  private readonly _catalogDocument: CatalogDocument;
  private readonly _searchKnowledge: SearchKnowledge;
  private readonly _getManifest: GetManifest;

  constructor(deps: ResolvedPipelineDependencies) {
    this._processing = deps.processing;

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
}
