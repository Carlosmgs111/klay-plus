import type { KnowledgeLineageRepository } from "../../../domain/KnowledgeLineageRepository.js";
import type { KnowledgeLineage } from "../../../domain/KnowledgeLineage.js";
import type { LineageId } from "../../../domain/LineageId.js";
export declare class IndexedDBKnowledgeLineageRepository implements KnowledgeLineageRepository {
    private store;
    constructor(dbName?: string);
    save(entity: KnowledgeLineage): Promise<void>;
    findById(id: LineageId): Promise<KnowledgeLineage | null>;
    delete(id: LineageId): Promise<void>;
    findBySemanticUnitId(semanticUnitId: string): Promise<KnowledgeLineage | null>;
}
//# sourceMappingURL=IndexedDBKnowledgeLineageRepository.d.ts.map