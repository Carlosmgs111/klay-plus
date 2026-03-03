import { UniqueId } from "../../../../shared/domain";

export class SourceKnowledgeId extends UniqueId {
  static override create(value: string): SourceKnowledgeId {
    if (!value || value.trim().length === 0) {
      throw new Error("SourceKnowledgeId cannot be empty");
    }
    return new SourceKnowledgeId({ value });
  }
}
