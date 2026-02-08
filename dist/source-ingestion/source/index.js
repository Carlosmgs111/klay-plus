/**
 * Source Module - Public API
 *
 * This module manages source references (URIs, metadata, version tracking).
 * It does NOT store content - that's handled by the extraction module.
 */
// ─── Domain ──────────────────────────────────────────────────────────────────
export { Source, SourceId, SourceType, SourceVersion, SourceRegistered, SourceUpdated, SourceExtracted, } from "./domain/index.js";
// ─── Application ─────────────────────────────────────────────────────────────
export { RegisterSource, UpdateSource, SourceUseCases } from "./application/index.js";
// ─── Composition & Factory ───────────────────────────────────────────────────
export { SourceComposer, sourceFactory } from "./composition/index.js";
//# sourceMappingURL=index.js.map