// ─── Use Cases ─────────────────────────────────────────────────────
export { ExecuteExtraction } from "./ExecuteExtraction.js";
export { UnsupportedMimeTypeError } from "./ExecuteExtraction.js";
// ─── Use Cases Container ──────────────────────────────────────────────
import { ExecuteExtraction } from "./ExecuteExtraction.js";
export class ExtractionUseCases {
    executeExtraction;
    constructor(repository, extractors, eventPublisher) {
        this.executeExtraction = new ExecuteExtraction(repository, extractors, eventPublisher);
    }
    /**
     * Returns the list of supported MIME types for extraction.
     */
    getSupportedMimeTypes() {
        return this.executeExtraction.getSupportedMimeTypes();
    }
}
//# sourceMappingURL=index.js.map