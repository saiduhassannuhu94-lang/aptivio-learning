import { describe, expect, it } from "vitest";
import { gradeQuiz, type GradeableQuestion } from "./grading";

const questions: GradeableQuestion[] = [
  {
    id: "q1",
    question_type: "single_choice",
    points: 2,
    options: [
      { id: "a", text: "A" },
      { id: "b", text: "B" },
    ],
    correct_option_ids: ["b"],
  },
  {
    id: "q2",
    question_type: "multiple_choice",
    points: 3,
    options: [
      { id: "a", text: "A" },
      { id: "b", text: "B" },
      { id: "c", text: "C" },
    ],
    correct_option_ids: ["a", "c"],
  },
];

describe("gradeQuiz", () => {
  it("awards points only for exact correct selections", () => {
    const result = gradeQuiz(questions, [
      { questionId: "q1", optionIds: ["b"] },
      { questionId: "q2", optionIds: ["c", "a"] },
    ]);

    expect(result.score).toBe(5);
    expect(result.maxScore).toBe(5);
    expect(result.gradedAnswers.map((answer) => answer.awarded_points)).toEqual([2, 3]);
  });

  it("treats unanswered questions as zero without losing them", () => {
    const result = gradeQuiz(questions, [{ questionId: "q1", optionIds: ["b"] }]);

    expect(result.score).toBe(2);
    expect(result.gradedAnswers).toHaveLength(2);
    expect(result.gradedAnswers[1].response.optionIds).toEqual([]);
  });

  it("rejects duplicate submitted question IDs", () => {
    expect(() =>
      gradeQuiz(questions, [
        { questionId: "q1", optionIds: ["a"] },
        { questionId: "q1", optionIds: ["b"] },
      ]),
    ).toThrow("A question was answered more than once.");
  });

  it("rejects options that do not belong to the question", () => {
    expect(() =>
      gradeQuiz(questions, [{ questionId: "q1", optionIds: ["not-an-option"] }]),
    ).toThrow("A submitted answer contains invalid option identifiers.");
  });

  it("rejects questions outside the quiz", () => {
    expect(() =>
      gradeQuiz(questions, [{ questionId: "q3", optionIds: ["a"] }]),
    ).toThrow("The submission contains a question outside this quiz.");
  });
});
