import { describe, expect, it } from "vitest";
import { challengeSubmissionSchema } from "./validation";

const questionId = "7d63a8e5-20e7-4c70-a8c4-3a2b2b1d7f99";

describe("challenge submission validation", () => {
  it("accepts a well-formed answer set", () => {
    expect(challengeSubmissionSchema.safeParse({
      answers: [{ questionId, optionIds: ["a"] }],
    }).success).toBe(true);
  });

  it("rejects duplicate question answers", () => {
    expect(challengeSubmissionSchema.safeParse({
      answers: [
        { questionId, optionIds: ["a"] },
        { questionId, optionIds: ["b"] },
      ],
    }).success).toBe(false);
  });

  it("rejects duplicate options within one answer", () => {
    expect(challengeSubmissionSchema.safeParse({
      answers: [{ questionId, optionIds: ["a", "a"] }],
    }).success).toBe(false);
  });

  it("rejects malformed question identifiers", () => {
    expect(challengeSubmissionSchema.safeParse({
      answers: [{ questionId: "not-a-uuid", optionIds: ["a"] }],
    }).success).toBe(false);
  });
});
