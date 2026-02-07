import type { SourceRepository } from "../../domain/SourceRepository.js";
import type { Source } from "../../domain/Source.js";
import type { SourceId } from "../../domain/SourceId.js";
import type { SourceType } from "../../domain/SourceType.js";
export declare class InMemorySourceRepository implements SourceRepository {
    private store;
    save(entity: Source): Promise<void>;
    findById(id: SourceId): Promise<Source | null>;
    delete(id: SourceId): Promise<void>;
    findByType(type: SourceType): Promise<Source[]>;
    findByUri(uri: string): Promise<Source | null>;
    exists(id: SourceId): Promise<boolean>;
}
//# sourceMappingURL=InMemorySourceRepository.d.ts.map