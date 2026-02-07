import { NeDBStore } from "../../../../../shared/infrastructure/nedb/NeDBStore.js";
import { toDTO, fromDTO } from "../indexeddb/LineageDTO.js";
export class NeDBKnowledgeLineageRepository {
    store;
    constructor(filename) {
        this.store = new NeDBStore(filename);
    }
    async save(entity) {
        await this.store.put(entity.id.value, toDTO(entity));
    }
    async findById(id) {
        const dto = await this.store.get(id.value);
        return dto ? fromDTO(dto) : null;
    }
    async delete(id) {
        await this.store.remove(id.value);
    }
    async findBySemanticUnitId(semanticUnitId) {
        const found = await this.store.findOne((d) => d.semanticUnitId === semanticUnitId);
        return found ? fromDTO(found) : null;
    }
}
//# sourceMappingURL=NeDBKnowledgeLineageRepository.js.map