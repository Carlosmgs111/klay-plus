export class ExtractionFailed {
    static EVENT_TYPE = "source-ingestion.extraction.failed";
    static is(event) {
        return event.eventType === ExtractionFailed.EVENT_TYPE;
    }
}
//# sourceMappingURL=ExtractionFailed.js.map