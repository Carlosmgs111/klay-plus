export const SemanticState = {
  Draft: "DRAFT",
  Active: "ACTIVE",
  Deprecated: "DEPRECATED",
  Archived: "ARCHIVED",
} as const;

export type SemanticState = (typeof SemanticState)[keyof typeof SemanticState];

export function canTransition(from: SemanticState, to: SemanticState): boolean {
  const transitions: Record<SemanticState, SemanticState[]> = {
    [SemanticState.Draft]: [SemanticState.Active],
    [SemanticState.Active]: [SemanticState.Deprecated, SemanticState.Archived],
    [SemanticState.Deprecated]: [SemanticState.Active, SemanticState.Archived],
    [SemanticState.Archived]: [],
  };

  return transitions[from].includes(to);
}
