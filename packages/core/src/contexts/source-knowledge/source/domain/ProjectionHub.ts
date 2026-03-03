import { ValueObject } from "../../../../shared/domain";

export interface ProjectionEntry {
  projectionId: string;
  profileId: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  generatedAt: Date;
}

interface ProjectionHubProps {
  projections: ReadonlyArray<ProjectionEntry>;
}

export class ProjectionHub extends ValueObject<ProjectionHubProps> {
  get projections(): ReadonlyArray<ProjectionEntry> {
    return this.props.projections;
  }

  hasProjectionForProfile(profileId: string): boolean {
    return this.props.projections.some((p) => p.profileId === profileId);
  }

  getProjectionForProfile(profileId: string): ProjectionEntry | undefined {
    return this.props.projections.find((p) => p.profileId === profileId);
  }

  withProjection(entry: ProjectionEntry): ProjectionHub {
    const filtered = this.props.projections.filter(
      (p) => p.profileId !== entry.profileId,
    );
    return new ProjectionHub({ projections: [...filtered, entry] });
  }

  static create(): ProjectionHub {
    return new ProjectionHub({ projections: [] });
  }

  static reconstitute(projections: ProjectionEntry[]): ProjectionHub {
    return new ProjectionHub({ projections: [...projections] });
  }
}
