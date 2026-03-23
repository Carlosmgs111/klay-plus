// ── Domain ──────────────────────────────────────────────────────────

export {
  KnowledgeLineage,
  LineageId,
  Trace,
} from "./domain";

export type { KnowledgeLineageRepository } from "./domain";

// ── Use Cases ────────────────────────────────────────────────────────

export { LinkContexts } from "./application/use-cases/LinkContexts";
export { UnlinkContexts } from "./application/use-cases/UnlinkContexts";
export { GetLineage } from "./application/use-cases/GetLineage";

// ── Infrastructure ───────────────────────────────────────────────────

export { InMemoryKnowledgeLineageRepository } from "./infrastructure/persistence/InMemoryKnowledgeLineageRepository";

// ── Composition ─────────────────────────────────────────────────────

export { lineageFactory } from "./composition";
export type {
  LineageInfrastructurePolicy,
  ResolvedLineageInfra,
  LineageFactoryResult,
} from "./composition";
