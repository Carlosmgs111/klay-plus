import { BaseChunker } from "./BaseChunker.js";
export declare class SentenceChunker extends BaseChunker {
    private readonly maxChunkSize;
    private readonly minChunkSize;
    readonly strategyId = "sentence-chunker";
    readonly version = 1;
    constructor(maxChunkSize?: number, minChunkSize?: number);
    protected splitContent(content: string): string[];
}
//# sourceMappingURL=SentenceChunker.d.ts.map