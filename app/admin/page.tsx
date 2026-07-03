import { redirect } from "next/navigation";
import { isUserAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AdminShortcutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isUserAdmin(user.id, user.email))) {
    redirect("/dashboard");
  }

  redirect("/dashboard/admin/feedback");
}
