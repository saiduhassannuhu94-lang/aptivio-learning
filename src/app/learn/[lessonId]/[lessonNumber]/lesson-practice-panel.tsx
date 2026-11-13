"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  courseSlug: string;
  lessonNumber: number;
  lessonTitle: string;
  exercise: string;
  takeaways: string[];
};

export function LessonPracticePanel({ courseSlug, lessonNumber, lessonTitle, exercise, takeaways }: Props) {
  const key = useMemo(() => "aptivio:lesson-notes:" + courseSlug + ":" + lessonNumber, [courseSlug, lessonNumber]);
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState<boolean[]>(() => takeaways.map(() => false));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored) as { answer?: string; checked?: boolean[] };
        setAnswer(typeof parsed.answer === "string" ? parsed.answer : "");
        setChecked(takeaways.map((_, index) => parsed.checked?.[index] === true));
      }
    } catch {
      setAnswer("");
    }
  }, [key, takeaways]);

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
      {saved && <p className="practice-saved-note" role="status">Your working has been saved on this device.</p>}
      <span className="practice-lesson-reference">REFLECTION NOTE · {lessonTitle}</span>
    </section>
  );
}
