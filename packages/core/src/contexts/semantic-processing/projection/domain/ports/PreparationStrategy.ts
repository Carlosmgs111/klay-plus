export interface PreparationStrategy {
  readonly strategyId: string;
  readonly version: number;
  prepare(content: string): Promise<string>;
}
