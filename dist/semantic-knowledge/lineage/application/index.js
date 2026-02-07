// ─── Use Cases ─────────────────────────────────────────────────────
export { RegisterTransformation } from "./RegisterTransformation.js";
// ─── Use Cases Facade ──────────────────────────────────────────────
import { RegisterTransformation } from "./RegisterTransformation.js";
export class LineageUseCases {
    registerTransformation;
    constructor(repository, eventPublisher) {
        this.registerTransformation = new RegisterTransformation(repository, eventPublisher);
    }
}
//# sourceMappingURL=index.js.map