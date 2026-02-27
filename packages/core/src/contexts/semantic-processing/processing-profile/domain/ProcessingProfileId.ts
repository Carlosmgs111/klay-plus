import { UniqueId } from "../../../../shared/domain";

export class ProcessingProfileId extends UniqueId {
  static create(value: string): ProcessingProfileId {
    return new ProcessingProfileId({ value });
  }
}
