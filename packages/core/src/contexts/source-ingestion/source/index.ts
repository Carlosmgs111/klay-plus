/**
 * Source Module - Public API
 *
 * This module manages source references (URIs, metadata, version tracking).
 * It does NOT store content - that's handled by the extraction module.
 */

// ─── Domain ──────────────────────────────────────────────────────────────────
export {
  Source,
  SourceId,
  SourceType,
  SourceVersion,
  SourceRegistered,
  SourceUpdated,
  SourceExtracted,
  // Domain Errors
  SourceNotFoundError,
  SourceAlreadyExistsError,
  SourceNameRequiredError,
  SourceUriRequiredError,
  SourceInvalidUriError,
  SourceInvalidTypeError,
} from "./domain/index.js";

export type { SourceRepository, SourceError } from "./domain/index.js";

// ─── Application ─────────────────────────────────────────────────────────────
export { RegisterSource, UpdateSource, SourceUseCases } from "./application/index.js";
export type { RegisterSourceCommand, UpdateSourceCommand } from "./application/index.js";

// ─── Composition & Factory ───────────────────────────────────────────────────
export { SourceComposer, sourceFactory } from "./composition/index.js";
export type {
  SourceInfrastructurePolicy,
  ResolvedSourceInfra,
  SourceFactoryResult,
} from "./composition/index.js";
