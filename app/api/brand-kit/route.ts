import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { requireFeatureAccess } from "@/lib/billing/plan-access";
import {
  brandKitFromRow,
  brandKitToRow,
  getBrandKitForUser,
} from "@/lib/brand-kit/server";
import { validateBrandKit } from "@/lib/brand-kit/validation";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const authResult = await requireAuthenticatedUser(supabase);
    if ("response" in authResult) {
      return authResult.response;
    }

    const featureResult = await requireFeatureAccess(
      supabase,
      authResult.user.id,
      "brand_kit"
    );
    if ("response" in featureResult) {
      return featureResult.response;
    }

    const brandKit = await getBrandKitForUser(supabase, authResult.user.id);
    return NextResponse.json({ brandKit });
  } catch (error) {
    console.error("Brand Kit fetch error:", error);
    return NextResponse.json(
      { error: "Unable to load Brand Kit." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const authResult = await requireAuthenticatedUser(supabase);
    if ("response" in authResult) {
      return authResult.response;
    }

    const featureResult = await requireFeatureAccess(
      supabase,
      authResult.user.id,
      "brand_kit"
    );
    if ("response" in featureResult) {
      return featureResult.response;
    }

    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const validation = validateBrandKit(body);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const updatedAt = new Date().toISOString();
    const { data, error } = await supabase
      .from("brand_kits")
      .upsert(brandKitToRow(authResult.user.id, validation.value, updatedAt), {
        onConflict: "user_id",
      })
      .select("*")
      .single();

    if (error) {
      console.error("Brand Kit save failed:", error.message);
      return NextResponse.json(
        { error: "Unable to save Brand Kit. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      brandKit: brandKitFromRow(data),
    });
  } catch (error) {
    console.error("Brand Kit save error:", error);
    return NextResponse.json(
      { error: "Unable to save Brand Kit. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();
    const authResult = await requireAuthenticatedUser(supabase);
    if ("response" in authResult) {
      return authResult.response;
    }

    const featureResult = await requireFeatureAccess(
      supabase,
      authResult.user.id,
      "brand_kit"
    );
    if ("response" in featureResult) {
      return featureResult.response;
    }

    const { error } = await supabase
      .from("brand_kits")
      .delete()
      .eq("user_id", authResult.user.id);

    if (error) {
      console.error("Brand Kit delete failed:", error.message);
      return NextResponse.json(
        { error: "Unable to delete Brand Kit. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Brand Kit delete error:", error);
    return NextResponse.json(
      { error: "Unable to delete Brand Kit. Please try again." },
      { status: 500 }
    );
  }
}
