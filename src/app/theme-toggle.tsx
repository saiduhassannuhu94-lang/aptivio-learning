"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("aptivio-theme");
    const preferred = stored === "dark" || (stored !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(preferred);
    document.documentElement.dataset.theme = preferred ? "dark" : "light";
  }, []);

  function toggle() {
    setDark((current) => {
      const next = !current;
      document.documentElement.dataset.theme = next ? "dark" : "light";
      window.localStorage.setItem("aptivio-theme", next ? "dark" : "light");
      document.cookie = "aptivio-theme=" + (next ? "dark" : "light") + "; Path=/; Max-Age=31536000; SameSite=Lax";
      return next;
    });
  }

  return (
    <button className="site-theme-toggle" type="button" onClick={toggle} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} aria-pressed={dark}>
      <span className="site-theme-icon" aria-hidden="true">{dark ? "☀" : "☾"}</span>
      <span>{dark ? "Light mode" : "Dark mode"}</span>
      <span className="site-theme-track" aria-hidden="true"><i /></span>
    </button>
  );
}
