import { z } from "zod";

const optionSchema = z.object({
  id: z.string().min(1).max(80),
  text: z.string().min(1).max(500),
});

const optionsSchema = z.array(optionSchema).min(2).max(12);

export type GradeableQuestion = {
  id: string;
  question_type: string;
  points: number;
  options: unknown;
  correct_option_ids: string[];
};

export type SubmittedQuizAnswer = {
  questionId: string;
  optionIds: string[];
};

export type GradedAnswer = {
  question_id: string;
  response: { optionIds: string[] };
  awarded_points: number;
};

export function gradeQuiz(
  questions: GradeableQuestion[],
  submittedAnswers: SubmittedQuizAnswer[],
) {
  if (questions.length === 0) {
    throw new Error("This quiz has no questions.");
  }

  const questionIds = new Set(questions.map((question) => question.id));
  if (questionIds.size !== questions.length) {
    throw new Error("Quiz question identifiers are not unique.");
  }

  const submittedIds = new Set(submittedAnswers.map((answer) => answer.questionId));
  if (submittedIds.size !== submittedAnswers.length) {
    throw new Error("A question was answered more than once.");
  }

  if (submittedAnswers.some((answer) => !questionIds.has(answer.questionId))) {
    throw new Error("The submission contains a question outside this quiz.");
  }

  const answersByQuestion = new Map(
    submittedAnswers.map((answer) => [answer.questionId, answer.optionIds]),
  );

  let score = 0;
  let maxScore = 0;
  const gradedAnswers: GradedAnswer[] = [];

  for (const question of questions) {
    if (!Number.isInteger(question.points) || question.points < 1 || question.points > 1000) {
      throw new Error("A quiz question has an invalid point value.");
    }

    const parsedOptions = optionsSchema.safeParse(question.options);
    if (!parsedOptions.success) {
      throw new Error("A quiz question has invalid answer options.");
    }

    const optionIds = parsedOptions.data.map((option) => option.id);
    if (new Set(optionIds).size !== optionIds.length) {
      throw new Error("A quiz question contains duplicate option identifiers.");
    }

    if (!["single_choice", "multiple_choice", "true_false"].includes(question.question_type)) {
      throw new Error("A quiz question uses an unsupported question type.");
    }

    const correct = question.correct_option_ids;
    if (
      !Array.isArray(correct) ||
      correct.length === 0 ||
      correct.some((id) => !optionIds.includes(id)) ||
      new Set(correct).size !== correct.length
    ) {
      throw new Error("A quiz question has an invalid answer key.");
    }

    if (
      (question.question_type === "single_choice" || question.question_type === "true_false") &&
      correct.length !== 1
    ) {
      throw new Error("A single-answer question must have exactly one correct option.");
    }

    if (question.question_type === "true_false" && optionIds.length !== 2) {
      throw new Error("A true-or-false question must have exactly two options.");
    }

    const selected = answersByQuestion.get(question.id) ?? [];
    if (
      !Array.isArray(selected) ||
      new Set(selected).size !== selected.length ||
      selected.some((id) => !optionIds.includes(id))
    ) {
      throw new Error("A submitted answer contains invalid option identifiers.");
    }

    if (
      (question.question_type === "single_choice" || question.question_type === "true_false") &&
      selected.length > 1
    ) {
      throw new Error("Select only one option for this question.");
    }

    const isCorrect =
      selected.length === correct.length &&
      [...selected].sort().every((id, index) => id === [...correct].sort()[index]);

    const awardedPoints = isCorrect ? question.points : 0;
    maxScore += question.points;
    score += awardedPoints;

    gradedAnswers.push({
      question_id: question.id,
      response: { optionIds: selected },
      awarded_points: awardedPoints,
    });
  }

  return { score, maxScore, gradedAnswers };
}
