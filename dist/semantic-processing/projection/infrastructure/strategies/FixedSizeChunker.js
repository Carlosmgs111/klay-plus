import { BaseChunker } from "./BaseChunker.js";
export class FixedSizeChunker extends BaseChunker {
    chunkSize;
    overlap;
    strategyId = "fixed-size-chunker";
    version = 1;
    constructor(chunkSize = 500, overlap = 50) {
        super();
        this.chunkSize = chunkSize;
        this.overlap = overlap;
        if (chunkSize <= 0)
            throw new Error("chunkSize must be positive");
        if (overlap < 0)
            throw new Error("overlap must be non-negative");
        if (overlap >= chunkSize)
            throw new Error("overlap must be less than chunkSize");
    }
    splitContent(content) {
        const chunks = [];
        let start = 0;
        const step = this.chunkSize - this.overlap;
        while (start < content.length) {
            const end = Math.min(start + this.chunkSize, content.length);
            chunks.push(content.slice(start, end));
            if (end >= content.length)
                break;
            start += step;
        }
        return chunks;
    }
}
//# sourceMappingURL=FixedSizeChunker.js.map