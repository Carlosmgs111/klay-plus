import { ValueObject } from "../../../../shared/domain";

interface TraceProps {
  fromContextId: string;
  toContextId: string;
  relationship: string;
  createdAt: Date;
}

export class Trace extends ValueObject<TraceProps> {
  get fromContextId(): string {
    return this.props.fromContextId;
  }

  get toContextId(): string {
    return this.props.toContextId;
  }

  get relationship(): string {
    return this.props.relationship;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  static create(fromContextId: string, toContextId: string, relationship: string): Trace {
    if (!fromContextId) throw new Error("Trace fromContextId is required");
    if (!toContextId) throw new Error("Trace toContextId is required");
    if (!relationship) throw new Error("Trace relationship is required");
    return new Trace({
      fromContextId,
      toContextId,
      relationship,
      createdAt: new Date(),
    });
  }

  static reconstitute(
    fromContextId: string,
    toContextId: string,
    relationship: string,
    createdAt: Date,
  ): Trace {
    return new Trace({ fromContextId, toContextId, relationship, createdAt });
  }
}
