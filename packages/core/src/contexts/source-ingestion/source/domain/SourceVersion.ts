import { ValueObject } from "../../../../shared/domain/index";

interface SourceVersionProps {
  version: number;
  contentHash: string;
  extractedAt: Date;
}

/**
 * Represents a version of a source's extracted content.
 * Only stores the hash, not the content itself.
 * The actual content is stored in ExtractionJob.
 */
export class SourceVersion extends ValueObject<SourceVersionProps> {
  get version(): number {
    return this.props.version;
  }

  get contentHash(): string {
    return this.props.contentHash;
  }

  get extractedAt(): Date {
    return this.props.extractedAt;
  }

  static initial(contentHash: string): SourceVersion {
    return new SourceVersion({
      version: 1,
      contentHash,
      extractedAt: new Date(),
    });
  }

  next(contentHash: string): SourceVersion {
    return new SourceVersion({
      version: this.props.version + 1,
      contentHash,
      extractedAt: new Date(),
    });
  }

  hasChanged(otherHash: string): boolean {
    return this.props.contentHash !== otherHash;
  }
}
