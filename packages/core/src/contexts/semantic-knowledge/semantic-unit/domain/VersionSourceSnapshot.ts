import { ValueObject } from "../../../../shared/domain";

interface VersionSourceSnapshotProps {
  sourceId: string;
  contentHash: string;
  projectionIds: ReadonlyArray<string>;
}

export class VersionSourceSnapshot extends ValueObject<VersionSourceSnapshotProps> {
  get sourceId(): string {
    return this.props.sourceId;
  }

  get contentHash(): string {
    return this.props.contentHash;
  }

  get projectionIds(): ReadonlyArray<string> {
    return this.props.projectionIds;
  }

  static create(
    sourceId: string,
    contentHash: string,
    projectionIds: string[] = [],
  ): VersionSourceSnapshot {
    if (!sourceId) throw new Error("VersionSourceSnapshot sourceId is required");
    if (!contentHash) throw new Error("VersionSourceSnapshot contentHash is required");

    return new VersionSourceSnapshot({
      sourceId,
      contentHash,
      projectionIds: [...projectionIds],
    });
  }

  withProjectionId(projectionId: string): VersionSourceSnapshot {
    return new VersionSourceSnapshot({
      ...this.props,
      projectionIds: [...this.props.projectionIds, projectionId],
    });
  }
}
