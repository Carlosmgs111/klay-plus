/**
 * Supported MIME types for text-based extraction.
 */
const TEXT_MIME_TYPES = [
    "text/plain",
    "text/markdown",
    "text/csv",
    "text/html",
    "application/json",
];
/**
 * Composer for the Extraction Module.
 *
 * Responsible for resolving infrastructure dependencies based on policy.
 * Each aspect (repository, extractors, publisher) has its own resolver method.
 */
export class ExtractionComposer {
    // ─── Repository Resolution ──────────────────────────────────────────────────
    static async resolveRepository(policy) {
        switch (policy.type) {
            case "in-memory": {
                const { InMemoryExtractionJobRepository } = await import("../infrastructure/persistence/InMemoryExtractionJobRepository.js");
                return new InMemoryExtractionJobRepository();
            }
            case "browser": {
                const { IndexedDBExtractionJobRepository } = await import("../infrastructure/persistence/indexeddb/IndexedDBExtractionJobRepository.js");
                const dbName = policy.dbName ?? "knowledge-platform";
                return new IndexedDBExtractionJobRepository(dbName);
            }
            case "server": {
                const { NeDBExtractionJobRepository } = await import("../infrastructure/persistence/nedb/NeDBExtractionJobRepository.js");
                const filename = policy.dbPath
                    ? `${policy.dbPath}/extraction-jobs.db`
                    : undefined;
                return new NeDBExtractionJobRepository(filename);
            }
            default:
                throw new Error(`Unknown policy type: ${policy.type}`);
        }
    }
    // ─── Extractors Resolution ──────────────────────────────────────────────────
    static async resolveExtractors(policy) {
        // Allow custom extractors override
        if (policy.customExtractors) {
            return policy.customExtractors;
        }
        const extractors = new Map();
        // Register text extractor for all text-based MIME types
        const { TextContentExtractor } = await import("../infrastructure/adapters/TextContentExtractor.js");
        const textExtractor = new TextContentExtractor();
        for (const mimeType of TEXT_MIME_TYPES) {
            extractors.set(mimeType, textExtractor);
        }
        // Register PDF extractor based on policy
        if (policy.type === "browser") {
            const { BrowserPdfContentExtractor } = await import("../infrastructure/adapters/BrowserPdfContentExtractor.js");
            extractors.set("application/pdf", new BrowserPdfContentExtractor());
        }
        else {
            // "server" and "in-memory" use server-side PDF extraction
            const { ServerPdfContentExtractor } = await import("../infrastructure/adapters/ServerPdfContentExtractor.js");
            extractors.set("application/pdf", new ServerPdfContentExtractor());
        }
        return extractors;
    }
    // ─── Event Publisher Resolution ─────────────────────────────────────────────
    static async resolveEventPublisher(_policy) {
        // Currently all policies use InMemoryEventPublisher
        // This can be extended to support distributed publishers (Redis, Kafka, etc.)
        const { InMemoryEventPublisher } = await import("../../../shared/infrastructure/InMemoryEventPublisher.js");
        return new InMemoryEventPublisher();
    }
    // ─── Main Resolution ────────────────────────────────────────────────────────
    static async resolve(policy) {
        const [repository, extractors, eventPublisher] = await Promise.all([
            this.resolveRepository(policy),
            this.resolveExtractors(policy),
            this.resolveEventPublisher(policy),
        ]);
        return {
            repository,
            extractors,
            eventPublisher,
        };
    }
}
//# sourceMappingURL=ExtractionComposer.js.map