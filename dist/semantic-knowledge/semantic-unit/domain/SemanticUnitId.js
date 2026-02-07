import { UniqueId } from "../../../shared/domain/index.js";
export class SemanticUnitId extends UniqueId {
    static create(value) {
        if (!value || value.trim().length === 0) {
            throw new Error("SemanticUnitId cannot be empty");
        }
        return new SemanticUnitId({ value });
    }
}
//# sourceMappingURL=SemanticUnitId.js.map