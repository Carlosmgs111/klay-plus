import type { Result } from "../../../shared/domain/Result";
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
}
