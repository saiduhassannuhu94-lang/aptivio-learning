import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getLearningPackage, learningPackages } from "@/lib/learning/library";
import { LessonPracticePanel } from "./lesson-practice-panel";
import { SiteHeader } from "@/app/site-header";
import { CourseArtwork } from "@/app/course-artwork";

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
    if (block.type === "h3" && /worked (?:application )?example|worked comparison|real-life example|example:/i.test(block.lines[0])) {
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


function ConceptDiagram({ courseSlug }: { courseSlug: string }) {
  const diagrams: Record<string, { title: string; steps: [string, string, string, string] }> = {
    "programming-logic-and-problem-solving": { title: "From a problem to a tested solution", steps: ["Define the problem", "Identify inputs", "Design the steps", "Test the result"] },
    "python-programming-beginner-to-intermediate": { title: "How a Python program runs", steps: ["Write Python code", "Run the interpreter", "Execute instructions", "Inspect the output"] },
    "javascript-programming-core-concepts": { title: "How JavaScript makes a page respond", steps: ["User action", "Event handler", "JavaScript logic", "Updated interface"] },
    "java-programming-object-oriented-design": { title: "The object-oriented flow", steps: ["Define a class", "Create an object", "Call its methods", "Observe its state"] },
    "c-programming-memory-fundamentals": { title: "From C source to machine execution", steps: ["Write source code", "Compile the code", "Load the program", "Use memory safely"] },
    "cpp-programming-data-structures": { title: "Working with data in C++", steps: ["Choose a structure", "Store the data", "Apply an operation", "Check the result"] },
    "csharp-dotnet-application-development": { title: "How a .NET application runs", steps: ["Write C# code", "Compile to IL", "Run on the CLR", "Deliver the result"] },
    "php-programming-web-backends": { title: "A PHP web request", steps: ["Browser request", "PHP server logic", "Data operation", "HTML response"] },
    "go-programming-networked-services": { title: "A Go service request", steps: ["Receive request", "Handle the work", "Coordinate goroutines", "Return response"] },
    "software-testing-quality-assurance": { title: "The test feedback loop", steps: ["Arrange the setup", "Act on the system", "Assert the result", "Improve the code"] },
    "html5-semantic-structure-accessibility": { title: "Building an accessible page", steps: ["Identify content", "Choose semantic HTML", "Add accessible names", "Test navigation"] },
    "css3-layout-responsive-design-motion": { title: "From layout rules to responsive UI", steps: ["Understand the box", "Choose a layout", "Adapt to screens", "Test interactions"] },
    "modern-javascript-browser-applications": { title: "A browser interaction cycle", steps: ["Browser event", "Application logic", "Update the state", "Render the change"] },
    "typescript-reliable-frontend-code": { title: "The TypeScript safety loop", steps: ["Describe data types", "Check the code", "Build JavaScript", "Run and verify"] },
    "react-components-state-effects": { title: "How React updates a screen", steps: ["Props and state", "Render component", "User interaction", "State update"] },
    "nextjs-app-router-full-stack-patterns": { title: "A request through Next.js", steps: ["Receive the route", "Load server data", "Render the page", "Send the response"] },
    "nodejs-express-api-development": { title: "An Express API request", steps: ["Client request", "Route and middleware", "Application logic", "JSON response"] },
    "rest-api-design-documentation": { title: "The REST request-response cycle", steps: ["Choose a resource", "Send HTTP request", "Process the request", "Return a response"] },
    "web-performance-core-web-vitals": { title: "The performance improvement loop", steps: ["Measure the page", "Find the bottleneck", "Optimise the cause", "Measure again"] },
    "progressive-web-apps-offline-first-design": { title: "How an offline-ready web app works", steps: ["Load the web app", "Register service worker", "Cache key resources", "Serve while offline"] },
  };
  const diagram = diagrams[courseSlug] ?? { title: "A practical learning cycle", steps: ["Understand the idea", "Study an example", "Apply the concept", "Check the result"] as [string, string, string, string] };
  return (
    <section className="lesson-concept-diagram" aria-label={diagram.title}>
      <div className="concept-diagram-heading"><span className="eyebrow">VISUAL EXPLANATION</span><h2>{diagram.title}</h2></div>
      <svg
        className="concept-diagram-visual"
        viewBox="0 0 720 116"
        role="img"
        aria-label={`${diagram.title}: four connected stages`}
      >
        <defs>
          <linearGradient id="concept-flow-line" x1="0" x2="1">
            <stop offset="0%" stopColor="#9bcab0" />
            <stop offset="100%" stopColor="#087f68" />
          </linearGradient>
        </defs>
        <path d="M90 48 H630" stroke="url(#concept-flow-line)" strokeWidth="5" strokeLinecap="round" />
        {diagram.steps.map((step, index) => {
          const x = 90 + index * 180;
          return (
            <g key={step}>
              <circle cx={x} cy="48" r="29" fill="#e4f2e7" />
              <circle cx={x} cy="48" r="21" fill="#087f68" />
              <text x={x} y="53" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="800">
                {String(index + 1).padStart(2, "0")}
              </text>
              <circle cx={x + 37} cy="48" r="3" fill="#d6e9da" />
            </g>
          );
        })}
      </svg>
      <div className="concept-diagram-flow">
        {diagram.steps.map((step, index) => <div className="concept-diagram-item" key={step}><span>{String(index + 1).padStart(2, "0")}</span><b>{step}</b></div>)}
      </div>
      <p>This is the big-picture flow for this learning path. The lesson below explains each part in detail.</p>
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
  const sectionIndex = item.sections.findIndex((group, groupIndex) =>
    index <= item.sections.slice(0, groupIndex + 1).reduce((sum, entry) => sum + entry.lessons.length, 0),
  );
  const section = item.sections[sectionIndex];

  return (
    <main className="lesson-page lesson-experience">
      <SiteHeader current="learn" />
      <div className="lesson-experience-grid">
        <aside className="lesson-outline">
          <Link className="lesson-back-link" href={"/learn/" + item.course.slug}>← Back to learning path</Link>
          <span className="eyebrow">YOUR LEARNING PATH</span>
          <h2>{item.course.title}</h2>
          <div className="lesson-outline-progress"><div><span>PATH POSITION</span><b>{index} / {lessons.length}</b></div><span className="lesson-outline-track"><i style={{ width: String(Math.round((index / lessons.length) * 100)) + "%" }} /></span></div>
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
          <ConceptDiagram courseSlug={item.course.slug} />
          <div className="lesson-real-world-visual"><CourseArtwork slug={item.course.slug} title={item.course.title} number={1} /><p><strong>Connect the idea to real work.</strong> Keep this visual in mind as you work through the example and practical task below.</p></div>
          <LessonBody markdown={lesson.body_markdown} />
          <LessonPracticePanel courseSlug={item.course.slug} lessonNumber={index} lessonTitle={lesson.title} exercise={lesson.exercise} takeaways={lesson.key_takeaways} />
          <div className="runner-actions lesson-navigation">
            {previous ? <Link className="button button-outline" href={"/learn/" + item.course.slug + "/" + previous}>← Previous lesson</Link> : <span />}
            {next ? <Link className="button button-primary" href={"/learn/" + item.course.slug + "/" + next}>Next lesson →</Link> : <Link className="button button-primary" href={"/learn/" + item.course.slug + "/assessment"}>Final course assessment ↗</Link>}
          </div>
          <p className="lesson-reader-footer">APTIVIO / Learn with understanding, not just speed.</p>
        </section>
      </div>
    </main>
  );
}
