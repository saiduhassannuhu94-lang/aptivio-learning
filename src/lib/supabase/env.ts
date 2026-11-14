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
 * Vercel preview deployments use their deployment host. Production uses the
 * configured canonical URL, the Vercel project URL, or APTIVIO's canonical
 * domain as a safe fallback.
 */
export function getSiteUrl() {
  const configuredValue = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercelDeploymentUrl = process.env.VERCEL_URL?.trim();
  const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();

  const fallbackValue =
    process.env.VERCEL_ENV === "preview" && vercelDeploymentUrl
      ? `https://${vercelDeploymentUrl}`
      : process.env.NODE_ENV === "production"
        ? productionUrl
          ? `https://${productionUrl}`
          : PRODUCTION_SITE_URL
        : "http://localhost:3000";

  const rawValue = configuredValue || fallbackValue;
  const parsed = z.string().url().safeParse(rawValue);

  if (
    !parsed.success ||
    !["http:", "https:"].includes(new URL(parsed.data).protocol)
  ) {
    throw new Error(
      "The configured authentication callback URL must be a valid HTTP or HTTPS URL.",
    );
  }

  return parsed.data.replace(/\/+$/, "");
}
