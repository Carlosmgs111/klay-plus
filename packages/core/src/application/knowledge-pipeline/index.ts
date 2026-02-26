/**
 * Knowledge Pipeline — Orchestrator Module
 *
 * Runtime-agnostic application service that coordinates all 4 bounded contexts
 * into a unified knowledge processing pipeline.
 *
 * Public API:
 * - KnowledgePipelinePort: the single entry point (interface)
 * - DTOs: input/output contracts
 * - KnowledgePipelineError: error with pipeline step tracking
 * - PipelineStep: enum of pipeline stages
 * - createKnowledgePipeline(): factory function
 * - KnowledgePipelinePolicy: configuration type
 *
 * NOT exported (internal):
 * - KnowledgePipelineOrchestrator (implementation)
 * - Use cases
 * - Facades
 */

// ─── Port ────────────────────────────────────────────────────────────────────
export type { KnowledgePipelinePort } from "./contracts/KnowledgePipelinePort.js";

// ─── DTOs ────────────────────────────────────────────────────────────────────
export type {
  ExecutePipelineInput,
  ExecutePipelineSuccess,
  IngestDocumentInput,
  IngestDocumentSuccess,
  ProcessDocumentInput,
  ProcessDocumentSuccess,
  CatalogDocumentInput,
  CatalogDocumentSuccess,
  SearchKnowledgeInput,
  SearchKnowledgeSuccess,
  CreateProcessingProfileInput,
  CreateProcessingProfileSuccess,
  GetManifestInput,
  GetManifestSuccess,
} from "./contracts/dtos.js";

// ─── Domain ──────────────────────────────────────────────────────────────────
export { KnowledgePipelineError } from "./domain/KnowledgePipelineError.js";
export { PipelineStep } from "./domain/PipelineStep.js";
export type { PipelineStep as PipelineStepType } from "./domain/PipelineStep.js";
export type { ContentManifestEntry } from "./domain/ContentManifest.js";

// ─── Factory ─────────────────────────────────────────────────────────────────
export { createKnowledgePipeline } from "./composition/knowledge-pipeline.factory.js";

// ─── Policy Type ─────────────────────────────────────────────────────────────
export type { KnowledgePipelinePolicy } from "./composition/KnowledgePipelineComposer.js";
