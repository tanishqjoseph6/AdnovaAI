import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { requireFeatureAccess } from "@/lib/billing/plan-access";
import { uploadScheduledPostImage } from "@/lib/social-scheduler/image-storage";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const authResult = await requireAuthenticatedUser(supabase);
    if ("response" in authResult) {
      return authResult.response;
    }

    const featureResult = await requireFeatureAccess(
      supabase,
      authResult.user.id,
      "social_scheduler"
    );
    if ("response" in featureResult) {
      return featureResult.response;
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image file is required." }, { status: 400 });
    }

    const uploaded = await uploadScheduledPostImage(
      supabase,
      authResult.user.id,
      file
    );

    if (!uploaded) {
      return NextResponse.json(
        { error: "Upload a JPG, PNG, WebP, or GIF image under 5 MB." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      imageUrl: uploaded.publicUrl,
      imageStoragePath: uploaded.storagePath,
    });
  } catch (error) {
    console.error("Scheduled post image upload error:", error);
    return NextResponse.json(
      { error: "Unable to upload image." },
      { status: 500 }
    );
  }
}
