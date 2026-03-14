import type { PipelineService } from "./pipeline-service";
import type { ServiceResult } from "./types";
import { serverPost, serverPut, serverGet, encodeContentForTransport } from "./server-http-client";
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
} from "@klay/core";

/**
 * ServerPipelineService — delegates to /api/pipeline/* routes via fetch.
 */
export class ServerPipelineService implements PipelineService {
  async execute(
    input: ExecutePipelineInput,
  ): Promise<ServiceResult<ExecutePipelineSuccess>> {
    return serverPost("/api/pipeline/execute", encodeContentForTransport({ ...input }));
  }

  async ingestDocument(
    input: IngestDocumentInput,
  ): Promise<ServiceResult<IngestDocumentSuccess>> {
    return serverPost("/api/pipeline/ingest", input);
  }

  async processDocument(
    input: ProcessDocumentInput,
  ): Promise<ServiceResult<ProcessDocumentSuccess>> {
    return serverPost("/api/pipeline/process", input);
  }

  async catalogDocument(
    input: CatalogDocumentInput,
  ): Promise<ServiceResult<CatalogDocumentSuccess>> {
    return serverPost("/api/pipeline/catalog", input);
  }

  async searchKnowledge(
    input: SearchKnowledgeInput,
  ): Promise<ServiceResult<SearchKnowledgeSuccess>> {
    return serverPost("/api/pipeline/search", input);
  }

  async createProcessingProfile(
    input: CreateProcessingProfileInput,
  ): Promise<ServiceResult<CreateProcessingProfileSuccess>> {
    return serverPost("/api/pipeline/profiles", input);
  }

  async listProfiles(): Promise<ServiceResult<ListProfilesResult>> {
    return serverGet("/api/pipeline/profiles");
  }

  async updateProfile(
    input: UpdateProfileInput,
  ): Promise<ServiceResult<UpdateProfileResult>> {
    return serverPut("/api/pipeline/profiles", input);
  }

  async deprecateProfile(
    input: DeprecateProfileInput,
  ): Promise<ServiceResult<DeprecateProfileResult>> {
    return serverPost("/api/pipeline/profiles/deprecate", input);
  }

  async getManifest(
    input: GetManifestInput,
  ): Promise<ServiceResult<GetManifestSuccess>> {
    const params = new URLSearchParams();
    if (input.resourceId) params.set("resourceId", input.resourceId);
    if (input.sourceId) params.set("sourceId", input.sourceId);
    if (input.manifestId) params.set("manifestId", input.manifestId);
    if (input.contextId) params.set("contextId", input.contextId);
    const qs = params.toString();
    return serverGet(`/api/pipeline/manifest${qs ? `?${qs}` : ""}`);
  }
}
