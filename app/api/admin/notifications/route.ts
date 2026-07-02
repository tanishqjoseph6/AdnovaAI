import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin/auth";
import { adminUserFromRow, type AdminUserRow } from "@/lib/admin/users";

type NotificationAdminRow = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  feedback_id: string | null;
  created_at: string;
};

type NotificationPayload = {
  userId?: unknown;
  title?: unknown;
  message?: unknown;
};

export async function GET() {
  try {
    const authResult = await requireAdminUser();
    if ("response" in authResult) {
      return authResult.response;
    }

    const { data: rows, error } = await authResult.admin
      .from("notifications")
      .select("id, user_id, title, message, is_read, feedback_id, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Admin notifications fetch failed:", error);
      return NextResponse.json(
        { error: "Unable to load notifications." },
        { status: 500 }
      );
    }

    const notifications = (rows ?? []) as NotificationAdminRow[];
    const userIds = Array.from(new Set(notifications.map((row) => row.user_id)));
    const { data: profiles, error: profilesError } =
      userIds.length > 0
        ? await authResult.admin
            .from("profiles")
            .select("id, email, username, full_name, role")
            .in("id", userIds)
        : { data: [], error: null };

    if (profilesError) {
      console.error("Admin notification profiles fetch failed:", profilesError);
      return NextResponse.json(
        { error: "Unable to load notification users." },
        { status: 500 }
      );
    }

    const profileMap = new Map(
      ((profiles ?? []) as AdminUserRow[]).map((profile) => [
        profile.id,
        adminUserFromRow(profile),
      ])
    );

    return NextResponse.json({
      notifications: notifications.map((notification) => ({
        id: notification.id,
        userId: notification.user_id,
        user: profileMap.get(notification.user_id) ?? null,
        title: notification.title,
        message: notification.message,
        isRead: notification.is_read,
        feedbackId: notification.feedback_id,
        createdAt: notification.created_at,
      })),
    });
  } catch (error) {
    console.error("Admin notifications fetch error:", error);
    return NextResponse.json(
      { error: "Unable to load notifications." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAdminUser();
    if ("response" in authResult) {
      return authResult.response;
    }

    const body = (await request.json().catch(() => ({}))) as NotificationPayload;
    const userId = typeof body.userId === "string" ? body.userId : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!userId) {
      return NextResponse.json({ error: "Choose a user." }, { status: 400 });
    }

    if (title.length < 3 || title.length > 120) {
      return NextResponse.json(
        { error: "Title must be between 3 and 120 characters." },
        { status: 400 }
      );
    }

    if (message.length < 3 || message.length > 500) {
      return NextResponse.json(
        { error: "Message must be between 3 and 500 characters." },
        { status: 400 }
      );
    }

    const { data: profile, error: profileError } = await authResult.admin
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (profileError || !profile) {
      console.error("Admin notification user lookup failed:", profileError);
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const { data, error } = await authResult.admin
      .from("notifications")
      .insert({
        user_id: userId,
        title,
        message,
        is_read: false,
      })
      .select("id, created_at")
      .single();

    if (error || !data) {
      console.error("Admin notification create failed:", error);
      return NextResponse.json(
        { error: "Unable to send notification." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, notification: data });
  } catch (error) {
    console.error("Admin notification create error:", error);
    return NextResponse.json(
      { error: "Unable to send notification." },
      { status: 500 }
    );
  }
}
