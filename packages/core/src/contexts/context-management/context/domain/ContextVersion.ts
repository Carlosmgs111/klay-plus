import { ValueObject } from "../../../../shared/domain";

interface ContextVersionProps {
  version: number;
  sourceIds: ReadonlyArray<string>;
  reason: string;
  createdAt: Date;
}

/**
 * Immutable version snapshot for a Context.
 * Tracks which sourceIds are included in each version.
 * Unlike UnitVersion, this has NO processing profile or source snapshots —
 * projections are managed by source-knowledge.
 */
export class ContextVersion extends ValueObject<ContextVersionProps> {
  get version(): number {
    return this.props.version;
  }

  get sourceIds(): ReadonlyArray<string> {
    return this.props.sourceIds;
  }

  get reason(): string {
    return this.props.reason;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  static initial(
    sourceIds: string[],
    reason?: string,
  ): ContextVersion {
    return new ContextVersion({
      version: 1,
      sourceIds: [...sourceIds],
      reason: reason ?? "Initial version",
      createdAt: new Date(),
    });
  }

  static next(
    previousVersion: number,
    sourceIds: string[],
    reason: string,
  ): ContextVersion {
    if (!reason || reason.trim().length === 0) {
      throw new Error("Version reason is required");
    }
    return new ContextVersion({
      version: previousVersion + 1,
      sourceIds: [...sourceIds],
      reason,
      createdAt: new Date(),
    });
  }

  static reconstitute(
    version: number,
    sourceIds: string[],
    reason: string,
    createdAt: Date,
  ): ContextVersion {
    return new ContextVersion({
      version,
      sourceIds: [...sourceIds],
      reason,
      createdAt,
    });
  }

  hasSource(sourceId: string): boolean {
    return this.props.sourceIds.includes(sourceId);
  }
}
