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
 * Return the public URL used for auth callbacks.
 *
 * NEXT_PUBLIC_SITE_URL is the explicit, canonical override. Vercel exposes
 * NEXT_PUBLIC_VERCEL_URL for deployments, which is useful for previews.
 * Production has a known canonical URL, so a missing optional setting must
 * never prevent the signup server action from reaching Supabase Auth.
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
  const value = /^https?:\/\//i.test(rawValue) ? rawValue : `https://${rawValue}`;
  const parsed = z.string().url().safeParse(value);

  if (
    !parsed.success ||
    !["http:", "https:"].includes(new URL(value).protocol)
  ) {
    throw new Error(
      "The configured authentication callback URL must be a valid HTTP or HTTPS URL.",
    );
  }

  return parsed.data.replace(/\/+$/, "");
}
