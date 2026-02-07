import { ValueObject } from "../../../shared/domain/index.js";
export class Meaning extends ValueObject {
    get content() {
        return this.props.content;
    }
    get summary() {
        return this.props.summary;
    }
    get language() {
        return this.props.language;
    }
    get topics() {
        return this.props.topics;
    }
    static create(content, language, topics = [], summary = null) {
        if (!content || content.trim().length === 0) {
            throw new Error("Meaning content cannot be empty");
        }
        if (!language)
            throw new Error("Meaning language is required");
        return new Meaning({ content, summary, language, topics: [...topics] });
    }
}
//# sourceMappingURL=Meaning.js.map