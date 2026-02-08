import type { SourceIngestionFacadePolicy, ResolvedSourceIngestionModules } from "./infra-policies.js";
/**
 * Composer for the Source Ingestion Facade.
 *
 * This is a COMPOSITION component - it only:
 * - Selects infrastructure implementations based on policy
 * - Instantiates modules via their factories
 * - Wires dependencies for the facade
 *
 * It does NOT contain:
 * - Business logic
 * - Domain rules
 * - Application flows
 */
export declare class SourceIngestionFacadeComposer {
    /**
     * Resolves all modules for the Source Ingestion context.
     * Uses dynamic imports for tree-shaking and environment-specific loading.
     */
    static resolve(policy: SourceIngestionFacadePolicy): Promise<ResolvedSourceIngestionModules>;
}
//# sourceMappingURL=SourceIngestionFacadeComposer.d.ts.map