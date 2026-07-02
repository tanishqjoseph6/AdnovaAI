import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { validateFeedbackInput } from "@/lib/feedback/validation";
import { createClient } from "@/lib/supabase/server";

const SCREENSHOT_BUCKET = "feedback-screenshots";
const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;
const ALLOWED_SCREENSHOT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function sanitizeFilename(filename: string): string {
  const fallback = "screenshot";
  const sanitized = filename
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return sanitized || fallback;
}

function getOptionalScreenshot(value: FormDataEntryValue | null): File | null {
  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  return value;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const authResult = await requireAuthenticatedUser(supabase);
    if ("response" in authResult) {
      return authResult.response;
    }

    const formData = await request.formData();
    const validation = validateFeedbackInput({
      category: formData.get("category"),
      subject: formData.get("subject"),
      message: formData.get("message"),
    });

    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const screenshot = getOptionalScreenshot(formData.get("screenshot"));
    let screenshotUrl: string | null = null;

    if (screenshot) {
      if (!ALLOWED_SCREENSHOT_TYPES.has(screenshot.type)) {
        return NextResponse.json(
          { error: "Screenshot must be a PNG, JPG, or WebP image." },
          { status: 400 }
        );
      }

      if (screenshot.size > MAX_SCREENSHOT_BYTES) {
        return NextResponse.json(
          { error: "Screenshot must be 5MB or smaller." },
          { status: 400 }
        );
      }

      const screenshotPath = `${authResult.user.id}/${Date.now()}-${crypto.randomUUID()}-${sanitizeFilename(
        screenshot.name
      )}`;

      const { error: uploadError } = await supabase.storage
        .from(SCREENSHOT_BUCKET)
        .upload(screenshotPath, screenshot, {
          cacheControl: "3600",
          contentType: screenshot.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Feedback screenshot upload failed:", uploadError);
        return NextResponse.json(
          { error: "Unable to upload screenshot. Please try again." },
          { status: 500 }
        );
      }

      screenshotUrl = screenshotPath;
    }

    const { data, error } = await supabase
      .from("user_feedback")
      .insert({
        user_id: authResult.user.id,
        category: validation.value.category,
        subject: validation.value.subject,
        message: validation.value.message,
        screenshot_url: screenshotUrl,
        status: "new",
      })
      .select("id, created_at")
      .single();

    if (error) {
      console.error("Feedback create failed:", error);

      if (screenshotUrl) {
        await supabase.storage.from(SCREENSHOT_BUCKET).remove([screenshotUrl]);
      }

      return NextResponse.json(
        { error: "Unable to submit feedback. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      feedback: data,
    });
  } catch (error) {
    console.error("Feedback create error:", error);
    return NextResponse.json(
      { error: "Unable to submit feedback. Please try again." },
      { status: 500 }
    );
  }
}
