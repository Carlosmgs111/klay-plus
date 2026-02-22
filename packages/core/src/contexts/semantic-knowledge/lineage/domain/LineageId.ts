import { UniqueId } from "../../../../shared/domain/index.js";

export class LineageId extends UniqueId {
  static override create(value: string): LineageId {
    if (!value || value.trim().length === 0) {
      throw new Error("LineageId cannot be empty");
    }
    return new LineageId({ value });
  }
}
