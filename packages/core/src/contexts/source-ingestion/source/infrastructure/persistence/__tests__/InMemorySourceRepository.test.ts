import { describe, it, expect, beforeEach } from "vitest";
import { InMemorySourceRepository } from "../InMemorySourceRepository";
import { Source } from "../../../domain/Source";
import { SourceId } from "../../../domain/SourceId";
import { SourceType } from "../../../domain/SourceType";

describe("InMemorySourceRepository", () => {
  let repo: InMemorySourceRepository;

  beforeEach(() => {
    repo = new InMemorySourceRepository();
  });

  function registerSource(id: string, name: string, uri: string): Source {
    return Source.register(
      SourceId.create(id),
      name,
      SourceType.PLAIN_TEXT,
      uri,
    );
  }

  // ── findAll ────────────────────────────────────────────────────

  describe("findAll", () => {
    it("returns all sources", async () => {
      await repo.save(registerSource("src-1", "First", "file:///a.txt"));
      await repo.save(registerSource("src-2", "Second", "file:///b.txt"));
      await repo.save(registerSource("src-3", "Third", "file:///c.txt"));

      const results = await repo.findAll();

      expect(results).toHaveLength(3);
      const ids = results.map((s) => s.id.value).sort();
      expect(ids).toEqual(["src-1", "src-2", "src-3"]);
    });

    it("returns empty array when no sources exist", async () => {
      const results = await repo.findAll();

      expect(results).toEqual([]);
    });
  });

  // ── count ─────────────────────────────────────────────────────

  describe("count", () => {
    it("returns the number of sources", async () => {
      await repo.save(registerSource("src-1", "First", "file:///a.txt"));
      await repo.save(registerSource("src-2", "Second", "file:///b.txt"));

      const result = await repo.count();

      expect(result).toBe(2);
    });

    it("returns 0 when no sources exist", async () => {
      const result = await repo.count();

      expect(result).toBe(0);
    });
  });
});
