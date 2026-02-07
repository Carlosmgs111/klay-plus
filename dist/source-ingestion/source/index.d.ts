export { Source, SourceId, SourceType, SourceVersion, SourceRegistered, SourceUpdated, SourceExtracted, } from "./domain/index.js";
export type { SourceRepository } from "./domain/index.js";
export { RegisterSource, UpdateSource, SourceUseCases } from "./application/index.js";
export type { RegisterSourceCommand, UpdateSourceCommand, } from "./application/index.js";
export { SourceComposer } from "./composition/SourceComposer.js";
export type { SourceInfrastructurePolicy, ResolvedSourceInfra, } from "./composition/infra-policies.js";
import type { SourceInfrastructurePolicy } from "./composition/infra-policies.js";
import type { SourceUseCases as _UseCases } from "./application/index.js";
import type { ResolvedSourceInfra } from "./composition/infra-policies.js";
export interface SourceFactoryResult {
    useCases: _UseCases;
    infra: ResolvedSourceInfra;
}
/**
 * Creates the source module with resolved infrastructure.
 * Returns both the use cases and the resolved infra (repository is exposed
 * for orchestrator coordination).
 */
export declare function sourceFactory(policy: SourceInfrastructurePolicy): Promise<SourceFactoryResult>;
//# sourceMappingURL=index.d.ts.map