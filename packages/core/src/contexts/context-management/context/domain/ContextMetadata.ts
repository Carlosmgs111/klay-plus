import { ValueObject } from "../../../../shared/domain";

interface ContextMetadataProps {
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tags: ReadonlyArray<string>;
  attributes: Readonly<Record<string, string>>;
}

export class ContextMetadata extends ValueObject<ContextMetadataProps> {
  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get createdBy(): string {
    return this.props.createdBy;
  }

  get tags(): ReadonlyArray<string> {
    return this.props.tags;
  }

  get attributes(): Readonly<Record<string, string>> {
    return this.props.attributes;
  }

  static create(
    createdBy: string,
    tags: string[] = [],
    attributes: Record<string, string> = {},
  ): ContextMetadata {
    if (!createdBy || createdBy.trim().length === 0) {
      throw new Error("ContextMetadata createdBy is required");
    }
    const now = new Date();
    return new ContextMetadata({
      createdAt: now,
      updatedAt: now,
      createdBy,
      tags: [...tags],
      attributes: { ...attributes },
    });
  }

  withUpdatedTimestamp(): ContextMetadata {
    return new ContextMetadata({
      ...this.props,
      updatedAt: new Date(),
    });
  }
}
