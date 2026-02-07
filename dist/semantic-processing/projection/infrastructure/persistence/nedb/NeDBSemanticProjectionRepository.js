import { NeDBStore } from "../../../../../shared/infrastructure/nedb/NeDBStore.js";
import { toDTO, fromDTO } from "../indexeddb/ProjectionDTO.js";
export class NeDBSemanticProjectionRepository {
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
        const results = await this.store.find((d) => d.semanticUnitId === semanticUnitId);
        return results.map(fromDTO);
    }
    async findBySemanticUnitIdAndType(semanticUnitId, type) {
        const found = await this.store.findOne((d) => d.semanticUnitId === semanticUnitId && d.type === type);
        return found ? fromDTO(found) : null;
    }
    async findByStatus(status) {
        const results = await this.store.find((d) => d.status === status);
        return results.map(fromDTO);
    }
}
//# sourceMappingURL=NeDBSemanticProjectionRepository.js.map