import { ValueObject } from "../../../shared/domain/index.js";

interface QueryProps {
  text: string;
  topK: number;
  filters: Readonly<Record<string, unknown>>;
  minScore: number;
}

export class Query extends ValueObject<QueryProps> {
  get text(): string {
    return this.props.text;
  }

  get topK(): number {
    return this.props.topK;
  }

  get filters(): Readonly<Record<string, unknown>> {
    return this.props.filters;
  }

  get minScore(): number {
    return this.props.minScore;
  }

  static create(
    text: string,
    topK: number = 10,
    filters: Record<string, unknown> = {},
    minScore: number = 0.0,
  ): Query {
    if (!text || text.trim().length === 0) {
      throw new Error("Query text cannot be empty");
    }
    if (topK < 1) {
      throw new Error("Query topK must be at least 1");
    }
    if (minScore < 0 || minScore > 1) {
      throw new Error("Query minScore must be between 0 and 1");
    }
    return new Query({ text, topK, filters: { ...filters }, minScore });
  }
}
