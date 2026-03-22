/**
 * SearchKnowledgeInput DTO — compile-time shape assertion + contract documentation.
 *
 * The top-level variable `_assert` serves as a compile-time guard: if
 * `SearchKnowledgeInput` ever loses any of the fields used below, TypeScript
 * will report a type error at build/test time before any runtime failure.
 */

import { describe, it, expect } from "vitest";
import type { SearchKnowledgeInput } from "../dtos";

// Compile-time assertion — if this assignment compiles, the type has the expected shape.
const _assert: SearchKnowledgeInput = {
  queryText: "test",
  retrievalOverride: {
    ranking: "mmr",
    mmrLambda: 0.5,
    crossEncoderModel: "cross-encoder/ms-marco-MiniLM-L-6-v2",
  },
};

describe("SearchKnowledgeInput DTO", () => {
  it("accepts retrievalOverride with all optional fields", () => {
    const input: SearchKnowledgeInput = {
      queryText: "semantic search",
      retrievalOverride: { ranking: "mmr", mmrLambda: 0.7 },
    };
    expect(input.retrievalOverride?.ranking).toBe("mmr");
    expect(input.retrievalOverride?.mmrLambda).toBe(0.7);
  });

  it("accepts SearchKnowledgeInput without retrievalOverride", () => {
    const input: SearchKnowledgeInput = { queryText: "plain search" };
    expect(input.retrievalOverride).toBeUndefined();
  });

  it("retrievalOverride ranking accepts all valid values", () => {
    const rankings: Array<SearchKnowledgeInput["retrievalOverride"]> = [
      { ranking: "passthrough" },
      { ranking: "mmr" },
      { ranking: "cross-encoder" },
    ];
    expect(rankings).toHaveLength(3);
  });

  it("compile-time assertion covers full retrievalOverride shape", () => {
    // _assert is defined at module scope; reaching this line confirms the
    // compile-time check passed.
    expect(_assert.queryText).toBe("test");
    expect(_assert.retrievalOverride?.ranking).toBe("mmr");
    expect(_assert.retrievalOverride?.mmrLambda).toBe(0.5);
    expect(_assert.retrievalOverride?.crossEncoderModel).toBe(
      "cross-encoder/ms-marco-MiniLM-L-6-v2"
    );
  });
});
