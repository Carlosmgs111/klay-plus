// Source module
export {
  Source,
  SourceId,
  SourceType,
  SourceVersion,
  SourceRegistered,
  SourceUpdated,
  SourceExtracted,
} from "./source/domain/index.js";

export type {
  SourceRepository,
  SourceExtractor,
  ExtractionResult,
} from "./source/domain/index.js";

export { RegisterSource, UpdateSource } from "./source/application/index.js";
export type {
  RegisterSourceCommand,
  UpdateSourceCommand,
} from "./source/application/index.js";

// Extraction module
export {
  ExtractionJob,
  ExtractionJobId,
  ExtractionStatus,
  ExtractionCompleted,
  ExtractionFailed,
} from "./extraction/domain/index.js";

export type { ExtractionJobRepository } from "./extraction/domain/index.js";

export { ExecuteExtraction } from "./extraction/application/index.js";
export type { ExecuteExtractionCommand } from "./extraction/application/index.js";
