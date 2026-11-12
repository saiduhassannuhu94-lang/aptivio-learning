import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

// Challenge tables are introduced by a versioned SQL migration. This isolated
// client boundary keeps the rest of the application typed while DB types are
// regenerated from the deployed schema.
export function createChallengeAdmin() {
  return createAdminClient() as unknown as SupabaseClient;
}
