import { ValueObject } from "../../../../shared/domain/index.js";

interface UnitMetadataProps {
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tags: ReadonlyArray<string>;
  attributes: Readonly<Record<string, string>>;
}

export class UnitMetadata extends ValueObject<UnitMetadataProps> {
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
  ): UnitMetadata {
    if (!createdBy) throw new Error("UnitMetadata createdBy is required");
    const now = new Date();
    return new UnitMetadata({
      createdAt: now,
      updatedAt: now,
      createdBy,
      tags: [...tags],
      attributes: { ...attributes },
    });
  }

  withUpdatedTimestamp(): UnitMetadata {
    return new UnitMetadata({
      ...this.props,
      updatedAt: new Date(),
    });
  }
}
