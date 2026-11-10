import Link from "next/link";

const learningPaths = [
  {
    number: "01",
    title: "Technology",
    description: "Develop practical digital skills, from programming fundamentals to modern tools.",
    tag: "Build useful skills",
  },
  {
    number: "02",
    title: "Business",
    description: "Understand the principles behind better decisions, stronger teams, and sustainable work.",
    tag: "Think strategically",
  },
  {
    number: "03",
    title: "Personal growth",
    description: "Build the habits, communication, and problem-solving skills that compound over time.",
    tag: "Keep improving",
  },
];

const principles = [
  ["Learn with direction", "Clear outcomes and structured lessons, not endless videos with no destination."],
  ["Practice what matters", "Exercises and knowledge checks that help turn information into ability."],
  ["See your progress", "A focused learning space that makes your next step easy to understand."],
];

export default function HomePage() {
  return (
    <main>
      <header className="site-header">
        <Link className="brand" href="/" aria-label="APTIVIO home">
          <span className="brand-mark">A</span>
          <span>APTIVIO</span>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          <Link href="#learning">Explore learning</Link>
          <Link href="#approach">Our approach</Link>
        </nav>
        <div className="header-actions">
          <Link className="sign-in" href="/sign-in">Sign in</Link>
          <Link className="button button-small button-dark" href="/sign-up">Get started <span aria-hidden="true">↗</span></Link>
        </div>
      </header>

      <section className="hero section-shell">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> A clearer way to grow</div>
          <h1>Turn what you want to know into <em>what you can do.</em></h1>
          <p className="hero-description">
            Learn practical skills through structured courses built around real outcomes.
            Move at your pace, practise with purpose, and keep making progress.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/courses">Explore courses <span aria-hidden="true">↗</span></Link>
            <Link className="text-link" href="#approach">How learning works <span aria-hidden="true">↓</span></Link>
          </div>
          <div className="hero-note">
            <span className="note-line" />
            <span>Built for curious minds. Designed for real progress.</span>
          </div>
        </div>

        <div className="hero-art" aria-label="Illustration of a structured learning journey">
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="art-card card-back">
            <span className="mini-label">YOUR NEXT CHAPTER</span>
            <span className="back-lines"><i /><i /><i /></span>
          </div>
          <div className="art-card card-main">
            <div className="card-topline"><span>LEARNING PATH</span><span className="live-dot">●</span></div>
            <div className="progress-ring"><span>01</span></div>
            <h2>Start with<br />one good step.</h2>
            <p>Small lessons. Meaningful momentum.</p>
            <div className="card-progress"><span /></div>
            <div className="card-foot"><span>YOUR JOURNEY</span><span>IN PROGRESS</span></div>
          </div>
          <div className="floating-chip chip-top"><span>✳</span> Learn with purpose</div>
          <div className="floating-chip chip-bottom"><span>↗</span> Progress, made visible</div>
          <div className="art-index">APTIVIO / 001</div>
        </div>
      </section>

      <section className="trust-strip" aria-label="APTIVIO learning principles">
        <div className="section-shell trust-inner">
          <span>THE APTIVIO STANDARD</span>
          <p>Clarity <b>·</b> Practice <b>·</b> Progress <b>·</b> Possibility</p>
        </div>
      </section>

      <section className="learning-section section-shell" id="learning">
        <div className="section-heading">
          <div>
            <div className="eyebrow">FIND YOUR DIRECTION</div>
            <h2>Skills worth<br /><em>building.</em></h2>
          </div>
          <p>Good learning starts with a clear direction. Explore areas designed to help you build knowledge you can actually use.</p>
        </div>
        <div className="path-grid">
          {learningPaths.map((path) => (
            <article className="path-card" key={path.number}>
              <div className="path-card-top"><span>{path.number} / PATH</span><span aria-hidden="true">↗</span></div>
              <div>
                <span className="path-tag">{path.tag}</span>
                <h3>{path.title}</h3>
                <p>{path.description}</p>
              </div>
              <Link href="/courses" className="path-link">Explore courses <span aria-hidden="true">→</span></Link>
            </article>
          ))}
        </div>
      </section>

      <section className="approach-section" id="approach">
        <div className="section-shell approach-inner">
          <div className="approach-intro">
            <div className="eyebrow eyebrow-light">LEARNING, WITH INTENTION</div>
            <h2>Less noise.<br /><em>More becoming.</em></h2>
            <p>Learning should leave you more capable than when you started. That is the standard we are building toward.</p>
            <Link className="button button-light" href="/courses">Find your next step <span aria-hidden="true">↗</span></Link>
          </div>
          <div className="principle-list">
            {principles.map(([title, description], index) => (
              <article className="principle" key={title}>
                <span className="principle-number">0{index + 1}</span>
                <div><h3>{title}</h3><p>{description}</p></div>
                <span className="principle-arrow" aria-hidden="true">↗</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="section-shell footer-main">
          <Link className="brand brand-footer" href="/"><span className="brand-mark">A</span><span>APTIVIO</span></Link>
          <p>Knowledge That Moves You Forward.</p>
          <span className="footer-location">Built for the world. Starting from Nigeria.</span>
        </div>
        <div className="section-shell footer-bottom">
          <span>© {new Date().getFullYear()} APTIVIO. All rights reserved.</span>
          <span>Learn with direction.</span>
        </div>
      </footer>
    </main>
  );
}
