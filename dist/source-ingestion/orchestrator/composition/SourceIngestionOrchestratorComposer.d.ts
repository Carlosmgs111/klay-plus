import type { SourceIngestionOrchestratorPolicy, ResolvedSourceIngestionModules } from "./infra-policies.js";
export declare class SourceIngestionOrchestratorComposer {
    /**
     * Resolves all modules for the Source Ingestion context.
     * Uses dynamic imports for tree-shaking and environment-specific loading.
     */
    static resolve(policy: SourceIngestionOrchestratorPolicy): Promise<ResolvedSourceIngestionModules>;
}
//# sourceMappingURL=SourceIngestionOrchestratorComposer.d.ts.map