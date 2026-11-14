import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/app/site-header";
import { AssessmentPlayer } from "./assessment-player";
import { getLearningPackage, learningPackages } from "@/lib/learning/library";

type Props = { params: Promise<{ lessonId: string }> };

export function generateStaticParams() {
  return learningPackages
    .filter((item) => item.course.assessment)
    .map((item) => ({ lessonId: item.course.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { lessonId } = await params;
  const item = getLearningPackage(lessonId);
  return { title: item ? "Final assessment | " + item.course.title : "Course assessment" };
}

export default async function CourseAssessmentPage({ params }: Props) {
  const { lessonId } = await params;
  const item = getLearningPackage(lessonId);
  if (!item?.course.assessment) notFound();

  return (
    <main className="assessment-page">
      <SiteHeader current="learn" />
      <div className="assessment-shell">
        <nav className="assessment-breadcrumb" aria-label="Breadcrumb">
          <Link href="/courses">Learning library</Link>
          <span>/</span>
          <Link href={"/learn/" + item.course.slug}>{item.course.title}</Link>
          <span>/</span>
          <span>Final assessment</span>
        </nav>
        <AssessmentPlayer
          courseSlug={item.course.slug}
          courseTitle={item.course.title}
          assessment={item.course.assessment}
          finalProject={item.course.finalProject}
        />
        <footer className="assessment-page-footer"><span>APTIVIO</span><span>Learn · Think · Build</span><Link href="/challenges">Try a reasoning challenge ↗</Link></footer>
      </div>
    </main>
  );
}
