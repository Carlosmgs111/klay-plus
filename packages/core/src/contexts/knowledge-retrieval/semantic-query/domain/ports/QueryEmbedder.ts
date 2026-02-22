export interface QueryEmbedder {
  embed(text: string): Promise<number[]>;
}
