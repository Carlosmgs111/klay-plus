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
  TextSourceExtractor,
  PdfBrowserExtractor,
  PdfServerExtractor,
  sourceFactory,
} from "./source/index.js";

export type {
  SourceRepository,
  SourceExtractor,
  ExtractionResult,
  SourceInfrastructurePolicy,
  ResolvedSourceInfra,
  RegisterSourceCommand,
  UpdateSourceCommand,
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
} from "./extraction/index.js";

export type {
  ExtractionJobRepository,
  ExtractionInfrastructurePolicy,
  ResolvedExtractionInfra,
  ExecuteExtractionCommand,
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
