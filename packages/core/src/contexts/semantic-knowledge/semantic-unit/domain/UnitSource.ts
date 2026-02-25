import { ValueObject } from "../../../../shared/domain/index.js";

interface UnitSourceProps {
  sourceId: string;
  sourceType: string;
  resourceId?: string;
  extractedContent: string;
  contentHash: string;
  addedAt: Date;
}

export class UnitSource extends ValueObject<UnitSourceProps> {
  get sourceId(): string {
    return this.props.sourceId;
  }

  get sourceType(): string {
    return this.props.sourceType;
  }

  get resourceId(): string | undefined {
    return this.props.resourceId;
  }

  get extractedContent(): string {
    return this.props.extractedContent;
  }

  get contentHash(): string {
    return this.props.contentHash;
  }

  get addedAt(): Date {
    return this.props.addedAt;
  }

  static create(
    sourceId: string,
    sourceType: string,
    extractedContent: string,
    contentHash: string,
    resourceId?: string,
  ): UnitSource {
    if (!sourceId) throw new Error("UnitSource sourceId is required");
    if (!sourceType) throw new Error("UnitSource sourceType is required");
    if (!extractedContent || extractedContent.trim().length === 0) {
      throw new Error("UnitSource extractedContent is required");
    }
    if (!contentHash) throw new Error("UnitSource contentHash is required");

    return new UnitSource({
      sourceId,
      sourceType,
      resourceId,
      extractedContent,
      contentHash,
      addedAt: new Date(),
    });
  }

  static reconstitute(
    sourceId: string,
    sourceType: string,
    extractedContent: string,
    contentHash: string,
    addedAt: Date,
    resourceId?: string,
  ): UnitSource {
    return new UnitSource({
      sourceId,
      sourceType,
      resourceId,
      extractedContent,
      contentHash,
      addedAt,
    });
  }
}
