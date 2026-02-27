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

export type { KnowledgeManagementPort } from "./contracts/KnowledgeManagementPort.js";

export type {
  IngestAndAddSourceInput,
  IngestAndAddSourceSuccess,
} from "./contracts/dtos.js";

export { KnowledgeManagementError } from "./domain/KnowledgeManagementError.js";
export { ManagementStep } from "./domain/ManagementStep.js";
export type { ManagementStep as ManagementStepType } from "./domain/ManagementStep.js";

export { createKnowledgeManagement } from "./composition/knowledge-management.factory.js";

export type { KnowledgeManagementPolicy } from "./composition/KnowledgeManagementComposer.js";
