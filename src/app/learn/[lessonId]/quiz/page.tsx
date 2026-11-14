import { notFound } from "next/navigation";
import { SiteHeader } from "@/app/site-header";
import { getLearningPackage, learningPackages } from "@/lib/learning/library";
import { learningQuizBank } from "@/lib/learning/quiz-bank";
import { QuizPlayer } from "./quiz-player";

type Props = { params: Promise<{ lessonId: string }> };

export function generateStaticParams() {
  return learningPackages.map((item) => ({ lessonId: item.course.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { lessonId } = await params;
  const item = getLearningPackage(lessonId);
  return { title: item ? "Knowledge check · " + item.course.title : "Knowledge check" };
}

export default async function LearningQuizPage({ params }: Props) {
  const { lessonId } = await params;
  const item = getLearningPackage(lessonId);
  const questions = learningQuizBank[lessonId];
  if (!item || !questions?.length) notFound();

  const index = learningPackages.findIndex((entry) => entry.course.slug === lessonId);
  const nextItem = index >= 0 ? learningPackages[index + 1] : undefined;

  return (
    <main className="quiz-page">
      <SiteHeader current="learn" />
      <div className="quiz-page-content">
        <QuizPlayer
          courseSlug={lessonId}
          courseTitle={item.course.title}
          questions={questions}
          nextCourse={nextItem ? { slug: nextItem.course.slug, title: nextItem.course.title } : null}
        />
      </div>
    </main>
  );
}
