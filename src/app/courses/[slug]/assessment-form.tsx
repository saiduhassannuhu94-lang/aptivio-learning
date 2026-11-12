"use client";

import { useState, type FormEvent } from "react";

export type AssessmentQuestion = {
  id: string;
  type: string;
  prompt: string;
  marks: number;
  rubric: string[];
};

type AssessmentFormProps = {
  assessmentId: string;
  questions: AssessmentQuestion[];
  alreadySubmitted: boolean;
};

export function AssessmentForm({
  assessmentId,
  questions,
  alreadySubmitted,
}: AssessmentFormProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(alreadySubmitted);
  const [error, setError] = useState<string | null>(null);

  const completedCount = questions.filter((question) => answers[question.id]?.trim()).length;
  const progress = questions.length ? (completedCount / questions.length) * 100 : 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (completedCount !== questions.length) {
      setError("Answer every question before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/learning/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentId,
          answers: questions.map((question) => ({
            questionId: question.id,
            response: answers[question.id].trim(),
          })),
        }),
      });
      const result = await response.json() as { error?: string; submitted?: boolean };
      if (!response.ok || !result.submitted) {
        setError(result.error || "Your assessment could not be submitted.");
        return;
      }
      setSubmitted(true);
      setAnswers({});
    } catch {
      setError("Network error. Your answers have not been confirmed as submitted.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="assessment-form" onSubmit={handleSubmit}>
      <div className="assessment-progress">
        <span>{completedCount} of {questions.length} answered</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="assessment-progress-track" aria-hidden="true">
        <span style={{ width: progress + "%" }} />
      </div>

      {questions.map((question, index) => (
        <section className="assessment-question" key={question.id}>
          <div className="assessment-question-heading">
            <span>QUESTION {String(index + 1).padStart(2, "0")}</span>
            <strong>{question.marks} marks</strong>
          </div>
          <h2>{question.prompt}</h2>
          <div className="assessment-rubric">
            <strong>Marking guide</strong>
            <ul>{question.rubric.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
          <label className="assessment-answer-label" htmlFor={"answer-" + question.id}>Your answer</label>
          <textarea
            id={"answer-" + question.id}
            rows={5}
            value={answers[question.id] ?? ""}
            onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))}
            placeholder="Write your reasoning, solution or explanation here..."
            maxLength={12000}
            required
          />
        </section>
      ))}

      {error && <p className="assessment-error" role="alert">{error}</p>}
      {submitted && (
        <p className="assessment-success" role="status">
          Your latest submission has been received. It is awaiting human marking; no automatic grade has been invented.
        </p>
      )}
      <button className="button button-primary" type="submit" disabled={submitting || completedCount !== questions.length}>
        {submitting ? "Submitting..." : submitted ? "Submit revised answers" : "Submit final assessment"}
      </button>
      <p className="assessment-disclaimer">Your written work is submitted for human marking. This assessment is not automatically graded.</p>
    </form>
  );
}
