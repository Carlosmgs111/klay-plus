import { UniqueId } from "../../../shared/domain/index.js";
export class ExtractionJobId extends UniqueId {
    static create(value) {
        if (!value || value.trim().length === 0) {
            throw new Error("ExtractionJobId cannot be empty");
        }
        return new ExtractionJobId({ value });
    }
}
//# sourceMappingURL=ExtractionJobId.js.map