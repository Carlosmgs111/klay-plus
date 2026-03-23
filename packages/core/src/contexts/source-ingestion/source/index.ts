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

export { RegisterSource } from "./application/use-cases/RegisterSource";
export type {
  RegisterSourceInput,
  RegisterSourceSuccess,
} from "./application/use-cases/RegisterSource";

export { SourceQueries } from "./application/use-cases/SourceQueries";
export { ExtractSource } from "./application/use-cases/ExtractSource";
export type { ExtractSourceInput, ExtractSourceSuccess } from "./application/use-cases/ExtractSource";
export { IngestAndExtract } from "./application/use-cases/IngestAndExtract";
export type { IngestAndExtractInput, IngestAndExtractSuccess } from "./application/use-cases/IngestAndExtract";
export { IngestSource } from "./application/use-cases/IngestSource";
export type { IngestSourceInput, IngestSourceResult } from "./application/use-cases/IngestSource";
export { BatchIngest } from "./application/use-cases/BatchIngest";
export type { BatchIngestItemResult } from "./application/use-cases/BatchIngest";
