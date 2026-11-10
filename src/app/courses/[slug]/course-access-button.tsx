"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type CourseAccessButtonProps = {
  courseId: string;
  courseVersionId: string;
  priceMinor: number;
  currency: string;
};

export function CourseAccessButton({
  courseId,
  courseVersionId,
  priceMinor,
  currency,
}: CourseAccessButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFree = priceMinor === 0;

  async function handleAccess() {
    setIsLoading(true);
    setError(null);

    try {
      if (!isFree) {
        const response = await fetch("/api/payments/initialize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseId }),
        });

        const payload: unknown = await response.json().catch(() => null);
        const result =
          typeof payload === "object" && payload !== null
            ? (payload as { authorizationUrl?: unknown; error?: unknown })
            : {};

        if (response.status === 401) {
          window.location.assign("/sign-in");
          return;
        }

        if (
          !response.ok ||
          typeof result.authorizationUrl !== "string"
        ) {
          throw new Error(
            typeof result.error === "string"
              ? result.error
              : "Checkout could not be started. Please try again.",
          );
        }

        window.location.assign(result.authorizationUrl);
        return;
      }

      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError || !authData.user) {
        window.location.assign("/sign-in");
        return;
      }

      const { error: enrollmentError } = await supabase
        .from("enrollments")
        .insert({
          user_id: authData.user.id,
          course_id: courseId,
          course_version_id: courseVersionId,
          status: "active",
          amount_minor: 0,
          currency,
        });

      if (enrollmentError && enrollmentError.code !== "23505") {
        throw new Error("We could not enrol you in this course. Please try again.");
      }

      window.location.assign("/dashboard");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="course-access-action">
      <button
        className="button button-primary"
        type="button"
        onClick={handleAccess}
        disabled={isLoading}
      >
        {isLoading
          ? "Preparing access…"
          : isFree
            ? "Enrol for free"
            : "Continue to secure payment"}
      </button>
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  );
}
