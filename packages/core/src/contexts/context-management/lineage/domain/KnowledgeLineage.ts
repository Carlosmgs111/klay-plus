import { AggregateRoot } from "../../../../shared/domain";
import { LineageId } from "./LineageId";
import { Trace } from "./Trace";

export class KnowledgeLineage extends AggregateRoot<LineageId> {
  private _contextId: string;
  private _traces: Trace[];

  private constructor(
    id: LineageId,
    contextId: string,
    traces: Trace[],
  ) {
    super(id);
    this._contextId = contextId;
    this._traces = traces;
  }

  get contextId(): string {
    return this._contextId;
  }

  get traces(): ReadonlyArray<Trace> {
    return [...this._traces];
  }

  static create(id: LineageId, contextId: string): KnowledgeLineage {
    if (!contextId) throw new Error("contextId is required");
    return new KnowledgeLineage(id, contextId, []);
  }

  static reconstitute(
    id: LineageId,
    contextId: string,
    traces: Trace[],
  ): KnowledgeLineage {
    return new KnowledgeLineage(id, contextId, traces);
  }

  addTrace(trace: Trace): void {
    this._traces.push(trace);
  }

  removeTrace(fromContextId: string, toContextId: string): boolean {
    const index = this._traces.findIndex(
      (t) => t.fromContextId === fromContextId && t.toContextId === toContextId,
    );
    if (index === -1) return false;
    this._traces.splice(index, 1);
    return true;
  }
}
