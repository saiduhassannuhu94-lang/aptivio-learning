import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getLearningPackage, learningPackages } from "@/lib/learning/library";
import { LessonPracticePanel } from "./lesson-practice-panel";

type Props = { params: Promise<{ lessonId: string; lessonNumber: string }> };
type Block = { type: "paragraph" | "h2" | "h3" | "quote" | "list" | "ordered" | "code"; lines: string[]; language?: string };

function renderText(text: string) {
  return text.split(/(\*\*[^*]+\*\*|\x60[^\x60]+\x60)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("\x60") && part.endsWith("\x60")) return <code key={index}>{part.slice(1, -1)}</code>;
    return part;
  });
}

function parseMarkdown(markdown: string): Block[] {
  const blocks: Block[] = [];
  const lines = markdown.split("\n");
  let current: Block | null = null;
  let codeLines: string[] | null = null;
  let codeLanguage = "";
  const flush = () => { if (current) blocks.push(current); current = null; };

  for (const line of lines) {
    const trimmed = line.trim();
    if (codeLines) {
      if (trimmed.startsWith("\x60\x60\x60")) {
        blocks.push({ type: "code", lines: codeLines, language: codeLanguage });
        codeLines = null;
        codeLanguage = "";
      } else {
        codeLines.push(line);
      }
      continue;
    }
    if (trimmed.startsWith("\x60\x60\x60")) {
      flush();
      codeLines = [];
      codeLanguage = trimmed.slice(3).trim();
      continue;
    }
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
  if (codeLines) blocks.push({ type: "code", lines: codeLines, language: codeLanguage });
  return blocks;
}

function renderBlock(block: Block, index: number): ReactNode {
  if (block.type === "h2") return <h2 key={index}>{renderText(block.lines[0].slice(3))}</h2>;
  if (block.type === "h3") return <h3 key={index}>{renderText(block.lines[0].slice(4))}</h3>;
  if (block.type === "quote") return <blockquote key={index}>{block.lines.map((line) => <p key={line}>{renderText(line.replace(/^>\s?/, ""))}</p>)}</blockquote>;
  if (block.type === "list") return <ul key={index}>{block.lines.map((line) => <li key={line}>{renderText(line.replace(/^-\s/, ""))}</li>)}</ul>;
  if (block.type === "ordered") return <ol key={index}>{block.lines.map((line) => <li key={line}>{renderText(line.replace(/^\d+\.\s/, ""))}</li>)}</ol>;
  if (block.type === "code") return <div className="lesson-code-panel" key={index}><div className="lesson-code-label"><span>WORKED CODE</span><small>{block.language || "EXAMPLE"}</small></div><pre><code>{block.lines.join("\n")}</code></pre></div>;
  return <p key={index}>{block.lines.map((line) => renderText(line)).reduce<ReactNode[]>((acc, value, lineIndex) => lineIndex ? [...acc, " ", value] : [value], [])}</p>;
}

function LessonBody({ markdown }: { markdown: string }) {
  const blocks = parseMarkdown(markdown);
  const output: ReactNode[] = [];
  let index = 0;
  while (index < blocks.length) {
    const block = blocks[index];
    if (block.type === "h3" && /worked example|real-life example|example:/i.test(block.lines[0])) {
      const example: Block[] = [];
      const heading = block;
      index += 1;
      while (index < blocks.length && blocks[index].type !== "h2" && blocks[index].type !== "h3") {
        example.push(blocks[index]);
        index += 1;
      }
      output.push(
        <section className="lesson-worked-example" key={index}>
          <div className="lesson-example-heading"><span className="lesson-example-icon">✳</span><div><span className="eyebrow">SEE THE IDEA IN ACTION</span><h3>{renderText(heading.lines[0].slice(4))}</h3></div></div>
          <div className="lesson-example-content">{example.map((part, partIndex) => renderBlock(part, partIndex))}</div>
        </section>,
      );
      continue;
    }
    output.push(renderBlock(block, index));
    index += 1;
  }
  return <div className="lesson-body">{output}</div>;
}

function LearningMap() {
  return (
    <section className="lesson-learning-map" aria-label="How this lesson works">
      <div className="lesson-map-step"><span>01</span><b>Understand</b><small>Build the idea</small></div>
      <div className="lesson-map-line" />
      <div className="lesson-map-step"><span>02</span><b>See it</b><small>Study an example</small></div>
      <div className="lesson-map-line" />
      <div className="lesson-map-step"><span>03</span><b>Try it</b><small>Work it yourself</small></div>
      <div className="lesson-map-line" />
      <div className="lesson-map-step"><span>04</span><b>Explain it</b><small>Check your thinking</small></div>
    </section>
  );
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
  let running = 0;
  const sectionIndex = item.sections.findIndex((group) => {
    running += group.lessons.length;
    return index <= running;
  });
  const section = item.sections[sectionIndex];

  return (
    <main className="lesson-page lesson-experience">
      <header className="dashboard-header">
        <Link className="brand" href="/"><span className="brand-mark">A</span><span>APTIVIO</span></Link>
        <nav className="challenge-nav"><Link href="/courses">Learning library</Link><Link href="/challenges">Brain challenges</Link><Link href="/progress">My progress</Link></nav>
      </header>
      <div className="lesson-experience-grid">
        <aside className="lesson-outline">
          <Link className="lesson-back-link" href={"/learn/" + item.course.slug}>← Back to learning path</Link>
          <span className="eyebrow">YOUR LEARNING PATH</span>
          <h2>{item.course.title}</h2>
          <div className="lesson-outline-progress"><div><span>YOUR PROGRESS</span><b>{index} / {lessons.length}</b></div><span className="lesson-outline-track"><i style={{ width: String(Math.round((index / lessons.length) * 100)) + "%" }} /></span></div>
          {item.sections.map((group, groupIndex) => {
            const start = item.sections.slice(0, groupIndex).reduce((sum, value) => sum + value.lessons.length, 0);
            return <div className="lesson-outline-group" key={group.title}><span>SECTION {String(groupIndex + 1).padStart(2, "0")}</span><b>{group.title}</b>{group.lessons.map((entry, lessonIndex) => {
              const number = start + lessonIndex + 1;
              return <Link className={number === index ? "is-current" : ""} href={"/learn/" + item.course.slug + "/" + number} key={entry.title}><small>{String(number).padStart(2, "0")}</small>{entry.title}</Link>;
            })}</div>;
          })}
          <Link className="lesson-outline-challenge" href="/challenges">Ready for a challenge? ↗</Link>
        </aside>
        <section className="lesson-reader lesson-reader-upgraded" id="lesson-content">
          <div className="lesson-reader-topline"><span>{section?.title ?? "LEARNING PATH"}</span><span>{lesson.duration_minutes} MIN READ</span></div>
          <div className="lesson-reader-meta"><span>LESSON {String(index).padStart(2, "0")} / {String(lessons.length).padStart(2, "0")}</span><span>{Math.round((index / lessons.length) * 100)}% through this path</span></div>
          <h1>{lesson.title}</h1>
          <p className="lesson-intro-line">Take your time with this idea. Read the explanation, follow the example, then try the exercise in your own words.</p>
          <LearningMap />
          <LessonBody markdown={lesson.body_markdown} />
          <LessonPracticePanel courseSlug={item.course.slug} lessonNumber={index} lessonTitle={lesson.title} exercise={lesson.exercise} takeaways={lesson.key_takeaways} />
          <div className="runner-actions lesson-navigation">
            {previous ? <Link className="button button-outline" href={"/learn/" + item.course.slug + "/" + previous}>← Previous lesson</Link> : <span />}
            {next ? <Link className="button button-primary" href={"/learn/" + item.course.slug + "/" + next}>Next lesson →</Link> : <Link className="button button-primary" href="/challenges">Test your thinking ↗</Link>}
          </div>
          <p className="lesson-reader-footer">APTIVIO / Learn with understanding, not just speed.</p>
        </section>
      </div>
    </main>
  );
}
