import { BaseChunker } from "./BaseChunker.js";
export class RecursiveChunker extends BaseChunker {
    maxChunkSize;
    overlap;
    strategyId = "recursive-chunker";
    version = 1;
    separators = ["\n\n", "\n", ". ", " "];
    constructor(maxChunkSize = 1000, overlap = 100) {
        super();
        this.maxChunkSize = maxChunkSize;
        this.overlap = overlap;
        if (maxChunkSize <= 0)
            throw new Error("maxChunkSize must be positive");
        if (overlap < 0)
            throw new Error("overlap must be non-negative");
    }
    splitContent(content) {
        return this.recursiveSplit(content, 0);
    }
    recursiveSplit(text, separatorIndex) {
        if (text.length <= this.maxChunkSize)
            return [text];
        if (separatorIndex >= this.separators.length) {
            const chunks = [];
            const step = this.maxChunkSize - this.overlap;
            for (let i = 0; i < text.length; i += step) {
                chunks.push(text.slice(i, i + this.maxChunkSize));
                if (i + this.maxChunkSize >= text.length)
                    break;
            }
            return chunks;
        }
        const separator = this.separators[separatorIndex];
        const parts = text.split(separator);
        if (parts.length <= 1) {
            return this.recursiveSplit(text, separatorIndex + 1);
        }
        const chunks = [];
        let current = "";
        for (const part of parts) {
            const candidate = current ? current + separator + part : part;
            if (candidate.length > this.maxChunkSize && current.length > 0) {
                chunks.push(current);
                current = part;
            }
            else {
                current = candidate;
            }
        }
        if (current)
            chunks.push(current);
        return chunks.flatMap((chunk) => chunk.length > this.maxChunkSize
            ? this.recursiveSplit(chunk, separatorIndex + 1)
            : [chunk]);
    }
}
//# sourceMappingURL=RecursiveChunker.js.map