import { describe, it, expect } from "vitest";
import { normalize } from "../src/commands/task-review.js";

// The reviewer output is parsed from an LLM response, so normalize() has to
// tolerate drift: missing fields, wrong types, junk verdicts, empty strings.

describe("normalize", () => {
  it("passes through a well-formed review", () => {
    const review = normalize({
      verdict: "needs_clarification",
      summary: "Scope is unclear.",
      questions: ["Which file?"],
      concerns: ["Deletes data without a backup."],
    });
    expect(review).toEqual({
      verdict: "needs_clarification",
      summary: "Scope is unclear.",
      questions: ["Which file?"],
      concerns: ["Deletes data without a backup."],
    });
  });

  it("defaults an unknown verdict to needs_clarification", () => {
    expect(normalize({ verdict: "totally-made-up" }).verdict).toBe("needs_clarification");
  });

  it("keeps a valid ready verdict", () => {
    expect(normalize({ verdict: "ready" }).verdict).toBe("ready");
  });

  it("fills missing fields with safe empties", () => {
    expect(normalize({})).toEqual({
      verdict: "needs_clarification",
      summary: "",
      questions: [],
      concerns: [],
    });
  });

  it("drops non-string and blank array entries", () => {
    const review = normalize({
      verdict: "flawed",
      summary: 42,
      questions: ["keep", "", "   ", 7, null],
      concerns: "not an array",
    });
    expect(review.summary).toBe("");
    expect(review.questions).toEqual(["keep"]);
    expect(review.concerns).toEqual([]);
  });

  it("does not throw on null/undefined", () => {
    expect(() => normalize(null)).not.toThrow();
    expect(normalize(undefined).verdict).toBe("needs_clarification");
  });
});
