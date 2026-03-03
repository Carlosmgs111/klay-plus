import { UniqueId } from "../../../../shared/domain";

export class ContextId extends UniqueId {
  static override create(value: string): ContextId {
    if (!value || value.trim().length === 0) {
      throw new Error("ContextId cannot be empty");
    }
    return new ContextId({ value });
  }
}
