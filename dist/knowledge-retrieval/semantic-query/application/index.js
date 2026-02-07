// ─── Use Cases ─────────────────────────────────────────────────────
export { ExecuteSemanticQuery } from "./ExecuteSemanticQuery.js";
// ─── Use Cases Facade ──────────────────────────────────────────────
import { ExecuteSemanticQuery } from "./ExecuteSemanticQuery.js";
export class SemanticQueryUseCases {
    executeSemanticQuery;
    constructor(queryEmbedder, vectorSearch, rankingStrategy) {
        this.executeSemanticQuery = new ExecuteSemanticQuery(queryEmbedder, vectorSearch, rankingStrategy);
    }
}
//# sourceMappingURL=index.js.map