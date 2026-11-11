"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { signOutAction } from "@/app/(auth)/actions";

type DashboardShellProps = {
  displayName: string;
  paymentNotice?: string;
};

function AptivioMark() {
  return (
    <svg className="aptivio-symbol" viewBox="0 0 48 48" role="img" aria-label="APTIVIO">
      <defs>
        <linearGradient id="aptivio-gradient" x1="5" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22A887" />
          <stop offset="1" stopColor="#087F68" />
        </linearGradient>
      </defs>
      <path d="M24 3.5 44 14.8v18.4L24 44.5 4 33.2V14.8L24 3.5Z" fill="url(#aptivio-gradient)" />
      <path d="m13.2 31.7 10.8-19 10.8 19h-5.2l-5.6-10-5.6 10h-5.2Z" fill="white" />
      <path d="M18.3 27.1h11.4" stroke="#C9E5B2" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function Icon({ name }: { name: "grid" | "book" | "compass" | "menu" | "sun" | "moon" | "arrow" }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22V5.5Z" /><path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20" /></>,
    compass: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2Z" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>,
    moon: <path d="M20.8 14.2A8.5 8.5 0 0 1 9.8 3.2 8.8 8.8 0 1 0 20.8 14.2Z" />,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export default function DashboardShell({ displayName, paymentNotice }: DashboardShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(window.localStorage.getItem("aptivio-theme") === "dark");
  }, []);

  function toggleTheme() {
    setDark((current) => {
      const next = !current;
      window.localStorage.setItem("aptivio-theme", next ? "dark" : "light");
      return next;
    });
  }

  return (
    <main className={`aptivio-dashboard ${dark ? "theme-dark" : "theme-light"}`}>
      <aside className={`dashboard-sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <Link href="/" className="dashboard-brand" aria-label="APTIVIO home">
          <AptivioMark />
          <span>APTIVIO<small>LEARNING PLATFORM</small></span>
        </Link>
        <div className="sidebar-caption">WORKSPACE</div>
        <nav className="dashboard-nav" aria-label="Dashboard navigation">
          <Link href="/dashboard" className="dashboard-nav-link active" onClick={() => setMenuOpen(false)}><Icon name="grid" />Overview</Link>
          <Link href="/courses" className="dashboard-nav-link" onClick={() => setMenuOpen(false)}><Icon name="book" />Explore courses</Link>
          <Link href="/courses" className="dashboard-nav-link" onClick={() => setMenuOpen(false)}><Icon name="compass" />Learning paths</Link>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-help"><span className="help-orb">?</span><div><strong>Need a hand?</strong><small>We're here to help you learn.</small></div></div>
          <form action={signOutAction}><button className="sidebar-signout" type="submit">Sign out <span>↗</span></button></form>
        </div>
      </aside>

      {menuOpen && <button className="dashboard-scrim" aria-label="Close navigation menu" onClick={() => setMenuOpen(false)} />}

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <button className="dashboard-menu-button" type="button" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}><Icon name="menu" /></button>
          <div className="topbar-context"><span>YOUR WORKSPACE</span><b>/</b><strong>Overview</strong></div>
          <div className="topbar-actions">
            <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} title={dark ? "Light mode" : "Dark mode"}><Icon name={dark ? "sun" : "moon"} /><span>{dark ? "Light" : "Dark"}</span></button>
            <div className="user-avatar" aria-label={displayName || "Learner"}>{(displayName.trim()[0] || "L").toUpperCase()}</div>
          </div>
        </header>

        <div className="dashboard-inner">
          <div className="dashboard-welcome">
            <div><div className="dashboard-kicker"><span /> LEARNING OVERVIEW</div><h1>Good to have you here{displayName ? `, ${displayName.split(" ")[0]}` : ""}.</h1><p>Your next chapter is built one focused session at a time.</p></div>
            <Link className="dashboard-explore-button" href="/courses">Explore courses <Icon name="arrow" /></Link>
          </div>

          {paymentNotice && <p className="payment-notice" role="status">{paymentNotice}</p>}

          <div className="dashboard-metric-grid">
            <article className="dashboard-metric-card"><span className="metric-label">YOUR LEARNING SPACE</span><strong>Ready</strong><small>Your account is active</small><span className="metric-decoration metric-decoration-one" /></article>
            <article className="dashboard-metric-card"><span className="metric-label">NEXT STEP</span><strong>Discover</strong><small>Find a course to begin</small><span className="metric-decoration metric-decoration-two" /></article>
            <article className="dashboard-metric-card"><span className="metric-label">YOUR PACE</span><strong>Yours</strong><small>Learn on your schedule</small><span className="metric-decoration metric-decoration-three" /></article>
          </div>

          <section className="dashboard-start-card">
            <div className="start-card-art" aria-hidden="true"><div className="start-orbit start-orbit-a" /><div className="start-orbit start-orbit-b" /><div className="start-mark"><AptivioMark /></div><span className="start-spark spark-a">✳</span><span className="start-spark spark-b">✦</span></div>
            <div className="start-card-copy"><span className="dashboard-kicker">A GOOD PLACE TO START</span><h2>Make your next move<br /><em>count.</em></h2><p>Explore structured courses, build practical skills, and turn what you learn into something you can use.</p><Link href="/courses" className="start-card-link">Browse the course catalogue <Icon name="arrow" /></Link></div>
          </section>

          <section className="dashboard-lower-grid">
            <article className="dashboard-lower-card"><div className="lower-card-heading"><div><span className="dashboard-kicker">YOUR LEARNING</span><h3>Continue your journey</h3></div><span className="lower-card-icon"><Icon name="book" /></span></div><p>Your enrolled courses will appear here, ready for you to pick up where you left off.</p><Link href="/courses">Find your first course <span>→</span></Link></article>
            <article className="dashboard-lower-card lower-card-quote"><span className="dashboard-kicker">A NOTE TO KEEP</span><blockquote>“Progress is built through the things you practise, not just the things you know.”</blockquote><span className="quote-rule" /><small>THE APTIVIO PRINCIPLE</small></article>
          </section>
          <footer className="dashboard-footer"><span>© {new Date().getFullYear()} APTIVIO</span><span>Knowledge that moves you forward.</span></footer>
        </div>
      </section>
    </main>
  );
}
