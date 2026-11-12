import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Learn",
  description: "Explore useful knowledge, clear lessons and practical learning material on APTIVIO.",
};

export default async function CoursesPage() {
  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  if (!isConfigured) {
    return (
      <main className="catalogue-page">
        <header className="dashboard-header">
          <Link className="brand" href="/"><span className="brand-mark">A</span><span>APTIVIO</span></Link>
          <Link className="dashboard-signout" href="/sign-in">Sign in</Link>
        </header>
        <section className="catalogue-content">
          <span className="eyebrow">THE LEARNING LIBRARY</span>
          <h1>Explore. Understand. Apply.</h1>
          <p>Learning material is being prepared. This is a library for curious students, not a formal school catalogue.</p>
        </section>
      </main>
    );
  }

  const supabase = await createClient();
  const { data: courses, error: coursesError } = await supabase
    .from("courses")
    .select("id, slug, published_version_id")
    .eq("status", "published")
    .not("published_version_id", "is", null)
    .order("published_at", { ascending: false });

  if (coursesError) {
    throw new Error("We could not load the learning library. Please try again.");
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
    throw new Error("We could not load learning details. Please try again.");
  }

  const versionsById = new Map(versions.map((version) => [version.id, version]));

  return (
    <main className="catalogue-page">
      <header className="dashboard-header">
        <Link className="brand" href="/"><span className="brand-mark">A</span><span>APTIVIO</span></Link>
        <Link className="dashboard-signout" href="/sign-in">Sign in</Link>
      </header>

      <section className="catalogue-content">
        <span className="eyebrow">THE LEARNING LIBRARY</span>
        <h1>Explore. Understand. Apply.</h1>
        <p>Discover useful topics and build knowledge at your own pace. Learn first, practise what you understand, and keep exploring.</p>

        {courses.length === 0 ? (
          <div className="catalogue-empty">
            <span className="dashboard-empty-mark">A</span>
            <h2>Learning material is being prepared.</h2>
            <p>We are building clear lessons and practical exercises. The library will grow as useful material is ready.</p>
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
                  <span className="catalogue-kicker">LEARNING RESOURCE</span>
                  <h2>{version.title}</h2>
                  {version.subtitle && <p className="catalogue-subtitle">{version.subtitle}</p>}
                  <p>{version.description}</p>
                  <div className="catalogue-card-foot">
                    <strong>Free to explore</strong>
                    <Link className="text-link" href={`/courses/${course.slug}`}>Open material <span aria-hidden="true">↗</span></Link>
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
