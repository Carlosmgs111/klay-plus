import type { PipelineService } from "./pipeline-service";
import type { ServiceResult } from "./types";
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
    return this._post("/api/pipeline/execute", input);
  }

  async ingestDocument(
    input: IngestDocumentInput,
  ): Promise<ServiceResult<IngestDocumentSuccess>> {
    return this._post("/api/pipeline/ingest", input);
  }

  async processDocument(
    input: ProcessDocumentInput,
  ): Promise<ServiceResult<ProcessDocumentSuccess>> {
    return this._post("/api/pipeline/process", input);
  }

  async catalogDocument(
    input: CatalogDocumentInput,
  ): Promise<ServiceResult<CatalogDocumentSuccess>> {
    return this._post("/api/pipeline/catalog", input);
  }

  async searchKnowledge(
    input: SearchKnowledgeInput,
  ): Promise<ServiceResult<SearchKnowledgeSuccess>> {
    return this._post("/api/pipeline/search", input);
  }

  async createProcessingProfile(
    input: CreateProcessingProfileInput,
  ): Promise<ServiceResult<CreateProcessingProfileSuccess>> {
    return this._post("/api/pipeline/profiles", input);
  }

  async listProfiles(): Promise<ServiceResult<ListProfilesResult>> {
    return this._get("/api/pipeline/profiles");
  }

  async updateProfile(
    input: UpdateProfileInput,
  ): Promise<ServiceResult<UpdateProfileResult>> {
    return this._put("/api/pipeline/profiles", input);
  }

  async deprecateProfile(
    input: DeprecateProfileInput,
  ): Promise<ServiceResult<DeprecateProfileResult>> {
    return this._post("/api/pipeline/profiles/deprecate", input);
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
    return this._get(`/api/pipeline/manifest${qs ? `?${qs}` : ""}`);
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private async _post<T>(path: string, body: unknown): Promise<ServiceResult<T>> {
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      return json as ServiceResult<T>;
    } catch (err) {
      return {
        success: false,
        error: {
          message: err instanceof Error ? err.message : "Network error",
          code: "NETWORK_ERROR",
        },
      };
    }
  }

  private async _put<T>(path: string, body: unknown): Promise<ServiceResult<T>> {
    try {
      const res = await fetch(path, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      return json as ServiceResult<T>;
    } catch (err) {
      return {
        success: false,
        error: {
          message: err instanceof Error ? err.message : "Network error",
          code: "NETWORK_ERROR",
        },
      };
    }
  }

  private async _get<T>(path: string): Promise<ServiceResult<T>> {
    try {
      const res = await fetch(path);
      const json = await res.json();
      return json as ServiceResult<T>;
    } catch (err) {
      return {
        success: false,
        error: {
          message: err instanceof Error ? err.message : "Network error",
          code: "NETWORK_ERROR",
        },
      };
    }
  }
}
