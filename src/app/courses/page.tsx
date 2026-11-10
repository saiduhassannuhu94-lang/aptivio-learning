import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format/currency";

export const metadata: Metadata = {
  title: "Explore courses",
  description: "Explore practical courses and structured learning paths on APTIVIO.",
};

export default async function CoursesPage() {
  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  if (!isConfigured) {
    return (
      <main className="catalogue-page">
        <header className="dashboard-header">
          <Link className="brand" href="/">
            <span className="brand-mark">A</span>
            <span>APTIVIO</span>
          </Link>
          <Link className="dashboard-signout" href="/sign-in">Sign in</Link>
        </header>
        <section className="catalogue-content">
          <span className="eyebrow">THE APTIVIO CATALOGUE</span>
          <h1>Learning with direction.</h1>
          <p>Our course catalogue is being prepared. Check back as the first reviewed courses are published.</p>
        </section>
      </main>
    );
  }

  const supabase = await createClient();
  const { data: courses, error: coursesError } = await supabase
    .from("courses")
    .select("id, slug, price_minor, currency, published_version_id")
    .eq("status", "published")
    .not("published_version_id", "is", null)
    .order("published_at", { ascending: false });

  if (coursesError) {
    throw new Error("We could not load the course catalogue. Please try again.");
  }

  const versionIds = courses
    .map((course) => course.published_version_id)
    .filter((id): id is string => id !== null);

  const { data: versions, error: versionsError } = versionIds.length
    ? await supabase
        .from("course_versions")
        .select("id, title, subtitle, description")
        .in("id", versionIds)
    : { data: [], error: null };

  if (versionsError) {
    throw new Error("We could not load course details. Please try again.");
  }

  const versionsById = new Map(versions.map((version) => [version.id, version]));

  return (
    <main className="catalogue-page">
      <header className="dashboard-header">
        <Link className="brand" href="/">
          <span className="brand-mark">A</span>
          <span>APTIVIO</span>
        </Link>
        <Link className="dashboard-signout" href="/sign-in">Sign in</Link>
      </header>

      <section className="catalogue-content">
        <span className="eyebrow">THE APTIVIO CATALOGUE</span>
        <h1>Learning with direction.</h1>
        <p>Structured courses designed to turn useful knowledge into practical ability.</p>

        {courses.length === 0 ? (
          <div className="catalogue-empty">
            <span className="dashboard-empty-mark">A</span>
            <h2>The first courses are being prepared.</h2>
            <p>We publish courses only after their lessons, learning outcomes, and quality review are complete. No empty catalogue theatre.</p>
            <Link className="text-link" href="/">Return to APTIVIO <span aria-hidden="true">↗</span></Link>
          </div>
        ) : (
          <div className="catalogue-grid">
            {courses.map((course) => {
              const version = course.published_version_id
                ? versionsById.get(course.published_version_id)
                : undefined;

              if (!version) return null;

              return (
                <article className="catalogue-card" key={course.id}>
                  <span className="catalogue-kicker">APTIVIO COURSE</span>
                  <h2>{version.title}</h2>
                  {version.subtitle && <p className="catalogue-subtitle">{version.subtitle}</p>}
                  <p>{version.description}</p>
                  <div className="catalogue-card-foot">
                    <strong>{course.price_minor === 0 ? "Free" : formatMoney(course.price_minor, course.currency)}</strong>
                    <span>Course details coming next</span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
