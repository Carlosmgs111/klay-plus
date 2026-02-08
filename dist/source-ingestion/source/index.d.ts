/**
 * Source Module - Public API
 *
 * This module manages source references (URIs, metadata, version tracking).
 * It does NOT store content - that's handled by the extraction module.
 */
export { Source, SourceId, SourceType, SourceVersion, SourceRegistered, SourceUpdated, SourceExtracted, } from "./domain/index.js";
export type { SourceRepository } from "./domain/index.js";
export { RegisterSource, UpdateSource, SourceUseCases } from "./application/index.js";
export type { RegisterSourceCommand, UpdateSourceCommand } from "./application/index.js";
export { SourceComposer, sourceFactory } from "./composition/index.js";
export type { SourceInfraPolicy, SourceInfrastructurePolicy, ResolvedSourceInfra, SourceFactoryResult, } from "./composition/index.js";
//# sourceMappingURL=index.d.ts.map