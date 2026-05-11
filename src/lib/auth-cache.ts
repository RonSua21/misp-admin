import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Memoised within a single React render tree (layout + page share one result).
 * Eliminates the duplicate auth.getUser() + DB round-trip that every page and
 * the layout were each independently making.
 */
export const getAdminUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const db = createAdminClient();
  const { data } = await db
    .from("users")
    .select("firstName, lastName, email, role, barangay")
    .eq("supabaseId", user.id)
    .single();

  return data ?? null;
});
