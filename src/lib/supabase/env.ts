import { z } from "zod";

const publicEnvironmentSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

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

export function getSiteUrl() {
  const configuredValue = process.env.NEXT_PUBLIC_SITE_URL;

  if (!configuredValue && process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_SITE_URL must be configured in production.");
  }

  const value = configuredValue ?? "http://localhost:3000";
  const parsed = z.string().url().safeParse(value);

  if (!parsed.success) {
    throw new Error("NEXT_PUBLIC_SITE_URL must be a valid absolute URL.");
  }

  return parsed.data.replace(/\/$/, "");
}
