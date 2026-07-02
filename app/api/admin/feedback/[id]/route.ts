import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin/auth";
import {
  createFeedbackScreenshotSignedUrl,
  feedbackTicketFromRow,
  validateAdminReplyInput,
  type FeedbackProfile,
  type FeedbackRow,
} from "@/lib/feedback/server";
import {
  isMissingNotificationsSchemaError,
  logNotificationStep,
} from "@/lib/notifications/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const authResult = await requireAdminUser();
    if ("response" in authResult) {
      return authResult.response;
    }

    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const validation = validateAdminReplyInput(body);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { admin, user } = authResult;
    const now = new Date().toISOString();
    const { adminReply, status } = validation.value;

    const { data: existing, error: existingError } = await admin
      .from("user_feedback")
      .select("*")
      .eq("id", id)
      .single();

    if (existingError || !existing) {
      console.error("Admin feedback lookup failed:", existingError);
      return NextResponse.json(
        { error: "Feedback not found." },
        { status: existingError?.code === "PGRST116" ? 404 : 500 }
      );
    }

    const previous = existing as FeedbackRow;
    const replyChanged = (previous.admin_reply ?? "") !== (adminReply ?? "");
    const shouldSetReplyMetadata = Boolean(adminReply) && replyChanged;

    const { data: updated, error: updateError } = await admin
      .from("user_feedback")
      .update({
        status,
        admin_reply: adminReply,
        replied_at: shouldSetReplyMetadata ? now : previous.replied_at,
        reviewed_by: adminReply ? user.id : previous.reviewed_by,
        updated_at: now,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError || !updated) {
      console.error("Admin feedback update failed:", updateError);
      return NextResponse.json(
        { error: "Unable to update feedback." },
        { status: 500 }
      );
    }

    if (shouldSetReplyMetadata) {
      const { error: notificationError } = await admin
        .from("notifications")
        .insert({
          user_id: previous.user_id,
          title: "📩 Reply from Advora Team",
          message:
            "We've reviewed your feedback and replied. Click to view the response.",
          feedback_id: previous.id,
          is_read: false,
        });

      if (notificationError) {
        logNotificationStep("create_feedback_reply_notification", notificationError, {
          feedbackId: previous.id,
          userId: previous.user_id,
        });

        return NextResponse.json(
          {
            error: isMissingNotificationsSchemaError(notificationError)
              ? "Feedback reply was saved, but notifications are not ready. Apply the notifications migration in Supabase."
              : "Feedback reply was saved, but the user notification could not be created.",
          },
          { status: 500 }
        );
      }
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("id, email, username, full_name")
      .eq("id", previous.user_id)
      .maybeSingle();

    const row = updated as FeedbackRow;
    const screenshotUrl = await createFeedbackScreenshotSignedUrl(
      admin,
      row.screenshot_url
    );

    return NextResponse.json({
      success: true,
      ticket: feedbackTicketFromRow(
        row,
        (profile as FeedbackProfile | null) ?? null,
        screenshotUrl
      ),
    });
  } catch (error) {
    console.error("Admin feedback update error:", error);
    return NextResponse.json(
      { error: "Unable to update feedback." },
      { status: 500 }
    );
  }
}
