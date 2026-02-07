// ─── Use Cases ─────────────────────────────────────────────────────
export { RegisterSource } from "./RegisterSource.js";
export { UpdateSource } from "./UpdateSource.js";
// ─── Use Cases Facade ──────────────────────────────────────────────
import { RegisterSource } from "./RegisterSource.js";
import { UpdateSource } from "./UpdateSource.js";
export class SourceUseCases {
    registerSource;
    updateSource;
    constructor(repository, eventPublisher) {
        this.registerSource = new RegisterSource(repository, eventPublisher);
        this.updateSource = new UpdateSource(repository, eventPublisher);
    }
}
//# sourceMappingURL=index.js.map