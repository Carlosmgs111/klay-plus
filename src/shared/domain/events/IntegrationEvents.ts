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

// ─── Source Ingestion → Semantic Knowledge ─────────────────────────

export interface SourceExtractedEvent {
  readonly eventType: "source-ingestion.source.extracted";
  readonly sourceId: string;
  readonly sourceType: string;
  readonly rawContent: string;
  readonly contentHash: string;
  readonly version: number;
  readonly extractedAt: Date;
}

// ─── Semantic Knowledge → Semantic Processing ──────────────────────

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

// ─── Semantic Processing → Knowledge Retrieval ─────────────────────

export interface ProjectionGeneratedEvent {
  readonly eventType: "semantic-processing.projection.generated";
  readonly projectionId: string;
  readonly semanticUnitId: string;
  readonly semanticUnitVersion: number;
  readonly projectionType: string;
  readonly strategyId: string;
}

// ─── Union type for all integration events ─────────────────────────

export type IntegrationEvent =
  | SourceExtractedEvent
  | SemanticUnitCreatedEvent
  | SemanticUnitVersionedEvent
  | SemanticUnitReprocessRequestedEvent
  | ProjectionGeneratedEvent;
