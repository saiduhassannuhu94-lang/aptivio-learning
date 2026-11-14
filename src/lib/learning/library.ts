import package01 from "../../../content/batch-01/01-programming-logic-and-problem-solving.json";
import package02 from "../../../content/batch-01/02-python-programming-beginner-to-intermediate.json";
import package03 from "../../../content/batch-01/03-javascript-programming-core-concepts.json";
import package04 from "../../../content/batch-01/04-java-programming-object-oriented-design.json";
import package05 from "../../../content/batch-01/05-c-programming-memory-fundamentals.json";
import package06 from "../../../content/batch-01/06-cpp-programming-data-structures.json";
import package07 from "../../../content/batch-01/07-csharp-dotnet-application-development.json";
import package08 from "../../../content/batch-01/08-php-programming-web-backends.json";
import package09 from "../../../content/batch-01/09-go-programming-networked-services.json";
import package10 from "../../../content/batch-01/10-software-testing-quality-assurance.json";
import package11 from "../../../content/batch-01/11-html5-semantic-structure-accessibility.json";
import package12 from "../../../content/batch-01/12-css3-layout-responsive-design-motion.json";
import package13 from "../../../content/batch-01/13-modern-javascript-browser-applications.json";
import package14 from "../../../content/batch-01/14-typescript-reliable-frontend-code.json";
import package15 from "../../../content/batch-01/15-react-components-state-effects.json";
import package16 from "../../../content/batch-01/16-nextjs-app-router-full-stack-patterns.json";
import package17 from "../../../content/batch-01/17-nodejs-express-api-development.json";
import package18 from "../../../content/batch-01/18-rest-api-design-documentation.json";
import package19 from "../../../content/batch-01/19-web-performance-core-web-vitals.json";
import package20 from "../../../content/batch-01/20-progressive-web-apps-offline-first-design.json";

export type LearningLesson = {
  title: string;
  duration_minutes: number;
  body_markdown: string;
  exercise: string;
  key_takeaways: string[];
};

export type LearningSection = {
  title: string;
  description: string;
  lessons: LearningLesson[];
};

export type LearningAssessmentQuestion = {
  id: string;
  type: string;
  prompt: string;
  marks: number;
  rubric: string[];
};

export type LearningAssessment = {
  title: string;
  pass_mark_percent: number;
  instructions: string;
  questions: LearningAssessmentQuestion[];
  total_marks: number;
};

export type LearningFinalProject = {
  title: string;
  deliverables: string[];
  acceptance_criteria: string[];
};

export type LearningPackage = {
  course: {
    slug: string;
    title: string;
    subtitle: string;
    description: string;
    level: string;
    language_code: string;
    duration_minutes: number;
    target_audience: string[];
    prerequisites: string[];
    outcomes: string[];
    accessibility: string;
    assessment?: LearningAssessment;
    finalProject?: LearningFinalProject;
  };
  sections: LearningSection[];
};

type LearningPackageSource = Omit<LearningPackage, "sections"> & {
  sections?: LearningSection[];
  course: LearningPackage["course"] & { sections?: LearningSection[] };
};

const packageSources = [
  package01, package02, package03, package04, package05,
  package06, package07, package08, package09, package10,
  package11, package12, package13, package14, package15,
  package16, package17, package18, package19, package20,
] as unknown as LearningPackageSource[];

// The package format stores its teaching sections inside course. Normalize
// that source shape once so every learner-facing page uses one stable model.
export const learningPackages: LearningPackage[] = packageSources.map((item) => {
  const { sections, course } = item;
  const normalizedSections = sections ?? course.sections ?? [];
  return {
    course: {
      slug: course.slug,
      title: course.title,
      subtitle: course.subtitle,
      description: course.description,
      level: course.level,
      language_code: course.language_code,
      duration_minutes: course.duration_minutes,
      target_audience: course.target_audience,
      prerequisites: course.prerequisites,
      outcomes: course.outcomes,
      accessibility: course.accessibility,
      assessment: course.assessment,
      finalProject: course.finalProject,
    },
    sections: normalizedSections,
  };
});

export function getLearningPackage(slug: string) {
  return learningPackages.find((item) => item.course.slug === slug);
}

export function getLessonCount(item: LearningPackage) {
  return item.sections.reduce((count, section) => count + section.lessons.length, 0);
}
