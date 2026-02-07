/**
 * MIME types supported by the text extractor.
 */
const SUPPORTED_MIME_TYPES = new Set([
    "text/plain",
    "text/markdown",
    "text/csv",
    "application/json",
]);
/**
 * Extracts raw text from plain text, markdown, CSV, and JSON sources.
 * Browser + Node.js compatible.
 *
 * For in-memory sources, provide the content directly via the `content` property.
 * For URI-based sources, the extractor will attempt to fetch the content.
 */
export class TextContentExtractor {
    canExtract(mimeType) {
        return SUPPORTED_MIME_TYPES.has(mimeType);
    }
    async extract(source) {
        if (!this.canExtract(source.mimeType)) {
            throw new Error(`TextContentExtractor does not support MIME type: ${source.mimeType}`);
        }
        let text;
        if (source.content) {
            text = new TextDecoder().decode(source.content);
        }
        else {
            text = source.uri;
        }
        const contentHash = await this.computeHash(text);
        const metadata = this.extractMetadata(text, source.mimeType);
        return { text, contentHash, metadata };
    }
    async computeHash(content) {
        if (typeof globalThis.crypto?.subtle !== "undefined") {
            const data = new TextEncoder().encode(content);
            const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
        }
        let hash = 5381;
        for (let i = 0; i < content.length; i++) {
            hash = (hash << 5) + hash + content.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }
    extractMetadata(content, mimeType) {
        const metadata = {
            mimeType,
            characterCount: content.length,
            wordCount: content.split(/\s+/).filter(Boolean).length,
        };
        if (mimeType === "application/json") {
            try {
                const parsed = JSON.parse(content);
                metadata["jsonType"] = Array.isArray(parsed) ? "array" : typeof parsed;
            }
            catch {
                metadata["jsonValid"] = false;
            }
        }
        return metadata;
    }
}
//# sourceMappingURL=TextContentExtractor.js.map