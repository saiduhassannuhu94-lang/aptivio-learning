const COURSE_ART: Record<string, { glyph: string; label: string; colors: [string, string, string] }> = {
  "programming-logic-and-problem-solving": { glyph: "{}", label: "LOGIC & ALGORITHMS", colors: ["#123c36", "#087f68", "#f3c66d"] },
  "python-programming-beginner-to-intermediate": { glyph: "Py", label: "PYTHON", colors: ["#16375b", "#397bb0", "#f4cf70"] },
  "javascript-programming-core-concepts": { glyph: "JS", label: "JAVASCRIPT", colors: ["#302b1d", "#9c792b", "#f5d76e"] },
  "java-programming-object-oriented-design": { glyph: "Jv", label: "JAVA & OOP", colors: ["#422a2b", "#a94e40", "#f4b47b"] },
  "c-programming-memory-fundamentals": { glyph: "C", label: "C & MEMORY", colors: ["#1d3559", "#487caf", "#a6d4e7"] },
  "cpp-programming-data-structures": { glyph: "C++", label: "C++ STRUCTURES", colors: ["#283452", "#6878a6", "#c5d5ed"] },
  "csharp-dotnet-application-development": { glyph: "C#", label: ".NET DEVELOPMENT", colors: ["#34274e", "#7958a7", "#d6b8ef"] },
  "php-programming-web-backends": { glyph: "php", label: "WEB BACKENDS", colors: ["#30324f", "#6a6fb0", "#c7c9f1"] },
  "go-programming-networked-services": { glyph: "Go", label: "NETWORK SERVICES", colors: ["#173d4b", "#288aa0", "#9de1e8"] },
  "software-testing-quality-assurance": { glyph: "QA", label: "SOFTWARE QUALITY", colors: ["#234239", "#4e9276", "#e1c56f"] },
  "html5-semantic-structure-accessibility": { glyph: "5", label: "HTML & ACCESSIBILITY", colors: ["#4b2b20", "#b96837", "#f5bf83"] },
  "css3-layout-responsive-design-motion": { glyph: "CSS", label: "RESPONSIVE DESIGN", colors: ["#202c59", "#506ac0", "#aebfff"] },
  "modern-javascript-browser-applications": { glyph: "DOM", label: "BROWSER APPLICATIONS", colors: ["#3c2e22", "#a96c30", "#f0c577"] },
  "typescript-reliable-frontend-code": { glyph: "TS", label: "TYPED FRONTEND", colors: ["#173c5b", "#357fb1", "#add9f1"] },
  "react-components-state-effects": { glyph: "R", label: "REACT & STATE", colors: ["#153e51", "#2789a4", "#a6e8f1"] },
  "nextjs-app-router-full-stack-patterns": { glyph: "N", label: "FULL-STACK NEXT.JS", colors: ["#20272a", "#58666b", "#e5ecee"] },
  "nodejs-express-api-development": { glyph: "N↗", label: "NODE & EXPRESS", colors: ["#173d31", "#468557", "#b5dc8a"] },
  "rest-api-design-documentation": { glyph: "API", label: "API DESIGN", colors: ["#263a4b", "#3c84a1", "#b5e0ec"] },
  "web-performance-core-web-vitals": { glyph: "↗", label: "WEB PERFORMANCE", colors: ["#3d2d21", "#b27a35", "#f2d08b"] },
  "progressive-web-apps-offline-first-design": { glyph: "PWA", label: "OFFLINE-FIRST APPS", colors: ["#26394d", "#4d83a8", "#bbd9ef"] },
};

export function CourseArtwork({ slug, title, number = 1 }: { slug: string; title: string; number?: number }) {
  const art = COURSE_ART[slug] ?? { glyph: "A", label: "APTIVIO LEARNING", colors: ["#173b33", "#087f68", "#e8b85c"] as [string, string, string] };
  const id = "course-art-" + slug.replace(/[^a-z0-9]/g, "");
  return (
    <div className="course-artwork" role="img" aria-label={"Illustrated course cover for " + title}>
      <svg viewBox="0 0 720 330" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={art.colors[0]} />
            <stop offset="100%" stopColor={art.colors[1]} />
          </linearGradient>
          <linearGradient id={id + "-glow"} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={art.colors[2]} stopOpacity=".9" />
            <stop offset="100%" stopColor={art.colors[2]} stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="720" height="330" fill={"url(#" + id + ")"} />
        <circle cx="575" cy="150" r="155" fill={"url(#" + id + "-glow)"} opacity=".34" />
        <circle cx="570" cy="157" r="106" fill="none" stroke="#ffffff" strokeOpacity=".22" strokeWidth="2" />
        <circle cx="570" cy="157" r="78" fill="none" stroke="#ffffff" strokeOpacity=".16" strokeDasharray="7 10" strokeWidth="2" />
        <path d="M0 265 180 178l100 62 100-105 130 83 210-125v237H0Z" fill="#061c1a" opacity=".18" />
        <path d="M42 48h170M42 61h108M42 74h133" stroke="#ffffff" strokeOpacity=".18" strokeWidth="3" strokeLinecap="round" />
        <g fill="none" stroke="#ffffff" strokeOpacity=".5" strokeWidth="2">
          <path d="M478 74 538 43l57 31v65l-57 32-60-32Z" />
          <path d="M478 200 538 168l57 32v64l-57 32-60-32Z" />
          <path d="m538 43 0 57m57-26-57 32m-60-32 60 32" />
        </g>
        <text x="570" y="176" fill="#ffffff" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="800" fontSize={art.glyph.length > 3 ? "62" : "88"} letterSpacing="-5">{art.glyph}</text>
        <text x="42" y="267" fill="#ffffff" fillOpacity=".72" fontFamily="Arial, sans-serif" fontSize="15" fontWeight="700" letterSpacing="3">{art.label}</text>
        <text x="42" y="303" fill="#ffffff" fillOpacity=".52" fontFamily="Arial, sans-serif" fontSize="12" letterSpacing="2">APTIVIO  /  LEARNING PATH {String(number).padStart(2, "0")}</text>
      </svg>
      <span className="course-artwork-shine" aria-hidden="true" />
    </div>
  );
}
