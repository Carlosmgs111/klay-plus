/**
 * Composition Root - Knowledge Retrieval Facade
 *
 * This module is ONLY responsible for:
 * - Resolving configuration via ConfigProvider
 * - Coordinating module composition
 * - Building policies for child modules
 *
 * It does NOT contain:
 * - Business logic
 * - Domain rules
 * - Application flows
 */

export { KnowledgeRetrievalFacadeComposer } from "./KnowledgeRetrievalFacadeComposer.js";

export type {
  KnowledgeRetrievalFacadePolicy,
  ResolvedKnowledgeRetrievalModules,
} from "./infra-policies.js";
