import { AggregateRoot } from "../../../shared/domain/index.js";
export class KnowledgeLineage extends AggregateRoot {
    _semanticUnitId;
    _transformations;
    _traces;
    constructor(id, semanticUnitId, transformations, traces) {
        super(id);
        this._semanticUnitId = semanticUnitId;
        this._transformations = transformations;
        this._traces = traces;
    }
    get semanticUnitId() {
        return this._semanticUnitId;
    }
    get transformations() {
        return [...this._transformations];
    }
    get traces() {
        return [...this._traces];
    }
    static create(id, semanticUnitId) {
        if (!semanticUnitId)
            throw new Error("semanticUnitId is required");
        return new KnowledgeLineage(id, semanticUnitId, [], []);
    }
    static reconstitute(id, semanticUnitId, transformations, traces) {
        return new KnowledgeLineage(id, semanticUnitId, transformations, traces);
    }
    registerTransformation(transformation) {
        this._transformations.push(transformation);
    }
    addTrace(trace) {
        this._traces.push(trace);
    }
}
//# sourceMappingURL=KnowledgeLineage.js.map