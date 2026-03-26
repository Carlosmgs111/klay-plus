import type { Result } from "../../../../../shared/domain/Result";
import type { DomainError } from "../../../../../shared/domain/errors";
import type { ProjectionType } from "../../domain/ProjectionType";

export interface ExistingProjectionInfo {
  projectionId: string;
  processingProfileId: string;
  chunksCount: number;
  dimensions: number;
  model: string;
}

export interface ProcessContentInput {
  projectionId: string;
  sourceId: string;
  content: string;
  type: ProjectionType;
  processingProfileId: string;
}

export interface ProcessContentSuccess {
  projectionId: string;
  chunksCount: number;
  dimensions: number;
  model: string;
  processingProfileVersion: number;
}

/**
 * Projection operations — semantic-processing capability.
 *
 * Facade over find, cleanup, and generate projection use cases.
 * Consumed by application-layer orchestrators (ProcessKnowledge, ReconcileProjections).
 */
export interface ProjectionOperationsPort {
  findExistingProjection(sourceId: string, profileId: string): Promise<ExistingProjectionInfo | null>;
  cleanupSourceProjectionForProfile(sourceId: string, profileId: string): Promise<string | null>;
  processContent(input: ProcessContentInput): Promise<Result<DomainError, ProcessContentSuccess>>;
}
