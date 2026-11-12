import Link from "next/link";

const pillars = [
  {
    number: "01",
    title: "Learn something useful",
    description: "Explore clear, practical learning material across technology, science, business, communication and everyday knowledge.",
    tag: "Knowledge library",
    href: "/courses",
    action: "Explore learning",
  },
  {
    number: "02",
    title: "Challenge your thinking",
    description: "Train your reasoning with logic puzzles, number patterns, memory exercises, verbal reasoning and timed brain challenges.",
    tag: "IQ-style challenges",
    href: "/courses",
    action: "Explore the platform",
  },
  {
    number: "03",
    title: "Track your growth",
    description: "Review your results, understand where you are strong, and see which skills deserve more practice.",
    tag: "Personal progress",
    href: "/sign-up",
    action: "Create your account",
  },
];

const experiences = [
  ["Learn", "Short lessons and explainers that make difficult ideas easier to understand."],
  ["Practise", "Knowledge checks, puzzles and practical exercises that make you think."],
  ["Challenge", "Timed reasoning tests that measure your performance across different skill areas."],
  ["Improve", "Clear feedback and progress history so each attempt teaches you something."],
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
          <Link href="#experience">What you can do</Link>
          <Link href="#about">Our idea</Link>
        </nav>
        <div className="header-actions">
          <Link className="sign-in" href="/sign-in">Sign in</Link>
          <Link className="button button-small button-dark" href="/sign-up">Get started <span aria-hidden="true">↗</span></Link>
        </div>
      </header>

      <section className="hero section-shell">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> LEARN. THINK. IMPROVE.</div>
          <h1>Feed your curiosity. <em>Test your thinking.</em></h1>
          <p className="hero-description">
            APTIVIO is a place to discover knowledge, sharpen your reasoning,
            take on brain challenges and understand how your skills improve.
            Learn at your own pace. Challenge yourself whenever you are ready.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/courses">Explore learning <span aria-hidden="true">↗</span></Link>
            <Link className="text-link" href="#experience">Discover APTIVIO <span aria-hidden="true">↓</span></Link>
          </div>
          <div className="hero-note">
            <span className="note-line" />
            <span>Not a school. A space to learn, think and grow.</span>
          </div>
        </div>

        <div className="hero-art" aria-label="APTIVIO learning and reasoning concept">
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="art-card card-back">
            <span className="mini-label">THINK DIFFERENTLY</span>
            <span className="back-lines"><i /><i /><i /></span>
          </div>
          <div className="art-card card-main">
            <div className="card-topline"><span>YOUR MIND, IN MOTION</span><span className="live-dot">●</span></div>
            <div className="progress-ring"><span>IQ+</span></div>
            <h2>Curiosity is<br />a starting point.</h2>
            <p>Learn a little. Think deeper. Improve.</p>
            <div className="card-progress"><span /></div>
            <div className="card-foot"><span>APTIVIO</span><span>LEARN / THINK</span></div>
          </div>
          <div className="floating-chip chip-top"><span>✳</span> Knowledge matters</div>
          <div className="floating-chip chip-bottom"><span>↗</span> Challenge your limits</div>
          <div className="art-index">APTIVIO / 001</div>
        </div>
      </section>

      <section className="trust-strip" aria-label="APTIVIO principles">
        <div className="section-shell trust-inner">
          <span>THE APTIVIO IDEA</span>
          <p>Discover <b>·</b> Understand <b>·</b> Challenge <b>·</b> Improve</p>
        </div>
      </section>

      <section className="learning-section section-shell" id="experience">
        <div className="section-heading">
          <div>
            <div className="eyebrow">ONE PLACE. MORE WAYS TO GROW.</div>
            <h2>Knowledge for life.<br /><em>Challenges for your mind.</em></h2>
          </div>
          <p>APTIVIO brings learning and self-challenge together. You are not signing up for a formal school programme. You are here to explore, practise and test what you can do.</p>
        </div>
        <div className="path-grid">
          {pillars.map((pillar) => (
            <article className="path-card" key={pillar.number}>
              <div className="path-card-top"><span>{pillar.number} / EXPERIENCE</span><span aria-hidden="true">↗</span></div>
              <div>
                <span className="path-tag">{pillar.tag}</span>
                <h3>{pillar.title}</h3>
                <p>{pillar.description}</p>
              </div>
              <Link href={pillar.href} className="path-link">{pillar.action} <span aria-hidden="true">→</span></Link>
            </article>
          ))}
        </div>
      </section>

      <section className="approach-section" id="about">
        <div className="section-shell approach-inner">
          <div className="approach-intro">
            <div className="eyebrow eyebrow-light">A DIFFERENT KIND OF LEARNING SPACE</div>
            <h2>Knowledge is useful.<br /><em>Thinking is powerful.</em></h2>
            <p>We want students to understand ideas, ask better questions, solve unfamiliar problems and recognise their own progress.</p>
            <Link className="button button-light" href="/courses">Start exploring <span aria-hidden="true">↗</span></Link>
          </div>
          <div className="principle-list">
            {experiences.map(([title, description], index) => (
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
          <p>Learn More. Think Better. Go Further.</p>
          <span className="footer-location">Built for curious minds. Starting from Nigeria.</span>
        </div>
        <div className="section-shell footer-bottom">
          <span>© {new Date().getFullYear()} APTIVIO. All rights reserved.</span>
          <span>Learn. Think. Improve.</span>
        </div>
      </footer>
    </main>
  );
}
