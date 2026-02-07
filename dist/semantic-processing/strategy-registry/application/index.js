// ─── Use Cases ─────────────────────────────────────────────────────
export { RegisterStrategy } from "./RegisterStrategy.js";
// ─── Use Cases Facade ──────────────────────────────────────────────
import { RegisterStrategy } from "./RegisterStrategy.js";
export class StrategyRegistryUseCases {
    registerStrategy;
    constructor(repository, eventPublisher) {
        this.registerStrategy = new RegisterStrategy(repository, eventPublisher);
    }
}
//# sourceMappingURL=index.js.map