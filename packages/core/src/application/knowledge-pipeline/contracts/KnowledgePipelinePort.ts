import type { Result } from "../../../shared/domain/Result.js";
import type { KnowledgePipelineError } from "../domain/KnowledgePipelineError.js";
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
} from "./dtos.js";

/**
 * KnowledgePipelinePort — the single public entry point for the orchestrator.
 *
 * This is a Port in the Hexagonal Architecture sense:
 * - Primary adapters (UI, REST) depend on this port
 * - The KnowledgePipelineOrchestrator implements this port
 * - The factory returns this port type (not the implementation)
 *
 * All methods return Result<KnowledgePipelineError, Success> for
 * functional error handling with pipeline step tracking.
 */
export interface KnowledgePipelinePort {
  /**
   * Executes the full knowledge pipeline: Ingest → Process → Catalog.
   * This is the main entry point for end-to-end document processing.
   */
  execute(
    input: ExecutePipelineInput,
  ): Promise<Result<KnowledgePipelineError, ExecutePipelineSuccess>>;

  /**
   * Ingests a document: registers the source and extracts text content.
   * Returns the extracted text for downstream use.
   */
  ingestDocument(
    input: IngestDocumentInput,
  ): Promise<Result<KnowledgePipelineError, IngestDocumentSuccess>>;

  /**
   * Processes content into semantic projections (chunking + embeddings).
   */
  processDocument(
    input: ProcessDocumentInput,
  ): Promise<Result<KnowledgePipelineError, ProcessDocumentSuccess>>;

  /**
   * Catalogs content as a semantic unit with lineage tracking.
   */
  catalogDocument(
    input: CatalogDocumentInput,
  ): Promise<Result<KnowledgePipelineError, CatalogDocumentSuccess>>;

  /**
   * Searches the knowledge base using semantic similarity.
   * Independent from the pipeline construction flow.
   */
  searchKnowledge(
    input: SearchKnowledgeInput,
  ): Promise<Result<KnowledgePipelineError, SearchKnowledgeSuccess>>;

  /**
   * Creates a processing profile for content processing.
   * A profile determines which chunking and embedding strategies are used.
   * Must be created before calling execute() or processDocument().
   */
  createProcessingProfile(
    input: CreateProcessingProfileInput,
  ): Promise<Result<KnowledgePipelineError, CreateProcessingProfileSuccess>>;

  /**
   * Retrieves content manifests for a resource, source, or by manifest ID.
   * Provides a top-down view of all artifacts produced from a resource.
   */
  getManifest(
    input: GetManifestInput,
  ): Promise<Result<KnowledgePipelineError, GetManifestSuccess>>;

  /**
   * Adds a source to an existing semantic unit (creates a new version).
   */
  addSource(
    input: AddSourceInput,
  ): Promise<Result<KnowledgePipelineError, AddSourceSuccess>>;

  /**
   * Removes a source from an existing semantic unit (creates a new version without it).
   */
  removeSource(
    input: RemoveSourceInput,
  ): Promise<Result<KnowledgePipelineError, RemoveSourceSuccess>>;

  /**
   * Reprocesses all sources of a semantic unit with a new processing profile.
   */
  reprocessUnit(
    input: ReprocessUnitInput,
  ): Promise<Result<KnowledgePipelineError, ReprocessUnitSuccess>>;

  /**
   * Rolls back a semantic unit to a previous version (non-destructive pointer move).
   */
  rollbackUnit(
    input: RollbackUnitInput,
  ): Promise<Result<KnowledgePipelineError, RollbackUnitSuccess>>;

  /**
   * Creates an additional projection for an existing semantic unit.
   * Multiple projections can coexist for the same unit (different profiles/types).
   */
  addProjection(
    input: AddProjectionInput,
  ): Promise<Result<KnowledgePipelineError, AddProjectionSuccess>>;

  /**
   * Links two semantic units with a named relationship.
   * Creates a flat reference (e.g., "related-to", "derived-from", "contradicts").
   */
  linkUnits(
    input: LinkUnitsInput,
  ): Promise<Result<KnowledgePipelineError, LinkUnitsSuccess>>;
}
