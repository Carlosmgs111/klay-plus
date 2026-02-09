import type { ExtractionJobRepository } from "../domain/ExtractionJobRepository.js";
import type { ContentExtractor } from "../domain/ContentExtractor.js";
import type { EventPublisher } from "../../../shared/domain/EventPublisher.js";
export type ExtractionInfraPolicy = "in-memory" | "browser" | "server";
/**
 * Map of MIME types to their corresponding content extractors.
 * The UseCase uses this to select the appropriate extractor at runtime.
 */
export type ExtractorMap = Map<string, ContentExtractor>;
export interface ExtractionInfrastructurePolicy {
    type: ExtractionInfraPolicy;
    dbPath?: string;
    dbName?: string;
    /**
     * Optional custom extractors map.
     * If not provided, default extractors are resolved based on policy.
     */
    customExtractors?: ExtractorMap;
}
export interface ResolvedExtractionInfra {
    repository: ExtractionJobRepository;
    /** Map of MIME types to extractors. UseCase selects based on source mimeType. */
    extractors: ExtractorMap;
    eventPublisher: EventPublisher;
}
//# sourceMappingURL=infra-policies.d.ts.map