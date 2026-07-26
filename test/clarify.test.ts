import { describe, it, expect, vi } from "vitest";
import {
  parseAssessment,
  refinePrompt,
  clearAssessment,
  type ClarifierPort,
} from "../src/clarify.js";

// ---------------------------------------------------------------------------
// parseAssessment — normalizes raw model output into a TaskAssessment
// ---------------------------------------------------------------------------

describe("parseAssessment", () => {
  it("parses a clear verdict", () => {
    const a = parseAssessment('{"clear": true, "concerns": [], "questions": []}');
    expect(a).toEqual({ clear: true, concerns: [], questions: [] });
  });

  it("parses a needs-clarification verdict", () => {
    const a = parseAssessment(
      '{"clear": false, "concerns": ["no target file"], "questions": ["Which file?"]}',
    );
    expect(a.clear).toBe(false);
    expect(a.concerns).toEqual(["no target file"]);
    expect(a.questions).toEqual(["Which file?"]);
  });

  it("strips ```json code fences and surrounding prose", () => {
    const raw =
      'Sure!\n```json\n{"clear": false, "concerns": [], "questions": ["What repo?"]}\n```';
    const a = parseAssessment(raw);
    expect(a.clear).toBe(false);
    expect(a.questions).toEqual(["What repo?"]);
  });

  it("caps questions at the configured maximum", () => {
    const a = parseAssessment(
      '{"clear": false, "concerns": [], "questions": ["a", "b", "c", "d", "e"]}',
    );
    expect(a.questions).toHaveLength(3);
  });

  it("drops non-string and blank entries from arrays", () => {
    const a = parseAssessment(
      '{"clear": false, "concerns": [1, "  ", "real"], "questions": ["  keep  ", null]}',
    );
    expect(a.concerns).toEqual(["real"]);
    expect(a.questions).toEqual(["keep"]);
  });

  it("treats a present question list as needing clarification even if clear is omitted", () => {
    const a = parseAssessment('{"questions": ["Which branch?"]}');
    expect(a.clear).toBe(false);
    expect(a.questions).toEqual(["Which branch?"]);
  });

  it("fails open (clear) on malformed JSON", () => {
    expect(parseAssessment("not json at all")).toEqual(clearAssessment());
    expect(parseAssessment("{ broken")).toEqual(clearAssessment());
    expect(parseAssessment("")).toEqual(clearAssessment());
  });

  it("fails open (clear) on non-object JSON", () => {
    expect(parseAssessment("[1, 2, 3]")).toEqual(clearAssessment());
  });
});

// ---------------------------------------------------------------------------
// refinePrompt — folds answers back into the instruction
// ---------------------------------------------------------------------------

describe("refinePrompt", () => {
  it("appends answered questions as clarifications", () => {
    const refined = refinePrompt("Fix the bug", [
      { question: "Which file?", answer: "src/auth.ts" },
    ]);
    expect(refined).toContain("Fix the bug");
    expect(refined).toContain("Additional clarifications:");
    expect(refined).toContain("Which file?");
    expect(refined).toContain("src/auth.ts");
  });

  it("returns the original unchanged when no questions are answered", () => {
    const refined = refinePrompt("Fix the bug", [
      { question: "Which file?", answer: "   " },
      { question: "Which branch?", answer: "" },
    ]);
    expect(refined).toBe("Fix the bug");
  });

  it("includes only answered questions", () => {
    const refined = refinePrompt("Do the thing", [
      { question: "Q1?", answer: "A1" },
      { question: "Q2?", answer: "" },
    ]);
    expect(refined).toContain("Q1?");
    expect(refined).not.toContain("Q2?");
  });
});

// ---------------------------------------------------------------------------
// ClarifierPort contract — a fake satisfies the interface used by the wizard
// ---------------------------------------------------------------------------

describe("ClarifierPort (fake)", () => {
  it("can be faked without a key", async () => {
    const port: ClarifierPort = {
      assess: vi
        .fn()
        .mockResolvedValue({ clear: false, concerns: ["vague"], questions: ["What?"] }),
    };
    const a = await port.assess("do stuff");
    expect(a.clear).toBe(false);
    expect(port.assess).toHaveBeenCalledWith("do stuff");
  });
});
