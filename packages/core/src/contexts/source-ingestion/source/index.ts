/**
 * Source Module - Public API
 *
 * This module manages source references (URIs, metadata, version tracking).
 * It does NOT store content - that's handled by the extraction module.
 */

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
} from "./domain";

export type { SourceRepository, SourceError } from "./domain";

export { sourceFactory } from "./composition";
export type {
  SourceInfrastructurePolicy,
  ResolvedSourceInfra,
  SourceFactoryResult,
} from "./composition";
