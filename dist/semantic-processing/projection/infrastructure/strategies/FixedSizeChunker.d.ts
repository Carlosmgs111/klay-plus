import { BaseChunker } from "./BaseChunker.js";
export declare class FixedSizeChunker extends BaseChunker {
    private readonly chunkSize;
    private readonly overlap;
    readonly strategyId = "fixed-size-chunker";
    readonly version = 1;
    constructor(chunkSize?: number, overlap?: number);
    protected splitContent(content: string): string[];
}
//# sourceMappingURL=FixedSizeChunker.d.ts.map