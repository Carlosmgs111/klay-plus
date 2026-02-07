import { ValueObject } from "../../../shared/domain/index.js";
export class Trace extends ValueObject {
    get fromUnitId() {
        return this.props.fromUnitId;
    }
    get toUnitId() {
        return this.props.toUnitId;
    }
    get relationship() {
        return this.props.relationship;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    static create(fromUnitId, toUnitId, relationship) {
        if (!fromUnitId)
            throw new Error("Trace fromUnitId is required");
        if (!toUnitId)
            throw new Error("Trace toUnitId is required");
        if (!relationship)
            throw new Error("Trace relationship is required");
        return new Trace({
            fromUnitId,
            toUnitId,
            relationship,
            createdAt: new Date(),
        });
    }
}
//# sourceMappingURL=Trace.js.map