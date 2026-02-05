import { ValueObject } from "../../../shared/domain/index.js";
import type { ProjectionType } from "./ProjectionType.js";

interface ProjectionResultProps {
  type: ProjectionType;
  data: unknown;
  strategyId: string;
  strategyVersion: number;
  generatedAt: Date;
}

export class ProjectionResult extends ValueObject<ProjectionResultProps> {
  get type(): ProjectionType {
    return this.props.type;
  }

  get data(): unknown {
    return this.props.data;
  }

  get strategyId(): string {
    return this.props.strategyId;
  }

  get strategyVersion(): number {
    return this.props.strategyVersion;
  }

  get generatedAt(): Date {
    return this.props.generatedAt;
  }

  static create(
    type: ProjectionType,
    data: unknown,
    strategyId: string,
    strategyVersion: number,
  ): ProjectionResult {
    if (!strategyId) throw new Error("ProjectionResult strategyId is required");
    return new ProjectionResult({
      type,
      data,
      strategyId,
      strategyVersion,
      generatedAt: new Date(),
    });
  }
}
