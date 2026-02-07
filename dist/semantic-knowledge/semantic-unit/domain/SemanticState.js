export const SemanticState = {
    Draft: "DRAFT",
    Active: "ACTIVE",
    Deprecated: "DEPRECATED",
    Archived: "ARCHIVED",
};
export function canTransition(from, to) {
    const transitions = {
        [SemanticState.Draft]: [SemanticState.Active],
        [SemanticState.Active]: [SemanticState.Deprecated, SemanticState.Archived],
        [SemanticState.Deprecated]: [SemanticState.Active, SemanticState.Archived],
        [SemanticState.Archived]: [],
    };
    return transitions[from].includes(to);
}
//# sourceMappingURL=SemanticState.js.map