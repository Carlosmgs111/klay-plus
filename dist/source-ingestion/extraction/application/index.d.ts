import type { ExtractionJobRepository } from "../domain/ExtractionJobRepository.js";
import type { ContentExtractor } from "../domain/ContentExtractor.js";
import type { EventPublisher } from "../../../shared/domain/EventPublisher.js";
export { ExecuteExtraction } from "./ExecuteExtraction.js";
export type { ExecuteExtractionCommand, ExecuteExtractionResult } from "./ExecuteExtraction.js";
import { ExecuteExtraction } from "./ExecuteExtraction.js";
export declare class ExtractionUseCases {
    readonly executeExtraction: ExecuteExtraction;
    constructor(repository: ExtractionJobRepository, extractor: ContentExtractor, eventPublisher: EventPublisher);
}
//# sourceMappingURL=index.d.ts.map