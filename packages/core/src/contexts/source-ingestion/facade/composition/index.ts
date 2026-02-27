/**
 * Composition Root - Source Ingestion Facade
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

export { SourceIngestionFacadeComposer } from "./SourceIngestionFacadeComposer.js";

export type {
  SourceIngestionFacadePolicy,
  ResolvedSourceIngestionModules,
} from "./infra-policies.js";
