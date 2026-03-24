/**
 * Cross-context port for reading active source IDs from a context.
 * Consumed by application-layer search orchestration (context-filtered search).
 * Implemented by ContextSourceAdapter (wraps context-management ContextRepository).
 */
export interface ContextSourcePort {
  getActiveSourceIds(contextId: string): Promise<Set<string> | null>;
}
