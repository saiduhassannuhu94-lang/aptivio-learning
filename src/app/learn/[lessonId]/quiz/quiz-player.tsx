"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { LearningQuizQuestion } from "@/lib/learning/quiz-bank";

type NextCourse = { slug: string; title: string } | null;
type Props = {
  courseSlug: string;
  courseTitle: string;
  questions: LearningQuizQuestion[];
  nextCourse: NextCourse;
};

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
}

export function QuizPlayer({ courseSlug, courseTitle, questions, nextCourse }: Props) {
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [expired, setExpired] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(300);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  useEffect(() => {
    if (!started || finished) return;
    const ticker = window.setInterval(() => {
      setSecondsLeft((remaining) => Math.max(remaining - 1, 0));
    }, 1000);
    const expiry = window.setTimeout(() => {
      setSecondsLeft(0);
      setExpired(true);
      setFinished(true);
    }, 300_000);
    return () => {
      window.clearInterval(ticker);
      window.clearTimeout(expiry);
    };
  }, [finished, started]);

  useEffect(() => {
    if (!finished) return;
    try {
      const key = "aptivio:quiz-history:" + courseSlug;
      const existing = window.localStorage.getItem(key);
      const history = existing ? JSON.parse(existing) as unknown : [];
      const entries = Array.isArray(history) ? history.slice(-9) : [];
      entries.push({
        score,
        total: questions.length,
        percentage,
        passed,
        expired,
        completedAt: new Date().toISOString(),
      });
      window.localStorage.setItem(key, JSON.stringify(entries));
    } catch {
      // The quiz still completes if browser storage is unavailable.
    }
  }, [courseSlug, expired, finished, passed, percentage, questions.length, score]);

  function chooseAnswer(optionIndex: number) {
    if (!started || finished || hasAnsweredCurrent) return;
    setAnswers((current) => ({ ...current, [currentIndex]: optionIndex }));
  }

  function continueQuiz() {
    if (!hasAnsweredCurrent || finished) return;
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((current) => current + 1);
    } else {
      setFinished(true);
    }
  }

  function retryQuiz() {
    setStarted(false);
    setFinished(false);
    setExpired(false);
    setSecondsLeft(300);
    setCurrentIndex(0);
    setAnswers({});
  }

  if (!started) {
    return (
      <section className="quiz-start-card">
        <Link className="quiz-back-link" href={"/learn/" + courseSlug}>← Back to course</Link>
        <span className="quiz-eyebrow">APTIVIO · KNOWLEDGE CHECK</span>
        <div className="quiz-start-icon" aria-hidden="true">✦</div>
        <h1>Test what you have learned.</h1>
        <p className="quiz-start-description">{courseTitle}. Answer each question, read the feedback and use your result to decide what to revise next.</p>
        <div className="quiz-rules-grid">
          <div><strong>{questions.length}</strong><span>Questions</span></div>
          <div><strong>05:00</strong><span>Time limit</span></div>
          <div><strong>70%</strong><span>Pass mark</span></div>
        </div>
        <div className="quiz-start-note"><b>How it works</b><span>One question appears at a time. Feedback appears after each answer. You need at least 70% to unlock the next learning path. This is a practice assessment, not a standardised IQ test.</span></div>
        <button type="button" className="aptivio-action quiz-primary-action" onClick={() => setStarted(true)}>Start assessment <span aria-hidden="true">→</span></button>
      </section>
    );
  }

  if (finished) {
    return (
      <section className="quiz-finish-shell" aria-live="polite">
        <div className={"quiz-result-card " + (passed ? "is-passed" : "is-failed")}>
          {passed && <div className="quiz-confetti" aria-hidden="true">{Array.from({ length: 18 }, (_, index) => <i key={index} style={{ "--confetti-index": index } as CSSProperties} />)}</div>}
          <div className="quiz-result-symbol" aria-hidden="true">{passed ? "✓" : "×"}</div>
          <span className="quiz-eyebrow">{passed ? "LEVEL CLEARED" : "KEEP BUILDING YOUR SKILL"}</span>
          <h1>{passed ? "You did it!" : "Not passed this time."}</h1>
          <p>{passed
            ? "You have shown a good understanding of " + courseTitle + ". Your next learning path is ready."
            : "You completed the assessment, but your score is below the 70% pass mark. Review the explanations and try again."}</p>
          <div className="quiz-score-display"><strong>{percentage}%</strong><span>{score} correct out of {questions.length}</span></div>
          {expired && <p className="quiz-expired-note">The countdown reached zero. Unanswered questions were marked incorrect.</p>}
          <p className="quiz-save-status">Attempt history is kept in this browser when storage is available.</p>
          {passed ? (
            <Link className="aptivio-action quiz-primary-action" href={nextCourse ? "/learn/" + nextCourse.slug : "/courses"}>
              {nextCourse ? "Move to next level" : "Explore more learning paths"} <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <div className="quiz-result-actions">
              <button type="button" className="aptivio-action quiz-primary-action" onClick={retryQuiz}>Try again <span aria-hidden="true">↻</span></button>
              <Link className="aptivio-action quiz-secondary-action" href={"/learn/" + courseSlug}>Review learning path</Link>
            </div>
          )}
        </div>
        <section className="quiz-review-list">
          <h2>Answer review</h2>
          {questions.map((question, index) => {
            const chosen = answers[index];
            const correct = chosen === question.correctIndex;
            return (
              <article className={"quiz-review-item " + (correct ? "review-correct" : "review-wrong")} key={question.id}>
                <div className="quiz-review-heading"><strong>Question {index + 1}</strong><span>{correct ? "✓ Correct" : "✕ Fail"}</span></div>
                <p>{question.prompt}</p>
                <small>Your answer: {chosen === undefined ? "Not answered" : question.options[chosen]}</small>
                {!correct && <small>Correct answer: {question.options[question.correctIndex]}</small>}
                <p className="quiz-review-explanation">{question.explanation}</p>
              </article>
            );
          })}
        </section>
      </section>
    );
  }

  return (
    <section className="quiz-running-card">
      <div className="quiz-running-topline">
        <div><span className="quiz-eyebrow">APTIVIO KNOWLEDGE CHECK</span><h1>{courseTitle}</h1></div>
        <div className={"quiz-countdown " + (secondsLeft <= 60 ? "is-low" : "")} aria-live="off">
          <span aria-hidden="true">◷</span><strong>{formatTime(secondsLeft)}</strong><small>TIME LEFT</small>
        </div>
      </div>
      <div className="quiz-progress-track"><span style={{ width: ((currentIndex + (hasAnsweredCurrent ? 1 : 0)) / questions.length) * 100 + "%" }} /></div>
      <div className="quiz-question-meta"><span>QUESTION {currentIndex + 1} OF {questions.length}</span><span>{Math.round((currentIndex / questions.length) * 100)}% COMPLETE</span></div>
      <h2 className="quiz-question-prompt">{currentQuestion.prompt}</h2>
      <div className="quiz-answer-options">
        {currentQuestion.options.map((option, optionIndex) => {
          const isCorrect = optionIndex === currentQuestion.correctIndex;
          const isChosen = selectedOption === optionIndex;
          const stateClass = hasAnsweredCurrent
            ? (isCorrect ? "option-correct" : isChosen ? "option-wrong" : "")
            : "";
          return (
            <button
              key={option}
              type="button"
              className={"quiz-answer-option " + stateClass + (isChosen ? " is-selected" : "")}
              onClick={() => chooseAnswer(optionIndex)}
              disabled={hasAnsweredCurrent}
              aria-pressed={isChosen}
            >
              <span className="quiz-option-letter">{String.fromCharCode(65 + optionIndex)}</span>
              <span className="quiz-option-text">{option}</span>
              {hasAnsweredCurrent && isCorrect && <span className="quiz-option-state" aria-label="Correct">✓</span>}
              {hasAnsweredCurrent && isChosen && !isCorrect && <span className="quiz-option-state" aria-label="Failed">✕</span>}
            </button>
          );
        })}
      </div>
      {hasAnsweredCurrent && (
        <div className={"quiz-answer-feedback " + (selectedOption === currentQuestion.correctIndex ? "feedback-correct" : "feedback-wrong")} role="status">
          <strong>{selectedOption === currentQuestion.correctIndex ? "✓ Correct answer" : "✕ FAIL · Not quite"}</strong>
          <p>{currentQuestion.explanation}</p>
        </div>
      )}
      <div className="quiz-running-footer">
        <span>{hasAnsweredCurrent ? "Read the explanation before continuing." : "Choose one answer to continue."}</span>
        <button type="button" className="aptivio-action quiz-primary-action" onClick={continueQuiz} disabled={!hasAnsweredCurrent}>
          {currentIndex === questions.length - 1 ? "Finish quiz" : "Next question"} <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  );
}
