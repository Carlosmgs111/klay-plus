import { UniqueId } from "../../../shared/domain/index.js";
export class QueryId extends UniqueId {
    static create(value) {
        if (!value || value.trim().length === 0) {
            throw new Error("QueryId cannot be empty");
        }
        return new QueryId({ value });
    }
}
//# sourceMappingURL=QueryId.js.map