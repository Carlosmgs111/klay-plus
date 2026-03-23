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

export { GetSource } from "./application/use-cases/GetSource";
export type { GetSourceInput } from "./application/use-cases/GetSource";

export { ListSources } from "./application/use-cases/ListSources";

export { GetSourceCount } from "./application/use-cases/GetSourceCount";

export { ExtractSource } from "./application/use-cases/ExtractSource";
export type {
  ExtractSourceInput,
  ExtractSourceSuccess,
} from "./application/use-cases/ExtractSource";

export { GetExtractedText } from "./application/use-cases/GetExtractedText";
export type { GetExtractedTextInput } from "./application/use-cases/GetExtractedText";

export { IngestAndExtract } from "./application/use-cases/IngestAndExtract";
export type {
  IngestAndExtractInput,
  IngestAndExtractSuccess,
} from "./application/use-cases/IngestAndExtract";

export { IngestFile } from "./application/use-cases/IngestFile";
export type {
  IngestFileInput,
  IngestFileSuccess,
} from "./application/use-cases/IngestFile";

export { IngestExternalResource } from "./application/use-cases/IngestExternalResource";
export type {
  IngestExternalResourceInput,
  IngestExternalResourceSuccess,
} from "./application/use-cases/IngestExternalResource";

export { BatchRegister } from "./application/use-cases/BatchRegister";
export type {
  BatchRegisterInput,
  BatchRegisterItemResult,
} from "./application/use-cases/BatchRegister";

export { BatchIngestAndExtract } from "./application/use-cases/BatchIngestAndExtract";
export type {
  BatchIngestAndExtractInput,
  BatchIngestAndExtractItemResult,
} from "./application/use-cases/BatchIngestAndExtract";
