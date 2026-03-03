// ── Domain ──────────────────────────────────────────────────────────

export { Context } from "./context/domain/Context";
export { ContextId } from "./context/domain/ContextId";
export { ContextState } from "./context/domain/ContextState";
export { ContextSource } from "./context/domain/ContextSource";
export { ContextVersion } from "./context/domain/ContextVersion";
export { ContextMetadata } from "./context/domain/ContextMetadata";

// ── Repository Port ─────────────────────────────────────────────────

export type { ContextRepository } from "./context/domain/ContextRepository";

// ── Events ──────────────────────────────────────────────────────────

export { ContextCreated } from "./context/domain/events/ContextCreated";
export { ContextSourceAdded } from "./context/domain/events/ContextSourceAdded";
export { ContextSourceRemoved } from "./context/domain/events/ContextSourceRemoved";
export { ContextVersioned } from "./context/domain/events/ContextVersioned";
export { ContextDeprecated } from "./context/domain/events/ContextDeprecated";
export { ContextRolledBack } from "./context/domain/events/ContextRolledBack";

// ── Infrastructure ──────────────────────────────────────────────────

export { InMemoryContextRepository } from "./context/infrastructure/InMemoryContextRepository";

// ── Service ─────────────────────────────────────────────────────────

export {
  ContextManagementService,
  ContextNotFoundError,
  ProfileNotSatisfiedError,
} from "./service/ContextManagementService";

// ── Composition ─────────────────────────────────────────────────────

export { createContextManagementContext } from "./composition/factory";

export type {
  ContextManagementModules,
  ResolvedContextManagementModules,
} from "./composition/factory";
