import { ValueObject } from "../../../shared/domain/index.js";
export const TransformationType = {
    Extraction: "EXTRACTION",
    Chunking: "CHUNKING",
    Enrichment: "ENRICHMENT",
    Embedding: "EMBEDDING",
    Merge: "MERGE",
    Split: "SPLIT",
};
export class Transformation extends ValueObject {
    get type() {
        return this.props.type;
    }
    get appliedAt() {
        return this.props.appliedAt;
    }
    get strategyUsed() {
        return this.props.strategyUsed;
    }
    get inputVersion() {
        return this.props.inputVersion;
    }
    get outputVersion() {
        return this.props.outputVersion;
    }
    get parameters() {
        return this.props.parameters;
    }
    static create(type, strategyUsed, inputVersion, outputVersion, parameters = {}) {
        if (!strategyUsed)
            throw new Error("Transformation strategyUsed is required");
        return new Transformation({
            type,
            appliedAt: new Date(),
            strategyUsed,
            inputVersion,
            outputVersion,
            parameters: { ...parameters },
        });
    }
}
//# sourceMappingURL=Transformation.js.map