import { ValueObject } from "../../../shared/domain/index.js";
export class RetrievalItem extends ValueObject {
    get semanticUnitId() {
        return this.props.semanticUnitId;
    }
    get content() {
        return this.props.content;
    }
    get score() {
        return this.props.score;
    }
    get version() {
        return this.props.version;
    }
    get metadata() {
        return this.props.metadata;
    }
    static create(semanticUnitId, content, score, version, metadata = {}) {
        return new RetrievalItem({
            semanticUnitId,
            content,
            score,
            version,
            metadata: { ...metadata },
        });
    }
}
export class RetrievalResult extends ValueObject {
    get queryText() {
        return this.props.queryText;
    }
    get items() {
        return this.props.items;
    }
    get totalFound() {
        return this.props.totalFound;
    }
    get executedAt() {
        return this.props.executedAt;
    }
    static create(queryText, items, totalFound) {
        return new RetrievalResult({
            queryText,
            items: [...items],
            totalFound,
            executedAt: new Date(),
        });
    }
    isEmpty() {
        return this.props.items.length === 0;
    }
}
//# sourceMappingURL=RetrievalResult.js.map