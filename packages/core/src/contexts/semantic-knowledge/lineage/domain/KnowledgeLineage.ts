import { AggregateRoot } from "../../../../shared/domain";
import { LineageId } from "./LineageId";
import { Transformation } from "./Transformation";
import { Trace } from "./Trace";

export class KnowledgeLineage extends AggregateRoot<LineageId> {
  private _semanticUnitId: string;
  private _transformations: Transformation[];
  private _traces: Trace[];

  private constructor(
    id: LineageId,
    semanticUnitId: string,
    transformations: Transformation[],
    traces: Trace[],
  ) {
    super(id);
    this._semanticUnitId = semanticUnitId;
    this._transformations = transformations;
    this._traces = traces;
  }

  get semanticUnitId(): string {
    return this._semanticUnitId;
  }

  get transformations(): ReadonlyArray<Transformation> {
    return [...this._transformations];
  }

  get traces(): ReadonlyArray<Trace> {
    return [...this._traces];
  }

  static create(id: LineageId, semanticUnitId: string): KnowledgeLineage {
    if (!semanticUnitId) throw new Error("semanticUnitId is required");
    return new KnowledgeLineage(id, semanticUnitId, [], []);
  }

  static reconstitute(
    id: LineageId,
    semanticUnitId: string,
    transformations: Transformation[],
    traces: Trace[],
  ): KnowledgeLineage {
    return new KnowledgeLineage(id, semanticUnitId, transformations, traces);
  }

  registerTransformation(transformation: Transformation): void {
    this._transformations.push(transformation);
  }

  addTrace(trace: Trace): void {
    this._traces.push(trace);
  }
}
