// Source Module
export {
  Source,
  SourceId,
  SourceType,
  SourceVersion,
  SourceRegistered,
  SourceUpdated,
  SourceExtracted,
  SourceUseCases,
  SourceComposer,
  RegisterSource,
  UpdateSource,
  sourceFactory,
} from "./source/index.js";

export type {
  SourceRepository,
  SourceInfrastructurePolicy,
  ResolvedSourceInfra,
  RegisterSourceCommand,
  UpdateSourceCommand,
  SourceFactoryResult,
} from "./source/index.js";

// Resource Module
export {
  Resource,
  ResourceId,
  ResourceStatus,
  StorageLocation,
  ResourceStored,
  ResourceDeleted,
  ResourceUseCases,
  ResourceComposer,
  StoreResource,
  RegisterExternalResource,
  DeleteResource,
  GetResource,
  resourceFactory,
  // Domain Errors
  ResourceNotFoundError,
  ResourceAlreadyExistsError,
  ResourceInvalidNameError,
  ResourceInvalidMimeTypeError,
  ResourceStorageFailedError,
} from "./resource/index.js";

export type {
  ResourceRepository,
  ResourceStorage,
  ResourceError,
  ResourceInfrastructurePolicy,
  ResolvedResourceInfra,
  StoreResourceCommand,
  StoreResourceResult,
  RegisterExternalResourceCommand,
  RegisterExternalResourceResult,
  DeleteResourceCommand,
  ResourceFactoryResult,
} from "./resource/index.js";

// Extraction Module
export {
  ExtractionJob,
  ExtractionJobId,
  ExtractionStatus,
  ExtractionCompleted,
  ExtractionFailed,
  ExtractionUseCases,
  ExtractionComposer,
  ExecuteExtraction,
  extractionFactory,
  UnsupportedMimeTypeError,
  // Content Extractors
  TextContentExtractor,
  BrowserPdfContentExtractor,
  ServerPdfContentExtractor,
} from "./extraction/index.js";

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
} from "./extraction/index.js";

// Context Facade (Application Layer Entry Point)
export {
  SourceIngestionFacade,
  SourceIngestionFacadeComposer,
  createSourceIngestionFacade,
} from "./facade/index.js";

export type {
  SourceIngestionFacadePolicy,
  ResolvedSourceIngestionModules,
  IngestFileSuccess,
} from "./facade/index.js";
