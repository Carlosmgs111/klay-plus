import { UniqueId } from "../../../shared/domain/index.js";
export class LineageId extends UniqueId {
    static create(value) {
        if (!value || value.trim().length === 0) {
            throw new Error("LineageId cannot be empty");
        }
        return new LineageId({ value });
    }
}
//# sourceMappingURL=LineageId.js.map