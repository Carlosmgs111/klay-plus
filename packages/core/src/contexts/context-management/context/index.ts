// ── Domain ──────────────────────────────────────────────────────────

export { Context } from "./domain/Context";
export { ContextId } from "./domain/ContextId";
export { ContextState } from "./domain/ContextState";
export { ContextSource } from "./domain/ContextSource";
export { ContextVersion } from "./domain/ContextVersion";
export { ContextMetadata } from "./domain/ContextMetadata";
export type { ContextRepository } from "./domain/ContextRepository";

// ── Events ──────────────────────────────────────────────────────────

export { ContextCreated } from "./domain/events/ContextCreated";
export { ContextSourceAdded } from "./domain/events/ContextSourceAdded";
export { ContextSourceRemoved } from "./domain/events/ContextSourceRemoved";
export { ContextVersioned } from "./domain/events/ContextVersioned";
export { ContextDeprecated } from "./domain/events/ContextDeprecated";
