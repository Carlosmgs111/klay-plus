import type { KnowledgePipelinePort } from "../../application/knowledge-pipeline/contracts/KnowledgePipelinePort.js";
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
} from "../../application/knowledge-pipeline/contracts/dtos.js";

// ─── UI Result Type ─────────────────────────────────────────────────────────

/**
 * Generic result type for UI consumption.
 * Unwraps the Result<E, T> pattern into a simpler success/error shape.
 */
export type UIResult<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: {
        message: string;
        code: string;
        step?: string;
        completedSteps?: string[];
      };
    };

// ─── UI Adapter ─────────────────────────────────────────────────────────────

/**
 * KnowledgePipelineUIAdapter — Primary Adapter for UI consumers.
 *
 * Wraps the KnowledgePipelinePort, converting Result<E, T> into
 * UIResult<T> for simpler consumption by frontend components.
 *
 * This adapter:
 * - Receives KnowledgePipelinePort (never the implementation)
 * - Contains zero business logic
 * - Only transforms Result → UIResult
 */
export class KnowledgePipelineUIAdapter {
  constructor(private readonly _pipeline: KnowledgePipelinePort) {}

  async execute(input: ExecutePipelineInput): Promise<UIResult<ExecutePipelineSuccess>> {
    const result = await this._pipeline.execute(input);
    return this._unwrap(result);
  }

  async ingestDocument(input: IngestDocumentInput): Promise<UIResult<IngestDocumentSuccess>> {
    const result = await this._pipeline.ingestDocument(input);
    return this._unwrap(result);
  }

  async processDocument(input: ProcessDocumentInput): Promise<UIResult<ProcessDocumentSuccess>> {
    const result = await this._pipeline.processDocument(input);
    return this._unwrap(result);
  }

  async catalogDocument(input: CatalogDocumentInput): Promise<UIResult<CatalogDocumentSuccess>> {
    const result = await this._pipeline.catalogDocument(input);
    return this._unwrap(result);
  }

  async searchKnowledge(input: SearchKnowledgeInput): Promise<UIResult<SearchKnowledgeSuccess>> {
    const result = await this._pipeline.searchKnowledge(input);
    return this._unwrap(result);
  }

  async createProcessingProfile(input: CreateProcessingProfileInput): Promise<UIResult<CreateProcessingProfileSuccess>> {
    const result = await this._pipeline.createProcessingProfile(input);
    return this._unwrap(result);
  }

  async getManifest(input: GetManifestInput): Promise<UIResult<GetManifestSuccess>> {
    const result = await this._pipeline.getManifest(input);
    return this._unwrap(result);
  }

  async addSource(input: AddSourceInput): Promise<UIResult<AddSourceSuccess>> {
    const result = await this._pipeline.addSource(input);
    return this._unwrap(result);
  }

  async removeSource(input: RemoveSourceInput): Promise<UIResult<RemoveSourceSuccess>> {
    const result = await this._pipeline.removeSource(input);
    return this._unwrap(result);
  }

  async reprocessUnit(input: ReprocessUnitInput): Promise<UIResult<ReprocessUnitSuccess>> {
    const result = await this._pipeline.reprocessUnit(input);
    return this._unwrap(result);
  }

  async rollbackUnit(input: RollbackUnitInput): Promise<UIResult<RollbackUnitSuccess>> {
    const result = await this._pipeline.rollbackUnit(input);
    return this._unwrap(result);
  }

  async addProjection(input: AddProjectionInput): Promise<UIResult<AddProjectionSuccess>> {
    const result = await this._pipeline.addProjection(input);
    return this._unwrap(result);
  }

  async linkUnits(input: LinkUnitsInput): Promise<UIResult<LinkUnitsSuccess>> {
    const result = await this._pipeline.linkUnits(input);
    return this._unwrap(result);
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private _unwrap<T>(result: { isOk(): boolean; value: T; error: any }): UIResult<T> {
    if (result.isOk()) {
      return { success: true, data: result.value };
    }

    const error = result.error;
    return {
      success: false,
      error: {
        message: error.message ?? "Unknown error",
        code: error.code ?? "UNKNOWN",
        step: error.step,
        completedSteps: error.completedSteps,
      },
    };
  }
}
