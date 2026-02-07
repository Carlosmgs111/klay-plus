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
  ExtractionInfrastructurePolicy,
  ResolvedExtractionInfra,
  ExecuteExtractionCommand,
  ExecuteExtractionResult,
} from "./extraction/index.js";

// ═══════════════════════════════════════════════════════════════════════════
// Orchestrator Module
// ═══════════════════════════════════════════════════════════════════════════
export {
  SourceIngestionOrchestrator,
  SourceIngestionOrchestratorComposer,
  sourceIngestionOrchestratorFactory,
} from "./orchestrator/index.js";

export type {
  SourceIngestionOrchestratorPolicy,
  SourceIngestionInfraPolicy,
  ResolvedSourceIngestionModules,
} from "./orchestrator/index.js";
