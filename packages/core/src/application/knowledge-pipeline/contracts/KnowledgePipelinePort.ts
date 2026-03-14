import type { Result } from "../../../shared/domain/Result";
import type { KnowledgePipelineError } from "../domain/KnowledgePipelineError";
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
} from "./dtos";

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
   * Ingests a source, processes content, and adds it to an existing context.
   * Simplified flow: Ingest -> Process -> AddToContext.
   * Returns error if the context does not exist.
   */
  ingestAndAddSource(
    input: IngestAndAddSourceInput,
  ): Promise<Result<KnowledgePipelineError, IngestAndAddSourceSuccess>>;

  /**
   * Executes the full knowledge pipeline:
   * Ingest -> Process -> (optional) AddToContext
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
   * Uses sourceId + processingProfileId.
   */
  processDocument(
    input: ProcessDocumentInput,
  ): Promise<Result<KnowledgePipelineError, ProcessDocumentSuccess>>;

  /**
   * Creates a Context (replaces "catalog document" / "create semantic unit").
   * A Context groups sources and declares a requiredProfileId.
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

  listProfiles(): Promise<Result<KnowledgePipelineError, ListProfilesResult>>;

  updateProfile(
    input: UpdateProfileInput,
  ): Promise<Result<KnowledgePipelineError, UpdateProfileResult>>;

  deprecateProfile(
    input: DeprecateProfileInput,
  ): Promise<Result<KnowledgePipelineError, DeprecateProfileResult>>;

  /**
   * Retrieves content manifests for a resource, source, context, or by manifest ID.
   * Provides a top-down view of all artifacts produced from a resource.
   */
  getManifest(
    input: GetManifestInput,
  ): Promise<Result<KnowledgePipelineError, GetManifestSuccess>>;
}
