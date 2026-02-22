import { ValueObject } from "../../../../shared/domain/index";
import type { ProjectionType } from "./ProjectionType.js";

interface ProjectionResultProps {
  type: ProjectionType;
  data: unknown;
  processingProfileId: string;
  processingProfileVersion: number;
  generatedAt: Date;
}

export class ProjectionResult extends ValueObject<ProjectionResultProps> {
  get type(): ProjectionType {
    return this.props.type;
  }

  get data(): unknown {
    return this.props.data;
  }

  get processingProfileId(): string {
    return this.props.processingProfileId;
  }

  get processingProfileVersion(): number {
    return this.props.processingProfileVersion;
  }

  get generatedAt(): Date {
    return this.props.generatedAt;
  }

  static create(
    type: ProjectionType,
    data: unknown,
    processingProfileId: string,
    processingProfileVersion: number,
  ): ProjectionResult {
    if (!processingProfileId) throw new Error("ProjectionResult processingProfileId is required");
    return new ProjectionResult({
      type,
      data,
      processingProfileId,
      processingProfileVersion,
      generatedAt: new Date(),
    });
  }
}
