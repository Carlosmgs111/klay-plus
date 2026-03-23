/**
 * Port for reading active source IDs from a context.
 * Consumed by SearchKnowledge use case to filter results by context membership.
 * Implemented by ContextSourceAdapter (wraps ContextRepository directly).
 */
export interface ContextSourcePort {
  /** Returns the set of active source IDs for a context, or null if the context does not exist. */
  getActiveSourceIds(contextId: string): Promise<Set<string> | null>;
}
