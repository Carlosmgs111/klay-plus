/**
 * Template Method base for all chunking strategies.
 * Subclasses only need to implement splitContent().
 */
export class BaseChunker {
    chunk(content) {
        const validated = this.validate(content);
        if (validated.length === 0)
            return [];
        const rawChunks = this.splitContent(validated);
        return this.buildChunks(rawChunks, validated);
    }
    validate(content) {
        if (!content || content.trim().length === 0)
            return "";
        return content;
    }
    buildChunks(rawChunks, originalContent) {
        const chunks = [];
        let searchFrom = 0;
        for (let i = 0; i < rawChunks.length; i++) {
            const chunkContent = rawChunks[i];
            if (chunkContent.length === 0)
                continue;
            const startOffset = originalContent.indexOf(chunkContent, searchFrom);
            const actualStart = startOffset >= 0 ? startOffset : searchFrom;
            chunks.push({
                content: chunkContent,
                index: chunks.length,
                startOffset: actualStart,
                endOffset: actualStart + chunkContent.length,
                metadata: this.buildChunkMetadata(chunkContent, chunks.length),
            });
            searchFrom = actualStart + chunkContent.length;
        }
        return chunks;
    }
    buildChunkMetadata(content, index) {
        return {
            strategy: this.strategyId,
            chunkIndex: String(index),
            charCount: String(content.length),
            wordCount: String(content.split(/\s+/).filter(Boolean).length),
        };
    }
    estimateTokens(text) {
        return Math.ceil(text.length / 4);
    }
}
//# sourceMappingURL=BaseChunker.js.map