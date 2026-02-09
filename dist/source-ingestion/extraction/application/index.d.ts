import type { ExtractionJobRepository } from "../domain/ExtractionJobRepository.js";
import type { EventPublisher } from "../../../shared/domain/EventPublisher.js";
export { ExecuteExtraction } from "./ExecuteExtraction.js";
export type { ExecuteExtractionCommand, ExecuteExtractionResult, ExtractorMap, } from "./ExecuteExtraction.js";
export { UnsupportedMimeTypeError } from "./ExecuteExtraction.js";
import { ExecuteExtraction, type ExtractorMap } from "./ExecuteExtraction.js";
export declare class ExtractionUseCases {
    readonly executeExtraction: ExecuteExtraction;
    constructor(repository: ExtractionJobRepository, extractors: ExtractorMap, eventPublisher: EventPublisher);
    /**
     * Returns the list of supported MIME types for extraction.
     */
    getSupportedMimeTypes(): string[];
}
//# sourceMappingURL=index.d.ts.map