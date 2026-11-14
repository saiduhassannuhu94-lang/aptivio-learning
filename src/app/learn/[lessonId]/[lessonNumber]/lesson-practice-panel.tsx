"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Props = {
  courseSlug: string;
  lessonNumber: number;
  lessonTitle: string;
  exercise: string;
  takeaways: string[];
};

type StoredReflection = { answer?: string; checked?: boolean[] };

export function LessonPracticePanel({ courseSlug, lessonNumber, lessonTitle, exercise, takeaways }: Props) {
  const key = useMemo(() => "aptivio:lesson-notes:" + courseSlug + ":" + lessonNumber, [courseSlug, lessonNumber]);
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState<boolean[]>(() => takeaways.map(() => false));
  const [saved, setSaved] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [progressReady, setProgressReady] = useState(false);
  const [progressSaving, setProgressSaving] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(key);
        if (stored && active) {
          const parsed = JSON.parse(stored) as StoredReflection;
          setAnswer(typeof parsed.answer === "string" ? parsed.answer : "");
          setChecked(takeaways.map((_, index) => parsed.checked?.[index] === true));
        }
      } catch {
        if (active) setAnswer("");
      }
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [key, takeaways]);

  useEffect(() => {
    let active = true;
    async function loadProgress() {
      try {
        const response = await fetch("/api/learning/library-progress?slug=" + encodeURIComponent(courseSlug), { cache: "no-store" });
        if (!active) return;
        if (response.status === 401) {
          setProgressError("Sign in to sync completed lessons across your devices.");
          return;
        }
        if (!response.ok) {
          setProgressError("Lesson progress could not be loaded. Refresh and try again.");
          return;
        }
        const data = await response.json() as { completedLessonNumbers?: number[] };
        if (active) setCompleted((data.completedLessonNumbers ?? []).includes(lessonNumber));
      } catch {
        if (active) setProgressError("Your connection prevented progress from loading.");
      } finally {
        if (active) setProgressReady(true);
      }
    }
    void loadProgress();
    return () => { active = false; };
  }, [courseSlug, lessonNumber]);

  function saveReflection() {
    try {
      window.localStorage.setItem(key, JSON.stringify({ answer, checked }));
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }

  function updateCheck(index: number, value: boolean) {
    setChecked((current) => current.map((item, itemIndex) => itemIndex === index ? value : item));
    setSaved(false);
  }

  async function saveCompletion(nextCompleted: boolean) {
    setProgressSaving(true);
    setProgressError(null);
    try {
      const response = await fetch("/api/learning/library-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: courseSlug, lessonNumber, completed: nextCompleted }),
      });
      const data = await response.json().catch(() => ({})) as { completed?: boolean; error?: string };
      if (!response.ok) {
        setProgressError(response.status === 401
          ? "Sign in to sync completed lessons across your devices."
          : data.error ?? "Your progress could not be saved. Please try again.");
        return;
      }
      setCompleted(data.completed === true);
    } catch {
      setProgressError("Your connection prevented progress from saving.");
    } finally {
      setProgressSaving(false);
    }
  }

  const reviewed = checked.filter(Boolean).length;

  return (
    <section className="lesson-practice-studio">
      <div className="practice-studio-heading"><div><span className="eyebrow">YOUR TURN</span><h2>Practice studio</h2><p>Do the exercise before you move on. Writing your reasoning helps expose gaps you might miss by simply reading.</p></div><span className="practice-studio-mark">✎</span></div>
      <div className="practice-task"><span>THE EXERCISE</span><p>{exercise}</p></div>
      <label className="practice-answer-label" htmlFor="lesson-reflection">Write your attempt</label>
      <textarea id="lesson-reflection" value={answer} onChange={(event) => { setAnswer(event.target.value); setSaved(false); }} placeholder="Explain your steps, show your working, or write what you would try first…" rows={6} />
      <div className="practice-save-row"><small>Your reflection is saved on this device, not sent to a teacher.</small><button type="button" className="button button-primary" onClick={saveReflection}>Save my working</button></div>
      <div className="practice-self-check"><div className="practice-self-check-heading"><div><span className="eyebrow">BE HONEST WITH YOURSELF</span><h3>Can you explain these ideas?</h3></div><strong>{reviewed}/{takeaways.length}</strong></div>
        {takeaways.map((takeaway, index) => <label className="practice-check-row" key={takeaway}><input type="checkbox" checked={checked[index] ?? false} onChange={(event) => updateCheck(index, event.target.checked)} /><span>{takeaway}</span></label>)}
        <div className="practice-check-footer">{reviewed === takeaways.length ? "You have checked every takeaway. Try explaining the lesson without looking." : "Tick an idea only when you can explain it in your own words."}</div>
      </div>
      <div className="lesson-completion-panel">
        <div><span className="eyebrow">ACCOUNT PROGRESS</span><strong>{completed ? "Lesson completed" : "Ready to record your progress?"}</strong><small>{completed ? "This lesson is saved to your APTIVIO account." : "Check every takeaway before marking this lesson complete."}</small></div>
        <button type="button" className={completed ? "button button-outline" : "button button-primary"} onClick={() => void saveCompletion(!completed)} disabled={!progressReady || progressSaving || !!progressError || reviewed !== takeaways.length}>
          {progressSaving ? "Saving…" : completed ? "Undo completion" : "Mark lesson complete"}
        </button>
      </div>
      {progressError && <p className="lesson-progress-error" role="status">{progressError} {progressError.startsWith("Sign in") && <Link href="/sign-in">Sign in ↗</Link>}</p>}
      {saved && <p className="practice-saved-note" role="status">Your working has been saved on this device.</p>}
      <span className="practice-lesson-reference">REFLECTION NOTE · {lessonTitle}</span>
    </section>
  );
}
