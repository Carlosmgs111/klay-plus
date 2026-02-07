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
export {};
//# sourceMappingURL=IntegrationEvents.js.map