/**
 * Integration events define the cross-context communication contracts.
 *
 * Flow:
 *   SourceExtracted (Source Ingestion)
 *     → SemanticUnitCreated (Semantic Knowledge)
 *       → ProjectionGenerated (Semantic Processing)
 *
 * Each context listens to events from other contexts via these contracts.
 * No shared repositories, no cross-context entity references, no coupled infrastructure.
 */
export interface SourceExtractedEvent {
    readonly eventType: "source-ingestion.source.extracted";
    readonly sourceId: string;
    readonly sourceType: string;
    readonly rawContent: string;
    readonly contentHash: string;
    readonly version: number;
    readonly extractedAt: Date;
}
export interface SemanticUnitCreatedEvent {
    readonly eventType: "semantic-knowledge.semantic-unit.created";
    readonly semanticUnitId: string;
    readonly content: string;
    readonly language: string;
    readonly version: number;
    readonly sourceId: string;
    readonly sourceType: string;
}
export interface SemanticUnitVersionedEvent {
    readonly eventType: "semantic-knowledge.semantic-unit.versioned";
    readonly semanticUnitId: string;
    readonly content: string;
    readonly version: number;
    readonly reason: string;
}
export interface SemanticUnitReprocessRequestedEvent {
    readonly eventType: "semantic-knowledge.semantic-unit.reprocess-requested";
    readonly semanticUnitId: string;
    readonly currentVersion: number;
    readonly reason: string;
}
export interface ProjectionGeneratedEvent {
    readonly eventType: "semantic-processing.projection.generated";
    readonly projectionId: string;
    readonly semanticUnitId: string;
    readonly semanticUnitVersion: number;
    readonly projectionType: string;
    readonly strategyId: string;
}
export type IntegrationEvent = SourceExtractedEvent | SemanticUnitCreatedEvent | SemanticUnitVersionedEvent | SemanticUnitReprocessRequestedEvent | ProjectionGeneratedEvent;
//# sourceMappingURL=IntegrationEvents.d.ts.map