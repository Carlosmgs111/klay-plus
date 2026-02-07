import type { SourceInfrastructurePolicy } from "../../../source/composition/infra-policies.js";
import type { ExtractionInfrastructurePolicy } from "../../../extraction/composition/infra-policies.js";
import type { SourceUseCases } from "../../../source/application/index.js";
import type { ExtractionUseCases } from "../../../extraction/application/index.js";
import type { SourceRepository } from "../../../source/domain/SourceRepository.js";
export type SourceIngestionInfraPolicy = "in-memory" | "browser" | "server";
export interface SourceIngestionFacadePolicy {
    type: SourceIngestionInfraPolicy;
    /**
     * Database path for server-side persistence (NeDB).
     * @default "./data"
     */
    dbPath?: string;
    /**
     * Database name for browser-side persistence (IndexedDB).
     * @default "source-ingestion"
     */
    dbName?: string;
    /**
     * Override policies for individual modules.
     * If not provided, modules inherit from the facade's type.
     */
    overrides?: {
        source?: Partial<SourceInfrastructurePolicy>;
        extraction?: Partial<ExtractionInfrastructurePolicy>;
    };
}
export interface ResolvedSourceIngestionModules {
    source: SourceUseCases;
    extraction: ExtractionUseCases;
    /** Repository exposed for facade coordination */
    sourceRepository: SourceRepository;
}
//# sourceMappingURL=infra-policies.d.ts.map