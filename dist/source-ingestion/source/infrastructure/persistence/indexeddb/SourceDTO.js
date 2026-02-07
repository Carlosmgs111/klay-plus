import { Source } from "../../../domain/Source.js";
import { SourceId } from "../../../domain/SourceId.js";
import { SourceVersion } from "../../../domain/SourceVersion.js";
export function toDTO(source) {
    return {
        id: source.id.value,
        name: source.name,
        type: source.type,
        uri: source.uri,
        currentVersionIndex: source.currentVersion?.version ?? null,
        versions: [...source.versions].map((v) => ({
            version: v.version,
            contentHash: v.contentHash,
            extractedAt: v.extractedAt.toISOString(),
        })),
        registeredAt: source.registeredAt.toISOString(),
    };
}
export function fromDTO(dto) {
    if (dto.versions.length === 0) {
        return Source.reconstitute(SourceId.create(dto.id), dto.name, dto.type, dto.uri, null, [], new Date(dto.registeredAt));
    }
    const svList = [];
    // Reconstitute version chain
    for (let i = 0; i < dto.versions.length; i++) {
        const vDto = dto.versions[i];
        if (i === 0) {
            svList.push(SourceVersion.initial(vDto.contentHash));
        }
        else {
            svList.push(svList[i - 1].next(vDto.contentHash));
        }
    }
    return Source.reconstitute(SourceId.create(dto.id), dto.name, dto.type, dto.uri, svList[svList.length - 1], svList, new Date(dto.registeredAt));
}
//# sourceMappingURL=SourceDTO.js.map