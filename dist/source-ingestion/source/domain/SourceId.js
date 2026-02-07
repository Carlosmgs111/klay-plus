import { UniqueId } from "../../../shared/domain/index.js";
export class SourceId extends UniqueId {
    static create(value) {
        if (!value || value.trim().length === 0) {
            throw new Error("SourceId cannot be empty");
        }
        return new SourceId({ value });
    }
}
//# sourceMappingURL=SourceId.js.map