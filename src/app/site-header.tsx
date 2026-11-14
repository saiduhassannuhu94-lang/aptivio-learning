import Link from "next/link";
import { ThemeToggle } from "@/app/theme-toggle";

type SiteSection = "home" | "learn" | "think" | "portfolio";

const navItems: { label: string; href: string; key: SiteSection }[] = [
  { label: "Home", href: "/", key: "home" },
  { label: "Learning paths", href: "/courses", key: "learn" },
  { label: "Think Lab", href: "/challenges", key: "think" },
  { label: "Portfolio", href: "/portfolio", key: "portfolio" },
];

export function AptivioLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className={"site-brand" + (compact ? " site-brand-compact" : "")} aria-label="APTIVIO home">
      <span className="site-brand-mark" aria-hidden="true">
        <svg viewBox="0 0 48 48" focusable="false">
          <path d="M24 3.5 44 14.8v18.4L24 44.5 4 33.2V14.8L24 3.5Z" fill="currentColor" />
          <path d="m13.2 31.7 10.8-19 10.8 19h-5.2l-5.6-10-5.6 10h-5.2Z" fill="#fff" />
          <path d="M18.3 27.1h11.4" stroke="#C9E5B2" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </span>
      <span className="site-brand-copy"><strong>APTIVIO</strong><small>LEARN · THINK · BUILD</small></span>
    </Link>
  );
}

export function SiteHeader({ current = "home" }: { current?: SiteSection }) {
  return (
    <header className="site-header">
      <AptivioLogo />
      <nav className="site-nav" aria-label="Main navigation">
        {navItems.map((item) => (
          <Link key={item.key} href={item.href} className={current === item.key ? "is-active" : undefined} aria-current={current === item.key ? "page" : undefined}>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="site-header-actions">
        <ThemeToggle />
        <Link className="site-dashboard-link" href="/dashboard">Dashboard <span aria-hidden="true">↗</span></Link>
      </div>
      <details className="site-mobile-menu">
        <summary aria-label="Open navigation menu"><span /><span /><span /></summary>
        <nav aria-label="Mobile navigation">
          {navItems.map((item) => (
            <Link key={item.key} href={item.href} className={current === item.key ? "is-active" : undefined}>{item.label}</Link>
          ))}
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/portfolio">My portfolio</Link>
          <a href="https://wa.me/2347077992618" target="_blank" rel="noreferrer">Contact support ↗</a>
          <a href="mailto:saiduhassannuhu94@gmail.com">Email support ↗</a>
          <ThemeToggle />
          <Link href="/sign-in">Sign in</Link>
          <Link href="/sign-up" className="site-mobile-join">Create free account ↗</Link>
        </nav>
      </details>
    </header>
  );
}
