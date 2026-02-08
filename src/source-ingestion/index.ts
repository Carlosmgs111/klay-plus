// ═══════════════════════════════════════════════════════════════════════════
// Source Module
// ═══════════════════════════════════════════════════════════════════════════
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
  SourceInfraPolicy,
  SourceInfrastructurePolicy,
  ResolvedSourceInfra,
  RegisterSourceCommand,
  UpdateSourceCommand,
  SourceFactoryResult,
} from "./source/index.js";

// ═══════════════════════════════════════════════════════════════════════════
// Extraction Module
// ═══════════════════════════════════════════════════════════════════════════
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
  // Content Extractors
  TextContentExtractor,
  PdfContentExtractor,
  CompositeContentExtractor,
} from "./extraction/index.js";

export type {
  ExtractionJobRepository,
  ContentExtractor,
  ExtractionResult,
  ExtractionInfraPolicy,
  ExtractionInfrastructurePolicy,
  ResolvedExtractionInfra,
  ExecuteExtractionCommand,
  ExecuteExtractionResult,
  ExtractionFactoryResult,
} from "./extraction/index.js";

// ═══════════════════════════════════════════════════════════════════════════
// Context Facade (Application Layer Entry Point)
// ═══════════════════════════════════════════════════════════════════════════
export {
  SourceIngestionFacade,
  SourceIngestionFacadeComposer,
  createSourceIngestionFacade,
} from "./application/facade/index.js";

export type {
  SourceIngestionFacadePolicy,
  SourceIngestionInfraPolicy,
  ResolvedSourceIngestionModules,
} from "./application/facade/index.js";
