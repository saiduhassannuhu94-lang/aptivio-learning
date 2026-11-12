"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type Option = { id: string; text: string };
type Question = {
  id: string;
  prompt: string;
  options: Option[];
  points: number;
  sort_order: number;
  explanation: string;
};
type Challenge = {
  id: string;
  slug: string;
  title: string;
  category: string;
  difficulty: string;
  summary: string;
  instructions: string;
  duration_seconds: number;
  max_attempts: number | null;
};
type Attempt = { id: string; attempt_number: number; started_at: string };
type Result = {
  attemptId: string;
  score: number;
  maxScore: number;
  percentage: number;
  elapsedSeconds: number;
  breakdown: { questionId: string; correct: boolean; awardedPoints: number; maxPoints: number }[];
};

function formatTime(seconds: number) {
  const safe = Math.max(0, seconds);
  return `${Math.floor(safe / 60).toString().padStart(2, "0")}:${(safe % 60).toString().padStart(2, "0")}`;
}

export function ChallengeRunner({ slug }: { slug: string }) {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const submittedRef = useRef(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch(`/api/challenges/${encodeURIComponent(slug)}`);
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Challenge could not be loaded.");
        if (!active) return;
        setChallenge(payload.challenge);
        setQuestions(payload.questions);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Challenge could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [slug]);

  const submit = useCallback(async () => {
    if (!attempt || submittedRef.current || submitting || expired) return;
    submittedRef.current = true;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(`/api/challenges/attempts/${attempt.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: questions.map((question) => ({
            questionId: question.id,
            optionIds: answers[question.id] ? [answers[question.id]] : [],
          })),
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        if (response.status === 410) setExpired(true);
        throw new Error(payload.error ?? "Your result could not be saved.");
      }
      setResult(payload.result);
    } catch (submitError) {
      submittedRef.current = false;
      setError(submitError instanceof Error ? submitError.message : "Your result could not be saved.");
    } finally {
      setSubmitting(false);
    }
  }, [attempt, answers, questions, submitting, expired]);

  useEffect(() => {
    if (!attempt || !challenge || result || expired) return;
    const update = () => {
      const elapsed = Math.floor((Date.now() - new Date(attempt.started_at).getTime()) / 1000);
      const left = Math.max(0, challenge.duration_seconds - elapsed);
      setRemaining(left);
      if (left === 0) void submit();
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [attempt, challenge, result, expired, submit]);

  async function start() {
    if (!challenge || starting) return;
    setStarting(true);
    setError("");
    try {
      const response = await fetch(`/api/challenges/${challenge.id}/attempts`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) {
        if (payload.error?.includes("Resume it")) {
          const current = await fetch(`/api/challenges/${challenge.id}/attempts`);
          const currentPayload = await current.json();
          if (current.ok && currentPayload.attempt) {
            setAttempt(currentPayload.attempt);
            return;
          }
        }
        throw new Error(payload.error ?? "Could not start the challenge.");
      }
      setAttempt(payload.attempt);
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Could not start the challenge.");
    } finally {
      setStarting(false);
    }
  }

  if (loading) return <section className="challenge-runner-shell"><p>Loading challenge…</p></section>;
  if (error && !challenge) return <section className="challenge-runner-shell"><p role="alert">{error}</p><Link href="/challenges">Back to challenges</Link></section>;
  if (!challenge) return null;

  if (expired) {
    return (
      <section className="challenge-runner-shell">
        <div className="result-panel">
          <span className="eyebrow">TIME LIMIT REACHED</span>
          <h1>This attempt has expired.</h1>
          <p className="result-summary">Your time ran out before the challenge was submitted. No score has been recorded for this attempt.</p>
          <Link className="button button-primary" href="/challenges">Choose another challenge</Link>
        </div>
      </section>
    );
  }

  if (result) {
    const correct = result.breakdown.filter((item) => item.correct).length;
    return (
      <section className="challenge-runner-shell">
        <div className="result-panel">
          <span className="eyebrow">CHALLENGE COMPLETE</span>
          <h1>Your result is in.</h1>
          <div className="result-score">{result.percentage}<small>%</small></div>
          <p className="result-summary">You answered {correct} of {questions.length} questions correctly in {formatTime(result.elapsedSeconds)}.</p>
          <div className="result-stats">
            <div><strong>{result.score}/{result.maxScore}</strong><span>Points</span></div>
            <div><strong>{correct}/{questions.length}</strong><span>Correct</span></div>
            <div><strong>{formatTime(result.elapsedSeconds)}</strong><span>Time used</span></div>
          </div>
          <h2>Review your answers</h2>
          <div className="answer-review">
            {questions.map((question, questionIndex) => {
              const item = result.breakdown.find((entry) => entry.questionId === question.id);
              return (
                <article className="answer-review-item" key={question.id}>
                  <span className={item?.correct ? "review-status is-correct" : "review-status is-wrong"}>{item?.correct ? "Correct" : "Review"}</span>
                  <h3>{questionIndex + 1}. {question.prompt}</h3>
                  <p>{question.explanation}</p>
                </article>
              );
            })}
          </div>
          <p className="challenge-disclaimer">This is your score on this practice challenge. It is not a standardised IQ score.</p>
          <div className="runner-actions"><Link className="button button-primary" href="/progress">View my progress</Link><Link className="text-link" href="/challenges">Try another challenge ↗</Link></div>
        </div>
      </section>
    );
  }

  if (!attempt) {
    return (
      <section className="challenge-runner-shell">
        <div className="challenge-intro-card">
          <span className="eyebrow">{challenge.category.toUpperCase()} / {challenge.difficulty.toUpperCase()}</span>
          <h1>{challenge.title}</h1>
          <p>{challenge.summary}</p>
          {challenge.instructions && <p>{challenge.instructions}</p>}
          <div className="challenge-hero-meta"><span>{questions.length} questions</span><span>{Math.ceil(challenge.duration_seconds / 60)} minutes</span><span>One point per question</span></div>
          <div className="challenge-notice">You need to sign in to save your attempt and result. Your score measures this challenge only, not your overall IQ.</div>
          <button className="button button-primary" type="button" onClick={start} disabled={starting}>{starting ? "Starting…" : "Start challenge ↗"}</button>
          {error && <p className="challenge-error" role="alert">{error}</p>}
          {error.toLowerCase().includes("sign in") && <Link className="text-link" href="/sign-in">Sign in to save your attempt ↗</Link>}
          <Link className="text-link runner-back" href="/challenges">← All challenges</Link>
        </div>
      </section>
    );
  }

  const question = questions[index];
  const answeredCount = Object.keys(answers).length;

  return (
    <section className="challenge-runner-shell">
      <div className="runner-topline"><span>{challenge.title}</span><span className={remaining < 30 ? "runner-timer is-low" : "runner-timer"}>◷ {formatTime(remaining)}</span></div>
      <div className="runner-progress"><span style={{ width: `${((index + 1) / questions.length) * 100}%` }} /></div>
      <div className="runner-question-card">
        <div className="runner-question-meta"><span>QUESTION {index + 1} OF {questions.length}</span><span>{answeredCount} answered</span></div>
        <h1>{question.prompt}</h1>
        <div className="runner-options">
          {question.options.map((option) => (
            <label className={answers[question.id] === option.id ? "runner-option selected" : "runner-option"} key={option.id}>
              <input
                type="radio"
                name={question.id}
                value={option.id}
                checked={answers[question.id] === option.id}
                onChange={() => setAnswers((current) => ({ ...current, [question.id]: option.id }))}
              />
              <span className="option-marker">{option.id.toUpperCase()}</span>
              <span>{option.text}</span>
            </label>
          ))}
        </div>
        {error && <p className="challenge-error" role="alert">{error}</p>}
        <div className="runner-actions">
          <button className="button button-outline" type="button" onClick={() => setIndex((value) => Math.max(0, value - 1))} disabled={index === 0}>Previous</button>
          {index < questions.length - 1 ? (
            <button className="button button-primary" type="button" onClick={() => setIndex((value) => Math.min(questions.length - 1, value + 1))}>Next question →</button>
          ) : (
            <button className="button button-primary" type="button" onClick={() => void submit()} disabled={submitting}>{submitting ? "Submitting…" : "Submit challenge"}</button>
          )}
        </div>
        <p className="runner-footnote">Your answers are saved when you submit. You can move between questions before finishing.</p>
      </div>
    </section>
  );
}
