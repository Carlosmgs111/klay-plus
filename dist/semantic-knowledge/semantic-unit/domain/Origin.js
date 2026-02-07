import { ValueObject } from "../../../shared/domain/index.js";
export class Origin extends ValueObject {
    get sourceId() {
        return this.props.sourceId;
    }
    get extractedAt() {
        return this.props.extractedAt;
    }
    get sourceType() {
        return this.props.sourceType;
    }
    static create(sourceId, extractedAt, sourceType) {
        if (!sourceId)
            throw new Error("Origin sourceId is required");
        if (!sourceType)
            throw new Error("Origin sourceType is required");
        return new Origin({ sourceId, extractedAt, sourceType });
    }
}
//# sourceMappingURL=Origin.js.map