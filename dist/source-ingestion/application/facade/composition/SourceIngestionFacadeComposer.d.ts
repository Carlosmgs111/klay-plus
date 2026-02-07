import type { SourceIngestionFacadePolicy, ResolvedSourceIngestionModules } from "./infra-policies.js";
/**
 * Composer for the Source Ingestion Facade.
 * Resolves all module dependencies based on infrastructure policy.
 */
export declare class SourceIngestionFacadeComposer {
    /**
     * Resolves all modules for the Source Ingestion context.
     * Uses dynamic imports for tree-shaking and environment-specific loading.
     */
    static resolve(policy: SourceIngestionFacadePolicy): Promise<ResolvedSourceIngestionModules>;
}
//# sourceMappingURL=SourceIngestionFacadeComposer.d.ts.map