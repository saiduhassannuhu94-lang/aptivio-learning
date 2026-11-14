"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { LearningAssessment, LearningFinalProject } from "@/lib/learning/library";

type Props = {
  courseSlug: string;
  courseTitle: string;
  assessment: LearningAssessment;
  finalProject?: LearningFinalProject;
};

type ReviewValue = boolean | null;
type AssessmentState = {
  started: boolean;
  submitted: boolean;
  currentIndex: number;
  answers: Record<string, string>;
  rubricReview: Record<string, ReviewValue[]>;
  rubricRevealed: Record<string, boolean>;
};

const emptyState: AssessmentState = {
  started: false,
  submitted: false,
  currentIndex: 0,
  answers: {},
  rubricReview: {},
  rubricRevealed: {},
};

function criterionMarks(text: string, questionMarks: number, rubricCount: number) {
  const match = text.match(/\((\d+)\)\s*$/);
  return match ? Number(match[1]) : questionMarks / Math.max(1, rubricCount);
}

function questionTypeLabel(type: string) {
  return type.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function AssessmentPlayer({ courseSlug, courseTitle, assessment, finalProject }: Props) {
  const storageKey = "aptivio:course-assessment:" + courseSlug;
  const [state, setState] = useState<AssessmentState>(emptyState);
  const [hydrated, setHydrated] = useState(false);
  const totalMarks = assessment.total_marks || assessment.questions.reduce((sum, question) => sum + question.marks, 0);
  const currentQuestion = assessment.questions[state.currentIndex];

  useEffect(() => {
    let active = true;
    const frame = window.requestAnimationFrame(() => {
      try {
        const raw = window.localStorage.getItem(storageKey);
        if (raw && active) {
          const parsed = JSON.parse(raw) as Partial<AssessmentState>;
          const restoredIndex = Number.isInteger(parsed.currentIndex)
            ? Math.min(Math.max(parsed.currentIndex as number, 0), assessment.questions.length - 1)
            : 0;
          setState({
            started: parsed.started === true,
            submitted: parsed.submitted === true,
            currentIndex: restoredIndex,
            answers: parsed.answers && typeof parsed.answers === "object" ? parsed.answers : {},
            rubricReview: parsed.rubricReview && typeof parsed.rubricReview === "object" ? parsed.rubricReview : {},
            rubricRevealed: parsed.rubricRevealed && typeof parsed.rubricRevealed === "object" ? parsed.rubricRevealed : {},
          });
        }
      } catch {
        if (active) setState(emptyState);
      } finally {
        if (active) setHydrated(true);
      }
    });
    return () => {
      active = false;
      window.cancelAnimationFrame(frame);
    };
  }, [assessment.questions.length, storageKey]);

  function commit(next: AssessmentState) {
    setState(next);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // The assessment remains usable even when browser storage is unavailable.
    }
  }

  function updateAnswer(questionId: string, value: string) {
    commit({ ...state, answers: { ...state.answers, [questionId]: value } });
  }

  function revealRubric(questionId: string) {
    if ((state.answers[questionId] ?? "").trim().length < 12) return;
    commit({ ...state, rubricRevealed: { ...state.rubricRevealed, [questionId]: true } });
  }

  function updateCriterion(questionId: string, criterionIndex: number, value: boolean) {
    const question = assessment.questions.find((item) => item.id === questionId);
    if (!question) return;
    const review = state.rubricReview[questionId] ?? question.rubric.map(() => null);
    const nextReview = [...review];
    nextReview[criterionIndex] = value;
    commit({ ...state, rubricReview: { ...state.rubricReview, [questionId]: nextReview } });
  }

  function questionIsReviewed(questionId: string) {
    const question = assessment.questions.find((item) => item.id === questionId);
    if (!question || !state.rubricRevealed[questionId]) return false;
    const review = state.rubricReview[questionId] ?? [];
    return review.length === question.rubric.length && review.every((value) => value !== null);
  }

  function questionScore(questionId: string) {
    const question = assessment.questions.find((item) => item.id === questionId);
    if (!question) return 0;
    const review = state.rubricReview[questionId] ?? [];
    const raw = question.rubric.reduce((sum, criterion, index) => (
      sum + (review[index] === true ? criterionMarks(criterion, question.marks, question.rubric.length) : 0)
    ), 0);
    return Math.min(question.marks, raw);
  }

  const earnedMarks = assessment.questions.reduce((sum, question) => sum + questionScore(question.id), 0);
  const percentage = Math.round((earnedMarks / Math.max(1, totalMarks)) * 100);
  const passed = percentage >= assessment.pass_mark_percent;
  const currentReview = currentQuestion
    ? state.rubricReview[currentQuestion.id] ?? currentQuestion.rubric.map(() => null)
    : [];
  const currentAnswered = currentQuestion
    ? (state.answers[currentQuestion.id] ?? "").trim().length >= 12
    : false;
  const currentReviewed = currentQuestion ? questionIsReviewed(currentQuestion.id) : false;
  const isLastQuestion = state.currentIndex === assessment.questions.length - 1;

  if (!hydrated) {
    return <section className="assessment-loading" aria-live="polite">Preparing your assessment…</section>;
  }

  if (!state.started) {
    return (
      <section className="assessment-start-card">
        <Link className="assessment-back-link" href={"/learn/" + courseSlug}>← Back to learning path</Link>
        <span className="assessment-eyebrow">APTIVIO · COURSE ASSESSMENT</span>
        <div className="assessment-start-symbol" aria-hidden="true">✦</div>
        <h1>{assessment.title}</h1>
        <p className="assessment-start-description">{courseTitle}. This assessment uses the course&apos;s own written problems, practical tasks and marking rubric.</p>
        <div className="assessment-stats">
          <div><strong>{assessment.questions.length}</strong><span>Written tasks</span></div>
          <div><strong>{totalMarks}</strong><span>Total marks</span></div>
          <div><strong>{assessment.pass_mark_percent}%</strong><span>Target score</span></div>
        </div>
        <div className="assessment-instructions">
          <span>BEFORE YOU START</span>
          <p>{assessment.instructions}</p>
        </div>
        <div className="assessment-honesty-note">
          <strong>How marking works</strong>
          <p>Write your answer first. Then reveal the marking rubric and honestly mark each criterion as “Met” or “Not yet”. APTIVIO calculates the score from your self-review. It is not an AI grade or an independent teacher&apos;s mark.</p>
        </div>
        <button className="aptivio-action assessment-primary-action" type="button" onClick={() => commit({ ...emptyState, started: true })}>
          Start written assessment <span aria-hidden="true">→</span>
        </button>
      </section>
    );
  }

  if (state.submitted) {
    return (
      <div className="assessment-results">
        <section className={"assessment-result-card " + (passed ? "is-passed" : "is-not-passed")}>
          <Link className="assessment-back-link" href={"/learn/" + courseSlug}>← Back to learning path</Link>
          <span className="assessment-eyebrow">{passed ? "TARGET REACHED" : "MORE PRACTICE NEEDED"}</span>
          <div className="assessment-result-score">{percentage}%</div>
          <h1>{passed ? "Your self-review reached the target." : "Your self-review is below the target."}</h1>
          <p>You marked {earnedMarks} of {totalMarks} available marks as achieved. Use the review below to find the areas you marked “Not yet” and revisit those lessons.</p>
          <div className="assessment-result-caveat">This is a rubric-based self-review score. It has not been independently graded.</div>
          <div className="assessment-result-actions">
            <button type="button" className="aptivio-action assessment-primary-action" onClick={() => commit(emptyState)}>Retake assessment <span aria-hidden="true">↻</span></button>
            <Link className="aptivio-action assessment-secondary-action" href={"/learn/" + courseSlug}>Review the learning path</Link>
          </div>
        </section>
        <section className="assessment-review-list">
          <div className="assessment-review-heading"><span className="assessment-eyebrow">YOUR WORK</span><h2>Assessment review</h2></div>
          {assessment.questions.map((question, index) => {
            const review = state.rubricReview[question.id] ?? [];
            return (
              <article className="assessment-review-item" key={question.id}>
                <div className="assessment-review-top"><span>QUESTION {String(index + 1).padStart(2, "0")}</span><strong>{questionScore(question.id)} / {question.marks} marks self-awarded</strong></div>
                <h3>{question.prompt}</h3>
                <pre className="assessment-review-answer">{state.answers[question.id] || "No written answer saved."}</pre>
                <ul>{question.rubric.map((criterion, criterionIndex) => (
                  <li key={criterion} className={review[criterionIndex] === true ? "criterion-met" : "criterion-not-met"}>
                    <span>{review[criterionIndex] === true ? "✓ Met" : "○ Not yet"}</span>{criterion}
                  </li>
                ))}</ul>
              </article>
            );
          })}
        </section>
      </div>
    );
  }

  return (
    <section className="assessment-workspace">
      <header className="assessment-workspace-header">
        <div>
          <Link className="assessment-back-link" href={"/learn/" + courseSlug}>← Back to learning path</Link>
          <span className="assessment-eyebrow">WRITTEN ASSESSMENT · {courseTitle.toUpperCase()}</span>
          <h1>{assessment.title}</h1>
        </div>
        <div className="assessment-score-live"><span>SELF-REVIEW SCORE</span><strong>{earnedMarks}<small> / {totalMarks}</small></strong></div>
      </header>
      <div className="assessment-progress-row">
        <span>QUESTION {state.currentIndex + 1} OF {assessment.questions.length}</span>
        <span>{Math.round(((state.currentIndex + (currentReviewed ? 1 : 0)) / assessment.questions.length) * 100)}% REVIEWED</span>
      </div>
      <div className="assessment-progress-track"><span style={{ width: ((state.currentIndex + (currentReviewed ? 1 : 0)) / assessment.questions.length) * 100 + "%" }} /></div>

      <article className="assessment-question-card">
        <div className="assessment-question-kicker">
          <span>{questionTypeLabel(currentQuestion.type)}</span>
          <strong>{currentQuestion.marks} MARKS</strong>
        </div>
        <h2>{currentQuestion.prompt}</h2>

        {currentQuestion.type === "project" && finalProject && (
          <div className="assessment-project-brief">
            <span>CAPSTONE PROJECT · {finalProject.title}</span>
            <div className="assessment-project-columns">
              <div><h3>What to submit</h3><ul>{finalProject.deliverables.map((item) => <li key={item}>{item}</li>)}</ul></div>
              <div><h3>Acceptance checks</h3><ul>{finalProject.acceptance_criteria.map((item) => <li key={item}>{item}</li>)}</ul></div>
            </div>
          </div>
        )}

        <label className="assessment-answer-label" htmlFor={"answer-" + currentQuestion.id}>Your answer or working</label>
        <textarea
          id={"answer-" + currentQuestion.id}
          className="assessment-answer-input"
          value={state.answers[currentQuestion.id] ?? ""}
          onChange={(event) => updateAnswer(currentQuestion.id, event.target.value)}
          placeholder="Write your reasoning, solution, code or test cases here…"
          rows={9}
          spellCheck
        />
        <div className="assessment-answer-status">
          <span>{currentAnswered ? "Your response is saved on this device." : "Write at least a few complete sentences or a working solution before reviewing the rubric."}</span>
          <span>{(state.answers[currentQuestion.id] ?? "").length} characters</span>
        </div>

        {!state.rubricRevealed[currentQuestion.id] ? (
          <div className="assessment-reveal-rubric">
            <button className="aptivio-action assessment-secondary-action" type="button" disabled={!currentAnswered} onClick={() => revealRubric(currentQuestion.id)}>
              Reveal marking rubric <span aria-hidden="true">↓</span>
            </button>
            <small>The rubric stays hidden until you have written your attempt.</small>
          </div>
        ) : (
          <section className="assessment-rubric">
            <div className="assessment-rubric-heading"><div><span className="assessment-eyebrow">SELF-REVIEW</span><h3>Compare your work with each criterion</h3></div><strong>{questionScore(currentQuestion.id)} / {currentQuestion.marks}</strong></div>
            <p>Choose one honest result for every line. Do not award marks for something your answer does not show.</p>
            {currentQuestion.rubric.map((criterion, index) => {
              const mark = criterionMarks(criterion, currentQuestion.marks, currentQuestion.rubric.length);
              return (
                <div className="assessment-rubric-row" key={criterion}>
                  <span className="assessment-rubric-mark">{mark} {mark === 1 ? "mark" : "marks"}</span>
                  <span className="assessment-rubric-text">{criterion}</span>
                  <div className="assessment-rubric-choices">
                    <button type="button" className={currentReview[index] === true ? "is-met" : ""} aria-pressed={currentReview[index] === true} onClick={() => updateCriterion(currentQuestion.id, index, true)}>Met</button>
                    <button type="button" className={currentReview[index] === false ? "is-not-met" : ""} aria-pressed={currentReview[index] === false} onClick={() => updateCriterion(currentQuestion.id, index, false)}>Not yet</button>
                  </div>
                </div>
              );
            })}
            <div className="assessment-rubric-footer">{currentReviewed ? "Every criterion has been reviewed. You can continue." : "Review every criterion before moving to the next question."}</div>
          </section>
        )}
      </article>

      <footer className="assessment-navigation">
        <button className="aptivio-action assessment-secondary-action" type="button" disabled={state.currentIndex === 0} onClick={() => commit({ ...state, currentIndex: Math.max(0, state.currentIndex - 1) })}>← Previous</button>
        <span>{currentReviewed ? "Your review is ready." : "Complete your self-review to continue."}</span>
        {isLastQuestion ? (
          <button className="aptivio-action assessment-primary-action" type="button" disabled={!currentReviewed} onClick={() => commit({ ...state, submitted: true })}>Submit self-review <span aria-hidden="true">✓</span></button>
        ) : (
          <button className="aptivio-action assessment-primary-action" type="button" disabled={!currentReviewed} onClick={() => commit({ ...state, currentIndex: state.currentIndex + 1 })}>Next question <span aria-hidden="true">→</span></button>
        )}
      </footer>
      <p className="assessment-storage-note">Your written answers and self-review are stored in this browser only. They are not sent to a teacher or synced between devices.</p>
    </section>
  );
}
