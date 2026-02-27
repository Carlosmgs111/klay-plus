import { ValueObject } from "../../../../shared/domain";
import type { VersionSourceSnapshot } from "./VersionSourceSnapshot";

interface UnitVersionProps {
  version: number;
  processingProfileId: string;
  processingProfileVersion: number;
  sourceSnapshots: ReadonlyArray<VersionSourceSnapshot>;
  createdAt: Date;
  reason: string;
}

export class UnitVersion extends ValueObject<UnitVersionProps> {
  get version(): number {
    return this.props.version;
  }

  get processingProfileId(): string {
    return this.props.processingProfileId;
  }

  get processingProfileVersion(): number {
    return this.props.processingProfileVersion;
  }

  get sourceSnapshots(): ReadonlyArray<VersionSourceSnapshot> {
    return this.props.sourceSnapshots;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get reason(): string {
    return this.props.reason;
  }

  static initial(
    processingProfileId: string,
    processingProfileVersion: number,
    sourceSnapshots: VersionSourceSnapshot[],
  ): UnitVersion {
    return new UnitVersion({
      version: 1,
      processingProfileId,
      processingProfileVersion,
      sourceSnapshots: [...sourceSnapshots],
      createdAt: new Date(),
      reason: "Initial version",
    });
  }

  next(
    processingProfileId: string,
    processingProfileVersion: number,
    sourceSnapshots: VersionSourceSnapshot[],
    reason: string,
  ): UnitVersion {
    if (!reason || reason.trim().length === 0) {
      throw new Error("Version reason is required");
    }
    return new UnitVersion({
      version: this.props.version + 1,
      processingProfileId,
      processingProfileVersion,
      sourceSnapshots: [...sourceSnapshots],
      createdAt: new Date(),
      reason,
    });
  }

  static reconstitute(
    version: number,
    processingProfileId: string,
    processingProfileVersion: number,
    sourceSnapshots: VersionSourceSnapshot[],
    createdAt: Date,
    reason: string,
  ): UnitVersion {
    return new UnitVersion({
      version,
      processingProfileId,
      processingProfileVersion,
      sourceSnapshots: [...sourceSnapshots],
      createdAt,
      reason,
    });
  }

  getSnapshotForSource(sourceId: string): VersionSourceSnapshot | undefined {
    return this.props.sourceSnapshots.find((s) => s.sourceId === sourceId);
  }

  hasSource(sourceId: string): boolean {
    return this.props.sourceSnapshots.some((s) => s.sourceId === sourceId);
  }
}
