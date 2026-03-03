export const ContextState = {
  Draft: "DRAFT",
  Active: "ACTIVE",
  Deprecated: "DEPRECATED",
  Archived: "ARCHIVED",
} as const;

export type ContextState = (typeof ContextState)[keyof typeof ContextState];

export function canTransition(from: ContextState, to: ContextState): boolean {
  const transitions: Record<ContextState, ContextState[]> = {
    [ContextState.Draft]: [ContextState.Active],
    [ContextState.Active]: [ContextState.Deprecated, ContextState.Archived],
    [ContextState.Deprecated]: [ContextState.Active, ContextState.Archived],
    [ContextState.Archived]: [],
  };

  return transitions[from].includes(to);
}
