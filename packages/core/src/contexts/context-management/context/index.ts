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

// ── Use Cases ────────────────────────────────────────────────────────

export { CreateContext } from "./application/use-cases/CreateContext";
export { GetContext } from "./application/use-cases/GetContext";
export { ListContexts } from "./application/use-cases/ListContexts";
export { GetContextsForSource } from "./application/use-cases/GetContextsForSource";
export { AddSourceToContext } from "./application/use-cases/AddSourceToContext";
export { RemoveSourceFromContext } from "./application/use-cases/RemoveSourceFromContext";
export { TransitionContextState } from "./application/use-cases/TransitionContextState";
export { UpdateContextProfile } from "./application/use-cases/UpdateContextProfile";
export { GetContextDetails } from "./application/use-cases/GetContextDetails";
export { ListContextsSummary } from "./application/use-cases/ListContextsSummary";
export { ReconcileProjections } from "./application/use-cases/ReconcileProjections";
export { ReconcileAllProfiles } from "./application/use-cases/ReconcileAllProfiles";

// ── Ports ────────────────────────────────────────────────────────────

export type { SourceMetadataPort } from "./application/ports/SourceMetadataPort";
export type { ProjectionStatsPort } from "./application/ports/ProjectionStatsPort";
export type { SourceTextPort } from "./application/ports/SourceTextPort";
export type { ActiveProfilesPort } from "./application/ports/ActiveProfilesPort";
export type { ProjectionOperationsPort } from "./application/ports/ProjectionOperationsPort";

// ── Infrastructure ───────────────────────────────────────────────────

export { InMemoryContextRepository } from "./infrastructure/InMemoryContextRepository";
export { SourceMetadataAdapter } from "./infrastructure/adapters/SourceMetadataAdapter";
export { ProjectionStatsAdapter } from "./infrastructure/adapters/ProjectionStatsAdapter";
export { SourceTextAdapter } from "./infrastructure/adapters/SourceTextAdapter";
export { ActiveProfilesAdapter } from "./infrastructure/adapters/ActiveProfilesAdapter";
export { ProjectionOperationsAdapter } from "./infrastructure/adapters/ProjectionOperationsAdapter";
