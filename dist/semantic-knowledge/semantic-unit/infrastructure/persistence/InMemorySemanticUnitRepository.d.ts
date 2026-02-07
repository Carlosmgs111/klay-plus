import type { SemanticUnitRepository } from "../../domain/SemanticUnitRepository.js";
import type { SemanticUnit } from "../../domain/SemanticUnit.js";
import type { SemanticUnitId } from "../../domain/SemanticUnitId.js";
import type { SemanticState } from "../../domain/SemanticState.js";
export declare class InMemorySemanticUnitRepository implements SemanticUnitRepository {
    private store;
    save(entity: SemanticUnit): Promise<void>;
    findById(id: SemanticUnitId): Promise<SemanticUnit | null>;
    delete(id: SemanticUnitId): Promise<void>;
    findByOriginSourceId(sourceId: string): Promise<SemanticUnit[]>;
    findByState(state: SemanticState): Promise<SemanticUnit[]>;
    findByTags(tags: string[]): Promise<SemanticUnit[]>;
    exists(id: SemanticUnitId): Promise<boolean>;
}
//# sourceMappingURL=InMemorySemanticUnitRepository.d.ts.map