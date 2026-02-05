import { ValueObject } from "../../../shared/domain/index.js";

interface OriginProps {
  sourceId: string;
  extractedAt: Date;
  sourceType: string;
}

export class Origin extends ValueObject<OriginProps> {
  get sourceId(): string {
    return this.props.sourceId;
  }

  get extractedAt(): Date {
    return this.props.extractedAt;
  }

  get sourceType(): string {
    return this.props.sourceType;
  }

  static create(sourceId: string, extractedAt: Date, sourceType: string): Origin {
    if (!sourceId) throw new Error("Origin sourceId is required");
    if (!sourceType) throw new Error("Origin sourceType is required");
    return new Origin({ sourceId, extractedAt, sourceType });
  }
}
