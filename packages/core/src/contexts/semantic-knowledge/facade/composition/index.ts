/**
 * Composition Root - Semantic Knowledge Facade
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

export { SemanticKnowledgeFacadeComposer } from "./SemanticKnowledgeFacadeComposer.js";

export type {
  SemanticKnowledgeFacadePolicy,
  ResolvedSemanticKnowledgeModules,
} from "./infra-policies.js";
