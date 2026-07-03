import type { SupabaseClient, User } from "@supabase/supabase-js";
import { normalizeEmail } from "@/lib/admin/auth";

export async function logAdminAction({
  admin,
  user,
  action,
  targetType,
  targetId,
  metadata = {},
}: {
  admin: SupabaseClient;
  user: User;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}) {
  const { error } = await admin.from("admin_audit_logs").insert({
    admin_user_id: user.id,
    admin_email: normalizeEmail(user.email),
    action,
    target_type: targetType ?? null,
    target_id: targetId ?? null,
    metadata,
  });

  if (error) {
    console.error("Admin audit log write failed:", {
      action,
      targetType,
      targetId,
      code: error.code,
      message: error.message,
      details: error.details,
    });
  }
}
