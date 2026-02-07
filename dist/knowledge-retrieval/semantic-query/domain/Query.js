import { ValueObject } from "../../../shared/domain/index.js";
export class Query extends ValueObject {
    get text() {
        return this.props.text;
    }
    get topK() {
        return this.props.topK;
    }
    get filters() {
        return this.props.filters;
    }
    get minScore() {
        return this.props.minScore;
    }
    static create(text, topK = 10, filters = {}, minScore = 0.0) {
        if (!text || text.trim().length === 0) {
            throw new Error("Query text cannot be empty");
        }
        if (topK < 1) {
            throw new Error("Query topK must be at least 1");
        }
        if (minScore < 0 || minScore > 1) {
            throw new Error("Query minScore must be between 0 and 1");
        }
        return new Query({ text, topK, filters: { ...filters }, minScore });
    }
}
//# sourceMappingURL=Query.js.map