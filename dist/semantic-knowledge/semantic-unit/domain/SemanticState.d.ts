export declare const SemanticState: {
    readonly Draft: "DRAFT";
    readonly Active: "ACTIVE";
    readonly Deprecated: "DEPRECATED";
    readonly Archived: "ARCHIVED";
};
export type SemanticState = (typeof SemanticState)[keyof typeof SemanticState];
export declare function canTransition(from: SemanticState, to: SemanticState): boolean;
//# sourceMappingURL=SemanticState.d.ts.map