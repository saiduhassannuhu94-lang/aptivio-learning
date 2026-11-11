import { z } from "zod";

const publicEnvironmentSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

const PRODUCTION_SITE_URL = "https://aptivio-learning.vercel.app";

export function getSupabasePublicEnvironment() {
  const result = publicEnvironmentSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  if (!result.success) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return result.data;
}

/**
 * Resolve the application URL used by Supabase email and OAuth callbacks.
 *
 * Production uses the canonical site URL as a safe fallback. Vercel preview
 * deployments can use NEXT_PUBLIC_VERCEL_URL, which must be covered by the
 * project's Supabase Auth redirect allow-list.
 */
export function getSiteUrl() {
  const configuredValue = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercelDeploymentUrl = process.env.NEXT_PUBLIC_VERCEL_URL?.trim();

  const fallbackValue =
    process.env.VERCEL_ENV === "preview" && vercelDeploymentUrl
      ? vercelDeploymentUrl
      : process.env.NODE_ENV === "production"
        ? PRODUCTION_SITE_URL
        : "http://localhost:3000";

  const rawValue = configuredValue || fallbackValue;
  const normalizedValue = /^https?:\/\//i.test(rawValue)
    ? rawValue
    : `https://${rawValue}`;
  const parsed = z.string().url().safeParse(normalizedValue);

  if (!parsed.success || !["http:", "https:"].includes(new URL(normalizedValue).protocol)) {
    throw new Error(
      "The configured authentication callback URL must be a valid HTTP or HTTPS URL.",
    );
  }

  return parsed.data.replace(/\/+$/, "");
}
