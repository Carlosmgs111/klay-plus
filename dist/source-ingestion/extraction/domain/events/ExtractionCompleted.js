export class ExtractionCompleted {
    static EVENT_TYPE = "source-ingestion.extraction.completed";
    static is(event) {
        return event.eventType === ExtractionCompleted.EVENT_TYPE;
    }
    static getPayload(event) {
        if (!ExtractionCompleted.is(event)) {
            throw new Error("Event is not an ExtractionCompleted event");
        }
        return event.payload;
    }
}
//# sourceMappingURL=ExtractionCompleted.js.map