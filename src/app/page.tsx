import Link from "next/link";

const areas = [
  { icon: "⌘", title: "Technology", desc: "Understand how the digital world works, from code to cybersecurity.", color: "mint", href: "/courses" },
  { icon: "◉", title: "Science & everyday life", desc: "Connect big ideas to things you see, use and experience daily.", color: "blue", href: "/courses" },
  { icon: "∑", title: "Numbers & logic", desc: "Build confidence with patterns, problem-solving and clear reasoning.", color: "gold", href: "/challenges" },
  { icon: "✳", title: "Communication", desc: "Think clearly, explain ideas and understand information better.", color: "violet", href: "/courses" },
];

export default function HomePage() {
  return (
    <main className="aptivio-home">
      <header className="app-header">
        <Link className="app-brand" href="/"><span className="app-brand-symbol">a.</span><span>aptivio</span></Link>
        <nav className="app-nav" aria-label="Main navigation">
          <Link href="/courses">Explore</Link><Link href="/challenges">Brain challenges</Link><Link href="/progress">My progress</Link>
        </nav>
        <div className="app-header-actions"><Link className="app-login" href="/sign-in">Sign in</Link><Link className="app-button app-button-dark" href="/sign-up">Create free account <span>↗</span></Link></div>
        <details className="mobile-menu"><summary aria-label="Open navigation menu"><span></span><span></span><span></span></summary><div className="mobile-menu-panel"><Link href="/courses">Explore learning</Link><Link href="/challenges">Brain challenges</Link><Link href="/progress">My progress</Link><Link href="/sign-in">Sign in</Link><Link href="/sign-up">Create free account</Link></div></details>
      </header>

      <section className="app-hero">
        <div className="app-hero-copy">
          <div className="app-kicker"><span className="kicker-pulse"></span> YOUR SPACE TO LEARN AND THINK</div>
          <h1>Understand more.<br/><span>Think for yourself.</span></h1>
          <p className="app-hero-text">Learning should feel like someone is beside you, breaking a difficult idea into simple steps. Explore practical lessons, see how things work, try it yourself, then challenge your thinking.</p>
          <div className="app-hero-actions"><Link className="app-button app-button-primary" href="/courses">Start learning <span>→</span></Link><Link className="app-button app-button-outline" href="/challenges">Try a brain challenge</Link></div>
          <div className="app-proof"><span className="proof-avatars">✦ ◉ ◎</span><span>Learn at your pace · Free to explore · Built for curious minds</span></div>
        </div>
        <div className="app-hero-visual">
          <div className="visual-photo" role="img" aria-label="A student studying at a desk with books and a laptop"></div>
          <div className="visual-note note-one"><span className="note-icon">✳</span><div><b>Learn by understanding</b><small>Not just memorising words</small></div></div>
          <div className="visual-note note-two"><span className="note-icon note-icon-dark">↗</span><div><b>Put ideas into practice</b><small>Examples from real life</small></div></div>
          <div className="visual-stamp">LEARN<br/>THINK<br/>GROW<span>✳</span></div>
        </div>
      </section>

      <section className="app-stats"><div><b>20</b><span>learning paths</span></div><i></i><div><b>320</b><span>guided lessons</span></div><i></i><div><b>5</b><span>reasoning areas</span></div><i></i><div><b>₦0</b><span>to get started</span></div></section>

      <section className="app-section learning-map">
        <div className="app-section-heading"><div><span className="app-overline">PICK A DIRECTION</span><h2>What are you curious<br/>about today?</h2></div><p>Start with a subject that interests you. Each learning path is broken into smaller lessons so you can build understanding without feeling overwhelmed.</p></div>
        <div className="topic-grid">{areas.map((area) => <Link className="topic-card" href={area.href} key={area.title}><span className={`topic-icon ${area.color}`}>{area.icon}</span><span className="topic-arrow">↗</span><h3>{area.title}</h3><p>{area.desc}</p><span className="topic-link">Explore topic <b>→</b></span></Link>)}</div>
      </section>

      <section className="teaching-section">
        <div className="teaching-image"><div className="image-caption"><span>REAL LIFE CONNECTION</span><b>Learning makes more sense when you can see it.</b></div></div>
        <div className="teaching-copy"><span className="app-overline">HOW APTIVIO TEACHES</span><h2>We don't just give you a page to read.</h2><p>Every good lesson should help you understand an idea, see it in action and use it yourself. That's the experience we're building across APTIVIO.</p>
          <div className="teaching-steps"><div><span>01</span><section><b>Plain-language explanation</b><p>We unpack unfamiliar words and explain the idea one step at a time.</p></section></div><div><span>02</span><section><b>Visuals and worked examples</b><p>Diagrams, illustrations and everyday situations make abstract ideas easier to picture.</p></section></div><div><span>03</span><section><b>Try it yourself</b><p>Short exercises and feedback help you check whether you really understand.</p></section></div></div>
        </div>
      </section>

      <section className="app-section example-section"><div className="app-section-heading"><div><span className="app-overline">A TASTE OF THE EXPERIENCE</span><h2>From an idea to<br/>something you can use.</h2></div><p>For example, learning about algorithms should not stop at a definition. You should recognise one in your everyday routine.</p></div>
        <div className="example-card"><div className="example-copy"><span className="example-label">EVERYDAY EXAMPLE · ALGORITHMS</span><h3>Making tea is an algorithm.</h3><p>An algorithm is simply a set of steps used to complete a task. You already follow algorithms without calling them that.</p><ol><li><b>01</b> Boil the water.</li><li><b>02</b> Put the tea in a cup.</li><li><b>03</b> Pour in hot water.</li><li><b>04</b> Wait, then add milk or sugar.</li></ol><p className="example-takeaway"><b>The idea:</b> change the order or skip a step and the result may change. Programs work with instructions in the same way.</p></div>
          <div className="algorithm-visual" aria-label="Diagram showing four steps in an algorithm"><div className="algo-node">START</div><span className="algo-arrow">↓</span><div className="algo-node">Boil water</div><span className="algo-arrow">↓</span><div className="algo-node">Add tea</div><span className="algo-arrow">↓</span><div className="algo-node">Pour and wait</div><span className="algo-arrow">↓</span><div className="algo-node algo-end">READY TO DRINK</div></div>
        </div>
      </section>

      <section className="challenge-band"><div><span className="app-overline app-overline-light">YOUR MIND DESERVES A WORKOUT</span><h2>Curious how you think<br/>through a problem?</h2><p>Try logic, numerical, verbal, spatial and memory challenges. Get a score, review explanations and learn from every attempt.</p><Link className="app-button app-button-white" href="/challenges">Explore brain challenges <span>↗</span></Link></div><div className="challenge-art"><div className="orbit orbit-a"></div><div className="orbit orbit-b"></div><div className="brain-card"><span>APTIVIO / THINK LAB</span><b>What comes next?</b><div className="pattern-row"><i>2</i><i>4</i><i>8</i><i>16</i><i>?</i></div><small>Find the pattern. Trust your reasoning.</small></div><div className="brain-spark">✳</div></div></section>

      <footer className="app-footer"><Link className="app-brand" href="/"><span className="app-brand-symbol">a.</span><span>aptivio</span></Link><p>Knowledge that moves you forward.</p><div><Link href="/courses">Explore</Link><Link href="/challenges">Challenges</Link><Link href="/sign-in">Sign in</Link></div><small>© {new Date().getFullYear()} APTIVIO · Built for curious minds.</small></footer>
    </main>
  );
}
