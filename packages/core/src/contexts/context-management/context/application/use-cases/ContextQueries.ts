import type { ContextRepository } from "../../domain/ContextRepository";
import { Result } from "../../../../../shared/domain/Result";

export interface ContextRefDTO {
  id: string;
  name: string;
  state: string;
  requiredProfileId: string;
}

export interface ListContextsResult {
  contexts: ContextRefDTO[];
  total: number;
}

export interface GetSourceContextsResult {
  sourceId: string;
  contexts: ContextRefDTO[];
}
import { type StepError, stepError } from "../../../../../shared/domain/errors/stepError";
import { ContextId } from "../../domain/ContextId";

/**
 * ContextQueries — Pure domain read-side use case for context-management.
 *
 * Only domain queries (no cross-context enrichment).
 * Enriched views (getDetail, listSummary) live in application/context-read-model/.
 */
export class ContextQueries {
  constructor(
    private readonly _repo: ContextRepository,
  ) {}

  // Raw aggregate for internal use (e.g. ProcessKnowledge, app-layer orchestrators)
  async getRaw(contextId: string) {
    return this._repo.findById(ContextId.create(contextId));
  }

  // Lightweight ContextRefDTO list
  async listRefs(): Promise<Result<StepError, ListContextsResult>> {
    try {
      const contexts = await this._repo.findAll();
      return Result.ok({
        contexts: contexts.map((c) => ({
          id: c.id.value,
          name: c.name,
          state: c.state,
          requiredProfileId: c.requiredProfileId,
        })),
        total: contexts.length,
      });
    } catch (error) {
      return Result.fail(stepError("cataloging", error));
    }
  }

  // ContextRefDTO[] filtered by sourceId
  async listBySource(sourceId: string): Promise<Result<StepError, GetSourceContextsResult>> {
    try {
      const contexts = await this._repo.findBySourceId(sourceId);
      return Result.ok({
        sourceId,
        contexts: contexts.map((c) => ({
          id: c.id.value,
          name: c.name,
          state: c.state,
          requiredProfileId: c.requiredProfileId,
        })),
      });
    } catch (error) {
      return Result.fail(stepError("cataloging", error));
    }
  }
}
