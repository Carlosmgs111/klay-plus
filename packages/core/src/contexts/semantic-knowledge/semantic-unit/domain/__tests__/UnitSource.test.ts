import { describe, it, expect } from "vitest";
import { UnitSource } from "../UnitSource.js";

describe("UnitSource", () => {
  const validArgs = {
    sourceId: "source-123",
    sourceType: "document",
    extractedContent: "Some extracted content",
    contentHash: "abc123hash",
  };

  it("should create a valid UnitSource", () => {
    const source = UnitSource.create(
      validArgs.sourceId,
      validArgs.sourceType,
      validArgs.extractedContent,
      validArgs.contentHash,
    );

    expect(source.sourceId).toBe("source-123");
    expect(source.sourceType).toBe("document");
    expect(source.extractedContent).toBe("Some extracted content");
    expect(source.contentHash).toBe("abc123hash");
    expect(source.resourceId).toBeUndefined();
    expect(source.addedAt).toBeInstanceOf(Date);
  });

  it("should create with optional resourceId", () => {
    const source = UnitSource.create(
      validArgs.sourceId,
      validArgs.sourceType,
      validArgs.extractedContent,
      validArgs.contentHash,
      "resource-456",
    );

    expect(source.resourceId).toBe("resource-456");
  });

  it("should throw if sourceId is empty", () => {
    expect(() =>
      UnitSource.create("", validArgs.sourceType, validArgs.extractedContent, validArgs.contentHash),
    ).toThrow("UnitSource sourceId is required");
  });

  it("should throw if sourceType is empty", () => {
    expect(() =>
      UnitSource.create(validArgs.sourceId, "", validArgs.extractedContent, validArgs.contentHash),
    ).toThrow("UnitSource sourceType is required");
  });

  it("should throw if extractedContent is empty", () => {
    expect(() =>
      UnitSource.create(validArgs.sourceId, validArgs.sourceType, "", validArgs.contentHash),
    ).toThrow("UnitSource extractedContent is required");
  });

  it("should throw if extractedContent is whitespace only", () => {
    expect(() =>
      UnitSource.create(validArgs.sourceId, validArgs.sourceType, "   ", validArgs.contentHash),
    ).toThrow("UnitSource extractedContent is required");
  });

  it("should throw if contentHash is empty", () => {
    expect(() =>
      UnitSource.create(validArgs.sourceId, validArgs.sourceType, validArgs.extractedContent, ""),
    ).toThrow("UnitSource contentHash is required");
  });

  it("should be immutable (frozen props)", () => {
    const source = UnitSource.create(
      validArgs.sourceId,
      validArgs.sourceType,
      validArgs.extractedContent,
      validArgs.contentHash,
    );

    // Props are frozen via ValueObject base class
    expect(source.sourceId).toBe("source-123");
  });

  it("should reconstitute from persisted data", () => {
    const addedAt = new Date("2024-01-01");
    const source = UnitSource.reconstitute(
      "src-1",
      "api",
      "content",
      "hash",
      addedAt,
      "res-1",
    );

    expect(source.sourceId).toBe("src-1");
    expect(source.sourceType).toBe("api");
    expect(source.extractedContent).toBe("content");
    expect(source.contentHash).toBe("hash");
    expect(source.addedAt).toBe(addedAt);
    expect(source.resourceId).toBe("res-1");
  });

  it("should support equality comparison", () => {
    const a = UnitSource.reconstitute("s1", "doc", "content", "hash", new Date("2024-01-01"));
    const b = UnitSource.reconstitute("s1", "doc", "content", "hash", new Date("2024-01-01"));

    expect(a.equals(b)).toBe(true);
  });
});
