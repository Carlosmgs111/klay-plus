import { ValueObject } from "../../../shared/domain/index.js";

interface TraceProps {
  fromUnitId: string;
  toUnitId: string;
  relationship: string;
  createdAt: Date;
}

export class Trace extends ValueObject<TraceProps> {
  get fromUnitId(): string {
    return this.props.fromUnitId;
  }

  get toUnitId(): string {
    return this.props.toUnitId;
  }

  get relationship(): string {
    return this.props.relationship;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  static create(fromUnitId: string, toUnitId: string, relationship: string): Trace {
    if (!fromUnitId) throw new Error("Trace fromUnitId is required");
    if (!toUnitId) throw new Error("Trace toUnitId is required");
    if (!relationship) throw new Error("Trace relationship is required");
    return new Trace({
      fromUnitId,
      toUnitId,
      relationship,
      createdAt: new Date(),
    });
  }
}
