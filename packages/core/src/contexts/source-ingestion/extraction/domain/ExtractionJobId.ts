import { UniqueId } from "../../../../shared/domain";

export class ExtractionJobId extends UniqueId {
  static override create(value: string): ExtractionJobId {
    if (!value || value.trim().length === 0) {
      throw new Error("ExtractionJobId cannot be empty");
    }
    return new ExtractionJobId({ value });
  }
}
