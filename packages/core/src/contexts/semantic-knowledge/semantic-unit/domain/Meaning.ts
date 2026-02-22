import { ValueObject } from "../../../../shared/domain/index.js";

interface MeaningProps {
  content: string;
  summary: string | null;
  language: string;
  topics: ReadonlyArray<string>;
}

export class Meaning extends ValueObject<MeaningProps> {
  get content(): string {
    return this.props.content;
  }

  get summary(): string | null {
    return this.props.summary;
  }

  get language(): string {
    return this.props.language;
  }

  get topics(): ReadonlyArray<string> {
    return this.props.topics;
  }

  static create(
    content: string,
    language: string,
    topics: string[] = [],
    summary: string | null = null,
  ): Meaning {
    if (!content || content.trim().length === 0) {
      throw new Error("Meaning content cannot be empty");
    }
    if (!language) throw new Error("Meaning language is required");
    return new Meaning({ content, summary, language, topics: [...topics] });
  }
}
