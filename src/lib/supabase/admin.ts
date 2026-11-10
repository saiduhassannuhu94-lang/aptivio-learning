import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/types/database";

const adminEnvironmentSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SECRET_KEY: z.string().min(1),
});

export function createAdminClient() {
  const parsed = adminEnvironmentSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  });

  if (!parsed.success) {
    throw new Error(
      "Server administration is not configured. Set the Supabase URL and SUPABASE_SECRET_KEY.",
    );
  }

  return createSupabaseClient<Database>(
    parsed.data.NEXT_PUBLIC_SUPABASE_URL,
    parsed.data.SUPABASE_SECRET_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    },
  );
}
