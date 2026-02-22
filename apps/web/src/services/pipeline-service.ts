import type { ServiceResult } from "./types.js";
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
} from "@klay/core";

/**
 * PipelineService — runtime-agnostic interface for pipeline operations.
 *
 * Implemented by:
 * - ServerPipelineService (fetches /api/pipeline/* routes)
 * - BrowserPipelineService (calls KnowledgePipelineUIAdapter directly)
 */
export interface PipelineService {
  execute(
    input: ExecutePipelineInput,
  ): Promise<ServiceResult<ExecutePipelineSuccess>>;

  ingestDocument(
    input: IngestDocumentInput,
  ): Promise<ServiceResult<IngestDocumentSuccess>>;

  processDocument(
    input: ProcessDocumentInput,
  ): Promise<ServiceResult<ProcessDocumentSuccess>>;

  catalogDocument(
    input: CatalogDocumentInput,
  ): Promise<ServiceResult<CatalogDocumentSuccess>>;

  searchKnowledge(
    input: SearchKnowledgeInput,
  ): Promise<ServiceResult<SearchKnowledgeSuccess>>;

  createProcessingProfile(
    input: CreateProcessingProfileInput,
  ): Promise<ServiceResult<CreateProcessingProfileSuccess>>;

  getManifest(
    input: GetManifestInput,
  ): Promise<ServiceResult<GetManifestSuccess>>;
}
