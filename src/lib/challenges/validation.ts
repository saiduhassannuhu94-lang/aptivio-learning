import { z } from "zod";

export const challengeSubmissionSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string().uuid(),
    optionIds: z.array(z.string().min(1).max(80)).max(8),
  })).max(200),
}).superRefine((value, context) => {
  const questionIds = value.answers.map((answer) => answer.questionId);
  if (new Set(questionIds).size !== questionIds.length) {
    context.addIssue({
      code: "custom",
      message: "A question can only be answered once.",
      path: ["answers"],
    });
  }

  value.answers.forEach((answer, index) => {
    if (new Set(answer.optionIds).size !== answer.optionIds.length) {
      context.addIssue({
        code: "custom",
        message: "An answer cannot contain duplicate options.",
        path: ["answers", index, "optionIds"],
      });
    }
  });
});
