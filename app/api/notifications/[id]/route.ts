import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import {
  isMissingNotificationsSchemaError,
  logNotificationStep,
} from "@/lib/notifications/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(_request: Request, context: RouteContext) {
  try {
    const supabase = await createClient();
    const authResult = await requireAuthenticatedUser(supabase);
    if ("response" in authResult) {
      return authResult.response;
    }

    const { id } = await context.params;
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("user_id", authResult.user.id);

    if (error) {
      logNotificationStep("mark_notification_read", error, {
        userId: authResult.user.id,
        notificationId: id,
      });

      if (isMissingNotificationsSchemaError(error)) {
        return NextResponse.json({ success: true, schemaReady: false });
      }

      return NextResponse.json(
        { error: "Unable to update notification." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logNotificationStep("mark_notification_read_unhandled", error);
    return NextResponse.json(
      { error: "Unable to update notification." },
      { status: 500 }
    );
  }
}
