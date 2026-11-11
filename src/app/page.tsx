import Link from "next/link";

const learningPaths = [
  {
    number: "01",
    title: "Technology & computing",
    description: "Build a strong foundation in programming, web development, databases, and modern digital tools.",
    tag: "Build practical systems",
    icon: "⌘",
  },
  {
    number: "02",
    title: "Business & innovation",
    description: "Learn to analyse problems, make informed decisions, and turn useful ideas into sustainable work.",
    tag: "Think with clarity",
    icon: "↗",
  },
  {
    number: "03",
    title: "Personal development",
    description: "Strengthen communication, critical thinking, and the habits that support lifelong learning.",
    tag: "Grow with intention",
    icon: "◎",
  },
];

const principles = [
  ["A clear learning path", "Know what you are learning, why it matters, and what comes next."],
  ["Practice that proves progress", "Use exercises and knowledge checks to turn concepts into real capability."],
  ["Progress you can understand", "A focused learner workspace built around your actual course activity."],
];

function BrandMark() {
  return <span className="brand-mark" aria-hidden="true">A</span>;
}

export default function HomePage() {
  return (
    <main className="engineering-home">
      <header className="site-header engineering-header">
        <Link className="brand" href="/" aria-label="APTIVIO home">
          <BrandMark />
          <span>APTIVIO</span>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          <Link href="#learning">Learning paths</Link>
          <Link href="#approach">How it works</Link>
          <Link href="/courses">Course catalogue</Link>
        </nav>
        <div className="header-actions">
          <Link className="sign-in" href="/sign-in">Sign in</Link>
          <Link className="button button-small button-dark engineering-header-cta" href="/sign-up">
            Create account <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </header>

      <section className="engineering-hero section-shell">
        <div className="engineering-hero-copy">
          <div className="engineering-eyebrow"><span className="eyebrow-dot" /> THE LEARNING SYSTEM FOR WHAT COMES NEXT</div>
          <h1>Build skills.<br /><em>Build what matters.</em></h1>
          <p className="engineering-hero-description">
            APTIVIO turns learning into a clear, practical process. Follow structured courses,
            practise the concepts, and develop skills you can carry into real projects.
          </p>
          <div className="engineering-hero-actions">
            <Link className="button button-primary" href="/courses">Explore learning paths <span aria-hidden="true">↗</span></Link>
            <Link className="engineering-secondary-link" href="/sign-up">Start learning <span aria-hidden="true">→</span></Link>
          </div>
          <div className="engineering-proofline">
            <span className="proofline-check">✓</span>
            <span>Structured learning</span><i />
            <span>Practical focus</span><i />
            <span>Clear progress</span>
          </div>
        </div>

        <div className="engineering-hero-visual" aria-label="Illustrative preview of the APTIVIO learning workspace">
          <div className="engineering-visual-grid" />
          <div className="engineering-visual-label"><span /> WORKSPACE PREVIEW <b>01 / 03</b></div>
          <div className="engineering-dashboard">
            <div className="engineering-dashboard-top">
              <div className="engineering-mini-brand"><BrandMark /><span>APTIVIO <small>LEARNING OS</small></span></div>
              <span className="engineering-status"><i /> LEARNER SPACE</span>
            </div>
            <div className="engineering-dashboard-body">
              <div className="engineering-dashboard-sidebar">
                <span className="engineering-side-active">▦</span><span>▤</span><span>◈</span><span>⚙</span>
              </div>
              <div className="engineering-dashboard-content">
                <span className="engineering-ui-kicker">YOUR LEARNING OVERVIEW</span>
                <h2>Make progress<br />with purpose.</h2>
                <p>A clear next step makes all the difference.</p>
                <div className="engineering-ui-course">
                  <div className="engineering-ui-course-icon">⌘</div>
                  <div><b>Programming foundations</b><small>Build from the fundamentals</small></div>
                  <span>↗</span>
                </div>
                <div className="engineering-ui-bottom">
                  <span><i /> Structured lessons</span>
                  <span>Designed to focus</span>
                </div>
              </div>
            </div>
          </div>
          <div className="engineering-float-note note-top"><span>✳</span><div><b>Learn with direction</b><small>One step at a time</small></div></div>
          <div className="engineering-float-note note-bottom"><span className="note-check">✓</span><div><b>Built around outcomes</b><small>Knowledge into capability</small></div></div>
          <div className="engineering-visual-foot">APTIVIO / LEARNING EXPERIENCE</div>
        </div>
      </section>

      <section className="engineering-ribbon" aria-label="APTIVIO learning principles">
        <div className="section-shell engineering-ribbon-inner">
          <span>THE APTIVIO METHOD</span>
          <p><b>01</b> Understand <i /> <b>02</b> Practise <i /> <b>03</b> Apply <i /> <b>04</b> Improve</p>
        </div>
      </section>

      <section className="engineering-learning section-shell" id="learning">
        <div className="engineering-section-heading">
          <div>
            <div className="engineering-eyebrow"><span className="eyebrow-dot" /> EXPLORE YOUR DIRECTION</div>
            <h2>Choose a direction.<br /><em>Build your edge.</em></h2>
          </div>
          <p>Start with the area that matters to you. Every strong skill begins with a foundation and grows through deliberate practice.</p>
        </div>
        <div className="engineering-path-grid">
          {learningPaths.map((path) => (
            <article className="engineering-path-card" key={path.number}>
              <div className="engineering-path-top"><span>{path.number} / LEARNING AREA</span><span className="engineering-path-icon">{path.icon}</span></div>
              <div className="engineering-path-copy">
                <span className="engineering-path-tag">{path.tag}</span>
                <h3>{path.title}</h3>
                <p>{path.description}</p>
              </div>
              <Link href="/courses" className="engineering-path-link">Explore courses <span aria-hidden="true">↗</span></Link>
            </article>
          ))}
        </div>
      </section>

      <section className="engineering-approach" id="approach">
        <div className="section-shell engineering-approach-inner">
          <div className="engineering-approach-intro">
            <div className="engineering-eyebrow engineering-eyebrow-light"><span className="eyebrow-dot" /> BUILT WITH INTENTION</div>
            <h2>Less noise.<br /><em>More capability.</em></h2>
            <p>Education should do more than fill a screen. It should help you understand, build, solve, and keep improving.</p>
            <Link className="button button-light" href="/courses">View course catalogue <span aria-hidden="true">↗</span></Link>
          </div>
          <div className="engineering-principles">
            {principles.map(([title, description], index) => (
              <article className="engineering-principle" key={title}>
                <span className="engineering-principle-number">0{index + 1}</span>
                <div><h3>{title}</h3><p>{description}</p></div>
                <span className="engineering-principle-arrow" aria-hidden="true">↗</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="engineering-final-cta section-shell">
        <div><span className="engineering-eyebrow"><span className="eyebrow-dot" /> YOUR NEXT STEP STARTS HERE</span><h2>Make learning<br /><em>move you forward.</em></h2></div>
        <Link className="button button-primary" href="/sign-up">Create your free account <span aria-hidden="true">↗</span></Link>
      </section>

      <footer className="site-footer engineering-footer">
        <div className="section-shell footer-main">
          <Link className="brand brand-footer" href="/"><BrandMark /><span>APTIVIO</span></Link>
          <p>Knowledge That Moves You Forward.</p>
          <span className="footer-location">Built for the world. Starting from Nigeria.</span>
        </div>
        <div className="section-shell footer-bottom">
          <span>© {new Date().getFullYear()} APTIVIO. All rights reserved.</span>
          <span>Clarity · Practice · Progress</span>
        </div>
      </footer>
    </main>
  );
}
