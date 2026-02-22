import { UniqueId } from "../../../../shared/domain/index.js";

export class ProcessingProfileId extends UniqueId {
  static create(value: string): ProcessingProfileId {
    return new ProcessingProfileId({ value });
  }
}
