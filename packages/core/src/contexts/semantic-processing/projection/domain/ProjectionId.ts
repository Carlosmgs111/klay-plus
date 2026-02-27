import { UniqueId } from "../../../../shared/domain";

export class ProjectionId extends UniqueId {
  static override create(value: string): ProjectionId {
    if (!value || value.trim().length === 0) {
      throw new Error("ProjectionId cannot be empty");
    }
    return new ProjectionId({ value });
  }
}
