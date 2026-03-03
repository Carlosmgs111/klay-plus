// ── Domain ──────────────────────────────────────────────────────────

export { SourceKnowledge } from "./source/domain/SourceKnowledge";
export { SourceKnowledgeId } from "./source/domain/SourceKnowledgeId";
export { ProjectionHub } from "./source/domain/ProjectionHub";
export type { ProjectionEntry } from "./source/domain/ProjectionHub";

// ── Repository Port ─────────────────────────────────────────────────

export type { SourceKnowledgeRepository } from "./source/domain/SourceKnowledgeRepository";

// ── Events ──────────────────────────────────────────────────────────

export { SourceKnowledgeCreated } from "./source/domain/events/SourceKnowledgeCreated";
export { ProjectionRegistered } from "./source/domain/events/ProjectionRegistered";

// ── Infrastructure ──────────────────────────────────────────────────

export { InMemorySourceKnowledgeRepository } from "./source/infrastructure/InMemorySourceKnowledgeRepository";

// ── Service ─────────────────────────────────────────────────────────

export {
  SourceKnowledgeService,
  SourceKnowledgeNotFoundError,
  SourceKnowledgeAlreadyExistsError,
} from "./service/SourceKnowledgeService";

export type {
  SatisfiesProfileResult,
  EnsureProfileSatisfiedResult,
} from "./service/SourceKnowledgeService";

// ── Composition ─────────────────────────────────────────────────────

export { createSourceKnowledgeContext } from "./composition/factory";

export type {
  SourceKnowledgeModules,
  ResolvedSourceKnowledgeModules,
} from "./composition/factory";
