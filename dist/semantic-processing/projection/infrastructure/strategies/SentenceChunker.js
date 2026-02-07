import { BaseChunker } from "./BaseChunker.js";
export class SentenceChunker extends BaseChunker {
    maxChunkSize;
    minChunkSize;
    strategyId = "sentence-chunker";
    version = 1;
    constructor(maxChunkSize = 1000, minChunkSize = 100) {
        super();
        this.maxChunkSize = maxChunkSize;
        this.minChunkSize = minChunkSize;
        if (maxChunkSize <= 0)
            throw new Error("maxChunkSize must be positive");
        if (minChunkSize < 0)
            throw new Error("minChunkSize must be non-negative");
    }
    splitContent(content) {
        const sentences = content.match(/[^.!?]*[.!?]+[\s]*/g) || [content];
        const chunks = [];
        let current = "";
        for (const sentence of sentences) {
            if (current.length + sentence.length > this.maxChunkSize &&
                current.length >= this.minChunkSize) {
                chunks.push(current.trim());
                current = "";
            }
            current += sentence;
        }
        if (current.trim().length > 0) {
            chunks.push(current.trim());
        }
        return chunks;
    }
}
//# sourceMappingURL=SentenceChunker.js.map