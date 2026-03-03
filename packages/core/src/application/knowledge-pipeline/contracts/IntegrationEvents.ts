/**
 * Integration events define the cross-context communication contracts.
 *
 * Flow:
 *   SourceExtracted (Source Ingestion)
 *     -> SourceKnowledgeCreated (Source Knowledge)
 *       -> ProjectionGenerated (Semantic Processing)
 *         -> (Optional) ContextSourceAdded (Context Management)
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

export interface SourceKnowledgeCreatedEvent {
  readonly eventType: "source-knowledge.source-knowledge.created";
  readonly sourceKnowledgeId: string;
  readonly sourceId: string;
  readonly contentHash: string;
  readonly defaultProfileId: string;
}

export interface ProjectionGeneratedEvent {
  readonly eventType: "semantic-processing.projection.generated";
  readonly projectionId: string;
  readonly sourceId: string;
  readonly projectionType: string;
  readonly processingProfileId: string;
}

export interface ProjectionFailedEvent {
  readonly eventType: "semantic-processing.projection.failed";
  readonly projectionId: string;
  readonly sourceId: string;
  readonly error: string;
}

export interface ContextSourceAddedEvent {
  readonly eventType: "context-management.context.source-added";
  readonly contextId: string;
  readonly sourceId: string;
  readonly sourceKnowledgeId: string;
}

export type IntegrationEvent =
  | SourceExtractedEvent
  | SourceKnowledgeCreatedEvent
  | ProjectionGeneratedEvent
  | ProjectionFailedEvent
  | ContextSourceAddedEvent;
