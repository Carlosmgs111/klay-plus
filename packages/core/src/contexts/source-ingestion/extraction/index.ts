/**
 * Extraction Module - Public API
 *
 * This module handles content extraction from sources (PDF, text, etc.).
 */

export {
  ExtractionJob,
  ExtractionJobId,
  ExtractionStatus,
  ExtractionCompleted,
  ExtractionFailed,
  // Domain Errors
  ExtractionJobNotFoundError,
  ExtractionSourceIdRequiredError,
  ExtractionInvalidStateError,
  ExtractionCannotStartError,
  ExtractionCannotCompleteError,
  ExtractionCannotFailError,
  ExtractionFailedError,
  UnsupportedMimeTypeError,
  ContentHashingError,
} from "./domain";

export type {
  ExtractionJobRepository,
  ContentExtractor,
  ExtractionResult,
  ExtractionError,
} from "./domain";

export {
  ExecuteExtraction,
  ExtractionUseCases,
} from "./application";
export type {
  ExecuteExtractionCommand,
  ExecuteExtractionResult,
  ExtractorMap,
} from "./application";

export {
  TextContentExtractor,
  BrowserPdfContentExtractor,
  ServerPdfContentExtractor,
} from "./infrastructure/adapters";

export { extractionFactory } from "./composition";
export type {
  ExtractionInfrastructurePolicy,
  ResolvedExtractionInfra,
  ExtractionFactoryResult,
} from "./composition";
