import { UniqueId } from "../../../../shared/domain/index";

export class SourceId extends UniqueId {
  static override create(value: string): SourceId {
    if (!value || value.trim().length === 0) {
      throw new Error("SourceId cannot be empty");
    }
    return new SourceId({ value });
  }
}
