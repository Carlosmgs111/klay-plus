/**
 * Knowledge Management — Orchestrator Module
 *
 * Application service for multi-step lifecycle operations on existing
 * semantic units. Coordinates ingestion + knowledge + processing contexts.
 *
 * Public API:
 * - KnowledgeManagementPort: the single entry point (interface)
 * - DTOs: input/output contracts
 * - KnowledgeManagementError: error with step tracking
 * - ManagementStep: enum of management steps
 * - createKnowledgeManagement(): factory function
 * - KnowledgeManagementPolicy: configuration type
 *
 * NOT exported (internal):
 * - KnowledgeManagementOrchestrator (implementation)
 * - Use cases
 * - Composer
 */

export type { KnowledgeManagementPort } from "./contracts/KnowledgeManagementPort";

export type {
  IngestAndAddSourceInput,
  IngestAndAddSourceSuccess,
} from "./contracts/dtos";

export { KnowledgeManagementError } from "./domain/KnowledgeManagementError";
export { ManagementStep } from "./domain/ManagementStep";
export type { ManagementStep as ManagementStepType } from "./domain/ManagementStep";

export { createKnowledgeManagement } from "./composition/knowledge-management.factory";

export type { KnowledgeManagementPolicy } from "./composition/knowledge-management.factory";
