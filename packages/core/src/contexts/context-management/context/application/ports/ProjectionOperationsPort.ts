import type { Result } from "../../../../../shared/domain/Result";
import type { DomainError } from "../../../../../shared/domain/errors";
import type { ProjectionType } from "../../../../semantic-processing/projection/domain/ProjectionType";

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
 * Port for projection operations needed by context-management use cases.
 * Consumed by ReconcileProjections.
 * Implemented by ProjectionOperationsAdapter (wraps individual semantic-processing UCs).
 */
export interface ProjectionOperationsPort {
  findExistingProjection(sourceId: string, profileId: string): Promise<ExistingProjectionInfo | null>;
  cleanupSourceProjectionForProfile(sourceId: string, profileId: string): Promise<string | null>;
  processContent(input: ProcessContentInput): Promise<Result<DomainError, ProcessContentSuccess>>;
}
