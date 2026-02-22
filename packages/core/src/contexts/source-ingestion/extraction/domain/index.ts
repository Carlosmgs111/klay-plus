export { ExtractionJob } from "./ExtractionJob.js";
export { ExtractionJobId } from "./ExtractionJobId.js";
export { ExtractionStatus } from "./ExtractionStatus.js";
export type { ExtractionJobRepository } from "./ExtractionJobRepository.js";
export type { ContentExtractor, ExtractionResult } from "./ContentExtractor.js";

export { ExtractionCompleted } from "./events/ExtractionCompleted.js";
export { ExtractionFailed } from "./events/ExtractionFailed.js";

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
} from "./errors/index.js";
