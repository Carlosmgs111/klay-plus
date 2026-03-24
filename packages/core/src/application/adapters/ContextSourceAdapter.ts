import type { ContextRepository } from "../../contexts/context-management/context/domain/ContextRepository";
import type { ContextSourcePort } from "../ports/ContextSourcePort";
import { ContextId } from "../../contexts/context-management/context/domain/ContextId";

export class ContextSourceAdapter implements ContextSourcePort {
  constructor(private readonly _contextRepository: ContextRepository) {}

  async getActiveSourceIds(contextId: string): Promise<Set<string> | null> {
    const context = await this._contextRepository.findById(ContextId.create(contextId));
    if (!context) return null;
    return new Set(context.activeSources.map((s) => s.sourceId));
  }
}
