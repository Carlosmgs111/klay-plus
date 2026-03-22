import { ValueObject } from "../../../../shared/domain";

interface ContextSourceProps {
  sourceId: string;
  sourceKnowledgeId: string;
  projectionId?: string;
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
    return this.props.sourceKnowledgeId ?? `sk-${this.props.sourceId}`;
  }

  get projectionId(): string | undefined {
    return this.props.projectionId;
  }

  get addedAt(): Date {
    return this.props.addedAt;
  }

  static create(sourceId: string, sourceKnowledgeId?: string, projectionId?: string): ContextSource {
    if (!sourceId || sourceId.trim().length === 0) {
      throw new Error("ContextSource sourceId is required");
    }

    return new ContextSource({
      sourceId,
      sourceKnowledgeId: sourceKnowledgeId || `sk-${sourceId}`,
      projectionId,
      addedAt: new Date(),
    });
  }

  static reconstitute(
    sourceId: string,
    sourceKnowledgeId: string,
    addedAt: Date,
    projectionId?: string,
  ): ContextSource {
    return new ContextSource({
      sourceId,
      sourceKnowledgeId,
      projectionId,
      addedAt,
    });
  }
}
