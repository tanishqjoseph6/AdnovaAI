import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import {
  isMissingNotificationsSchemaError,
  logNotificationStep,
  notificationFromRow,
} from "@/lib/notifications/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const authResult = await requireAuthenticatedUser(supabase);
    if ("response" in authResult) {
      return authResult.response;
    }

    const { data, error } = await supabase
      .from("notifications")
      .select("id, title, message, is_read, feedback_id, created_at")
      .eq("user_id", authResult.user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      logNotificationStep("fetch_notifications", error, {
        userId: authResult.user.id,
      });

      if (isMissingNotificationsSchemaError(error)) {
        return NextResponse.json({
          notifications: [],
          unreadCount: 0,
          schemaReady: false,
        });
      }

      return NextResponse.json(
        {
          notifications: [],
          unreadCount: 0,
          error: "Unable to load notifications.",
        },
        { status: 500 }
      );
    }

    const notifications = (data ?? []).map(notificationFromRow);
    return NextResponse.json({
      notifications,
      unreadCount: notifications.filter((notification) => !notification.read)
        .length,
    });
  } catch (error) {
    logNotificationStep("fetch_notifications_unhandled", error);
    return NextResponse.json(
      {
        notifications: [],
        unreadCount: 0,
        error: "Unable to load notifications.",
      },
      { status: 500 }
    );
  }
}
