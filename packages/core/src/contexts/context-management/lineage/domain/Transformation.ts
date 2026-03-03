import { ValueObject } from "../../../../shared/domain";

export const TransformationType = {
  Extraction: "EXTRACTION",
  Chunking: "CHUNKING",
  Enrichment: "ENRICHMENT",
  Embedding: "EMBEDDING",
  Merge: "MERGE",
  Split: "SPLIT",
} as const;

export type TransformationType = (typeof TransformationType)[keyof typeof TransformationType];

interface TransformationProps {
  type: TransformationType;
  appliedAt: Date;
  strategyUsed: string;
  inputVersion: number;
  outputVersion: number;
  parameters: Readonly<Record<string, unknown>>;
}

export class Transformation extends ValueObject<TransformationProps> {
  get type(): TransformationType {
    return this.props.type;
  }

  get appliedAt(): Date {
    return this.props.appliedAt;
  }

  get strategyUsed(): string {
    return this.props.strategyUsed;
  }

  get inputVersion(): number {
    return this.props.inputVersion;
  }

  get outputVersion(): number {
    return this.props.outputVersion;
  }

  get parameters(): Readonly<Record<string, unknown>> {
    return this.props.parameters;
  }

  static create(
    type: TransformationType,
    strategyUsed: string,
    inputVersion: number,
    outputVersion: number,
    parameters: Record<string, unknown> = {},
  ): Transformation {
    if (!strategyUsed) throw new Error("Transformation strategyUsed is required");
    return new Transformation({
      type,
      appliedAt: new Date(),
      strategyUsed,
      inputVersion,
      outputVersion,
      parameters: { ...parameters },
    });
  }
}
