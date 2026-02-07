import { UniqueId } from "../../../shared/domain/index.js";
export class ProjectionId extends UniqueId {
    static create(value) {
        if (!value || value.trim().length === 0) {
            throw new Error("ProjectionId cannot be empty");
        }
        return new ProjectionId({ value });
    }
}
//# sourceMappingURL=ProjectionId.js.map