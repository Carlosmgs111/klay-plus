import type { KnowledgeManagementPort } from "../../application/knowledge-management/contracts/KnowledgeManagementPort";
import type {
  IngestAndAddSourceInput,
  IngestAndAddSourceSuccess,
} from "../../application/knowledge-management/contracts/dtos";
import { unwrapResult } from "../shared/resultTransformers";
import type { UIResult } from "../shared/resultTransformers";

/**
 * KnowledgeManagementUIAdapter — Primary Adapter for UI consumers.
 *
 * Wraps the KnowledgeManagementPort, converting Result<E, T> into
 * UIResult<T> for simpler consumption by frontend components.
 *
 * This adapter:
 * - Receives KnowledgeManagementPort (never the implementation)
 * - Only transforms Result → UIResult
 */
export class KnowledgeManagementUIAdapter {
  constructor(private readonly _management: KnowledgeManagementPort) {}

  async ingestAndAddSource(input: IngestAndAddSourceInput): Promise<UIResult<IngestAndAddSourceSuccess>> {
    const result = await this._management.ingestAndAddSource(input);
    return unwrapResult(result);
  }
}
