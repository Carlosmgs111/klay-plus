// ─── Use Cases ─────────────────────────────────────────────────────
export { GenerateProjection } from "./GenerateProjection.js";
// ─── Use Cases Facade ──────────────────────────────────────────────
import { GenerateProjection } from "./GenerateProjection.js";
export class ProjectionUseCases {
    generateProjection;
    constructor(repository, embeddingStrategy, chunkingStrategy, vectorStore, eventPublisher) {
        this.generateProjection = new GenerateProjection(repository, embeddingStrategy, chunkingStrategy, vectorStore, eventPublisher);
    }
}
//# sourceMappingURL=index.js.map