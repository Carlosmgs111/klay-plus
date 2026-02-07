import { AggregateRoot } from "../../../shared/domain/index.js";
import { LineageId } from "./LineageId.js";
import { Transformation } from "./Transformation.js";
import { Trace } from "./Trace.js";
export declare class KnowledgeLineage extends AggregateRoot<LineageId> {
    private _semanticUnitId;
    private _transformations;
    private _traces;
    private constructor();
    get semanticUnitId(): string;
    get transformations(): ReadonlyArray<Transformation>;
    get traces(): ReadonlyArray<Trace>;
    static create(id: LineageId, semanticUnitId: string): KnowledgeLineage;
    static reconstitute(id: LineageId, semanticUnitId: string, transformations: Transformation[], traces: Trace[]): KnowledgeLineage;
    registerTransformation(transformation: Transformation): void;
    addTrace(trace: Trace): void;
}
//# sourceMappingURL=KnowledgeLineage.d.ts.map