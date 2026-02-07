export { SourceIngestionFacade } from "./SourceIngestionFacade.js";
export { SourceIngestionFacadeComposer } from "./composition/SourceIngestionFacadeComposer.js";
export type { SourceIngestionFacadePolicy, SourceIngestionInfraPolicy, ResolvedSourceIngestionModules, } from "./composition/infra-policies.js";
import type { SourceIngestionFacadePolicy } from "./composition/infra-policies.js";
import type { SourceIngestionFacade as _Facade } from "./SourceIngestionFacade.js";
/**
 * Factory function to create a fully configured SourceIngestionFacade.
 * This is the main entry point for consuming the Source Ingestion context.
 */
export declare function createSourceIngestionFacade(policy: SourceIngestionFacadePolicy): Promise<_Facade>;
//# sourceMappingURL=index.d.ts.map