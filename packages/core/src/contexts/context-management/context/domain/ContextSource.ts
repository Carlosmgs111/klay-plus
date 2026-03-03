import { ValueObject } from "../../../../shared/domain";

interface ContextSourceProps {
  sourceId: string;
  sourceKnowledgeId: string;
  addedAt: Date;
}

/**
 * Lightweight reference to a source within a Context.
 * Unlike UnitSource, this does NOT contain extracted content — content
 * is managed by the source-knowledge bounded context.
 */
export class ContextSource extends ValueObject<ContextSourceProps> {
  get sourceId(): string {
    return this.props.sourceId;
  }

  get sourceKnowledgeId(): string {
    return this.props.sourceKnowledgeId;
  }

  get addedAt(): Date {
    return this.props.addedAt;
  }

  static create(sourceId: string, sourceKnowledgeId: string): ContextSource {
    if (!sourceId || sourceId.trim().length === 0) {
      throw new Error("ContextSource sourceId is required");
    }
    if (!sourceKnowledgeId || sourceKnowledgeId.trim().length === 0) {
      throw new Error("ContextSource sourceKnowledgeId is required");
    }

    return new ContextSource({
      sourceId,
      sourceKnowledgeId,
      addedAt: new Date(),
    });
  }

  static reconstitute(
    sourceId: string,
    sourceKnowledgeId: string,
    addedAt: Date,
  ): ContextSource {
    return new ContextSource({
      sourceId,
      sourceKnowledgeId,
      addedAt,
    });
  }
}
