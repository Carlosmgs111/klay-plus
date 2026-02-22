import { ValueObject } from "../../../../shared/domain/index.js";

interface RetrievalItemProps {
  semanticUnitId: string;
  content: string;
  score: number;
  version: number;
  metadata: Readonly<Record<string, unknown>>;
}

export class RetrievalItem extends ValueObject<RetrievalItemProps> {
  get semanticUnitId(): string {
    return this.props.semanticUnitId;
  }

  get content(): string {
    return this.props.content;
  }

  get score(): number {
    return this.props.score;
  }

  get version(): number {
    return this.props.version;
  }

  get metadata(): Readonly<Record<string, unknown>> {
    return this.props.metadata;
  }

  static create(
    semanticUnitId: string,
    content: string,
    score: number,
    version: number,
    metadata: Record<string, unknown> = {},
  ): RetrievalItem {
    return new RetrievalItem({
      semanticUnitId,
      content,
      score,
      version,
      metadata: { ...metadata },
    });
  }
}

interface RetrievalResultProps {
  queryText: string;
  items: ReadonlyArray<RetrievalItem>;
  totalFound: number;
  executedAt: Date;
}

export class RetrievalResult extends ValueObject<RetrievalResultProps> {
  get queryText(): string {
    return this.props.queryText;
  }

  get items(): ReadonlyArray<RetrievalItem> {
    return this.props.items;
  }

  get totalFound(): number {
    return this.props.totalFound;
  }

  get executedAt(): Date {
    return this.props.executedAt;
  }

  static create(
    queryText: string,
    items: RetrievalItem[],
    totalFound: number,
  ): RetrievalResult {
    return new RetrievalResult({
      queryText,
      items: [...items],
      totalFound,
      executedAt: new Date(),
    });
  }

  isEmpty(): boolean {
    return this.props.items.length === 0;
  }
}
