import { UniqueId } from "../../../../shared/domain/index";

export class ProcessingProfileId extends UniqueId {
  static create(value: string): ProcessingProfileId {
    return new ProcessingProfileId({ value });
  }
}
