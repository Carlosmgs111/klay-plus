export { ExtractionJob } from "./ExtractionJob";
export { ExtractionJobId } from "./ExtractionJobId";
export { ExtractionStatus } from "./ExtractionStatus";
export type { ExtractionJobRepository } from "./ExtractionJobRepository";
export type { ContentExtractor, ExtractionResult } from "./ContentExtractor";

export { ExtractionCompleted } from "./events/ExtractionCompleted";
export { ExtractionFailed } from "./events/ExtractionFailed";

// Domain Errors
export {
  ExtractionJobNotFoundError,
  ExtractionSourceIdRequiredError,
  ExtractionInvalidStateError,
  ExtractionCannotStartError,
  ExtractionCannotCompleteError,
  ExtractionCannotFailError,
  ExtractionFailedError,
  UnsupportedMimeTypeError,
  ContentHashingError,
  type ExtractionError,
} from "./errors";
