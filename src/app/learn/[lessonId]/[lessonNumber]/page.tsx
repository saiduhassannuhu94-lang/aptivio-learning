import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getLearningPackage, learningPackages } from "@/lib/learning/library";

type Props = { params: Promise<{ lessonId: string; lessonNumber: string }> };

function renderText(text: string) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={index}>{part.slice(1, -1)}</code>;
    return part;
  });
}

function LessonBody({ markdown }: { markdown: string }) {
  const lines = markdown.split("\n");
  const blocks: { type: "paragraph" | "h2" | "h3" | "quote" | "list" | "ordered"; lines: string[] }[] = [];
  let current: typeof blocks[number] | null = null;
  const flush = () => { if (current) blocks.push(current); current = null; };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { flush(); continue; }
    const type = trimmed.startsWith("### ") ? "h3"
      : trimmed.startsWith("## ") ? "h2"
      : trimmed.startsWith("> ") ? "quote"
      : /^-\s/.test(trimmed) ? "list"
      : /^\d+\.\s/.test(trimmed) ? "ordered"
      : "paragraph";
    if (!current || current.type !== type) { flush(); current = { type, lines: [] }; }
    current.lines.push(trimmed);
  }
  flush();

  return <div className="lesson-body">{blocks.map((block, index) => {
    if (block.type === "h2") return <h2 key={index}>{renderText(block.lines[0].slice(3))}</h2>;
    if (block.type === "h3") return <h3 key={index}>{renderText(block.lines[0].slice(4))}</h3>;
    if (block.type === "quote") return <blockquote key={index}>{block.lines.map((line) => <p key={line}>{renderText(line.replace(/^>\s?/, ""))}</p>)}</blockquote>;
    if (block.type === "list") return <ul key={index}>{block.lines.map((line) => <li key={line}>{renderText(line.replace(/^-\s/, ""))}</li>)}</ul>;
    if (block.type === "ordered") return <ol key={index}>{block.lines.map((line) => <li key={line}>{renderText(line.replace(/^\d+\.\s/, ""))}</li>)}</ol>;
    return <p key={index}>{block.lines.map((line) => renderText(line)).reduce<ReactNode[]>((acc, value, lineIndex) => lineIndex ? [...acc, " ", value] : [value], [])}</p>;
  })}</div>;
}

export function generateStaticParams() {
  return learningPackages.flatMap((item) => {
    let number = 0;
    return item.sections.flatMap((section) => section.lessons.map(() => ({
      lessonId: item.course.slug,
      lessonNumber: String(++number),
    })));
  });
}

export default async function LearningLessonPage({ params }: Props) {
  const { lessonId, lessonNumber } = await params;
  const item = getLearningPackage(lessonId);
  const index = Number(lessonNumber);
  if (!item || !Number.isInteger(index) || index < 1) notFound();
  const lessons = item.sections.flatMap((section) => section.lessons);
  const lesson = lessons[index - 1];
  if (!lesson) notFound();
  const previous = index > 1 ? index - 1 : null;
  const next = index < lessons.length ? index + 1 : null;

  return (
    <main className="lesson-page">
      <header className="dashboard-header">
        <Link className="brand" href="/"><span className="brand-mark">A</span><span>APTIVIO</span></Link>
        <nav className="challenge-nav"><Link href="/challenges">Challenges</Link><Link href="/progress">My progress</Link></nav>
      </header>
      <section className="lesson-reader">
        <Link className="lesson-back-link" href={`/learn/${item.course.slug}`}>← {item.course.title}</Link>
        <div className="lesson-reader-meta"><span>LESSON {String(index).padStart(2, "0")} / {String(lessons.length).padStart(2, "0")}</span><span>{lesson.duration_minutes} min read</span></div>
        <h1>{lesson.title}</h1>
        <LessonBody markdown={lesson.body_markdown} />
        <div className="lesson-exercise"><span className="eyebrow">PRACTICE THIS</span><h2>Try it yourself</h2><p>{lesson.exercise}</p></div>
        <div className="lesson-takeaways"><h2>Key takeaways</h2><ul>{lesson.key_takeaways.map((takeaway) => <li key={takeaway}>{takeaway}</li>)}</ul></div>
        <div className="runner-actions lesson-navigation">
          {previous ? <Link className="button button-outline" href={`/learn/${item.course.slug}/${previous}`}>← Previous lesson</Link> : <span />}
          {next ? <Link className="button button-primary" href={`/learn/${item.course.slug}/${next}`}>Next lesson →</Link> : <Link className="button button-primary" href="/challenges">Test your thinking ↗</Link>}
        </div>
      </section>
    </main>
  );
}
