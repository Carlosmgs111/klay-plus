// Source Module
export {
  Source,
  SourceId,
  SourceType,
  SourceVersion,
  SourceRegistered,
  SourceUpdated,
  SourceExtracted,
  sourceFactory,
} from "./source";

export type {
  SourceRepository,
  SourceInfrastructurePolicy,
  ResolvedSourceInfra,
  SourceFactoryResult,
} from "./source";

// Resource Module
export {
  Resource,
  ResourceId,
  ResourceStatus,
  StorageLocation,
  ResourceStored,
  ResourceDeleted,
  resourceFactory,
  // Domain Errors
  ResourceNotFoundError,
  ResourceAlreadyExistsError,
  ResourceInvalidNameError,
  ResourceInvalidMimeTypeError,
  ResourceStorageFailedError,
} from "./resource";

export type {
  ResourceRepository,
  ResourceStorage,
  ResourceError,
  ResourceInfrastructurePolicy,
  ResolvedResourceInfra,
  ResourceFactoryResult,
} from "./resource";

// Extraction Module
export {
  ExtractionJob,
  ExtractionJobId,
  ExtractionStatus,
  ExtractionCompleted,
  ExtractionFailed,
  ExtractionUseCases,
  ExecuteExtraction,
  extractionFactory,
  UnsupportedMimeTypeError,
  // Content Extractors
  TextContentExtractor,
  BrowserPdfContentExtractor,
  ServerPdfContentExtractor,
} from "./extraction";

export type {
  ExtractionJobRepository,
  ContentExtractor,
  ExtractionResult,
  ExtractionInfrastructurePolicy,
  ResolvedExtractionInfra,
  ExecuteExtractionCommand,
  ExecuteExtractionResult,
  ExtractionFactoryResult,
  ExtractorMap,
} from "./extraction";

// Context Facade (Application Layer Entry Point)
export {
  SourceIngestionFacade,
  createSourceIngestionFacade,
} from "./facade";

export type {
  SourceIngestionFacadePolicy,
  ResolvedSourceIngestionModules,
  IngestFileSuccess,
} from "./facade";
