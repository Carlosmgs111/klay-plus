import { describe, it, expect } from "vitest";
import { validateProfile } from "../profileResolution";
import type { InfrastructureProfile } from "../InfrastructureProfile";
import { PRESET_PROFILES } from "../InfrastructureProfile";

describe("validateProfile", () => {
  it("accepts valid preset profiles", () => {
    for (const profile of Object.values(PRESET_PROFILES)) {
      const errors = validateProfile(profile);
      expect(errors).toEqual([]);
    }
  });

  it("detects dimension mismatch between embedding and vectorStore", () => {
    const profile: InfrastructureProfile = {
      id: "test",
      name: "Test",
      persistence: { type: "in-memory" },
      vectorStore: { type: "in-memory", dimensions: 128 },
      embedding: { type: "hash", dimensions: 256 },
      documentStorage: { type: "in-memory" },
    };
    const errors = validateProfile(profile);
    expect(errors).toContainEqual(
      expect.objectContaining({ code: "DIMENSION_MISMATCH" })
    );
  });

  it("detects missing authRef for providers that require credentials", () => {
    const profile: InfrastructureProfile = {
      id: "test",
      name: "Test",
      persistence: { type: "in-memory" },
      vectorStore: { type: "in-memory", dimensions: 1536 },
      embedding: { type: "openai", authRef: "", model: "text-embedding-3-small", dimensions: 1536 },
      documentStorage: { type: "in-memory" },
    };
    const errors = validateProfile(profile);
    expect(errors).toContainEqual(
      expect.objectContaining({ code: "MISSING_AUTH_REF" })
    );
  });

  it("detects browser-only providers used with server-only providers", () => {
    const profile: InfrastructureProfile = {
      id: "test",
      name: "Test",
      persistence: { type: "nedb" },
      vectorStore: { type: "indexeddb", dimensions: 384 },
      embedding: { type: "hash" },
      documentStorage: { type: "in-memory" },
    };
    const errors = validateProfile(profile);
    expect(errors).toContainEqual(
      expect.objectContaining({ code: "RUNTIME_MISMATCH" })
    );
  });
});
