import { ValueObject } from "../../../shared/domain/index.js";
export class ProjectionResult extends ValueObject {
    get type() {
        return this.props.type;
    }
    get data() {
        return this.props.data;
    }
    get strategyId() {
        return this.props.strategyId;
    }
    get strategyVersion() {
        return this.props.strategyVersion;
    }
    get generatedAt() {
        return this.props.generatedAt;
    }
    static create(type, data, strategyId, strategyVersion) {
        if (!strategyId)
            throw new Error("ProjectionResult strategyId is required");
        return new ProjectionResult({
            type,
            data,
            strategyId,
            strategyVersion,
            generatedAt: new Date(),
        });
    }
}
//# sourceMappingURL=ProjectionResult.js.map