import { NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/auth/require-user";
import { requireFeatureAccess } from "@/lib/billing/plan-access";
import {
  listThumbnailTemplatesForUser,
  saveThumbnailTemplate,
} from "@/lib/thumbnail/server";
import { thumbnailTemplateSaveSchema } from "@/lib/thumbnail/validation";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const authResult = await requireVerifiedUser(supabase);
    if ("response" in authResult) {
      return authResult.response;
    }

    const featureResult = await requireFeatureAccess(
      supabase,
      authResult.user.id,
      "thumbnail_generator"
    );
    if ("response" in featureResult) {
      return featureResult.response;
    }

    const templates = await listThumbnailTemplatesForUser(
      supabase,
      authResult.user.id
    );

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("List thumbnail templates error:", error);
    return NextResponse.json(
      { error: "Failed to load thumbnail templates." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const authResult = await requireVerifiedUser(supabase);
    if ("response" in authResult) {
      return authResult.response;
    }

    const featureResult = await requireFeatureAccess(
      supabase,
      authResult.user.id,
      "thumbnail_generator"
    );
    if ("response" in featureResult) {
      return featureResult.response;
    }

    const body = await request.json().catch(() => ({}));
    const parsed = thumbnailTemplateSaveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ?? "Invalid template payload.",
        },
        { status: 400 }
      );
    }

    const saved = await saveThumbnailTemplate(supabase, authResult.user.id, {
      name: parsed.data.name,
      format: parsed.data.format,
      prompt: parsed.data.prompt,
      brandName: parsed.data.brandName,
      brandColors: parsed.data.brandColors,
      productUrl: parsed.data.productUrl ?? "",
      previewImageUrl: parsed.data.previewImageUrl ?? null,
    });

    if (!saved) {
      return NextResponse.json(
        { error: "Failed to save template." },
        { status: 500 }
      );
    }

    return NextResponse.json({ template: saved });
  } catch (error) {
    console.error("Save thumbnail template error:", error);
    return NextResponse.json(
      { error: "Failed to save thumbnail template." },
      { status: 500 }
    );
  }
}
