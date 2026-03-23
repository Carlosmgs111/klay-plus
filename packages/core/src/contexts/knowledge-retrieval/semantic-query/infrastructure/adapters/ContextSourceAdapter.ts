import type { ContextRepository } from "../../../../context-management/context/domain/ContextRepository";
import type { ContextSourcePort } from "../../domain/ports/ContextSourcePort";
import { ContextId } from "../../../../context-management/context/domain/ContextId";

/**
 * Adapts ContextRepository to the ContextSourcePort interface.
 * Allows SearchKnowledge use case to filter results by context without
 * directly depending on any context service layer.
 */
export class ContextSourceAdapter implements ContextSourcePort {
  constructor(private readonly contextRepository: ContextRepository) {}

  async getActiveSourceIds(contextId: string): Promise<Set<string> | null> {
    const context = await this.contextRepository.findById(ContextId.create(contextId));
    if (!context) return null;
    return new Set(context.activeSources.map((s) => s.sourceId));
  }
}
