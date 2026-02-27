import { UniqueId } from "../../../../shared/domain";

export class ResourceId extends UniqueId {
  static override create(value: string): ResourceId {
    if (!value || value.trim().length === 0) {
      throw new Error("ResourceId cannot be empty");
    }
    return new ResourceId({ value });
  }
}
