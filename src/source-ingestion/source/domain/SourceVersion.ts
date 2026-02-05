import { ValueObject } from "../../../shared/domain/index.js";

interface SourceVersionProps {
  version: number;
  rawContent: string;
  contentHash: string;
  extractedAt: Date;
  sizeBytes: number;
}

export class SourceVersion extends ValueObject<SourceVersionProps> {
  get version(): number {
    return this.props.version;
  }

  get rawContent(): string {
    return this.props.rawContent;
  }

  get contentHash(): string {
    return this.props.contentHash;
  }

  get extractedAt(): Date {
    return this.props.extractedAt;
  }

  get sizeBytes(): number {
    return this.props.sizeBytes;
  }

  static initial(rawContent: string, contentHash: string): SourceVersion {
    return new SourceVersion({
      version: 1,
      rawContent,
      contentHash,
      extractedAt: new Date(),
      sizeBytes: new TextEncoder().encode(rawContent).length,
    });
  }

  next(rawContent: string, contentHash: string): SourceVersion {
    return new SourceVersion({
      version: this.props.version + 1,
      rawContent,
      contentHash,
      extractedAt: new Date(),
      sizeBytes: new TextEncoder().encode(rawContent).length,
    });
  }

  hasChanged(otherHash: string): boolean {
    return this.props.contentHash !== otherHash;
  }
}
