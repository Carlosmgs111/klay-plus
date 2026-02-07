import type { SemanticUnitRepository } from "../domain/SemanticUnitRepository.js";
import type { EventPublisher } from "../../../shared/domain/EventPublisher.js";
export type SemanticUnitInfraPolicy = "in-memory" | "browser" | "server";
export interface SemanticUnitInfrastructurePolicy {
    type: SemanticUnitInfraPolicy;
    dbPath?: string;
    dbName?: string;
}
export interface ResolvedSemanticUnitInfra {
    repository: SemanticUnitRepository;
    eventPublisher: EventPublisher;
}
//# sourceMappingURL=infra-policies.d.ts.map