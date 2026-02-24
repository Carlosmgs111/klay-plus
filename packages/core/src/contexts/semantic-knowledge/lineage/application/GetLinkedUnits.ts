import type { KnowledgeLineageRepository } from "../domain/KnowledgeLineageRepository.js";

export interface GetLinkedUnitsQuery {
  unitId: string;
  relationship?: string;
}

export interface LinkedUnitResult {
  fromUnitId: string;
  toUnitId: string;
  relationship: string;
  createdAt: Date;
}

export class GetLinkedUnits {
  constructor(
    private readonly repository: KnowledgeLineageRepository,
  ) {}

  async execute(query: GetLinkedUnitsQuery): Promise<LinkedUnitResult[]> {
    // Outbound links from this unit's lineage
    const lineage = await this.repository.findBySemanticUnitId(query.unitId);
    const outbound =
      lineage?.traces?.filter(
        (t) => !query.relationship || t.relationship === query.relationship,
      ) ?? [];

    // Inbound links from other units' lineages
    const inboundLineages = await this.repository.findByTraceTargetUnitId(
      query.unitId,
    );
    const inbound = inboundLineages.flatMap((l) =>
      l.traces.filter(
        (t) =>
          t.toUnitId === query.unitId &&
          (!query.relationship || t.relationship === query.relationship),
      ),
    );

    // Combine and deduplicate
    const all = [...outbound, ...inbound];
    const seen = new Set<string>();

    return all
      .filter((t) => {
        const key = `${t.fromUnitId}-${t.toUnitId}-${t.relationship}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((t) => ({
        fromUnitId: t.fromUnitId,
        toUnitId: t.toUnitId,
        relationship: t.relationship,
        createdAt: t.createdAt,
      }));
  }
}
