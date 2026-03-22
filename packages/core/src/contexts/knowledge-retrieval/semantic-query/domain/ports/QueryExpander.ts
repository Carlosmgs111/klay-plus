export interface QueryExpander {
  expand(queryText: string): Promise<string[]>;
}
