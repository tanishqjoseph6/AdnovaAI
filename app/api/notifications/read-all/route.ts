import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import {
  isMissingNotificationsSchemaError,
  logNotificationStep,
} from "@/lib/notifications/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH() {
  try {
    const supabase = await createClient();
    const authResult = await requireAuthenticatedUser(supabase);
    if ("response" in authResult) {
      return authResult.response;
    }

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", authResult.user.id)
      .eq("is_read", false);

    if (error) {
      logNotificationStep("mark_all_notifications_read", error, {
        userId: authResult.user.id,
      });

      if (isMissingNotificationsSchemaError(error)) {
        return NextResponse.json({ success: true, schemaReady: false });
      }

      return NextResponse.json(
        { error: "Unable to update notifications." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logNotificationStep("mark_all_notifications_read_unhandled", error);
    return NextResponse.json(
      { error: "Unable to update notifications." },
      { status: 500 }
    );
  }
}
