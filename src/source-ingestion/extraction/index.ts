/**
 * Extraction Module - Public API
 *
 * This module handles content extraction from sources (PDF, text, etc.).
 */

// ─── Domain ─────────────────────────────────────────────────────────────────
export {
  ExtractionJob,
  ExtractionJobId,
  ExtractionStatus,
  ExtractionCompleted,
  ExtractionFailed,
} from "./domain/index.js";

export type {
  ExtractionJobRepository,
  ContentExtractor,
  ExtractionResult,
} from "./domain/index.js";

// ─── Application ────────────────────────────────────────────────────────────
export {
  ExecuteExtraction,
  ExtractionUseCases,
  UnsupportedMimeTypeError,
} from "./application/index.js";
export type {
  ExecuteExtractionCommand,
  ExecuteExtractionResult,
  ExtractorMap,
} from "./application/index.js";

// ─── Infrastructure Adapters (for custom composition) ──────────────────────
export {
  TextContentExtractor,
  BrowserPdfContentExtractor,
  ServerPdfContentExtractor,
} from "./infrastructure/adapters/index.js";

// ─── Composition & Factory ──────────────────────────────────────────────────
export { ExtractionComposer, extractionFactory } from "./composition/index.js";
export type {
  ExtractionInfraPolicy,
  ExtractionInfrastructurePolicy,
  ResolvedExtractionInfra,
  ExtractionFactoryResult,
} from "./composition/index.js";
