import { BaseChunker } from "./BaseChunker.js";
export declare class RecursiveChunker extends BaseChunker {
    private readonly maxChunkSize;
    private readonly overlap;
    readonly strategyId = "recursive-chunker";
    readonly version = 1;
    private readonly separators;
    constructor(maxChunkSize?: number, overlap?: number);
    protected splitContent(content: string): string[];
    private recursiveSplit;
}
//# sourceMappingURL=RecursiveChunker.d.ts.map