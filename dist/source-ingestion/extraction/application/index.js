// ─── Use Cases ─────────────────────────────────────────────────────
export { ExecuteExtraction } from "./ExecuteExtraction.js";
// ─── Use Cases Facade ──────────────────────────────────────────────
import { ExecuteExtraction } from "./ExecuteExtraction.js";
export class ExtractionUseCases {
    executeExtraction;
    constructor(repository, extractor, eventPublisher) {
        this.executeExtraction = new ExecuteExtraction(repository, extractor, eventPublisher);
    }
}
//# sourceMappingURL=index.js.map