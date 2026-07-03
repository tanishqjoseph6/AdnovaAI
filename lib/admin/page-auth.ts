import { notFound } from "next/navigation";
import { isUserAdmin, isUserOwner } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

export async function requireAdminPage(options: { ownerOnly?: boolean } = {}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const allowed = options.ownerOnly
    ? await isUserOwner(user.id, user.email)
    : await isUserAdmin(user.id, user.email);

  if (!allowed) notFound();

  return user;
}
