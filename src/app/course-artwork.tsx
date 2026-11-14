const COURSE_PHOTOS: Record<string, string> = {
  "programming-logic-and-problem-solving": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=85",
  "python-programming-beginner-to-intermediate": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=85",
  "javascript-programming-core-concepts": "https://images.unsplash.com/photo-1627398242454-45a1465c2479?auto=format&fit=crop&w=1200&q=85",
  "java-programming-object-oriented-design": "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=85",
  "c-programming-memory-fundamentals": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=85",
  "cpp-programming-data-structures": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=85",
  "csharp-dotnet-application-development": "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=85",
  "php-programming-web-backends": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=85",
  "go-programming-networked-services": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=85",
  "software-testing-quality-assurance": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=85",
  "html5-semantic-structure-accessibility": "https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&w=1200&q=85",
  "css3-layout-responsive-design-motion": "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=85",
  "modern-javascript-browser-applications": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=85",
  "typescript-reliable-frontend-code": "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=85",
  "react-components-state-effects": "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=1200&q=85",
  "nextjs-app-router-full-stack-patterns": "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=85",
  "nodejs-express-api-development": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=85",
  "rest-api-design-documentation": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=85",
  "web-performance-core-web-vitals": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=85",
  "progressive-web-apps-offline-first-design": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=85",
};

export function CourseArtwork({ slug, title, number = 1 }: { slug: string; title: string; number?: number }) {
  const photo = COURSE_PHOTOS[slug] ?? "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=85";
  return (
    <div className="course-artwork course-photo-artwork" role="img" aria-label={title + " course photograph"} style={{ backgroundImage: "linear-gradient(90deg, rgba(8,28,24,.78), rgba(8,28,24,.12)), url(" + photo + ")" }}>
      <div className="course-photo-overlay"><span>APTIVIO · LEARNING PATH {String(number).padStart(2, "0")}</span><strong>{title}</strong><small>REAL SKILLS. PRACTICAL THINKING.</small></div>
      <span className="course-artwork-shine" aria-hidden="true" />
    </div>
  );
}
